import { error } from "@sveltejs/kit";
import { compile } from "mdsvex";
import { renderMarkdown } from "$lib/server/markdown";
import type { PageServerLoad } from "./$types";

interface DocEntry {
  fileName: string;
  slug: string;
  title: string;
  serial: number;
  description: string;
  raw: string;
}

function toExcerpt(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

function toTitle(
  frontmatter: Record<string, unknown>,
  fileName: string,
): string {
  const title = frontmatter.title;
  if (typeof title === "string" && title.trim().length > 0) {
    return title;
  }
  return fileName;
}

function toSerial(frontmatter: Record<string, unknown>): number {
  const serial = Number(frontmatter.serial ?? 0);
  return Number.isFinite(serial) ? serial : 0;
}

function toDescription(
  frontmatter: Record<string, unknown>,
  raw: string,
): string {
  const description = frontmatter.description;
  if (typeof description === "string" && description.trim().length > 0) {
    return description;
  }
  return toExcerpt(raw);
}

export const load: PageServerLoad = async ({ params }) => {
  const modules = import.meta.glob("../src/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  });

  const entries: DocEntry[] = [];

  for (const [path, file] of Object.entries(modules)) {
    const raw = typeof file === "string" ? file : "";
    const compiled = await compile(raw);
    const frontmatter = (compiled?.data as Record<string, unknown>) ?? {};
    const fileName = path.split("/").pop()?.replace(/\.md$/, "") ?? "";

    entries.push({
      fileName,
      slug: `/docs/${fileName}`,
      title: toTitle(frontmatter, fileName),
      serial: toSerial(frontmatter),
      description: toDescription(frontmatter, raw),
      raw,
    });
  }

  entries.sort((a, b) => a.serial - b.serial);

  const index = entries.findIndex((entry) => entry.fileName === params.slug);
  const current = index === -1 ? undefined : entries[index];

  if (current === undefined) {
    throw error(404, "Document not found");
  }

  const previous = index > 0 ? entries[index - 1] : undefined;
  const next = entries[index + 1];

  return {
    title: current.title,
    description: current.description,
    content: await renderMarkdown(current.raw),
    previous:
      previous === undefined
        ? null
        : { slug: previous.slug, title: previous.title },
    next:
      next === undefined ? null : { slug: next.slug, title: next.title },
  };
};
