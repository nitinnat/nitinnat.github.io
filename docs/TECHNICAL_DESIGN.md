Technical Design Document – Markdown‑powered Blog on GitHub Pages
1 Introduction

This document describes how to build a modern, bear‑blog–style blogging platform that renders Markdown, images, videos, GIFs, tables, code blocks and Mermaid diagrams and can be freely hosted via GitHub Pages. The goal is to match the minimalist feel of Nitin Nataraj’s Bear Blog site, while adding a few extra features such as tags, categories, search, dark‑/light‑mode toggle (defaulting to dark), and a comment system. The solution should use open‑source technologies, provide a clear content model and build pipeline, and rely on a GitHub Actions workflow for deployment.

After surveying the ecosystem of static‑site generators (SSGs), Next.js 16 was chosen for this project. A recent article comparing SSGs notes that Next.js remains “the most popular open‑source ReactJS framework” and highlights its rich feature set: prebuilt/static generation, server components, API routes, built‑in TypeScript and CSS support, image optimizations and flexible routing
bugfender.com
. Importantly, Next.js 16 can generate static exports: running next build produces an HTML file per route and enables deployment on any static web server
nextjs.org
. This combination of maturity, community support and static‑export capability makes Next.js a suitable backbone for a GitHub Pages blog.

2 Technology Stack

The design uses the following components:

Component	Purpose
Next.js 16	Core framework. Generates static HTML/CSS/JS for each route (output: 'export')
nextjs.org
 and provides routing, pre‑rendering and code splitting.
MDX	Hybrid Markdown + JSX format for posts and pages. Allows embedding React components (e.g., images, videos, Mermaid) directly in Markdown.
Tailwind CSS	Utility‑first styling library. Enables rapid styling of pages, responsive layouts and dark‑mode classes. Alternatively, any CSS framework or custom CSS can be used.
Prism.js & Rehype	Syntax highlighting for code blocks. GitHub’s documentation recommends triple backticks and language identifiers for fenced code blocks
docs.github.com
; rehype‑pretty‑code and Prism.js implement this behaviour.
Mermaid	JavaScript library to render diagrams from text. GitHub supports Mermaid syntax within fenced code blocks
docs.github.com
, and the site will leverage react‑mermaid to render diagrams client‑side.
Flexsearch	Lightweight search engine used to build a static index of posts at build time and provide client‑side search.
next‑themes	Small library to manage dark/light themes based on system preference or user selection. Dark mode will be the default.
Giscus	Comment widget that uses GitHub Discussions as a backend. It is free, open source and easy to embed in MDX pages.
GitHub Actions	CI pipeline to install dependencies, build the Next.js site and publish the static output to the gh‑pages branch.

Figure 1 illustrates the high‑level architecture.

3 Content Model
3.1 Folder structure

The project repository will have the following top‑level structure:

├── content/                # Markdown/MDX sources
│   ├── posts/             # Blog posts
│   │   └── yyyy-mm-dd-slug.mdx
│   ├── pages/             # Static pages (about, contact, etc.)
│   └── assets/            # Images, GIFs and other media referenced in posts
├── src/
│   ├── components/        # React components (layout, search, code block, mermaid, etc.)
│   ├── pages/             # Next.js pages (index, [slug], tags/[tag], categories/[category])
│   ├── lib/               # Helper functions (MDX loader, search index builder)
│   └── styles/            # Global CSS / Tailwind configuration
├── next.config.js         # Next.js configuration (static export settings)
├── package.json
└── .github/workflows/     # GitHub Actions pipeline

3.2 Front matter

Each post file in content/posts/ should start with YAML front matter that describes metadata used by the build pipeline. A typical front matter block looks like this:

---
title: "Building a production‑ready Python template in a weekend"
date: 2025-12-31
description: "Lessons learned from automating a Python project template."
tags: [python, template, productivity]
categories: [engineering]
cover: "/assets/images/template-cover.png"
draft: false
---


The cover field references an image stored in content/assets/. Additional optional fields include canonicalUrl (for cross‑posted articles) and slug (if different from the file name). Markdown headings, paragraphs, lists, tables and code blocks follow the front matter.

3.3 Supported Markdown features

Images & GIFs: Use Markdown image syntax (![](/assets/...png)) or the Image component from next/image for automatic sizing and optimization. The next/image component can be configured with a custom loader to handle remote images
nextjs.org
.

Videos: For embedded videos (e.g., YouTube, Vimeo), create a reusable Video component that wraps an <iframe> with responsive styling. The MDX author writes <Video src="https://www.youtube.com/embed/xyz" title="Demo" /> inside the post.

Tables: Standard Markdown tables are parsed by the MDX compiler without additional configuration.

Code blocks: Fenced code blocks using triple backticks are supported natively. GitHub’s documentation notes that you can add a language identifier after the opening backticks to enable syntax highlighting
docs.github.com
. Use rehype‑pretty‑code and Prism.js to transform these blocks into highlighted HTML. For example:

```python
def hello():
    print("Hello, world!")


Mermaid diagrams: GitHub’s advanced formatting docs explain that placing Mermaid syntax inside a fenced code block with the mermaid identifier will render a diagram
docs.github.com
. In this project, MDX code blocks tagged with mermaid will be intercepted by a custom Mermaid component that invokes the mermaid library at runtime. Example:

```mermaid
graph TD;
  A-->B;
  A-->C;
  B-->D;
  C-->D;

4 Application Architecture
4.1 Static site generation

Next.js 16 supports generating a static export of your application. When running next build, the framework produces one HTML file per route and avoids loading unnecessary JavaScript
nextjs.org
. By enabling the output: 'export' setting in next.config.js
nextjs.org
, the build output will be written to the out/ directory. Because the output consists only of static files, it can be hosted on GitHub Pages without a custom server.

Key configuration (next.config.js):

// next.config.js
const nextConfig = {
  output: 'export',          // Generate static export
  trailingSlash: true,       // Optional: ensures routes end with `/` for GitHub Pages
  images: {
    unoptimized: true        // Disable on‑the‑fly image optimization (not available in static export)
  },
  webpack(config) {
    // Allow importing .mdx files
    return config;
  },
};
module.exports = nextConfig;


The build pipeline performs these steps:

Collect MDX files from content/posts and content/pages.

Parse front matter and convert MDX to serialized React components using @next/mdx.

Generate static paths for each post, tag and category using getStaticPaths.

Render pages using getStaticProps to supply post data and search index data to components.

Write HTML, CSS and JS files to the out/ directory via next build.

Deploy out/ to GitHub Pages using a GitHub Actions workflow.

4.2 Routing

/ – Home page listing recent posts with pagination.

/blog/[slug] – Individual blog posts generated from MDX files. The [slug] parameter maps to the file name.

/tags/[tag] – Lists all posts containing a given tag.

/categories/[category] – Lists all posts within a category.

/search – Search interface that allows client‑side querying of the index.

Additional static pages such as /about or /contact live under content/pages/ and are routed via [...slug].js.

4.3 Components

Layout – Shared wrapper with site header, navigation links, dark/light toggle and footer. The header includes a search icon that links to /search.

PostLayout – Wraps each blog post, displaying the title, date, tags and comments. It receives the MDX component and passes a mapping (components prop) that overrides the default rendering of img, code, pre, table and mermaid nodes.

CodeBlock – Uses rehype‑pretty‑code and Prism.js to highlight code. The component also displays a copy‑to‑clipboard button. Because GitHub Pages uses Rouge by default, this project overrides the default highlighter by disabling Jekyll highlighting and applying custom CSS generated by Prism (rougify can also be used to generate CSS
docs.github.com
).

Mermaid – Client‑side component that imports the mermaid library and renders diagrams. It listens for changes to the diagram code and re‑renders accordingly. To avoid loading Mermaid in the initial bundle, it can be lazily imported inside a useEffect call.

Image – Wrapper around next/image configured for static export. Because static export cannot perform on‑the‑fly optimization, the component is configured with unoptimized: true and optional custom loaders for remote images
nextjs.org
.

Video – Simple wrapper that outputs a responsive <iframe> with allowed attributes (allowfullscreen, loading="lazy"). For local video files, use the HTML5 <video> tag with controls and a poster image.

SearchBar & SearchPage – A small React component that loads a prebuilt search index (public/search-index.json) and uses flexsearch to perform full‑text search across titles, descriptions and body content. The index is generated at build time by traversing all posts.

ThemeToggle – Uses the next‑themes library to read the user’s preferred color scheme (prefers-color-scheme: dark) and to store the selected theme in localStorage. The toggle will default to dark mode and allow switching to light mode.

Comments – Embeds the giscus widget. Giscus requires configuration of a GitHub repository and category, but no server or payment. The component receives the repo, repoId, category, categoryId and mapping (e.g., pathname) parameters.

5 Search Implementation

Index generation: During the build (getStaticProps), a script iterates over all posts, normalizes the Markdown content (stripping Markdown syntax and code blocks), and feeds it into flexsearch to build an index. The index and a store of post metadata are serialized to JSON and written to public/search-index.json and public/search-store.json.

Client‑side querying: The /search page loads the index asynchronously. When the user types a query, flexsearch returns matching document IDs. The component then renders a list of results linking to the corresponding posts. For performance, results can be paginated or limited.

6 Dark/Light Mode

Dark mode will be the default theme. The next‑themes hook reads the operating system preference (e.g., prefers-color-scheme) and stores the user’s choice in localStorage. Tailwind CSS will be configured in tailwind.config.js to support dark variants. Example usage:

import { ThemeProvider } from 'next-themes'

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}


In the site’s CSS, define colors using CSS variables and create dark variants. When the user toggles the theme, next‑themes adds class="light" or class="dark" to the <html> element, switching the variables accordingly.

7 Comments via Giscus

Giscus is a lightweight comment system that stores discussions in GitHub. To integrate Giscus:

Create a public GitHub repository (e.g., username/blog-comments) and enable GitHub Discussions.

In each post, embed the giscus React component:

import Giscus from '@giscus/react'

function Comments() {
  return (
    <Giscus
      repo="username/blog-comments"
      repoId="REPO_ID"
      category="General"
      categoryId="CATEGORY_ID"
      mapping="pathname"
      reactionsEnabled={true}
      emitMetadata={false}
      inputPosition="bottom"
      theme={useTheme().theme} // sync with dark/light mode
    />
  )
}


Obtain repoId and categoryId from the repository settings in GitHub.

The comments component will respect the site’s dark/light theme and load only when the post page is rendered.

8 GitHub Pages Deployment

The blog will be hosted on GitHub Pages through an automated GitHub Actions workflow. GitHub Pages builds Jekyll sites by default; however, by prebuilding the static site locally and committing only the static files, we avoid Jekyll entirely. GitHub’s Pages & Jekyll documentation explains that Jekyll highlights code blocks with Rouge by default but also notes that you can disable the highlighter and use your own CSS
docs.github.com
. Since we generate our own HTML, we are not bound by these constraints.

8.1 Workflow configuration

In .github/workflows/deploy.yml:

name: Deploy Blog

on:
  push:
    branches: [main]  # Deploy when changes land on main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build   # Runs next build
      - run: npm run export  # Generates static files in out/
      - uses: actions/upload-pages-artifact@v1
        with:
          path: out
      - uses: actions/deploy-pages@v2
        with:
          branch: gh-pages      # Deployment branch
          token: ${{ secrets.GITHUB_TOKEN }}


The workflow performs a clean install, builds the Next.js application, exports the static site to the out/ directory and uploads it as a Pages artifact. The deploy-pages step publishes the artifact to the gh‑pages branch. In the repository settings, enable GitHub Pages with “Deploy from branch” and select gh‑pages and the / root.

8.2 Custom domain and HTTPS

Optionally, you can configure a custom domain by adding a CNAME file to the public/ directory and updating your DNS to point to <username>.github.io. GitHub Pages automatically provisions HTTPS certificates when a custom domain is set.

9 Future Enhancements

Analytics: Integrate privacy‑friendly analytics (e.g., Plausible, Fathom, or Google Analytics) by adding the tracking script to the _app component or by using Next.js’s built‑in analytics features
bugfender.com
.

RSS feed & sitemap: Generate RSS/Atom feeds and a sitemap.xml as part of the build using packages like next-sitemap.

MDX components library: Expand the MDX component mapping to include callout boxes, footnotes, collapsible sections or mathematical notation (rehype-katex).

Offline support / PWA: Leverage Next.js’s PWA plugin to provide offline caching and installability.

10 Conclusion

This design uses the Next.js 16 framework to build a full‑featured static blog that embraces Markdown while adding interactive elements like search, dark/light mode and comments. The choice of Next.js is motivated by its popularity and rich feature set
bugfender.com
 and by its support for static exports
nextjs.org
, which allow hosting on GitHub Pages. By storing content as MDX files, the system enables authors to embed images, videos, code, tables and Mermaid diagrams with minimal friction. The build pipeline compiles MDX to static HTML, constructs a search index, highlights code with Prism and packages everything into a deployable folder. A GitHub Actions workflow automates the build and deployment process, ensuring free and effortless hosting on GitHub Pages.