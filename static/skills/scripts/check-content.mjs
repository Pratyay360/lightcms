#!/usr/bin/env node
/**
 * Check Markdown content for the LightCMS front matter contract.
 *
 * Usage:
 *   node scripts/check-content.mjs [content-root]
 *
 * If no root is given, the first existing directory among content, src,
 * _posts, and posts is used. YAML front matter is the LightCMS format;
 * TOML is accepted because Hugo and Zola templates often ship with it.
 * Exits 1 when an error is found.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const SKIP_DIRS = new Set([
  ".git",
  ".github",
  ".svelte-kit",
  ".vercel",
  "_site",
  "book",
  "dist",
  "node_modules",
  "public",
]);

const PAGE_NAMES = new Set([
  "about",
  "index",
  "intro",
  "readme",
  "summary",
  "_index",
]);

const CANDIDATE_ROOTS = ["content", "src", "_posts", "posts"];

function parseScalar(raw) {
  const value = raw.trim();
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return value;
}

function parseYamlFrontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  const data = {};
  let currentKey = null;
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const keyValue = line.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (keyValue) {
      const [, key, raw] = keyValue;
      currentKey = key;
      data[key] = parseScalar(raw);
      continue;
    }

    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(parseScalar(item[1]));
    }
  }
  return { data, format: "yaml" };
}

function parseTomlFrontMatter(source) {
  const match = source.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+\r?\n?/);
  if (!match) return null;

  const data = {};
  const lines = match[1].split(/\r?\n/);
  let inTable = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("#")) continue;
    if (/^\[.*\]$/.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable) continue;

    const keyValue = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.*)$/);
    if (!keyValue) continue;

    const [, key, first] = keyValue;
    let raw = first;
    if (raw.trimStart().startsWith("[") && !raw.includes("]")) {
      while (index + 1 < lines.length && !raw.includes("]")) {
        index += 1;
        raw += ` ${lines[index].trim()}`;
      }
    }
    data[key] = parseScalar(raw);
  }
  return { data, format: "toml" };
}

function parseFrontMatter(source) {
  return parseYamlFrontMatter(source) ?? parseTomlFrontMatter(source);
}

function isPost(relPath, rootIsPosts) {
  const normalized = relPath.replaceAll("\\", "/").toLowerCase();
  const base = normalized.split("/").pop().replace(/\.(md|mdx)$/, "");
  if (PAGE_NAMES.has(base)) return false;
  if (rootIsPosts) return true;
  return (
    normalized.includes("/posts/") ||
    normalized.includes("/blog/") ||
    normalized.includes("/post/") ||
    normalized.includes("/blog_") ||
    normalized.startsWith("_posts/") ||
    normalized.startsWith("posts/") ||
    normalized.startsWith("post/") ||
    normalized.startsWith("blog/") ||
    normalized.startsWith("blog_")
  );
}

function isEpochSlug(name) {
  return /^\d{10}$/.test(name);
}

function isDatePrefixedSlug(name) {
  return /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
}

function isSlug(name) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
}

async function findRoot() {
  for (const candidate of CANDIDATE_ROOTS) {
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) return candidate;
    } catch {
      // Keep looking.
    }
  }
  return process.cwd();
}

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      await walk(join(dir, entry.name), files);
      continue;
    }
    if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

const args = process.argv.slice(2);
const allowNoFrontmatter = args.includes("--allow-no-frontmatter");
const rootArg = args.find((arg) => !arg.startsWith("--"));
const root = rootArg ?? (await findRoot());
const rootBase = root.replaceAll("\\", "/").replace(/\/+$/, "").split("/").pop().toLowerCase();
const rootIsPosts = ["posts", "_posts", "blog"].includes(rootBase);
const errors = [];
const warnings = [];
let checked = 0;
let tomlFiles = 0;

for (const file of await walk(root)) {
  checked += 1;
  const rel = relative(root, file);
  const source = await readFile(file, "utf8");
  const parsed = parseFrontMatter(source);
  const base = rel.split("/").pop().replace(/\.(md|mdx)$/, "");
  const post = isPost(rel, rootIsPosts);

  if (base.toLowerCase() === "summary") continue;
  if (!parsed) {
    if (allowNoFrontmatter) {
      warnings.push(`${rel}: no front matter (allowed)`);
      continue;
    }
    errors.push(`${rel}: missing YAML or TOML front matter`);
    continue;
  }

  const { data, format } = parsed;
  if (format === "toml") tomlFiles += 1;

  if (!data.title || typeof data.title !== "string") {
    errors.push(`${rel}: missing title`);
  }
  if (!data.description) {
    (post ? errors : warnings).push(`${rel}: missing description`);
  }
  if (post) {
    const date = data.date === undefined ? "" : String(data.date);
    if (!date) {
      errors.push(`${rel}: post missing date`);
    } else if (
      !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(
        date,
      )
    ) {
      errors.push(`${rel}: date is not ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)`);
    } else if (!date.includes("T")) {
      warnings.push(`${rel}: date has no time; LightCMS will normalize it to a UTC datetime`);
    } else if (!date.endsWith("Z")) {
      warnings.push(`${rel}: date has no timezone; LightCMS will normalize it to UTC`);
    }
  }
  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    errors.push(`${rel}: draft must be a boolean`);
  }
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    warnings.push(`${rel}: tags is not a list; use a YAML list for portability`);
  }
  if (isEpochSlug(base)) {
    errors.push(`${rel}: filename is an epoch slug; use a human slug`);
  } else if (!PAGE_NAMES.has(base) && !isSlug(base) && !isDatePrefixedSlug(base)) {
    warnings.push(`${rel}: filename is not a lowercase hyphenated slug`);
  }
}

console.log(`Checked ${checked} Markdown file(s) under ${root}`);
if (tomlFiles > 0) {
  console.log(
    `${tomlFiles} file(s) use TOML; LightCMS writes YAML, so test at least one YAML entry.`,
  );
}
for (const error of errors) console.error(`ERROR ${error}`);
for (const warning of warnings) console.warn(`WARN  ${warning}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`\nOK: ${warnings.length} warning(s)`);
