# Build Pipeline

Detailed reference for the `scripts/build.js` build process - what it does, what it produces, and how it behaves under error conditions.

---

## Table of Contents

- [Running the Build](#running-the-build)
- [Build Steps](#build-steps)
- [Output Structure](#output-structure)
- [Generated File Reference](#generated-file-reference)
- [Error Handling](#error-handling)

---

## Running the Build

```bash
npm run build
```

This executes `node scripts/build.js`. The build always performs a **full, clean rebuild** - `dist/` is deleted first and recreated from scratch. There is no incremental mode, no watch mode, and no dependency cache.

**Prerequisites:**
- Node.js ≥ 20
- Dependencies installed via `npm ci`

---

## Build Steps

### 1. Clean output directory

`dist/` is removed with `fs-extra.remove()` and recreated empty. This guarantees no stale files from previous builds survive into the new output.

### 2. Copy static assets

The following files are copied from source into `dist/` flat (no subdirectory):

| Source | Destination |
|---|---|
| `src/assets/css/main.css` | `dist/main.css` |
| `src/assets/js/theme.js` | `dist/theme.js` |
| `src/404.html` | `dist/404.html` |
| `src/assets/google114f18ded00f75b0.html` | `dist/google114f18ded00f75b0.html` |

These files are not transformed - they are copied as-is.

### 3. Discover and parse posts

`glob` finds all files matching `posts/**/*.md`. Each file goes through:

1. **Filename validation** - Must match `YYYY-MM-DD~slug.md`. Files that don't match are skipped with a warning.
2. **Path safety check** - The resolved output path must fall within `dist/`. Files that fail are skipped with a warning.
3. **Frontmatter parse** - `gray-matter` splits the YAML block from the Markdown body.
4. **Field validation** - Field types and lengths are checked. Invalid values fall back to defaults or are discarded.
5. **Markdown render** - The body is rendered to HTML by `markdown-it` with `html: false` and the custom link renderer applied.
6. **TOC extraction** - `<h2>` and `<h3>` elements are scanned from the rendered HTML to build the heading list. Unique `id` attributes are assigned with collision handling.
7. **Metadata assembly** - `title`, `description`, category, slug, URL, reading time, and OG fields are finalized.

### 4. Generate post pages

For each valid post, the build:

1. Loads `src/template-post.html`.
2. Replaces all inline tokens (`__TITLE__`, `__CONTENT__`, `__TOC__`, etc.).
3. Replaces the `<!-- __META__ -->` hook with the per-post `<meta>` block.
4. Writes the result to `dist/<category>/<slug>/index.html`.

The `index.html` convention gives every post a clean URL (`/category/slug/`) without relying on server-side URL rewriting.

### 5. Generate category index pages

For each of the 8 fixed categories plus any additional categories discovered from post directories:

1. Loads `src/template-index.html`.
2. Builds an HTML list of posts in that category, sorted by date descending.
3. Replaces tokens and the `<!-- __RECENT_POSTS__ -->` hook.
4. Writes to `dist/<category>/index.html`.

Category index pages are generated even for categories with no posts. This keeps navigation links valid regardless of content.

### 6. Generate homepage

The homepage combines three sections:

- **Recent posts** - last N posts across all categories, sorted by date descending
- **Category cards** - one card per category with post count
- **Featured posts** - posts where `featured: true`, just 3 posts, sorted by date descending

All three are assembled as HTML strings and injected into `template-index.html` via their respective comment-style hooks, then written to `dist/index.html`.

### 7. Write auxiliary files

| File | Description |
|---|---|
| `dist/sitemap.xml` | XML sitemap listing all generated pages with `<loc>` and `<lastmod>` |
| `dist/robots.txt` | Allows all crawlers, points to sitemap |
| `dist/posts-index.json` | JSON array of all post metadata (title, description, tags, featured, category, date, slug, etc.) |

`posts-index.json` is available as a static file that can be used by search features on the page or other websites.

---

## Output Structure

```
dist/
├── index.html                        # Homepage
├── main.css                          # Styles
├── theme.js                          # Theme toggle script
├── 404.html                          # Custom 404 page
├── robots.txt
├── sitemap.xml
├── posts-index.json                  # All posts metadata
├── google114f18ded00f75b0.html       # GSC verification
│
├── activities/
│   ├── index.html
│   └── <slug>/
│       └── index.html                # One directory per post
├── certifications/
│   └── index.html
├── goals/
│   └── index.html
├── guestbook/
│   └── index.html
├── paper-reviews/
│   └── index.html
├── posts/
│   └── index.html
├── projects/
│   └── index.html
└── study-notes/
    └── index.html
```

Each post is at `dist/<category>/<slug>/index.html`, producing clean URLs of the form `https://blog.by-hahn.com/<category>/<slug>/` without requiring server-side routing.

---

## Generated File Reference

### `index.html` (homepage)

Contains:
- Site header with navigation
- Featured posts section (if any posts have `featured: true`)
- Recent posts list
- Category card grid
- Site footer

### `<category>/index.html`

Contains:
- Category heading and description
- Chronological post list for that category
- Navigation

### `<category>/<slug>/index.html`

Contains:
- Full post HTML (rendered Markdown)
- Post metadata: title, subtitle, date, reading time, tags
- Sticky sidebar TOC (populated from `__TOC__` token, empty if no headings)
- Mobile collapsible TOC (from `__MOBILE_TOC__` token)
- All OG and canonical meta tags in `<head>`

### `sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://blog.by-hahn.com/</loc>
    <lastmod>YYYY-MM-DD</lastmod>
  </url>
  <!-- one <url> entry per generated page -->
</urlset>
```

### `posts-index.json`

```json
[
  {
    "title": "Post Title",
    "subtitle": "Post Subtitle",
    "description": "Post summary.",
    "tags": ["engineering"],
    "featured": false,
    "readingTime": "1 min",
    "category": "projects",
    "date": "2026-01-04",
    "slug": "post-slug",
    "permalink": "/projects/post-slug/"
    "url": "https://blog.by-hahn.com/projects/post-slug/"
  }
]
```

Posts are sorted by date descending. This file can be fetched client-side to implement search or filtering without a server.

---

## Error Handling

The build is designed to be **non-fatal on malformed posts**. A single bad post should not block the rest of the site from building.

| Condition | Behavior |
|---|---|
| Filename does not match `YYYY-MM-DD~slug.md` | Skip post, log warning with filename |
| Resolved output path escapes `dist/` | Skip post, log warning with path |
| Frontmatter field exceeds length limit | Truncate to limit, continue |
| Category directory name contains unsafe characters | Skip category, log warning |
| Template file missing | Fatal error - build exits |

The CI workflow (`deploy.yml`) treats any non-zero build exit code as a failure, preventing a broken build from being deployed.

---

**Last updated:** February 28, 2026 | Based on commit: `a3a490b`
