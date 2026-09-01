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
        // Fallback for unsupported languages
        return `<pre><code class="language-${language}">${code}</code></pre>`;
      },
    },
  });
  let html = compiled?.code || "";
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

  return html.trim();
}
