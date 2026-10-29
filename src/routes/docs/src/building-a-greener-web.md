---
title: "Static Sites and CO2: Building a Greener Web"
description: Why static sites emit less carbon, how CDN caching cuts energy use, and what a greener web looks like.
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

Every page view costs energy. Somewhere, a server makes a cache miss, few database query runs, consuming a lot of compute as a result generating kgs of CO2. Commonly cited estimates put the web at roughly 2–4% of global electricity emissions,
comparable to the aviation industry. The architecture of your site determines how much you care about the blue planet. A static site generator (SSG) that builds your site once and serves it from a CDN is the most energy efficient way to share information.

## Why Static Sites Emit less Carbon

A dynamic site works on every event : execute code, query a database, and server render every thing. That work happens on servers that must stay powered around the clock, even when nobody is visiting.

A static site does the work once, at build time. The finished HTML is copied to CDN edge nodes worldwide and served from cache:

- No compute per request serving built static file uses a tiny fraction of the energy compared to server render a page on request.
- No always on database — databases and application servers consume power continuously; static sites have neither.
- Cache friendly by default — a request that hits an edge cache barely moves electrons beyond the network hop.
- Tiny payloads — Markdown-generated HTML is lean by construction, with no bloated JavaScript or heavy CSS being shipped to the client. Client always receives the smallest possible payload, which means less to download and pages load faster.

You all may have heard the study ["milliseconds make millions"](https://www.deloitte.com/ie/en/services/consulting/research/milliseconds-make-millions.html)

## The Ripple Effect: Durability Is Sustainability

A Hugo or Astro starlight built in 2016 can still be rebuilt and served in 2036 as the content is plain Markdown which becomes timeless, entire toolchain is open source and vendor neutral, the output is just some folders and files.
Owning your content as Markdown in Git is the durable, is a time saving option.

## How to Measure Your Website's Carbon Emissions

You cannot improve what you do, if not measured:

- **[Website Carbon Calculator](https://www.websitecarbon.com/)** — estimates grams of CO2 emitted per page view and compares your site against the global average.
- **[Ecograder](https://ecograder.com/)** — scores page performance, accessibility, green hosting, and estimated carbon emissions.
- **[GreenFrame](https://greenframe.io/)** — simulates user scenarios and multistep interactions to measure application level carbon footprint and energy consumption.
- **[WebPageTest](https://www.webpagetest.org/)** — provides in depth performance diagnostics alongside carbon footprint estimates and Core Web Vitals breakdowns.
- **[Green Web Checker](https://www.thegreenwebfoundation.org)** — checks whether a domain's hosting infrastructure runs on renewable energy.
- **Real-user metrics & Core Web Vitals** — metrics like Largest Content-ful Paint (LCP) and total transfer of initial bundle downloaded by any new user on every visit.

## How to Build a Greener Web

1. **Serve statically from a CDN** — the single biggest lever for content sites.
2. **Choose green alternative** — As we all know that, static sites are built once and served from a CDN so this is the most energy efficient way going ahead.
3. **Ship less JavaScript** — every kilobyte is parsed, executed, and maintained on the visitor's battery, and bandwidth.
4. **Compress and cache images** — media is usually the heaviest part of a page; serve them through the cdn and use modern web native formats like WEBP.

## Where LightCMS Fits

> LightCMS works on exactly:

- content is committed as Markdown to your own repository, published by a static site generator, and served as compiled minified files from your hosting provider's edge network.
- The CMS itself runs only while you are writing there is no production database serving readers, because readers are served by a CDN.

### Cost of running Static Sites

Static sites are generally cheaper or free to host.
Some notable static site hosting providers are:

- [GitHub Pages](https://pages.github.com/)
- [codeberg pages](https://pages.codeberg.org/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [bitbucket pages](https://bitbucket.org/product/features/pages)
- [Render](https://render.com/)
- [surge](https://surge.sh/)

even from a custom s3 bucket one can serve a static site.

