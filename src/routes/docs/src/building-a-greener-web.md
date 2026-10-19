---
title: "Static Sites and CO2: Building a Greener Web"
description: Why static sites emit less carbon than dynamic ones, how CDN caching and object storage cuts both energy and carbon footprint, how to measure your website's carbon footprint, and what a greener web looks like.
date: 2026-10-14T13:30:00Z
draft: false
tags:
  - sustainability
  - static-sites
  - green-web
  - co2
  - ssg
keywords:
  - static sites
  - green web
  - sustainability
  - website carbon
preview: /og-image.png
---

Every page view costs energy. Somewhere, a server wakes, a cache misses, a database query runs, and electricity increasingly measured in grams of CO2
is spent delivering a paragraph of text. Commonly cited estimates put the web at roughly 2–4% of global electricity emissions,
comparable to the aviation industry. The architecture of your site determines where on that spectrum you land,
and **static sites sit at the clean end**.

---

## Why Static Sites Emit Less Carbon

A dynamic site works on every event : execute code, query a database, assemble HTML. That work happens on servers that must stay powered around the clock, even when nobody is visiting.

A static site does the work once, at build time. The finished HTML is copied to CDN edge nodes worldwide and served from cache:

- **No compute per request** — serving a cached static file uses a tiny fraction of the energy of rendering a page on demand.
- **No always-on database** — databases and application servers consume power continuously; static sites have neither.
- **Cache-friendly by default** — a request that hits an edge cache barely moves electrons beyond the network hop.
- **Tiny payloads** — Markdown-generated HTML is lean by construction, with no framework runtime shipped to the browser unless needed.

Multiply that across every visitor, every month, for the life of the site, and the difference is not symbolic.

## The Ripple Effect: Durability Is Sustainability

Static sites also age gracefully. A Hugo or Astro site built in 2026 can still be rebuilt and served in 2036 — the content is plain Markdown, toolchain is open source, and the output is a folder of files. Sites that get abandoned because their platform shut down or their WordPress install became unmaintainable force rebuilds: rewriting the same content on new infrastructure is its own kind of waste.

Owning your content as Markdown in Git is the durable, low-waste option.

## How to Measure Your Website's Carbon

You cannot improve what you do not measure:

- **[Website Carbon Calculator](https://www.websitecarbon.com/)** — estimates grams of CO2 emitted per page view and compares your site against the global average.
- **[Ecograder](https://ecograder.com/)** — scores page performance, accessibility, green hosting, and estimated carbon emissions.
- **[GreenFrame](https://greenframe.io/)** — simulates user scenarios and multi-step interactions to measure application-level carbon footprint and energy consumption.
- **[WebPageTest](https://www.webpagetest.org/)** — provides in-depth performance diagnostics alongside carbon footprint estimates and Core Web Vitals breakdowns.
- **[Green Web Checker](https://www.thegreenwebfoundation.org/check)** — checks whether a domain's hosting infrastructure runs on renewable energy.
- **Real-user metrics & Core Web Vitals** — metrics like Largest Contentful Paint (LCP) and total transfer weight correlate directly with energy consumed per view.

The LightCMS site itself displays a live carbon rating in its footer — the same measurement philosophy this guide recommends.

## How to Build a Greener Web

1. **Serve statically from a CDN** — the single biggest lever for content sites.
2. **Choose green hosting** — providers powering data centers with renewable energy (several major providers now publish their energy sourcing).
3. **Ship less JavaScript** — every kilobyte is parsed, executed, and maintained on the visitor's battery.
4. **Compress and cache images** — media is usually the heaviest part of a page; serve modern formats and long cache lifetimes.
5. **Keep content durable** — plain Markdown and open formats mean a site never needs a wasteful rebuild-from-scratch.
6. **Publish deliberately** — a small, high-value site that people return to beats a sprawling one nobody reads, byte for byte.

## Where LightCMS Fits

LightCMS is built on exactly these principles: content is committed as Markdown to your own repository, published by a static site generator, and served as cached files from your host's edge network. The CMS itself runs only while you are writing — there is no production database serving readers, because readers are served by a CDN.

---

## Frequently Asked Questions

### How much CO2 does a typical website emit?

Estimates vary by method, but a typical page view emits on the order of a fraction of a gram to a gram of CO2; heavy, poorly cached pages emit considerably more. Static, cached pages sit at the low end.

### Does green hosting really matter?

Yes. Data-center energy is the dominant factor in a site's footprint; hosting on renewable-powered infrastructure reduces it substantially.

### Is a static blog eco-friendly?

Among the greenest options available: cached files served from an edge network, no always-on database, and content that remains readable and rebuildable for decades.

### What is sustainable web?

A practice of minimizing the energy cost of the web: lean pages, efficient code, renewable hosting, durable content, and measured impact — of which static architecture is the foundation.
