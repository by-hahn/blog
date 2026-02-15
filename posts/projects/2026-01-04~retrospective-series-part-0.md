---
title: "Blog Development Plan & Retrospective Series"
description: "Retrospective Series Part. 0"
og_title: "Blog Development Plan & Retrospective Series"
og_description: "Retrospective Series Part. 0"
# og_image: "auto og image generator not yet developed"
---

## Introduction

### Why I Built My Own Blog

I wanted a place to archive my work, projects, certifications, and the lessons I've learned.
But more than that, I wanted to build the platform itself.

Instead of just using an existing tool like Jekyll or Hugo, I decided to treat
the blog as a standalone engineering project. Building everything from scratch felt
like the right way to deeply understand how static sites actually work.
This included content processing, rendering, deployment, and SEO.

It wasn't the fastest path, but it was a valuable journey that taught me a lot.

---

### Initial Approach and Its Limitations

My first implementation was a client-side rendered blog that fetched posts directly
from the GitHub API. As a proof of concept, it worked. However, when considering real-world
usage, the limitations became apparent:

- SEO was fundamentally weak due to client-side rendering
- Initial page loads were slower than expected
- The Blog was too fragile due to GitHub API rate limits
- The overall user experience suffered, especially for first-time visitors

This approach helped me validate the idea, but it wasn't something I wanted to scale long-term.

---

### The Shift: Build-Time Generation

To address these issues, I redesigned the architecture around build-time generation:

- **GitHub Actions for automated builds**  
  Every push triggers a full rebuild of the site.

- **A custom Static Site Generator (SSG)**  
  Markdown files are converted into fully static HTML at build time.

This shift gave me the best of both worlds:
- Full control over structure and design
- Fast load times and strong SEO
- Zero runtime dependencies on external APIs

---

## What's Next

With the core architecture in place, the next phase focuses on polish, readability,
and long-term extensibility.

### Content & UX Enhancements

**1. Guestbook**
- A lightweight guestbook powered by Giscus
- A simple way for visitors to leave messages without heavy infrastructure

**2. Certifications Gallery**
- A dedicated gallery-style page for certifications
- More expressive than a plain list and better aligned with the portfolio aesthetic

**3. Dark Mode**
- Manual theme toggle
- Automatic detection based on system preferences

**4. Search Functionality**
- Full-text search across all posts
- Essential as content volume grows


### Technical Improvements

⭐ **[Core Focus] Markdown → HTML Rendering & Design Improvements**
- Improved typography for long-form technical writing
- Clear heading hierarchy and better spacing
- Syntax-highlighted code blocks at build time
- Styled blockquotes and callouts for notes and insights
- All presentation handled during the build process to keep Markdown content clean

⭐ **[Core Focus] Automated OG Image Generation**
- Unique Open Graph images generated per page at build time
- No runtime image generation or server-side rendering
- Consistent visuals when sharing posts on social platforms

⭐ **[Core Focus] URL & Content Architecture Refinement**
- Current: `/<category>/<slug>`
- Planned: `/<category>/<sub-category>/<slug>`
- Optional custom permalinks via YAML front matter

**Ongoing Bug Fixes**
- Continuous refinement through real-world usage
- Fixing edge cases discovered after deployment

---

## Connecting the Blog with My Portfolio

While this blog is a standalone project, my portfolio site remains the primary entry
point. One of my goals is to make the two feel naturally connected while keeping their architectures independent.

⭐ **[Core Focus] Portfolio-Blog Integration**
- During the blog build process, a structured feed of recent posts is generated
- The portfolio site consumes this pre-built data
- No runtime API calls, no duplicated logic
- Shared build artifacts, but independent deployments

This approach keeps both sites fast, simple, and loosely coupled.

---

## Coming Up: The Retrospective Series

I'm planning a short retrospective series (around five posts) that dives deeper into
the technical side of this project:

(TBD)
1. **Architecture Design & Tech Stack Decisions**  
2. **Building a Custom Static Site Generator**  
3. **Automated Deployment with GitHub Actions**  
4. **Performance Optimization & SEO**  
5. **Bugs, Trade-offs, and Lessons Learned**

Each post will focus on real decisions, trade-offs, and mistakes.
Not just the final result.

---

## Wrapping Up

Building this blog from scratch required more effort than using an existing framework,
but it paid off.

I now have:
- A platform I fully understand
- An architecture I can evolve freely
- A space that reflects both my technical growth and thought process

This is only the beginning.  
The upcoming retrospective series will document not just *what* I built, but *why*
I built it that way.

Thanks for reading, and stay tuned for more!
