import { renderMarkdown } from "$lib/server/markdown";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const modules = import.meta.glob("../src/*.md", {
		query: "?raw",
		import: "default",
		eager: true,
	});
	const fileKey = Object.keys(modules).find(
		(key) =>
			key.endsWith(`/${params.slug}.md`) || key.endsWith(`\\${params.slug}.md`),
	);

	const file = fileKey ? modules[fileKey] : null;

	if (typeof file !== "string") {
		throw new Error("Document not found");
	}

	const html = await renderMarkdown(file);

	return {
		content: html,
	};
};
