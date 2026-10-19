import { compile } from "mdsvex";
import { createHighlighter } from "shiki";

const highlighter = await createHighlighter({
  themes: ["github-dark", "github-light"],
  langs: [
    "typescript",
    "javascript",
    "tsx",
    "jsx",
    "html",
    "css",
    "bash",
    "json",
    "yaml",
    "markdown",
    "svelte",
  ],
});

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

/**
 * mdsvex only emits `id` attributes when a slugger is configured, so headings
 * arrive bare. Fragments such as `#section-name` would otherwise never resolve,
 * which SvelteKit rejects at prerender time.
 */
export function addHeadingIds(html: string): string {
  const seen = new Map<string, number>();

  return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (_heading, level, inner) => {
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

export async function renderMarkdown(source: string) {
  const compiled = await compile(source, {
    highlight: {
      highlighter: async (code, lang) => {
        const language = lang || "text";
        const loadedLangs = highlighter.getLoadedLanguages();

        if (loadedLangs.includes(language)) {
          return highlighter.codeToHtml(code, {
            lang: language,
            themes: {
              light: "github-light",
              dark: "github-dark",
            },
          });
        }
        return `<pre><code class="language-${language}">${code}</code></pre>`;
      },
    },
  });
  let html = compiled?.code || "";
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

  return addHeadingIds(html.trim());
}
