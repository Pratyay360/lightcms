<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div class="privacy-wrap">
  {@html data.html}
</div>

<style>
  .privacy-wrap {
    --privacy-link: light-dark(var(--color-primary-700), var(--color-primary-300));
    max-width: 46rem;
    margin-inline: auto;
    padding-block: 2.5rem 4rem;
    padding-inline: 1.25rem;
    color: var(--foreground);
    line-height: 1.75;
    overflow-wrap: break-word;
  }

  .privacy-wrap :global(h1),
  .privacy-wrap :global(h2),
  .privacy-wrap :global(h3) {
    font-family: inherit;
    color: var(--foreground);
    line-height: 1.3;
    text-wrap: balance;
    scroll-margin-top: 5rem;
  }
  .privacy-wrap :global(h1) {
    font-size: 1.875rem;
    font-weight: 700;
    margin-block: 0 0.5rem;
  }
  .privacy-wrap :global(h2) {
    font-size: 1.3125rem;
    font-weight: 700;
    margin-block: 2.75rem 1rem;
    padding-top: 1.75rem;
    border-top: 1px solid var(--border);
  }
  .privacy-wrap :global(h3) {
    font-size: 1.0625rem;
    font-weight: 650;
    margin-block: 2rem 0.75rem;
  }
  .privacy-wrap :global(p) {
    margin-block: 0 1rem;
    font-size: 0.9375rem;
  }
  .privacy-wrap :global(ul),
  .privacy-wrap :global(ol) {
    margin-block: 0 1rem;
    padding-inline-start: 1.5rem;
    font-size: 0.9375rem;
  }
  .privacy-wrap :global(li + li) {
    margin-top: 0.375rem;
  }
  .privacy-wrap :global(ul) {
    list-style-type: square;
  }
  .privacy-wrap :global(ul > li > ul) {
    list-style-type: circle;
  }
  .privacy-wrap :global(ul > li > ul > li > ul) {
    list-style-type: square;
  }
  .privacy-wrap :global(ol li) {
    font-family: inherit;
  }
  .privacy-wrap :global(blockquote) {
    margin-block: 0 1rem;
    margin-inline: 0;
    padding: 0.875rem 1.125rem;
    font-size: 0.9375rem;
    color: var(--foreground);
    background: var(--muted);
    border-left: 3px solid var(--privacy-link);
    border-radius: 0 0.5rem 0.5rem 0;
  }
  .privacy-wrap :global(blockquote > :last-child) {
    margin-bottom: 0;
  }
  .privacy-wrap :global(hr) {
    margin-block: 2rem;
    border-color: var(--border);
  }
  .privacy-wrap :global(table) {
    width: 100%;
    margin-block: 0 1.5rem;
    font-size: 0.875rem;
    line-height: 1.6;
    border-collapse: collapse;
  }
  .privacy-wrap :global(th),
  .privacy-wrap :global(td) {
    padding: 0.625rem 0.75rem;
    text-align: left;
    vertical-align: top;
    border: 1px solid var(--border);
  }
  .privacy-wrap :global(th) {
    font-weight: 650;
    background: var(--muted);
  }
  .privacy-wrap :global(a) {
    color: var(--privacy-link);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
  .privacy-wrap :global(a:focus-visible) {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
</style>
