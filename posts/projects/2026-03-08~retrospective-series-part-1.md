---
title: "Why I Built It From Scratch: Design and Tech Decisions"
subtitle: "Retrospective Series Part. 1"
series:
  id: "blog-retrospective-series"
  part: 1
  article: 1
tags: ["blog", "ssg", "retrospective", "architecture"]
featured: true
og_title: "Why I Built My Blog From Scratch: Design and Tech Decisions"
# og_image: "auto og image generator not yet developed"
---

In [the previous part of this series](https://blog.by-hahn.com/projects/retrospective-series-part-0/), I described the general arc of this project: a blog that started as a rough prototype, hit a wall, and had to be rethought from the ground up. This article is about what that rethinking actually looked like. What broke, what the alternatives were, and why I ended up building my own system instead of reaching for one that already existed.

---

## The First Version, and Why It Did Not Last

The first version of this blog was built around a simple idea. Blog posts would live as Markdown files in a GitHub repository. When someone visited the site, the browser would fetch those files through the GitHub API*, convert them from Markdown to HTML on the spot, and inject them into the page.

It worked. I had posts loading, pages rendering, and a site that looked functional enough to call a prototype.

But it was doing something that mattered a great deal: **it was waiting until a visitor arrived before doing any work at all.**

That sounds like a minor detail. In practice, it caused three distinct problems.

*API (Application Programming Interface): a way for one program to request data or services from another service over the internet.

---

## Three Problems That Could Not Be Ignored

### Search visibility

When a search engine like Google visits a webpage, it sends an automated crawler to read the page's content. What matters is the HTML that already exists when the request is made.

With the first version of this blog, the crawler would initially see an empty shell: a loading spinner, minimal markup, and JavaScript that would fetch the actual post content from the GitHub API after the page loaded. Modern crawlers can execute some JavaScript, but relying entirely on client-side rendering still creates major indexing and reliability problems compared to serving complete HTML directly.

**A crawler that cannot reliably access your content cannot reliably index it.** The posts existed, but to a search engine, they were simply not there.

This is what people mean when they talk about SEO (Search Engine Optimization) being "fundamentally broken" for certain architectural choices. The issue is not a missing setting or a configuration tweak. The content simply was not available in a dependable way at the moment it needed to be read.

### API rate limits

The GitHub API is not meant to serve a public website's content. It is a tool for developers accessing repository data programmatically. And like most APIs, it has rate limits: a ceiling on how many requests can be made in a given period of time.

For a blog with very few visitors and only a handful of posts, this would probably never come up. The site would look perfectly stable. But the moment traffic spikes, or someone shares a post, or a script repeatedly loads the page, that ceiling becomes real. Requests start failing. Posts stop loading. The site becomes unreliable in exactly the situation when it should be most reliable.

Building a site on top of a third-party service's API and hoping it will behave like infrastructure is a fragile bet. I did not want the blog's availability to depend on whether GitHub happened to be having a good day.

### Load time

The third problem was performance. And it was not just about individual posts loading slowly. The bigger issue was the homepage.

With only a few posts, the delay might be barely noticeable. But the homepage was not fetching one post. It fetched every post in the repository through the GitHub API, sorted them by date, grouped them by category, and built the index listing on the page. All of that work happened inside the visitor's browser, on their device, after they had already arrived.

This meant two things. First, the homepage could not display anything meaningful until every one of those requests had completed. The more posts existed, the slower this would get over time. Second, the work was being done by the visitor's computer, not a server. A device on a slow connection, or an older phone, would feel every bit of that cost.

Even on a fast connection this was noticeable. The issue was not the connection speed. It was the decision to defer all of this work to the moment someone arrived, and then hand the bill to the visitor.

---

## What Static Site Generation Actually Means

The approach I moved to has a name: **Static Site Generation**, or SSG. A Static Site Generator takes content files and converts them into finished HTML pages before anyone visits the site. That is what I ended up writing from scratch. The idea is almost the opposite of what I had before.

Instead of waiting for a visitor to arrive and then assembling the page, all of that work happens in advance, in a step called the **build**. Every time I push a change to the repository, a build runs automatically: a custom JavaScript script, `build.js`, reads every Markdown file, converts it to HTML, and writes out finished, complete HTML files into an output folder. By the time anyone visits the site, those files already exist. The server's only job is to hand them over. The details of how that script actually works are what [the next article](https://blog.by-hahn.com/projects/retrospective-series-part-2/) covers.

The important part is not just the HTML itself, but *when* that HTML gets produced. With the first version of the blog, pages only came together after a visitor arrived. With static site generation, the work happens earlier, during the build. By the time someone visits the site, the finished HTML already exists and is ready to be served immediately.

All three problems share the same source. **The work is done before anyone arrives.** A crawler that arrives finds everything already in place. The GitHub API is no longer part of the picture, because nothing calls it at runtime. And the homepage no longer asks the visitor's device to do anything. The sorted post list, the category index, the reading times, all of it was calculated once during the build and is ready to be delivered as-is.

**Every page is now ready before anyone asks for it.**

---

## Why Not Just Use an Existing Tool

At this point the reasonable question is: this is exactly what tools and frameworks like Hugo, Jekyll, or Next.js are built for. Why spend the time writing your own?

The short answer is that I was not treating this as a project to simply set up and move on from. I wanted to work through the entire process as a real engineering problem, from content parsing to HTML generation to automated deployment.

The blog was not just the destination. The system underneath it was part of the project itself.

Using an existing framework would have handled most of that for me, and in doing so, would have hidden exactly the parts I wanted to understand. When a framework processes a Markdown file and produces an HTML page, there are a dozen decisions buried in that process: how URLs are structured, how metadata is handled, how templates are rendered, how the deployment pipeline is wired together. A framework absorbs all of those decisions so you do not have to think about them. That is genuinely useful when the goal is to get a blog running quickly. It was not useful for what I was trying to do.

**I wanted a system I could fully understand, maintain, and reason about myself.** Building from scratch was the only way to get there.

None of this is an argument against existing tools. If you want a blog and your goal is to write, then Hugo or Jekyll or any number of other options are genuinely good choices. Building from scratch has real costs. It took longer. It produced bugs I then had to fix myself. It continues to require maintenance that a battle-tested framework would handle automatically. Those are not small trade-offs.

---

## Where the Complexity Ended Up

There is one decision that shapes the entire architecture of this project, and it was worth naming directly.

**All of the complexity should live in the build step, not at runtime.**

The build script that processes posts and produces HTML files is not simple. It handles file discovery, content parsing, template injection, URL generation, table of contents extraction, sitemap production, and more. When something goes wrong, it surfaces during the build, not in front of a visitor.

But once the build runs successfully, the site itself is as simple as possible. Just files. No server logic, no database, no external dependencies. That also made it possible to host the site for free on GitHub Pages, with GitHub Actions handling the build and deployment automatically on every push. For a personal blog, running and maintaining a dedicated server was never worth the cost or the overhead. The static approach made GitHub's free tooling the natural fit from the start.

The less infrastructure the site depended on, the more durable it felt. For a project I wanted to maintain for years, that ended up mattering more than I expected.

Looking back, trading build complexity for runtime simplicity was the right call for this kind of project. A blog needs to be fast, reliable, and easy to reason about. All of that is easier to guarantee when there is almost nothing happening at runtime.

---

## From Markdown to HTML (Coming Next)

The decision to move to a build-time approach was one thing. Actually writing a system was another.

The next article walks through the build pipeline in detail: what happens between writing a Markdown post and that post appearing at a URL. If you are an engineer who wants to understand the technical specifics, the [ARCHITECTURE.md](https://github.com/by-hahn/blog/blob/main/docs/ARCHITECTURE.md) document in the GitHub repository covers the same ground in much more depth. For everyone else, the next part covers the same territory as a story rather than a spec.