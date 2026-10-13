---
title: why light cms??
description: why yet another cms
date: '2026-09-18T00:41:00Z'
draft: false
weight: 0
tags:
  - cms
  - why
  - lightcms
  - why lightcms
isCJKLanguage: false
headless: false
---
#### **So, before introducing yet another CMS…**

I’ve tried quite a few CMS solutions over the years, and somehow, most of them felt a little pale. They worked, but they often missed something—especially when it came to the actual experience of writing and managing content for a blog.

The closest thing I found to a genuinely pleasant workflow was Front Matter. It makes working with content much easier, but the core problem remains: opening VS Code is a lot of overhead for something as simple as writing a blog post.

And that seemed backwards. Writing should be the easy part.

1. If you have learned something over the years, share that.
2. If you built something, write about it.
3. If you solved a problem that took you three days to figure out, document it because someone else might discover your post months or years later while trying to solve the exact same problem.

I strongly believe that everyone should have their own little place on the internet. There are plenty of good arguments for owning your own publishing space, such as [https://dsokolovskiy.com/blog/all/why-you-should-run-a-blog/](https://dsokolovskiy.com/blog/all/why-you-should-run-a-blog/) [https://asbpe.org/blog/2009/05/04/seven-reasons-why-you-should-start-your-own-blog/](https://asbpe.org/blog/2009/05/04/seven-reasons-why-you-should-start-your-own-blog/)    [https://goinswriter.com/why-blog/](https://goinswriter.com/why-blog/). 

But getting started shouldn't require one being a web developer.

A static site is the simplest way to publish content, but managing it isn’t simple.

You write your content, a static site generator builds the pages, and CI/CD takes care of deploying them whenever the content changes. No manual uploads, no server to maintain just to publish a blog post. There are already plenty of excellent static site generators out there Jekyll, Hugo, Astro, Eleventy, and [many more](https://jamstack.org/generators/).

Yet, you shouldn't need to understand Git, Markdown, front matter schemas, repositories, or deployment pipelines just to publish a paragraph about your experience.

**A CMS that stays out of your way**

The goal is to make it possible for anyone to write and manage content in one place, with as little friction as possible.

The content still lives in Github.  
The site can still be generated automatically through CI.  
But the person writing shouldn't have to care about any of that. One should open the editor, write, and publish. That's it.

The editor should make you feel the urge to write, rather than turning writing into a sophisticated technical task.

Keeping the benefits of a Gitbacked content workflow while hiding the complexity from the person who simply wants to hit publish.

The goal isn't to build just another CMS; it's to create a pleasant publishing experience built around tools that already works well.

There are excellent tools for supporting your static site like,  comments, analytics, [newsletters.](https://github.com/pratyay360/newsy)

Also, The web shouldn't be unnecessarily heavy. Most sites don’t actually need server side rendering or megabytes of JavaScript. Static sites are particularly attractive here because they provide a fast, lightweight experience without requiring a massive client side application. Also, we should care about the environmental cost of the web, too. [(Tools like Website Carbon can help estimate the emissions associated with your website).](https://www.websitecarbon.com/)

**TL;DR**

Writing a blog post should never be a sophisticated task, One should feel delighted to write their own experience.

The Goal Of Lightcms is to make you only focus on writing.   

> Everyone has a voice. Share yours.
