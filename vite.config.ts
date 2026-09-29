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
    // The `auth` CLI dev dependency pins an older exact `@better-auth/core`, which bun hoists to
    // the project root, while `better-auth` resolves its own nested copy. Externalizing these
    // packages makes the built server resolve the hoisted, mismatched copy at runtime, so they
    // are bundled together to keep a single consistent version.
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
