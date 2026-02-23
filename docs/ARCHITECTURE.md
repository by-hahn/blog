# Architecture

This document covers the build pipeline, template system, content model, and security hardening in detail.

---

## Table of Contents

- [Build Pipeline](#build-pipeline)
- [Template System](#template-system)
- [Content Model](#content-model)
- [Security Hardening](#security-hardening)

---

## Build Pipeline

All build logic is in `scripts/build.js`. Every time you run the build, it deletes `dist/` and rebuilds everything from scratch. There is no incremental build, no tracking of which files changed. This is a deliberate choice: at this scale, a full rebuild finishes in under a second, and the simpler approach is easier to maintain.

### Steps

1. **Clean** - `dist/` is deleted and recreated as an empty directory.

2. **Copy static assets** - `main.css`, `theme.js`, `404.html`, and the Google Search Console verification file are copied from `src/assets/` and `src/` to `dist/`. These files are not modified.

3. **Discover posts** - `glob` finds all `*.md` files under `posts/**/*.md`. Files that do not follow the `YYYY-MM-DD~slug.md` naming format, or that fail path validation, are logged and skipped.

4. **Parse content** - Each file is read and processed:
   - `gray-matter` separates the YAML frontmatter from the Markdown body
   - `markdown-it` converts the Markdown body to an HTML string

5. **Extract metadata from filename** - The filename is the only source for the post's date and URL slug. Frontmatter cannot override these. This keeps URLs stable even if you edit the frontmatter later.

6. **Apply frontmatter fallbacks** - If `title` is missing, it is generated from the slug (hyphens become spaces, title-cased). If `description` is missing, it is taken from the first paragraph of the post, with HTML tags removed.

7. **Generate post pages** - Each post is inserted into `template-post.html` using token replacement, then saved to `dist/<category>/<slug>/index.html`.

8. **Generate category index pages** - One index page is created per category using `template-index.html`. Pages are created even for empty categories, so navigation links always work.

9. **Generate homepage** - The homepage (`dist/index.html`) is built from `template-index.html` with:
   - Recent posts list (newest first)
   - Category cards with post counts
   - Featured posts section (posts with `featured: true` in frontmatter, up to 3)

10. **Write auxiliary files** - `sitemap.xml`, `robots.txt`, and `posts-index.json` are written to `dist/`.

### Design Trade-offs

**Full rebuild over incremental** - An incremental build would need to track which files changed, which templates depend on which posts, and when to invalidate cached output. For a blog with a few dozen to a few hundred posts, a full rebuild takes under a second. The added complexity of incremental builds was not worth it at this scale.

**Single-file pipeline** - All build logic is in `scripts/build.js`. This was easy to work with in early development, but the file now handles many different things. In a bigger project, it would make sense to split this into separate modules (content parser, template renderer, file writer, etc.). For now, it is still manageable.

**No hot-reload** - There is no file watcher or local dev server. Thought this would be just fine for writing posts. When editing templates or CSS, you need to run the build manually and refresh the browser each time. This is the main friction in the development workflow.

---

## Template System

Two HTML templates in `src/` are used to generate all pages.

| Template | Generated pages |
|---|---|
| `template-index.html` | Homepage, all category index pages |
| `template-post.html` | All individual post pages |

The build script creates the final HTML by replacing placeholder tokens in the template with the actual values for each page. No external templating library is used.

### Inline Tokens

These tokens are replaced with escaped text or pre-rendered HTML:

| Token | Replaced with |
|---|---|
| `__TITLE__` | Post or page title (HTML-escaped) |
| `__SUBTITLE__` | Post subtitle (HTML-escaped, empty string if not set) |
| `__DATE__` | Formatted publication date |
| `__READING_TIME__` | Estimated reading time, e.g. `"5 min"` |
| `__CONTENT__` | Rendered Markdown as HTML |
| `__TOC__` | Table of contents HTML for the desktop sidebar |
| `__MOBILE_TOC__` | Table of contents HTML for mobile (collapsible) |
| `__CATEGORY__` | Category slug |
| `__CATEGORY_LABEL__` | Category name as displayed to users |

### Comment-Style Hooks

These are replaced with larger HTML blocks. Using HTML comment syntax means the template is still valid HTML that can be opened in a browser before the build runs.

| Hook | Replaced with |
|---|---|
| `<!-- __META__ -->` | Full `<meta>` block: description, canonical URL, OG tags |
| `<!-- __RECENT_POSTS__ -->` | Recent posts list HTML |
| `<!-- __CATEGORY_CARDS__ -->` | Category grid HTML |
| `<!-- __FEATURED_POSTS__ -->` | Featured posts section HTML |

`<!-- __META__ -->` is the most important hook. It lets the build inject different `<meta>` and `<link>` tags into `<head>` for each page, without needing to split the template into multiple partial files.

---

## Content Model

### Filename Convention

```
YYYY-MM-DD~slug.md
```

Both parts are required:

- **Date** - sets the publication date, sort order, and the `<time>` element in the output. The format must be ISO 8601 (`YYYY-MM-DD`).
- **Slug** - becomes the URL path segment. **Only lowercase letters, numbers, and hyphens are allowed.** The build will reject filenames with other characters.

The **category** comes from the name of the subdirectory directly under `posts/`. The final URL of a post looks like:

```
https://blog.by-hahn.com/<category>/<slug>/
```

The filename is the permanent identifier for a post. You can edit the frontmatter freely without changing the URL. To change the URL, rename the file.

### Frontmatter Fields

All fields are optional. The build uses fallback values where noted.

| Field | Type | Fallback | Notes |
|---|---|---|---|
| `title` | string | Generated from slug | Max 200 chars |
| `subtitle` | string | - | Shown below the title on the post page |
| `description` | string | First paragraph (HTML removed) | Max 500 chars. Used in meta description and post previews. |
| `tags` | string | `[]` | - |
| `featured` | boolean | `false` | Shows the post in the homepage featured section |
| `og_image` | string | - | - |
| `og_title` | string | Same as `title` | Used only for `og:title`. Max 200 chars. |

### Table of Contents Generation

During the build, the rendered HTML of each post is scanned for `<h2>` and `<h3>` elements. For each heading:

1. The heading text is extracted.
2. A slug is generated (lowercase, non-alphanumeric characters replaced with hyphens).
3. If the same slug already exists in this post, a number is added at the end (`-2`, `-3`, ...) to make it unique.
4. The `id` attribute is added to the heading element in the HTML.
5. The heading is added to the TOC list.

Two versions of the TOC are inserted into the template:
- `__TOC__` - a `<nav>` list for the sticky sidebar on desktop
- `__MOBILE_TOC__` - a `<details><summary>` collapsible block for mobile

---

## Security Hardening

The build processes Markdown files that may contain untrusted content, and outputs static HTML that is served to users. The following protections are in place.

### HTML Escaping

All values from frontmatter that are inserted into HTML, such as `title`, `subtitle`, `description`, `og_title`, tag names, category names, and category labels are passed through an `escapeHtml` function before being written to the output. This prevents XSS attacks where a malicious string in frontmatter could inject scripts into the generated page.

### Path Traversal Prevention

Before writing any output file, the build checks that the target path is inside `dist/` using an `isSafePath` function. For example, a slug like `../../etc/passwd` would resolve to a path outside `dist/` and would be rejected with a logged error.

### Dangerous Protocol Blocking

A custom `markdown-it` link renderer handles all `<a href>` output. Before writing the `href` value, it checks for dangerous protocols: `javascript:`, `data:`, `vbscript:`, `file:`. If any of these are found, the `href` is replaced with `#`.

### Link Safety Attributes

The same custom link renderer adds `rel="noopener noreferrer"` to every link. This prevents the linked page from accessing `window.opener` (tab-napping), and stops the browser from sending the `Referer` header.

### Raw HTML in Markdown

`markdown-it` is configured with `html: false`. Any raw HTML written inside a post's Markdown will be escaped and shown as plain text in the output. Post authors cannot inject arbitrary HTML through post content.

### Input Validation

- Frontmatter string fields are trimmed to defined maximum lengths before use.
- Category names (from directory names) and filenames are checked against an allowed-character pattern before being used in paths or HTML.

---

**Last updated:** February 23, 2026 | Based on commit: `0910735`
