---
title: "How a Blog Post Actually Gets Built"
subtitle: "Retrospective Series Part. 2"
series:
  id: "blog-retrospective-series"
  part: 2
  article: 1
tags: ["blog", "ssg", "retrospective", "build-pipeline"]
featured: false
og_title: "How a Blog Post Actually Gets Built"
# og_image: "auto og image generator not yet developed"
---

In the [last part](https://blog.by-hahn.com/projects/retrospective-series-part-1/), I talked about the decision to move all rendering to build time, and why that trade-off made sense for this project over the original prototype. The idea was to do as much work as possible before anyone visits the site, so that by the time a request arrives, every page is already fully assembled and ready to be served.

What I did not get into is what that process actually looks like in practice. How does a Markdown file sitting in a folder on my computer become a finished HTML page at a real URL?

That is what this article covers. I want to follow a single post file through the entire process, step by step, in the order that it actually happens. No skipping ahead, no hand-waving.

---

## The Filename Becomes the Identity

Before I write a single word of content, I have to name the file correctly. The naming format is not optional, and it is not just a convention I chose for tidiness. The build script reads the filename itself as the primary source of information about the post.

Every file follows this pattern:

```
YYYY-MM-DD~slug.md
```

The date portion sets when the post was published and where it appears in any sorted list. The slug, which is the part after the tilde, becomes the URL. The category comes from whichever subdirectory the file lives in. So if I save a file called `2026-03-08~retrospective-series-part-1.md` inside the `projects/` folder, the final address of that post becomes `/projects/retrospective-series-part-1/`. The filename is, in that sense, the unique identity of the post. Change the filename, and you change the URL. Everything else, the title, the description, the tags, can be revised freely without touching the address the post lives at.

When I first came up with this format, I was just trying to solve the problem of keeping posts sorted by date in the file system while also making the URL obvious from the filename. It was only later that I noticed Jekyll and other static site generators use a very similar convention, something like `YYYY-MM-DD-slug.md`. **That felt reassuring rather than deflating. It meant I had followed the same reasoning independently.** The one difference I kept deliberately was the tilde instead of a hyphen between the date and the slug. A hyphen blends into the slug itself, which can make the two parts visually harder to separate at a glance. The tilde marks a clear boundary.

The build script also enforces the format strictly. Files that do not match the expected pattern are skipped with a warning rather than processed incorrectly. **A badly named file should fail visibly, not silently produce something unpredictable.**

---

## Before the Writing Even Starts

Once the filename is valid, the build reads the file itself. A typical post starts like this:

```
---
title: "Why I Built It From Scratch"
subtitle: "Retrospective Series Part. 1"
tags: ["blog", "ssg", "retrospective"]
featured: true
---

In the last part of this series...
```

The block between the two sets of dashes is called **frontmatter**. It is a small section of structured metadata written in a format called YAML (Yet Another Markup Language), which is essentially a readable way to write key-value pairs. The build reads this block separately from the post content and uses it to fill in information like the page title, the description shown in link previews, and whether the post should appear in the featured section on the homepage.

Because I wrote the build script myself, I can add new frontmatter fields whenever the need arises. The featured post system is a good example of this. When I wanted a way to highlight certain posts on the homepage, I added a `featured` field, updated `build.js` to look for it, and built a new section into the homepage template that collects and displays those posts. None of that required changing how any existing post file was structured. Posts without the field simply behave as they always did.

### What Happens When Fields Are Missing

None of the frontmatter fields are required. If I leave out the title, the build generates one automatically from the slug by turning hyphens into spaces and capitalizing it. If I leave out the description, the build takes the first paragraph of the post and uses that instead. **The goal was for the system to be forgiving about omissions.** Not every post needs the same set of metadata, and I did not want to fill in fields I did not need just because the system expected them.

---

## Why Markdown Fits the Philosophy

Markdown was not the only option. But it was the one that felt most consistent with what this blog is trying to be.

It is a lightweight format for writing text with simple formatting built in. An asterisk on each side of a word makes it **bold**. A hash symbol at the start of a line becomes a heading. A hyphen at the start of a line becomes a bullet point. It is much easier to read and write than raw HTML, and it keeps the content files clean and focused on the writing itself.

Part of why Markdown suits this blog is that it feels close to writing naturally. **The formatting sits in the background.** A post written in Markdown still reads as plain text even before it is processed. That matters to me because the blog is meant to be a place for long-form writing, not a medium where the format gets in the way of the content.

That said, Markdown is not just plain text. Unlike a `.txt` file, it carries real structure: distinct heading levels, emphasis, lists, code blocks. All of that translates into meaningful output when the build runs, without me ever having to write a single HTML tag. The library I am using, `markdown-it`, handles the conversion automatically and supports a range of extensions I can reach for as the blog grows.

There is one rule worth mentioning: if raw HTML somehow ends up inside a post, the build treats it as plain text and displays it literally, rather than rendering it. For now, every post is written by me, so this rarely comes up. But the same pipeline could eventually support guest posts or some form of user-submitted content, and in those situations the ability to inject arbitrary HTML would be a real risk. Building this restriction in from the start means it is already handled if that moment ever comes.

---

## Turning Content Into a Page

Once the Markdown has been converted to HTML, the build knows what the post's content looks like. **But content alone is not a page.** A finished page also needs the surrounding structure that ties it to the rest of the site: the navigation, the sidebar, the footer, and all the metadata that search engines and social platforms read when someone links to the post.

That structure comes from a template file. There are two templates this blog uses: one for individual post pages, and one for the homepage and category index pages. Neither is a completed page on its own. They are shells with placeholders where the real content will go.

The placeholders look like this inside the template:

```
__TITLE__
__CONTENT__
__DATE__
__READING_TIME__
```

The build reads the template, finds each placeholder, and replaces it with the actual value for that post. `__TITLE__` becomes the post title, `__CONTENT__` becomes the converted HTML, `__DATE__` becomes the formatted date extracted from the filename, and so on. Reading time is calculated from the word count of the post during the build, assuming an average reading pace, and inserted as static text.

There is also a second kind of placeholder, used for larger HTML blocks that need to go into the `<head>` section of the page. These are written as HTML comments:

```html
<!-- __META__ -->
```

That single line gets replaced with the full set of meta tags for the post: the description, the canonical URL, and the Open Graph tags (OG tags) that control how the page appears when shared as a link on social platforms. Writing the placeholder as an HTML comment rather than some invented custom syntax was a small but useful decision. HTML comment syntax is ignored by browsers, which means the template file itself stays valid and openable in a browser at any point during development, even before the build has run. It keeps the template readable as a real document, not just as input for a script.

### Generating Structure Automatically

The table of contents is also generated at this stage. The build scans the converted HTML for every second-level and third-level heading in the post, collects their text, and generates two versions of the TOC: one for the sticky sidebar on desktop, and a collapsible version for mobile. Both are inserted into the template before the page is written out.

Once everything is assembled, the build writes the finished page to a specific location inside the output folder. Each post gets its own folder, with an `index.html` inside it. This is what produces the clean URLs: when a browser requests a path that ends with a slash, it automatically looks for an `index.html` in that folder. The visitor sees only the URL. The file structure behind it stays out of sight.

---

## Why I Rebuild Everything Every Time

Every time the build runs, it deletes the entire output folder and rebuilds everything from scratch. Every file gets regenerated, whether or not anything in that post changed.

When I was designing the build pipeline, I thought about whether to go with a full rebuild or an incremental approach, where only files that actually changed would be regenerated. Incremental builds are more efficient on paper, but they come with a cost: the build has to maintain a reliable record of which inputs produced which outputs, and which outputs need to be updated when a given input changes. For a personal blog where one post's title might appear on the homepage, in the sitemap, and across category index pages, keeping that dependency map accurate and trustworthy adds meaningful complexity to the codebase.

For a project at this scale, a full rebuild finishes in under a second regardless. The time saved by an incremental approach would be negligible, while the added complexity of managing it would be real and ongoing. **A full rebuild is also easier to reason about:** every run starts from a clean state, and the output is always consistent with the current source. No stale files, no partial updates, no edge cases from a dependency that was tracked incorrectly.

So the full rebuild was not a limitation I accepted reluctantly. It was the option that made the most sense given the actual constraints of the project.

---

## A Note on Safety

### Preventing Unexpected Input

Even for a site where I write every post myself, building some basic protections into the pipeline seemed worth doing. Mistakes happen, and the same pipeline could eventually be extended in ways that bring in content from other sources.

Every string pulled from frontmatter and inserted into the HTML output gets sanitized before it lands on the page. This prevents a case where an unexpected title or description could inject a script into the rendered page. Before writing any output file, the build also checks that the destination path actually falls inside the output folder, so a cleverly constructed slug cannot trick the build into writing a file somewhere it should not. Links inside post content are checked for dangerous protocols like `javascript:` and replaced with harmless placeholders if found.

None of these required much code. But they are the kind of thing that becomes considerably harder to add later, once content is already flowing through the pipeline.

---

## In the End, It's Just Files

At the end of all of this, the output folder is just a folder full of files. HTML pages, a stylesheet, a JavaScript file for the theme toggle, a sitemap, a text file for search engine crawlers, and a JSON (JavaScript Object Notation, a structured data format) file that lists every post with its metadata. There is no server-side logic running, and nothing waiting for a request to arrive before assembling a response. Unlike the prototype version of the blog, where a visitor had to arrive before the content was fetched and rendered, every page now exists in full before anyone asks for it. The server's only job is to hand over whichever file a visitor requested.

A lot of care went into the parts of this blog that are visible. The theme toggle, the responsive layout, the TOC scroll behavior, the typography. These were not afterthoughts. But looking back, at least as much time went into decisions that no reader will ever notice directly. How files get named. How templates are structured. Whether to rebuild from scratch each time or carry over what already exists. How the pipeline handles something unexpected. **None of that shows up on the page. But it is where most of the actual design work happened, and getting those decisions right is what makes the visible parts hold together.**

---

## Coming Next

The build worked perfectly in local testing. And then I deployed it for the first time, and several things broke immediately.

The next article is about that deployment, what broke, why it broke, and what it taught me about the gap between "works on my machine" and "works for everyone else."

If you want to go deeper into the technical details of the build pipeline covered here, the [BUILD_PIPELINE.md](https://github.com/by-hahn/blog/blob/main/docs/BUILD_PIPELINE.md) document in the GitHub repository covers every step in full detail. And if you want to build something similar yourself, the full source is available there as well.