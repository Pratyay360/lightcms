// @ts-nocheck
import adapter from "@sveltejs/adapter-vercel";
import { sveltekit } from "@sveltejs/kit/vite";
// import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { mdsvex } from "mdsvex";
import { defineConfig } from "vite-plus";

export default defineConfig({
	fmt: {
		ignorePatterns: [],
	},
	lint: {
		plugins: ["typescript", "unicorn", "oxc"],
		categories: {
			correctness: "error",
		},
		rules: {
			"vite-plus/prefer-vite-plus-imports": "error",
		},
		options: {
			typeAware: true,
			typeCheck: false,
		},
		jsPlugins: [
			{
				name: "vite-plus",
				specifier: "vite-plus/oxlint-plugin",
			},
		],
	},
	server: {
		allowedHosts: true,
	},

	plugins: [
		{
			name: "superforms-skip-dead-default",
			enforce: "pre",
			async resolveId(source, importer) {
				if (source === "sveltekit-superforms") {
					const resolved = await this.resolve(
						"sveltekit-superforms/client",
						importer,
						{
							skipSelf: true,
						},
					);
					return resolved?.id ?? null;
				}
				return null;
			},
		},
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
			compilerOptions: {
				experimental: { async: true },
			},
			experimental: {
				remoteFunctions: true,
				forkPreloads: true,
			},
			typescript: {
				config: (config) => {
					config.include.push("../drizzle.config.ts");
				},
			},
		}),
		mdsvex({ extensions: [".svelte", ".md"] }),
	],
});
