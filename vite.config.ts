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
  ssr: {
    noExternal: [
      "vite-plus",
      "better-auth",
      "@better-auth/core",
      "@better-auth/drizzle-adapter",
      "@better-auth/infra",
      "@better-auth/passkey",
      "@better-auth/telemetry",
      "@better-auth/utils",
    ],
  },

  plugins: lazyPlugins(async () => [
    {
      name: "superforms-skip-dead-default",
      enforce: "pre",
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
