import { compile } from "mdsvex";
import type { PageServerLoad } from "./$types";

interface DocPost {
	title: string;
	slug: string;
	serial: number;
	description: string;
}

export const load: PageServerLoad = async () => {
	const modules = import.meta.glob("./src/*.md", {
		query: "?raw",
		import: "default",
		eager: true,
	});

	const posts: DocPost[] = [];

	for (const [path, file] of Object.entries(modules)) {
		const raw = typeof file === "string" ? file : "";
		const compiled = await compile(raw);
		const frontmatter = (compiled?.data as Record<string, any>) || {};
		const fileName = path.split("/").pop()?.replace(/\.md$/, "") ?? "";

		posts.push({
			title: (frontmatter.title as string) ?? fileName,
			slug: `/docs/${fileName}`,
			serial: Number(frontmatter.serial ?? 0),
			description:
				(frontmatter.description as string) ??
				raw
					.replace(/^---[\s\S]*?---/, "")
					.replace(/\s+/g, " ")
					.trim()
					.slice(0, 150),
		});
	}

	posts.sort((a, b) => a.serial - b.serial);

	return {
		title: "Documentation",
		posts,
	};
};
