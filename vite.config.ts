import adapter from "@sveltejs/adapter-vercel";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { mdsvex } from "mdsvex";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    options: { typeAware: true, typeCheck: true },
  },
  server: {
    allowedHosts: true,
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: adapter(),
      paths: {
        relative: true,
      },
      experimental: {
        remoteFunctions: true,
        forkPreloads: true,
      },
      vitePlugin: {
        inspector: {
          // toggleKeyCombo: "alt-x",
          showToggleButton: "active",
          toggleButtonPos: "bottom-right",
        },
      },
    }),
    mdsvex({ extensions: [".svelte", ".md"] }),
  ],
});
