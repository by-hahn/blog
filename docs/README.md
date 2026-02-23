# Engineering Documentation

This directory contains technical documentation for the custom static publishing system powering **blog.by-hahn.com**.

Unlike traditional framework-based blogs, this project is built around a handcrafted Node.js build pipeline.  
These documents explain the architecture, design decisions, SEO strategy, and operational learnings behind the system.

---

## System Architecture

- **[Architecture](./ARCHITECTURE.md)**  
  High-level system design and structural overview of the static site generator.

- **[Build Pipeline](./BUILD_PIPELINE.md)**  
  Detailed explanation of the content processing flow, HTML generation, and deployment logic.

---

## Content & SEO

- **[SEO Strategy](./SEO_STRATEGY.md)**  
  Metadata generation, sitemap logic, Open Graph handling, and indexing considerations.

---

## Engineering Notes

- **[Bug Log](./BUG_LOG.md)**  
  Chronological record of fixes and technical issues encountered during development.

- **[Lessons Learned](./LESSONS_LEARNED.md)**  
  Design reflections and insights gained from building and evolving the system.

---

## Philosophy

This project prioritizes:

- Build-time rendering over runtime fetching
- Deterministic outputs over API-dependent content
- Explicit pipeline logic over framework abstraction
- Long-term maintainability and transparency

The documentation in this directory exists to make design decisions explicit and traceable.