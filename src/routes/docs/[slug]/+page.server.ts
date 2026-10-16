import { error } from "@sveltejs/kit";
import { absoluteUrl, SITE } from "$lib/seo";
import { loadDocEntries } from "$lib/server/docs";
import { renderMarkdown } from "$lib/server/markdown";
import type { PageServerLoad } from "./$types";

export const prerender = true;

export const entries = async () => {
  const docs = await loadDocEntries();
  return docs.map((doc) => ({ slug: doc.slug }));
};

export const load: PageServerLoad = async ({ params }) => {
  const entries = await loadDocEntries();

  const index = entries.findIndex((entry) => entry.slug === params.slug);
  const current = index === -1 ? undefined : entries[index];

  if (current === undefined) {
    throw error(404, "Document not found");
  }

  const previous = index > 0 ? entries[index - 1] : undefined;
  const next = entries[index + 1];
  const docUrl = absoluteUrl(`/docs/${current.slug}`);
  const homeUrl = absoluteUrl("/");
  const docsUrl = absoluteUrl("/docs");
  const organization = {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.origin,
  };

  return {
    title: current.title,
    description: current.description,
    keywords: current.keywords,
    content: await renderMarkdown(current.raw),
    previous:
      previous === undefined ? null : { slug: `/docs/${previous.slug}`, title: previous.title },
    next: next === undefined ? null : { slug: `/docs/${next.slug}`, title: next.title },
    seo: {
      title: `${current.title} | ${SITE.name}`,
      description: current.description,
      type: "article" as const,
      image: current.preview,
      imageAlt: current.title,
      jsonLd: [
        {
          "@type": "Article",
          headline: current.title,
          description: current.description,
          ...(current.date === null
            ? {}
            : { datePublished: current.date, dateModified: current.date }),
          mainEntityOfPage: { "@type": "WebPage", "@id": docUrl },
          author: organization,
          publisher: organization,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
            {
              "@type": "ListItem",
              position: 2,
              name: "Documentation",
              item: docsUrl,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: current.title,
              item: docUrl,
            },
          ],
        },
      ],
    },
  };
};
