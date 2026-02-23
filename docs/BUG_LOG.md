# Bug Log

## Index
- [2026-02-15] Mobile toc visibility + anchor/highlight
- [2026-01-02] First GitHub Actions deployment (path-related fixes)

---

## 2026-02-15

#### `a17c72f` — fix(toc): fix mobile toc visibility and heading anchor/highlight behavior
**Impact:** Mobile users could not access TOC; anchor/highlight behavior was inconsistent.

- TOC was not visible on mobile devices
- Add scroll-margin-top to headings
- Fixed incorrect anchor link generation and scroll-based heading highlight behavior

---

## 2026-01-02

### Build: First GitHub Actions Deployment (`cc074cd`)

This was the first time the blog was deployed through GitHub Actions.

The local build had been working without visible issues. However, moving to a CI-based deployment exposed several assumptions in the templates. Most of them were related to relative paths and deployment behavior.

What appeared correct in the local environment behaved differently once the site was built and served through GitHub Pages.

The fixes below were part of stabilizing the automated deployment workflow.

---

#### `220bd65` — fix: update buttons to point root paths
**Impact:** Navigation buttons broke on nested routes due to relative paths.

- Updated buttons to use root-relative paths

#### `6d495c4` — fix: ensure custom domain persistence during GitHub Pages deployment
**Impact:** Custom domain setting could be wiped after deployment.

- Preserved CNAME during automated deployment

#### `4b81862` — fix: fix broken category paths in templates
**Impact:** Category navigation could lead to 404.

- Corrected template path resolution

#### `89dc336` — fix: fix broken css paths in templates
**Impact:** Styles failed to load.

- Fixed incorrect relative path references

---

**Last updated:** February 23, 2026 | Based on commit: `0910735`
