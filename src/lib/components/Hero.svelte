<script lang="ts">
import { DotLottieSvelte } from "@lottiefiles/dotlottie-svelte";
import ArrowRight from "@lucide/svelte/icons/arrow-right";
import Layers from "@lucide/svelte/icons/layers";
import LayoutTemplate from "@lucide/svelte/icons/layout-template";
import Pencil from "@lucide/svelte/icons/pencil";
</script>


<section id="features" class="space-y-8 border-t border-border pt-12 sm:pt-16">
  <div class="max-w-3xl space-y-3">
    <h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
      A friendly, open source Git based CMS for static sites.
    </h2>
  </div>

  <div class="rounded-2xl border border-border bg-card/50 p-6 shadow-xs sm:p-8 lg:p-12">
    <div class="space-y-12 sm:space-y-16 lg:space-y-20">
      <!-- Row 1: Box Left, Text Right -->
      <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div
          class="flex h-64 sm:h-72 lg:h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4 shadow-xs"
        >
          <DotLottieSvelte src="/speak.lottie" autoplay={true} loop={true} />
        </div>

        <div class="flex flex-col justify-center space-y-4">
          <div
            class="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground"
          >
            <Pencil size={13} class="text-primary" />
            <span>Content Creation</span>
          </div>

          <h3 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Awesome editor & natural language writing
          </h3>

          <p class="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Craft and edit posts with an intuitive, distraction free Markdown editor equipped with rich formatting and live syntax highlighting. Write at the speed of thought using natural language solutions powered by <a href="https://wit.ai" target="_blank" rel="noreferrer" class="font-semibold text-primary underline">Wit.ai</a> or OpenAI Whisper-compatible models.
          </p>
        </div>
      </div>

      <!-- Row 2: Text Left, Box Right -->
      <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div class="order-2 flex flex-col justify-center space-y-4 lg:order-1">
          <div
            class="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground"
          >
            <Layers size={13} class="text-primary" />
            <span>Architecture & Git</span>
          </div>

          <h3 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Jamstack simplicity & Git-backed collaboration
          </h3>

          <p class="text-sm leading-relaxed text-muted-foreground sm:text-base">
            LightCMS embraces the modern Jamstack workflow by keeping all content in standard frontmatter schema based Markdown files.
            Leverage Git's versioning and pull requests to collaborate transparently with complete history, zero vendor lock-in, and no database maintenance.
          </p>
        </div>

        <div
          class="order-1 flex h-64 sm:h-72 lg:h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4 shadow-xs lg:order-2"
        >
          <DotLottieSvelte src="/bloggers.lottie" autoplay={true} loop={true} />
        </div>
      </div>

      <!-- Row 3: Box Left, Text Right -->
      <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div
          class="flex h-64 sm:h-72 lg:h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4 shadow-xs"
        >
          <DotLottieSvelte src="/globe.lottie" autoplay={true} loop={true} />
        </div>

        <div class="flex flex-col justify-center space-y-4">
          <h3 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Eco friendly delivery for blogs & documentation
          </h3>

          <p class="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pre rendered static sites consume significantly less energy than database driven apps which fetch data from a server every time a page is loaded. Whether you are publishing an engineering blog or maintaining enterprise project documentation, deploy across edge CDNs with unmatched speed and a minimal carbon footprint.
          </p>

          <div>
            <a
              href="/docs"
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:underline"
            >
              Explore documentation
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div class="order-2 flex flex-col justify-center space-y-4 lg:order-1">
          <div
            class="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground"
          >
            <LayoutTemplate size={13} class="text-primary" />
            <span>Template workflow</span>
          </div>

          <h3 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Multiple templates for static site generators
          </h3>

          <p class="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Start from battle-tested templates for Hugo, Astro, Zola, Eleventy, Jekyll, and more with standardized front matter. Save time with ready-to-use configurations or customize the LLM prompt to generate templates for any static site generator.
            <a href="https://github.com/light-cms" class="text-foreground">Learn more</a>
            or you can ask a LLM to help you get started. <a href="/llms.txt" class="text-foreground">Ask a question</a>
          </p>


        </div>

        <div
          class="order-1 flex h-64 sm:h-72 lg:h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4 shadow-xs lg:order-2"
        >
          <DotLottieSvelte src="/developer.lottie" autoplay={true} loop={true} />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <div
        class="flex h-64 sm:h-72 lg:h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4 shadow-xs"
      >
        <DotLottieSvelte src="/ai.lottie" autoplay={true} loop={true} />
      </div>

      <div class="order-1 flex flex-col justify-center space-y-4 lg:order-2">


        <h3 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Content creation assistance
        </h3>

        <p class="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Leverage AI assistants to quickly draft, edit, and improve your content directly inside the editor.

        </p>


      </div>
    </div>
  </div>
</section>
