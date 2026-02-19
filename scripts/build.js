// scripts/build.js
// Output URL: /<category>/<slug>/
// Dist layout:
// dist/
// ├─ index.html
// ├─ css/main.css
// ├─ <category>/index.html
// ├─ <category>/<slug>/index.html
// ├─ 404.html
// ├─ robots.txt
// └─ sitemap.xml

const path = require("path");
const fs = require("fs-extra");
const glob = require("glob");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "posts");
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");

const SITE = {
  title: "by-hahn's Personal Blog",
  description: "B. Hahn's career journey across development, research, and learning.",
  url: "https://blog.by-hahn.com", // canonical base

  og: {
    title: "B. Hahn (by-hahn)'s Personal Blog",
    description: "B. Hahn's career journey across development, research, and learning.",
    image: "https://blog.by-hahn.com/og/default.png",
    type: "website",
  },
};


// Generate category pages even if there are 0 posts
const NAV_CATEGORIES = [
  "activities",
  "goals",
  "paper-reviews",
  "posts",
  "projects",
  "study-notes",
  "guestbook",
  "certifications",
];

// MarkdownIt configuration
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
});

function isValidUrl(url) {
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  return !dangerousProtocols.test(url);
}

// Override link rendering rules for security
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const href = tokens[idx].attrGet("href");

  if (href && !isValidUrl(href)) {
    tokens[idx].attrSet("href", "#");
  }

  const rel = tokens[idx].attrGet("rel") || "";
  const relSet = new Set(rel.split(/\s+/).filter(Boolean));
  relSet.add("noopener");
  relSet.add("noreferrer");
  tokens[idx].attrSet("rel", Array.from(relSet).join(" "));

  return self.renderToken(tokens, idx, options);
};

// Escape HTML special characters
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Prevent path traversal attacks
function isSafePath(basePath, targetPath) {
  const resolvedBase = path.resolve(basePath);
  const resolvedTarget = path.resolve(targetPath);

  const normalizedBase = path.normalize(resolvedBase);
  const normalizedTarget = path.normalize(resolvedTarget);

  return (
    normalizedTarget.startsWith(normalizedBase + path.sep) ||
    normalizedTarget === normalizedBase
  );
}

// Validate filename contains only safe characters
function isValidFilename(filename) {
  const safePattern = /^[\w\-\.~]+$/;
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return false;
  }
  return safePattern.test(filename);
}

// Validate category name (allows alphanumeric, hyphen, underscore)
function isValidCategory(category) {
  const safePattern = /^[a-z0-9\-_]+$/;
  return safePattern.test(category) && !category.includes("..");
}

function parsePostFilename(filename) {
  const m = filename.match(/^(\d{4})-(\d{2})-(\d{2})~(.+)\.md$/);
  if (!m) return null;
  const [, yyyy, mm, dd, slug] = m;

  if (!/^[a-z0-9\-]+$/.test(slug)) {
    console.warn(`Invalid slug format: ${slug}`);
    return null;
  }

  return { yyyy, mm, dd, slug, date: `${yyyy}-${mm}-${dd}` };
}

function humanize(s) {
  return String(s).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Calculate reading time in minutes (average 238 words per minute)
function calculateReadingTime(markdownContent) {
  const wordCount = markdownContent
    .split(/\s+/)
    .filter(word => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 238));
  return `${minutes} min`;
}

// Extract first paragraph from markdown content for auto-description
function extractFirstParagraph(markdownContent) {
  // Split by double newlines to find paragraphs
  const paragraphs = markdownContent
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith("#")); // Filter out headings
  
  if (paragraphs.length === 0) return "";
  
  const firstPara = paragraphs[0];
  // Remove markdown syntax for cleaner description
  const cleaned = firstPara
    .replace(/[*_~`]/g, "") // Remove markdown formatting
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Convert links to plain text
    .trim();
  
  return cleaned.slice(0, 500); // Limit to 500 characters
}

// Slugify text for heading IDs
function slugify(text) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^\p{L}\p{N}\-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "heading";
}

// Extract h2/h3 headings from rendered HTML, add id attributes, return modified HTML + headings list
function extractHeadingsAndAddIds(htmlContent) {
  const headings = [];
  const usedIds = new Set();

  const result = htmlContent.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, inner) => {
    const level = parseInt(tag[1]);
    const plainText = inner.replace(/<[^>]+>/g, "").trim();
    let id = slugify(plainText);

    // Ensure unique IDs
    let uniqueId = id;
    let counter = 1;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${counter++}`;
    }
    usedIds.add(uniqueId);

    headings.push({ level, text: plainText, id: uniqueId });
    return `<${tag} id="${uniqueId}"${attrs}>${inner}</${tag}>`;
  });

  return { html: result, headings };
}

// Build TOC HTML from extracted headings
function buildTocHtml(headings) {
  if (headings.length === 0) return "";

  let html = '<ul class="toc-list">';
  for (const h of headings) {
    const sub = h.level === 3 ? " toc-sub" : "";
    html += `<li><a href="#${h.id}" class="toc-link${sub}">${h.text}</a></li>`;
  }
  html += "</ul>";
  return html;
}

// Build mobile TOC (collapsible details element)
function buildMobileTocHtml(headings) {
  if (headings.length === 0) return "";

  let html = '<details class="mobile-toc"><summary>\uD83D\uDCD1 Table of Contents</summary>';
  html += buildTocHtml(headings);
  html += "</details>";
  return html;
}

function buildPermalink({ category, slug }) {
  return `/${category}/${slug}/`;
}

function fullUrlFromPath(pathname) {
  return SITE.url.replace(/\/$/, "") + pathname;
}

function buildMetaTags({ title, description, fullUrl, type = "article", og_image }) {
  const t = escapeHtml(title || SITE.title);
  const d = escapeHtml(description || SITE.description);
  const u = escapeHtml(fullUrl);
  const img = og_image ? escapeHtml(og_image) : "";

  return [
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${u}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:type" content="${escapeHtml(type)}" />`,
    `<meta property="og:url" content="${u}" />`,
    img ? `<meta property="og:image" content="${img}" />` : "",
  ].filter(Boolean).join("\n  ");
}

async function loadTemplate(name) {
  return fs.readFile(path.join(SRC_DIR, name), "utf8");
}

async function copyAssets() {
  const assetsSrc = path.join(SRC_DIR, "assets");
  if (await fs.pathExists(assetsSrc)) {
    await fs.copy(assetsSrc, DIST_DIR);
  }
  const cssSrc = path.join(SRC_DIR, "assets", "css", "main.css");
  const cssDst = path.join(DIST_DIR, "css", "main.css");
  if (await fs.pathExists(cssSrc)) {
    await fs.ensureDir(path.dirname(cssDst));
    await fs.copy(cssSrc, cssDst);
  }
}

async function copyStaticFiles() {
  // 404.html
  const p404 = path.join(SRC_DIR, "404.html");
  if (await fs.pathExists(p404)) {
    await fs.copy(p404, path.join(DIST_DIR, "404.html"));
  }

  // Google Search Console verification
  const gsc = path.join(SRC_DIR, "assets", "google114f18ded00f75b0.html");
  if (await fs.pathExists(gsc)) {
    await fs.copy(gsc, path.join(DIST_DIR, "google114f18ded00f75b0.html"));
  }

  // robots.txt (copy if exists, create if not)
  const robotsSrc = path.join(SRC_DIR, "robots.txt");
  const robotsDst = path.join(DIST_DIR, "robots.txt");
  if (await fs.pathExists(robotsSrc)) {
    await fs.copy(robotsSrc, robotsDst);
  } else {
    const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url.replace(/\/$/, "")}/sitemap.xml\n`;
    await fs.writeFile(robotsDst, robots, "utf8");
  }
}

// Inject meta tags into HTML head, prioritizing hook if available
function injectMetaIntoHead(html, metaBlock) {
  if (html.includes("<!-- __META__ -->")) {
    return html.replace("<!-- __META__ -->", metaBlock);
  }

  const hasCanonical = /rel=["']canonical["']/i.test(html);
  const hasOgTitle = /property=["']og:title["']/i.test(html);

  if (!hasCanonical && !hasOgTitle) {
    return html.replace("</head>", `  ${metaBlock}\n</head>`);
  }

  if (!hasCanonical) {
    const canonicalOnly = metaBlock
      .split("\n")
      .filter((line) => line.includes('rel="canonical"'))
      .join("\n  ");
    if (canonicalOnly) {
      return html.replace("</head>", `  ${canonicalOnly}\n</head>`);
    }
  }

  return html;
}

function renderIndexTemplate(indexTpl, { canonicalPath, recentHtml, categoryCardsHtml, featuredHtml = "" }) {
  const meta = buildMetaTags({
    title: SITE.og.title || SITE.title,
    description: SITE.og.description || SITE.description,
    fullUrl: SITE.url + canonicalPath,
    type: SITE.og.type || "website",
    og_image: SITE.og.image,
  });


  let html = indexTpl;
  html = injectMetaIntoHead(html, meta);

  html = html
    .replace("<!-- __FEATURED_POSTS__ -->", featuredHtml)
    .replace("<!-- __RECENT_POSTS__ -->", recentHtml)
    .replace("<!-- __CATEGORY_CARDS__ -->", categoryCardsHtml);

  return html;
}

// Convert YYYY-MM-DD date string to ISO format
function toIsoDate(dateStrYYYYMMDD) {
  return new Date(`${dateStrYYYYMMDD}T00:00:00.000Z`).toISOString();
}

function buildSitemap(items) {
  const entries = items.map(({ loc, lastmod }) => {
    const safeLoc = escapeHtml(loc);
    const safeLastmod = escapeHtml(lastmod);
    return `
  <url>
    <loc>${safeLoc}</loc>
    <lastmod>${safeLastmod}</lastmod>
  </url>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

(async function main() {
  try {
    console.log("Build start");
    await fs.remove(DIST_DIR);
    await fs.ensureDir(DIST_DIR);

    const indexTpl = await loadTemplate("template-index.html");
    const postTpl = await loadTemplate("template-post.html");

    await copyAssets();
    await copyStaticFiles();

    const mdFiles = glob.sync("**/*.md", { cwd: POSTS_DIR, nodir: true });

    const posts = [];
    for (const rel of mdFiles) {
      try {
        const abs = path.join(POSTS_DIR, rel);

        // Check: prevent path traversal
        if (!isSafePath(POSTS_DIR, abs)) {
          console.warn(`Skipping suspicious path: ${rel}`);
          continue;
        }

        const parts = rel.split(path.sep);
        if (parts.length < 2) continue;

        const category = parts[0];
        const filename = parts[parts.length - 1];

        // Check: validate category name
        if (!isValidCategory(category)) {
          console.warn(`Skipping invalid category: ${category}`);
          continue;
        }

        // Check: validate filename
        if (!isValidFilename(filename)) {
          console.warn(`Skipping invalid filename: ${filename}`);
          continue;
        }

        const name = parsePostFilename(filename);
        if (!name) continue;

        const raw = await fs.readFile(abs, "utf8");
        const { data: fm, content } = matter(raw);

        const slug = name.slug;
        const permalink = buildPermalink({ category, slug });
        const fullUrl = fullUrlFromPath(permalink);

        // Calculate reading time
        const readingTime = calculateReadingTime(content);

        // Limit frontmatter field lengths for security
        const title = fm?.title ? String(fm.title).slice(0, 200) : humanize(slug);
        const subtitle = fm?.subtitle ? String(fm.subtitle).slice(0, 200) : "";
        const description = fm?.description ? String(fm.description).slice(0, 500) : extractFirstParagraph(content);
        const tags = Array.isArray(fm?.tags) ? fm.tags.map(t => String(t).slice(0, 50)) : [];
        const featured = Boolean(fm?.featured);
        const og_image = fm?.og_image ? String(fm.og_image).slice(0, 500) : "";
        const og_title = fm?.og_title ? String(fm.og_title).slice(0, 200) : "";
        const og_description = description;  // Auto-generated from description

        // Check: validate og_image URL
        let validOgImage = "";
        if (og_image) {
          if (og_image.match(/^https?:\/\/.+/) && isValidUrl(og_image)) {
            validOgImage = og_image;
          } else {
            console.warn(`Invalid og_image URL in ${filename}, ignoring`);
          }
        }

        const htmlContent = md.render(content);

        // Extract headings and add anchor IDs for TOC
        const { html: processedHtml, headings } = extractHeadingsAndAddIds(htmlContent);
        const tocHtml = buildTocHtml(headings);
        const mobileTocHtml = buildMobileTocHtml(headings);

        const meta = buildMetaTags({
          title: og_title || title,
          description: og_description || description,
          fullUrl,
          type: "article",
          og_image: validOgImage,
        });

        const outDir = path.join(DIST_DIR, category, slug);

        // Check: validate output path
        if (!isSafePath(DIST_DIR, outDir)) {
          console.warn(`Skipping suspicious output path: ${outDir}`);
          continue;
        }

        await fs.ensureDir(outDir);

        const outHtml = postTpl
          .replace("<!-- __META__ -->", meta)
          .replaceAll("__TITLE__", escapeHtml(title))
          .replaceAll("__SUBTITLE__", escapeHtml(subtitle))
          .replaceAll("__DATE__", escapeHtml(name.date))
          .replaceAll("__READING_TIME__", escapeHtml(readingTime))
          .replaceAll("__CONTENT__", processedHtml)
          .replaceAll("__TOC__", tocHtml)
          .replaceAll("__MOBILE_TOC__", mobileTocHtml)
          .replaceAll("__CATEGORY__", category)
          .replaceAll("__CATEGORY_LABEL__", escapeHtml(humanize(category)));

        await fs.writeFile(path.join(outDir, "index.html"), outHtml, "utf8");

        posts.push({
          title,
          subtitle,
          description,
          tags,
          featured,
          readingTime,
          category,
          date: name.date,
          slug,
          permalink,
          url: fullUrl,
        });

        console.log(`Built: ${permalink}`);
      } catch (error) {
        console.error(`Failed to process ${rel}:`, error.message);
        continue;
      }
    }

    posts.sort((a, b) => b.date.localeCompare(a.date));

    // Category list fixed by 'nav' standard
    const discovered = [...new Set(posts.map(p => p.category))];
    const categories = [...new Set([...NAV_CATEGORIES, ...discovered])];

    // Build featured posts section
    const featuredPosts = posts.filter(p => p.featured);
    const featuredHtml = featuredPosts.length > 0
      ? `<div class="card" style="border-color: var(--featured); border-width: 2px; margin-bottom: 14px;">
      <h2 style="margin:0 0 8px">Featured posts</h2>
      <ul class="posts">\n${featuredPosts.slice(0, 3).map(p =>
        `<li class="post"><a href="${p.permalink}">${escapeHtml(p.date)} — ${escapeHtml(p.title)}</a></li>`
      ).join("\n")}\n</ul>${featuredPosts.length > 3 ? `<div style="margin-top:10px"><a class="btn" href="/featured/">View all featured posts</a></div>` : ""}
    </div>`
      : "";

    const recentHtml = posts.length
      ? `<ul class="posts">\n${posts.slice(0, 12).map(p =>
        `<li class="post"><a href="${p.permalink}">${escapeHtml(p.date)} — ${escapeHtml(p.title)} <span class="muted">(${escapeHtml(p.category)})</span></a></li>`
      ).join("\n")}\n</ul>`
      : `<div class="muted">No posts found.</div>`;

    const categoryCardsHtml = categories.map(cat => {
      const catPosts = posts.filter(p => p.category === cat);
      const list = catPosts.slice(0, 8).map(p =>
        `<li class="post"><a href="${p.permalink}">${escapeHtml(p.date)} — ${escapeHtml(p.title)}</a></li>`
      ).join("\n");

      const empty = `<div class="muted">No posts yet.</div>`;
      const viewAllHref = `/${cat}/`;

      return `
      <div class="card">
        <h4 style="margin:0 0 8px">${escapeHtml(humanize(cat))}</h4>
        ${catPosts.length ? `<ul class="posts">${list}</ul>` : empty}
        <div style="margin-top:10px"><a class="btn" href="${viewAllHref}">View all</a></div>
      </div>
    `;
    }).join("\n");

    const homeHtml = renderIndexTemplate(indexTpl, {
      canonicalPath: "/",
      recentHtml,
      categoryCardsHtml,
      featuredHtml,
    });

    await fs.writeFile(path.join(DIST_DIR, "index.html"), homeHtml, "utf8");

    // Generate category pages for all categories
    for (const cat of categories) {
      if (!isValidCategory(cat)) {
        console.warn(`Skipping invalid category for page generation: ${cat}`);
        continue;
      }

      const catDir = path.join(DIST_DIR, cat);

      if (!isSafePath(DIST_DIR, catDir)) {
        console.warn(`Skipping suspicious category path: ${catDir}`);
        continue;
      }

      await fs.ensureDir(catDir);

      const catPosts = posts.filter(p => p.category === cat);
      const list = catPosts.length
        ? `<ul class="posts">\n${catPosts.map(p =>
          `<li class="post"><a href="${p.permalink}">${escapeHtml(p.date)} — ${escapeHtml(p.title)}</a></li>`
        ).join("\n")}\n</ul>`
        : `<div class="muted">No posts yet.</div>`;

      const catRecent = `
      <div class="card">
        <h2 style="margin:0 0 10px">${escapeHtml(humanize(cat))}</h2>
        ${list}
      </div>
    `;

      const catPage = renderIndexTemplate(indexTpl, {
        canonicalPath: `/${cat}/`,
        recentHtml: catRecent,
        categoryCardsHtml: `<div class="muted">Go back <a href="/">Home</a> to browse other categories.</div>`,
      });

      await fs.writeFile(path.join(catDir, "index.html"), catPage, "utf8");
    }

    await fs.writeJson(path.join(DIST_DIR, "posts-index.json"), posts, { spaces: 2 });

    // Generate sitemap.xml
    const nowIso = new Date().toISOString();
    const items = [];

    items.push({ loc: fullUrlFromPath("/"), lastmod: nowIso });
    for (const cat of categories) {
      items.push({ loc: fullUrlFromPath(`/${cat}/`), lastmod: nowIso });
    }
    for (const p of posts) {
      const lastmod = toIsoDate(p.date);
      items.push({ loc: p.url, lastmod });
    }

    const sitemap = buildSitemap(items);
    await fs.writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8");

    console.log(`\nSuccess! Built ${posts.length} posts. Categories: ${categories.length}`);
  } catch (error) {
    console.error("\nBuild failed:", error);
    process.exit(1);
  }
})();
