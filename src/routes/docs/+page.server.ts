import { DOCS_DESCRIPTION, DOCS_TITLE, absoluteUrl } from "$lib/seo";
import { loadDocEntries } from "$lib/server/docs";
import type { PageServerLoad } from "./$types";

export const prerender = true;

export const load: PageServerLoad = async () => {
	const entries = await loadDocEntries();

	const posts = entries.map((entry) => ({
		title: entry.title,
		slug: `/docs/${entry.slug}`,
		serial: entry.serial,
		description: entry.description,
	}));

	return {
		title: "Documentation",
		posts,
		seo: {
			title: DOCS_TITLE,
			description: DOCS_DESCRIPTION,
			jsonLd: {
				"@type": "ItemList",
				name: DOCS_TITLE,
				description: DOCS_DESCRIPTION,
				itemListElement: posts.map((post, index) => ({
					"@type": "ListItem",
					position: index + 1,
					name: post.title,
					url: absoluteUrl(post.slug),
				})),
			},
		},
	};
};
