---
title: Getting Started with LightCMS
description: Learn how to use LightCMS and integrate it with your static site generator.
serial: 1
date: 2026-09-01T16:44:00Z
draft: false
tags:
  - lightcms
  - cms
  - git
  - ssg
  - static
  - site
  - generator
keywords:
  - lightcms
  - getting started
  - wysiwyg
  - markdown
  - git-backed
preview: /og-image.png
---

**LightCMS** is a lightweight, Git backed content management system and workspace designed to bring the excitement of writing back
and to make the process of writing fun and easier than ever before.
It bridges the gap between the power of static site generators and the simplicity
of a distraction-free, visual editor.

## Core Pillars

LightCMS is designed around a single guiding principle:
**Give everyone a voice to speak — nothing should stand between you and sharing your knowledge.**

### 1. 🗂️ Git-Backed Storage (Zero Lock-In)

Your content belongs to you and on your own git repository. Every draft, post, and revision is stored directly as Markdown and front matter files in your own GitHub repository.
No proprietary database exports, no vendor lock in, and full version history
with Git branches, commits, and pull requests.

### 2. ✍️ WYSIWYG & Markdown Synergy

Built on [TipTap](https://tiptap.dev), the editor gives you real-time visual
formatting while automatically generating clean, semantic Markdown and YAML front matter.
Enjoy rich typography, math equations (KaTeX), syntax-highlighted code blocks,
tables, task lists, and drag-and-drop media.

### 3. 🤖 Integrated AI Copilot

Drafting and editing is faster with an integrated AI writing companion. Ask the copilot
to outline articles, rephrase paragraphs, expand ideas, or fix grammar
powered by any OpenAI-compatible provider (OpenAI, OpenRouter, Ollama, NVIDIA NIM).

### 4. 🎙️ Speech to Text

Capture inspiration on the fly. Record your thoughts directly inside the editor
and let [openai Whisper](https://groq.com) (powered by Vercel AI SDK)
or [Wit.ai](https://wit.ai/)
transcribe your speech into structured text in seconds.

### 5. 🌗 First-Class Themes & Aesthetics

Carefully curated light and dark modes with all major custom theme support catering to your needs and taste.

### 6. 📬 Automated Newsletter Dispatch

Built-in support for [Newsy](https://github.com/light-cms/newsy) turns newly
published posts into email newsletters sent directly to your audience without any monthly third-party subscriptions.

---

## How LightCMS Works

The LightCMS workflow keeps technical complexity hidden from the user while
preserving options to ease the process:

1. **Sign In**: Log into your LightCMS instance with your GitHub account.
2. **Select Repository**: Pick the GitHub repository containing your static blog or website (Astro, Hugo, SvelteKit, Jekyll, Next.js, etc.).
3. **Write & Format**: Create new articles or edit existing posts with real time visual feedback, asset uploads, and front matter management.
4. **Publish**: LightCMS automatically creates a commit or pull request to your chosen branch.
5. **Automated Deployment**: Your existing CI/CD pipeline (e.g. GitHub Actions) builds and deploys your static site to your favorite host.

### Dont't worry we have a lot of preconfigured sample repositories with

Model repositories for all major static site generators

you can hand this over to your agent for further customization.

---

## Next Steps

Ready to explore further? Follow these guides to tailor LightCMS to your stack:

- [Why LightCMS?](/docs/why-lightcms) — Read the design philosophy behind Git backed publishing.
- [How to Start a Blog](/docs/how-to-start-a-blog) — Step by step guide to starting a fast, durable blog.
- [Self Hosting LightCMS](/docs/self-hosting-lightcms) — Deploy your own private instance of LightCMS.
- [Newsletter Automation](/docs/newsletter-newsy) — Distribute posts to subscribers automatically with Newsy.
- [Building a Greener Web](/docs/building-a-greener-web) — Learn how static publishing reduces digital carbon emissions.
