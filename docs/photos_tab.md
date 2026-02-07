# New functionality addition


Technical Design Document for Re‑implementing the Bryan Minear Landscape Portfolio Site
Overview and Objectives

The goal of this project is to re‑create Bryan Minear’s Landscape Portfolio page (https://bryanminear.com/landscape-portfolio/) in a modern, maintainable way. The existing site is a WordPress installation using the Archee theme and Elementor Pro. It presents a masonry‑style gallery of landscape photographs, a dark/light mode toggle, a dynamic headline (“COME FOR THE PHOTOS, STAY FOR THE …”) and a footer with social media links. The re‑implementation should reproduce the look and feel while improving performance, maintainability and accessibility.

Key features observed on the existing site include:

Navigation bar with links to sections such as Home, Prints, Journal, Collections, Portfolio and About【915055202856020†L30-L38】.

Dark/light mode toggle at the top of the page【915055202856020†L30-L38】.

Masonry gallery of recent work. The HTML reveals that each image is an <a> element containing a div with data-thumbnail, width and height attributes. Clicking an image opens a lightbox (powered by FancyBox)
bryanminear.com
.

Dynamic tagline near the bottom of the gallery that cycles through phrases such as “ANIMATED GIFS”, “LOVE OF PIZZA”, “STAR WARS QUOTES” and “LACK OF GREEN”
bryanminear.com
.

Footer with the photographer’s logo, copyright notice and social media icons
bryanminear.com
.

The new implementation should be static or Jamstack based to eliminate WordPress overhead, while still allowing easy content updates (e.g., via a headless CMS or configuration file). The design must be responsive, accessible and performant. The document below outlines architecture, component design, technologies and implementation steps.

1. System Architecture
1.1 High‑Level Architecture
Layer	Description
Front‑end	A static website built with React (using Next.js for server‑side rendering and routing) or alternatively with SvelteKit/Vue. Static pages ensure fast load times.
Content management	Use a headless CMS (e.g., Sanity, Contentful or Strapi) or a simple JSON/YAML file stored in the repository to hold image metadata (URL, caption, dimensions).
Media storage	Host the high‑resolution images on a CDN or an object storage service (e.g., AWS S3, Cloudflare R2). Thumbnails are generated at build time.
Deployment & Hosting	Deploy the static site to a serverless platform such as Vercel, Netlify or GitHub Pages. Use CDN edge caching for images.
1.2 Component Overview

Main Layout

Contains the <header>, <nav>, content <main> area and <footer>.

Provides the theme switcher (dark/light toggle) by toggling CSS variables and storing user preference in localStorage.

Navigation Bar

Fixed at the top and collapses into a hamburger menu on mobile.

Contains links identical to the original site: Home, Prints, Journal, Collections, Professional Portfolio, Landscape Portfolio, Gear and About【915055202856020†L30-L38】.

Hero Section / Title

Displays page title (“Landscape Portfolio” and subtitle “A selection of recent work”) similar to the original
bryanminear.com
.

Could include a short introduction or call‑to‑action.

Gallery Section

Implements a masonry layout using CSS Grid or a library such as react-masonry-css
.

Each gallery item is sourced from the CMS / JSON and rendered with <a> tags pointing to the high‑resolution image. When clicked, the image opens in a lightbox.

Use a modern lightbox library such as Fancybox, GLightbox, or react-image-lightbox. The original site uses FancyBox, as seen in the source code
bryanminear.com
.

Implement lazy loading with the loading="lazy" attribute to defer off‑screen images and improve performance.

Provide alt text to ensure accessibility.

Dynamic Tagline

Implement a dynamic headline component that cycles through an array of phrases (“ANIMATED GIFS”, “LOVE OF PIZZA”, “STAR WARS QUOTES”, “LACK OF GREEN”) just like the original tagline
bryanminear.com
.

Use a simple typewriter/rotator script (e.g., a custom React component or small library like react-text-loop
).

The component should be accessible (using aria-live attributes) and allow the rotation to pause on hover.

Footer

Displays the photographer’s logo and copyright notice
bryanminear.com
.

Includes social media icons (Twitter, Instagram, Spotify) with links taken from the original code
bryanminear.com
.

Use icon components from a font library like Font Awesome or Heroicons.

Accessibility & SEO

Ensure proper semantics (<header>, <nav>, <main>, <footer>, <section>) and meaningful heading hierarchy.

Provide alt text and aria-labels for interactive elements.

Use role="img" and aria-hidden attributes for purely decorative imagery.

Add metadata tags for social sharing (Open Graph and Twitter Card) as seen in the original page source
bryanminear.com
.

Theme (Dark/Light Mode)

Define CSS variables for colors (background, text, accent) and switch between dark and light palettes.

Provide a toggle button (sun/moon icon) in the header that updates the variables and persists the choice with localStorage.

The default theme can respect the user’s OS preference via the prefers-color-scheme media query.

2. Data and Content Structure
2.1 Image Metadata

Store image data in a JSON or YAML file (or fetch from a headless CMS). Each object should contain:

id: Unique identifier.

title: Optional title or caption.

thumbnailUrl: URL to the thumbnail (for the masonry view).

fullUrl: URL to the high‑resolution image (for the lightbox).

width & height: Dimensions of the full image (used by the lightbox for sizing).

alt: Alt text for accessibility.

Example entry:

{
  "id": "landscape-01",
  "title": "Sunset at Lake Michigan",
  "thumbnailUrl": "/images/landscape-01-thumb.jpg",
  "fullUrl": "/images/landscape-01.jpg",
  "width": 1500,
  "height": 1000,
  "alt": "Warm sunset over Lake Michigan with a silhouetted shoreline"
}


A collection of these objects can be consumed by the gallery component at build time.

2.2 Dynamic Headline Phrases

Define an array of strings for the tagline component. Example:

const taglinePhrases = [
  "ANIMATED GIFS",
  "LOVE OF PIZZA",
  "STAR WARS QUOTES",
  "LACK OF GREEN"
];

3. Detailed Component Design
3.1 Navigation Bar

Structure: A <nav> element containing an unordered list of links. The links reflect the original site navigation【915055202856020†L30-L38】.

Responsive Design: Use CSS Flexbox to lay out items horizontally on desktops. On small screens, collapse into a hamburger menu that toggles the list.

Theme Toggle: Place a toggle button at the end of the nav. Use an icon (sun/moon) to indicate the current theme.

3.2 Masonry Gallery Component

The gallery component should:

Receive an array of image objects.

Render a responsive masonry layout using CSS Grid or a library. CSS Grid approach:

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: 8px; /* baseline height */
  gap: 16px;
}
.gallery-item {
  position: relative;
  cursor: pointer;
}
.gallery-item img {
  width: 100%;
  display: block;
  border-radius: 8px;
}


Lightbox: Use a lightbox library. When an item is clicked, call openLightbox(index) to set the current image and display the overlay. The lightbox shows the high‑resolution image with navigation arrows and close button.

Lazy Loading: For each <img> element, set loading="lazy" and optionally use the Intersection Observer API to load images as they enter the viewport.

Accessibility: Provide alt attributes from the image metadata. Use aria-label on the clickable anchor. Ensure keyboard navigation (tab to images and open/close lightbox via Enter/Escape keys).

3.3 Dynamic Tagline Component

Implement a React component that cycles through the tagline phrases:

import { useState, useEffect } from 'react';

function DynamicTagline({ phrases, interval = 3000 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, interval);
    return () => clearInterval(timer);
  }, [phrases, interval]);

  return (
    <h2 className="dynamic-tagline">
      COME FOR THE PHOTOS, <br />
      STAY FOR THE <span aria-live="polite">{phrases[index]}</span>
    </h2>
  );
}


The aria-live="polite" attribute announces changes to screen readers without being disruptive. CSS transitions can fade between words.

3.4 Theme Toggle Logic

Define CSS custom properties in :root for colors:

:root {
  --color-bg: #ffffff;
  --color-text: #0a0a0a;
  --color-accent: #2d3748;
}
[data-theme="dark"] {
  --color-bg: #0a0a0a;
  --color-text: #f7fafc;
  --color-accent: #f56565;
}
body {
  background: var(--color-bg);
  color: var(--color-text);
}


The toggle component switches the data-theme attribute on the <html> or <body> element and writes the value to localStorage. On page load, the script reads the saved value or falls back to the OS preference.

3.5 Footer Component

Logo & Copyright: Display the photographer’s logo image. The copyright text is “© 2024. Copyright Antimatter Media, LLC.”
bryanminear.com
.

Social Icons: Provide anchor tags linking to Twitter, Instagram and Spotify as in the original site
bryanminear.com
. Use accessible icons and ensure they open in new tabs (rel="noopener noreferrer").

4. Development Stack and Tools

Framework: Next.js (React) for file‑based routing and static generation. Alternatively, SvelteKit or Vue 3 with Vite can be used.

Styling: CSS Modules, Tailwind CSS or Styled Components for scoped, reusable styles. Tailwind would simplify dark/light mode using built‑in classes.

Lightbox Library: Fancybox, GLightbox or React‑Image‑Lightbox. Choose one that supports keyboard navigation and lazy loading.

Masonry Layout Library: react-masonry-css or pure CSS Grid.

CMS (optional): Sanity, Contentful or Strapi if non‑technical editors need to add/update images. For a simpler implementation, store metadata in a local JSON file.

Hosting: Deploy to Vercel or Netlify with automatic builds triggered on changes in the repository or CMS. These platforms provide HTTPS, CDN and image optimization.

5. Performance and Optimization Considerations

Image Optimization

Generate multiple sizes of each image (e.g., 480px, 768px, 1024px, 1500px) using build tools like Sharp or Next.js Image component. Serve the appropriate size via the srcset attribute.

Lazy‑load off‑screen images and defer loading of the lightbox library until the user interacts with the gallery.

Minification & Bundling

Use the framework’s build process to bundle, tree‑shake and minify JavaScript/CSS.

Leverage HTTP/2 and caching headers to improve repeat visits.

Accessibility & SEO

Provide alt text for all images and icons.

Ensure contrast ratios meet WCAG 2.1 guidelines for dark and light themes.

Add Open Graph metadata similar to the original site (title, description, image) to improve social sharing
bryanminear.com
.

Analytics & Privacy

Integrate a privacy‑friendly analytics tool (e.g., Plausible, Fathom) to track page views and user interactions.

6. Implementation Steps

Set up Repository & Framework

Initialize a Git repository and create a Next.js project (npx create-next-app).

Create pages: /index (home), /prints, /journal, /collections/seasonal, /collections/legacy, /portfolio/professional, /portfolio/landscape, /gear, /about. This mirrors the navigation structure【915055202856020†L30-L38】.

Implement Layout & Theming

Build a Layout component with header, navigation, main slot and footer.

Implement dark/light mode toggle using CSS variables and context.

Develop Gallery Page

Create a LandscapeGallery page/component that imports image metadata from the CMS/JSON.

Use a Masonry layout to display thumbnails.

Integrate a lightbox library for full image viewing.

Add the dynamic tagline component below the gallery.

Add Footer & Social Links

Place the logo, copyright text and social icons in the footer.

Integrate CMS (optional)

Configure a headless CMS to store images and retrieve them via API at build time. Provide fields for title, slug, image and alt.

Testing & Optimization

Test the site on various devices and browsers.

Validate accessibility using tools like Lighthouse, axe-core or WAVE.

Optimize images and fine‑tune the build for performance.

Deployment

Connect the repository to Vercel/Netlify and configure continuous deployment.

Set up domain name and SSL.

7. Conclusion

By moving away from a heavy WordPress installation to a static or Jamstack architecture, the re‑implemented Landscape Portfolio will load faster, be easier to maintain and provide a more engaging user experience. The design faithfully reproduces the original features—navigation, masonry gallery with lightbox, dynamic tagline and dark/light theme—while adding modern best practices for accessibility and performance. Carefully structuring the data, components and theme will make future updates straightforward for developers and content editors alike.