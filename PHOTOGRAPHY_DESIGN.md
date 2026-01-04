# Photography Tab Design (GitHub Pages, App Router)

## Overview
This document describes how to add a new /photography page that displays a hero image, a masonry gallery of high-resolution photos, a click-to-enlarge lightbox, a dynamic tagline, and scroll-in animations. The implementation targets a static export hosted on GitHub Pages and uses the existing App Router + MDX pipeline in this repo.

## Key Decisions
- Hosting: GitHub Pages static export (no server-side auth).
- Images: Stored in the repo under public assets (publicly accessible).
- Content source: Single MDX file in content/pages/photography.mdx with front matter for hero, gallery, and tagline data.
- Animations: Framer Motion for scroll-in reveals.
- Lightbox: A React lightbox library (recommended: yet-another-react-lightbox).

## Constraints and Notes
- GitHub Pages is fully public. Any image in public/ is accessible by URL.
- RAW files can be tens of MB and may exceed GitHub file size limits. If a RAW file exceeds 100 MB, GitHub will reject it. Even smaller RAWs will slow page loads.
- If RAWs must be published, consider using large JPG/WEBP for the site and keep RAWs in a private archive.
- Static export uses next/image with unoptimized: true, so images are served as-is.

## Content Model (MDX Front Matter)
Create content/pages/photography.mdx with front matter like:

---
title: "Landscape Portfolio"
description: "Some photos I've taken over the past 6 years or so"
heroImage: "/assets/photos/hero.jpg"
heroAlt: "Sunset over the mountains"
heroSubtitle: "Some photos I've taken over the past 6 years or so"
taglinePhrases:
  - "ANIMATED GIFS"
  - "LOVE OF PIZZA"
  - "STAR WARS QUOTES"
  - "LACK OF GREEN"
gallery:
  - id: "landscape-01"
    thumb: "/assets/photos/thumbs/landscape-01.jpg"
    full: "/assets/photos/full/landscape-01.jpg"
    width: 3000
    height: 2000
    alt: "Warm sunset over Lake Michigan"
  - id: "landscape-02"
    thumb: "/assets/photos/thumbs/landscape-02.jpg"
    full: "/assets/photos/full/landscape-02.jpg"
    width: 2400
    height: 3200
    alt: "Snowy peaks under dramatic clouds"
---

Optional body content can follow the front matter for intro text or credits.

## Asset Layout
Use the following structure under public/:

- public/assets/photos/hero.jpg
- public/assets/photos/full/
- public/assets/photos/thumbs/

Thumbnails should be smaller, optimized images to keep the gallery fast.

## Routing and Page Structure
- Route: /photography
- Page: src/app/photography/page.tsx
  - Loads the MDX content via getPageBySlug("photography")
  - Compiles MDX body with compileMDX
  - Reads hero, gallery, and tagline data from front matter

Add a header nav link in src/components/header.tsx to /photography.

## Component Plan
- PhotoHero
  - Full-bleed hero image with overlay title/subtitle.
  - Uses heroImage, title, heroSubtitle, heroAlt.

- PhotoGallery (client component)
  - Masonry layout using CSS columns or CSS grid.
  - Renders thumbnails from gallery data.
  - Uses Framer Motion for scroll-in animations.

- PhotoLightbox (client component)
  - Opens full-res images on click.
  - Uses gallery full URLs and dimensions.

- DynamicTagline (client component)
  - Rotates text from taglinePhrases array.
  - Uses aria-live="polite" for accessibility.

## Layout and Styling
The current RootLayout constrains all pages to max-w-3xl. The photography page should be wider with a full-bleed hero.

Recommended adjustment:
- Move the container/max-width class into page components (home, about, posts).
- Let /photography use a max-w-6xl or max-w-7xl container and a full-bleed hero section.

## MDX Metadata Support
Update src/lib/content.ts so getPageBySlug preserves arbitrary front matter (heroImage, gallery, taglinePhrases) rather than discarding them. This can be done by extending the Page meta type or returning data as a generic object for pages.

## Dependencies
Add these packages:
- framer-motion (scroll-in animations)
- yet-another-react-lightbox (lightbox modal)

If preferred, choose an alternate lightbox library that works in a static export.

## Implementation Steps
1. Create content/pages/photography.mdx with front matter and initial gallery list.
2. Add photos to public/assets/photos/full/ and thumbnails to public/assets/photos/thumbs/.
3. Update src/lib/content.ts to include page front matter fields.
4. Create src/app/photography/page.tsx.
5. Add components under src/components/photography/:
   - photo-hero.tsx
   - photo-gallery.tsx
   - photo-lightbox.tsx
   - dynamic-tagline.tsx
6. Add /photography to src/components/header.tsx.
7. Install dependencies and wire up animations and lightbox.

## Risks and Mitigations
- Large repo size: many high-res images will bloat the repo. Mitigate with thumbnails and compressed full-size images.
- GitHub size limits: files over 100 MB will not be accepted. Keep RAWs out of the repo if they exceed this limit.
- Performance: heavy images can slow initial load. Use thumbnails for the grid and load full-res only in the lightbox.

## Open Questions
- Should RAW files be excluded in favor of large JPG/WEBP for the site?
- Should the hero image be the first gallery image or a separate asset?

