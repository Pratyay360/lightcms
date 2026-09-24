import adapter from "@sveltejs/adapter-vercel";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { mdsvex } from "mdsvex";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  server: {
    allowedHosts: true,
  },

  plugins: lazyPlugins(async () => [
    {
      name: "superforms-skip-dead-default",
      enforce: "pre",
      async resolveId(source: string, importer: string | undefined) {
        if (source === "sveltekit-superforms") {
          const resolved = await this.resolve("sveltekit-superforms/client", importer, {
            skipSelf: true,
          });
          return resolved?.id ?? null;
        }
        return null;
      },
    },
    tailwindcss(),
    sveltekit({
      adapter: adapter(),
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
  ]),
});
