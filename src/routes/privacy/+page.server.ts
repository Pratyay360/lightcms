import { renderMarkdown } from "$lib/server/markdown";
import type { PageServerLoad } from "./$types";
import policy from "./policy.md?raw";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const EXPLICIT_ID_PATTERN = /\{#([A-Za-z][\w:.-]*)\}\s*$/;

function uniqueId(base: string, seen: Map<string, number>): string {
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);

  return count === 0 ? base : `${base}-${count}`;
}

function addHeadingIds(html: string): string {
  const seen = new Map<string, number>();

  return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (heading, level, inner) => {
    const text = inner
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const explicit = text.match(EXPLICIT_ID_PATTERN);

    if (explicit) {
      const id = uniqueId(explicit[1], seen);
      const cleanInner = inner.replace(/\s*\{#([A-Za-z][\w:.-]*)\}\s*$/, "");

      return `<h${level} id="${id}">${cleanInner}</h${level}>`;
    }

    return `<h${level} id="${uniqueId(slugify(text), seen)}">${inner}</h${level}>`;
  });
}

export const load: PageServerLoad = async () => {
  const html = addHeadingIds(await renderMarkdown(policy));

  return { html };
};
