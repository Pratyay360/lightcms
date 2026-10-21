---
title: Newsletter & Email Automation
description: How to configure automated newsletters for your blog using Newsy and Git driven publishing without expensive third-party platforms.
serial: 5
date: 2026-09-18T01:50:00Z
draft: false
tags:
  - newsletter
  - email
  - newsy
  - smtp
keywords:
  - newsletter
  - email automation
  - newsy
  - smtp
  - lightcms
preview: /og-image.png
---

Connecting with your directly via email is one of the most effective ways to
build a dedicated audience. However, the traditional process of managing a newsletter has become
needlessly cumbersome, bloated, and expensive.

LightCMS embraces a modern, developer friendly alternative: **Git-driven newsletters** powered by [Newsy](https://github.com/light-cms/newsy) .

---

## The Traditional Newsletter Problem

With conventional platforms like Mailchimp, Substack, or Brevo, your workflow typically requires:

1. Signing up for an external service with rigid subscription tiers.
2. Managing fragmented mailing lists across third-party dashboards.
3. Manually copying and pasting your blog post into proprietary rich-text email builders.
4. Dealing with bloated tracking scripts, cookies, and privacy compliance requirements.
5. Paying substantial monthly fees as your subscriber count grows.

---

## The Git-Driven Approach: Newsy

The **Newsy** philosophy is simple: **Your Git repository is the single source of truth for your newsletter.**

[Newsy](https://github.com/light-cms/newsy) is an open-source, automated newsletter service that monitors your GitHub repository:

1. **Write & Publish**: When you finish drafting an article in LightCMS and hit Publish, the Markdown file (`.md`, `.mdx`, or `.html`) is committed to your repository.
2. **Detection**: Newsy observes repository push events and detects newly created content files in your configured blog directory.
3. **Dispatch**: Newsy parses the Markdown, formats it into clean, responsive HTML, and broadcasts the newsletter directly to your subscribers via your own SMTP provider.

Learn more and explore the source on the [Newsy GitHub Repository](https://github.com/light-cms/newsy) and the [Newsy Website](https://newsy.lightcms.me).

---
