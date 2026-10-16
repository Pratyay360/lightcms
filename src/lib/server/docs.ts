import matter from "gray-matter";
import { DEFAULT_OG_IMAGE } from "$lib/seo";

export interface DocEntry {
  /** Path segment under `/docs`, e.g. `selfhost` or `comparison/top-git-cms`. */
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  serial: number;
  date: string | null;
  preview: string;
  raw: string;
}

function toIsoDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = new Date(value.trim());
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

function toSlug(path: string): string {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? "";
}

function toTitle(frontmatter: Record<string, unknown>, slug: string): string {
  const title = frontmatter.title;
  if (typeof title === "string" && title.trim().length > 0) {
    return title.trim();
  }
  const lastSegment = slug.split("/").pop() ?? slug;
  return lastSegment
    .split("-")
    .map((word) => (word.length > 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

function toDescription(frontmatter: Record<string, unknown>, raw: string): string {
  const description = frontmatter.description;
  if (typeof description === "string" && description.trim().length > 0) {
    return description.trim();
  }
  return raw
    .replace(/^---[\s\S]*?---/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);
}

function toKeywords(frontmatter: Record<string, unknown>): string[] {
  const rawKeywords = frontmatter.keywords;
  if (Array.isArray(rawKeywords)) {
    return rawKeywords
      .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
      .map((k) => k.trim());
  }
  if (typeof rawKeywords === "string" && rawKeywords.trim().length > 0) {
    return rawKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }
  return [];
}

function toSerial(frontmatter: Record<string, unknown>): number {
  const serial = Number(frontmatter.serial ?? frontmatter.weight ?? 0);
  return Number.isFinite(serial) ? serial : 0;
}

function toPreview(frontmatter: Record<string, unknown>): string {
  const preview = frontmatter.preview;
  if (typeof preview === "string" && preview.trim().length > 0) {
    return preview.trim().replace(/^\/static(?=\/)/, "") || DEFAULT_OG_IMAGE;
  }
  return DEFAULT_OG_IMAGE;
}

export async function loadDocEntries(): Promise<DocEntry[]> {
  const modules = import.meta.glob("../../routes/docs/src/**/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  });

  const entries: DocEntry[] = [];

  for (const [path, file] of Object.entries(modules)) {
    const raw = typeof file === "string" ? file : "";
    const { data: frontmatter } = matter(raw);

    if (frontmatter.draft === true) {
      continue;
    }

    const slug = toSlug(path);

    entries.push({
      slug,
      title: toTitle(frontmatter, slug),
      description: toDescription(frontmatter, raw),
      keywords: toKeywords(frontmatter),
      serial: toSerial(frontmatter),
      date: toIsoDate(frontmatter.date),
      preview: toPreview(frontmatter),
      raw,
    });
  }

  entries.sort((a, b) => a.serial - b.serial || a.slug.localeCompare(b.slug));

  return entries;
}
