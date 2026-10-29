---

title: Introduction
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
- "lightcms"
- "getting started"
- "introduction"
- "wysiwyg"
- "markdown"
- "git-backed"

---

---

### 1. 🗂️ Git-Backed Storage (Zero Lock-In)

Your content belongs to you and on your own git repository. Every draft, post, and revision is stored directly as a file with front matter.
No database to think about, no vendor lock in, and full version history with Git branches,
commits, and pull requests.

### 2. ✍️ Awesome Editor and Front Matter support

Built on top of [TipTap](https://tiptap.dev), the editor gives you a nice visual
formatting while automatically generating clean, semantic Markdown and YAML front matter.
Enjoy rich typography, math equations (KaTeX), syntax highlighted code blocks,
tables, task lists, and drag-and-drop media.

### 3. 🤖 Integrated AI Copilot

Drafting and editing is faster with an integrated AI writing companion. Ask the copilot
to outline articles, rephrase paragraphs, expand ideas, or fix grammar
powered by any OpenAI compatible provider (OpenAI, OpenRouter, Ollama cloud, NVIDIA NIM).

### 4. 🎙️ Speech to Text

Write at the speed you think, record your thoughts directly in the editor
and let [OpenAI Whisper](https://openai.com/index/whisper/) or [Wit.ai](https://wit.ai/)
transcribe that into text.

### 5. 🌗 First Class Themes and Appearance

Carefully curated light and dark modes with all major custom theme support catering to your needs and taste.

### 6. 📬 Automated Newsletter Dispatch

Built in support for [Newsy](https://newsy.lightcms.me) turns newly published posts into
newsletters and sents directly to your audience without any monthly third party subscriptions.

---

## How LightCMS Works

The LightCMS workflow keeps technical complexity hidden from the user while
preserving options to ease the process:

1. **Sign In**: Log into your LightCMS instance with your GitHub account.
2. **Select Repository**: Pick the GitHub repository containing your static blog or website (Astro, Hugo, SvelteKit, Jekyll, Next.js, etc.).
3. **Write & Format**: Create new articles or edit existing posts with real time visual feedback, asset uploads, and front matter management.
4. **Publish**: LightCMS automatically creates a commit or pull request to your chosen branch.
5. **Automated Deployment**: Your existing build pipeline cloudflare pages, netlify, or vercel integrates with LightCMS to automatically deploy your site. But for custom deployment needs,

### Dont't worry we have a lot of preconfigured sample repositories with ci pipelines to deploy on github pagess

Model repositories for all major static site generators, you can hand this over to your agent for further customization.

---

## Next Steps

Ready to explore further? Follow these guides to tailor LightCMS to your stack:

- [Why LightCMS?](/docs/why-lightcms) — Read the design philosophy behind Git backed publishing.
- [How to Start a Blog](/docs/how-to-start-a-blog) — Step by step guide to starting a fast, durable blog.
- [Self Hosting LightCMS](/docs/self-hosting-lightcms) — Deploy your own private instance of LightCMS.
- [Newsletter Automation](/docs/newsletter-newsy) — Distribute posts to subscribers automatically with Newsy.
- [Building a Greener Web](/docs/building-a-greener-web) — Learn how static publishing reduces digital carbon emissions.
