// scripts/build.js
// Output URL: /<category>/<slug>/
// Dist layout:
// dist/
// ├─ index.html
// ├─ css/main.css
// ├─ <category>/index.html
// └─ <category>/<slug>/index.html

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
};

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

function parsePostFilename(filename) {
  const m = filename.match(/^(\d{4})-(\d{2})-(\d{2})~(.+)\.md$/);
  if (!m) return null;
  const [, yyyy, mm, dd, slug] = m;
  return { yyyy, mm, dd, slug, date: `${yyyy}-${mm}-${dd}` };
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function humanize(s) {
  return String(s).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildPermalink({ category, slug }) {
  return `/${category}/${slug}/`;
}

function buildMetaTags({ title, description, fullUrl, og_title, og_description, og_image }) {
  const t = escapeHtml(og_title || title || SITE.title);
  const d = escapeHtml(og_description || description || SITE.description);
  const u = escapeHtml(fullUrl);
  const img = og_image ? escapeHtml(og_image) : "";

  return [
    `<meta name="description" content="${escapeHtml(description || SITE.description)}" />`,

    // SEO canonical
    `<link rel="canonical" href="${u}" />`,

    // Open Graph
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:url" content="${u}" />`,
    img ? `<meta property="og:image" content="${img}" />` : "",
  ].filter(Boolean).join("\n  ");
}


async function loadTemplate(name) {
  return fs.readFile(path.join(SRC_DIR, name), "utf8");
}

async function copyAssets() {
  // src/assets/** -> dist/**
  const assetsSrc = path.join(SRC_DIR, "assets");
  if (await fs.pathExists(assetsSrc)) {
    await fs.copy(assetsSrc, DIST_DIR);
  }
  // src/assets/css/main.css -> dist/css/main.css
  const cssSrc = path.join(SRC_DIR, "assets", "css", "main.css");
  const cssDst = path.join(DIST_DIR, "css", "main.css");
  if (await fs.pathExists(cssSrc)) {
    await fs.ensureDir(path.dirname(cssDst));
    await fs.copy(cssSrc, cssDst);
  }
}

(async function main() {
  console.log("🛠️ Build start");
  await fs.remove(DIST_DIR);
  await fs.ensureDir(DIST_DIR);

  await copyAssets();

  const indexTpl = await loadTemplate("template-index.html");
  const postTpl = await loadTemplate("template-post.html");

  const mdFiles = glob.sync("**/*.md", { cwd: POSTS_DIR, nodir: true });

  const posts = [];

  for (const rel of mdFiles) {
    const abs = path.join(POSTS_DIR, rel);
    const parts = rel.split(path.sep);
    if (parts.length < 2) continue;

    const category = parts[0];
    const filename = parts[parts.length - 1];
    const name = parsePostFilename(filename);
    if (!name) continue;

    const raw = await fs.readFile(abs, "utf8");
    const { data: fm, content } = matter(raw);

    const slug = name.slug;
    const permalink = buildPermalink({ category, slug });
    const fullUrl = SITE.url.replace(/\/$/, "") + permalink;

    const title = fm?.title ? String(fm.title) : humanize(slug);
    const description = fm?.description ? String(fm.description) : "";
    const tags = Array.isArray(fm?.tags) ? fm.tags.map(String) : [];

    const og_title = fm?.og_title ? String(fm.og_title) : "";
    const og_description = fm?.og_description ? String(fm.og_description) : "";
    const og_image = fm?.og_image ? String(fm.og_image) : "";

    const htmlContent = md.render(content);

    const meta = buildMetaTags({
      title, description, fullUrl, og_title, og_description, og_image,
    });

    // dist/<category>/<slug>/index.html
    const outDir = path.join(DIST_DIR, category, slug);
    await fs.ensureDir(outDir);

    const outHtml = postTpl
      .replace("<!-- __META__ -->", meta)
      .replaceAll("__TITLE__", escapeHtml(title))
      .replaceAll("__DATE__", escapeHtml(name.date))
      .replaceAll("__CONTENT__", htmlContent)
      .replaceAll("__CATEGORY__", category)
      .replaceAll("__CATEGORY_LABEL__", escapeHtml(humanize(category)));

    await fs.writeFile(path.join(outDir, "index.html"), outHtml, "utf8");

    posts.push({
      title,
      description,
      tags,
      category,
      date: name.date,
      slug,
      permalink,
      url: fullUrl,
    });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));
  const categories = [...new Set(posts.map(p => p.category))].sort();

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

    return `
      <div class="card">
        <h4 style="margin:0 0 8px">${escapeHtml(humanize(cat))}</h4>
        ${catPosts.length ? `<ul class="posts">${list}</ul>` : `<div class="muted">No posts found.</div>`}
        <div style="margin-top:10px"><a class="btn" href="/${cat}/">View all</a></div>
      </div>
    `;
  }).join("\n");

  const outIndex = indexTpl
    .replace("<!-- __RECENT_POSTS__ -->", recentHtml)
    .replace("<!-- __CATEGORY_CARDS__ -->", categoryCardsHtml);

  await fs.writeFile(path.join(DIST_DIR, "index.html"), outIndex, "utf8");

  // dist/<category>/index.html
  for (const cat of categories) {
    const catDir = path.join(DIST_DIR, cat);
    await fs.ensureDir(catDir);

    const catPosts = posts.filter(p => p.category === cat);
    const list = catPosts.map(p =>
      `<li class="post"><a href="${p.permalink}">${escapeHtml(p.date)} — ${escapeHtml(p.title)}</a></li>`
    ).join("\n");

    const catRecent = `
      <div class="card">
        <h2 style="margin:0 0 10px">${escapeHtml(humanize(cat))}</h2>
        <ul class="posts">${list}</ul>
      </div>
    `;

    const catPage = indexTpl
      .replace("<!-- __RECENT_POSTS__ -->", catRecent)
      .replace("<!-- __CATEGORY_CARDS__ -->",
        `<div class="muted">Go back <a href="/">Home</a> to browse other categories.</div>`);

    await fs.writeFile(path.join(catDir, "index.html"), catPage, "utf8");
  }

  await fs.writeJson(path.join(DIST_DIR, "posts-index.json"), posts, { spaces: 2 });

  console.log(`Success! Built ${posts.length} posts.`);
})().catch((e) => {
  console.error("Build failed:", e);
  process.exit(1);
});
