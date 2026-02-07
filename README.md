# Personal Blog & Photography Portfolio

A modern, fast, and SEO-friendly blog and photography portfolio built with Next.js 16. Features include MDX blog posts, photo galleries with auto-tagging, and external asset storage via Cloudflare R2.

## Features

- **Blog** - Write posts in MDX with syntax highlighting, mermaid diagrams, and rich media
- **Photography Portfolio** - Organized photo galleries with lightbox viewer and metadata
- **Timeline** - Auto-generated career and education timeline
- **Skills Showcase** - Dynamic skills presentation
- **Dark Mode** - System-aware theme with manual toggle
- **Static Site Generation** - Lightning-fast performance with GitHub Pages
- **External Asset Storage** - Photos and documents stored in Cloudflare R2 (free tier)
- **Admin Tools** - Photo auto-tagging and metadata management

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Content**: MDX for blog posts
- **Animations**: Framer Motion
- **Syntax Highlighting**: Shiki with Rehype Pretty Code
- **Icons**: Lucide React
- **Deployment**: GitHub Pages
- **Asset Storage**: Cloudflare R2
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git
- (Optional) AWS CLI for R2 asset management

## Quick Start

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your site.

## Project Structure

```
.
├── content/              # All content (posts, photos, pages)
│   ├── assets/          # Images & documents (downloaded from R2 during build)
│   ├── posts/           # MDX blog posts
│   ├── pages/           # Static pages (about, etc.)
│   ├── photos-metadata.json  # Photo gallery metadata
│   └── skills.md        # Skills content
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components
│   └── lib/             # Utility functions
├── scripts/             # Build and utility scripts
├── docs/                # Documentation
└── public/              # Static assets (copied during build)
```

## Content Management

### Writing Blog Posts

Create a new `.mdx` file in `content/posts/`:

```mdx
---
title: "Your Post Title"
date: 2026-02-07
description: "A brief description for SEO"
tags: [nextjs, react, tutorial]
categories: [engineering]
draft: false
---

## Your Content Here

Write your post content using MDX...
```

**Features:**
- Full MDX support (JSX in markdown)
- Syntax highlighting with Shiki
- Mermaid diagrams
- Auto-generated table of contents
- Reading time calculation

### Managing Photos

Photos are organized in `content/assets/photos/` by album:

```
content/assets/photos/
├── 0001_Colorado/
│   ├── image1.jpg
│   └── image2.jpg
└── 0002_Utah/
    └── heroImage.jpg
```

**Photo Metadata** is stored in `content/photos-metadata.json`:

```json
{
  "0001_Colorado": {
    "title": "Colorado Adventures",
    "location": "Colorado",
    "date": "2023-05",
    "images": [...]
  }
}
```

**Auto-tagging**: Run `npm run sync-photos` to automatically detect new photos and update metadata.

## Asset Storage (Cloudflare R2)

This site uses Cloudflare R2 for external asset storage to keep the repository lightweight.

### Initial Setup

1. **Create R2 Bucket** (see `docs/R2_SETUP_INSTRUCTIONS.md`)
2. **Upload Assets**:
   ```bash
   source .env.r2
   ./scripts/upload-to-r2.sh
   ```

### How It Works

- **Development**: Assets served from local `content/assets/`
- **Production**: GitHub Actions downloads assets from R2 during build
- **Deployment**: Assets bundled with static site and served via GitHub Pages CDN

### Adding New Assets

1. Add assets to `content/assets/` locally
2. Upload to R2:
   ```bash
   source .env.r2
   ./scripts/upload-to-r2.sh
   ```
3. Commit metadata changes (not the actual assets)
4. GitHub Actions will download from R2 on next deploy

**Note**: Assets are `.gitignore`d - only metadata is committed to git.

## Customization

### Site Configuration

Edit site metadata in `src/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "Your Name - Blog & Portfolio",
  description: "Your description here",
  // ... other metadata
}
```

### Theme & Styling

- **Colors**: Edit `tailwind.config.ts`
- **Fonts**: Modify `src/app/layout.tsx`
- **Components**: Customize in `src/components/`

### Navigation

Update navigation links in `src/components/navbar.tsx`

### About Page

Edit `content/pages/about.mdx`

### Skills & Timeline

- **Skills**: Edit `content/skills.md`
- **Timeline**: The timeline is auto-generated from `scripts/generate-timeline.js`

## Deployment

### GitHub Pages Setup

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: GitHub Actions

2. **Add R2 Secrets** (if using external assets):
   - Go to Settings → Secrets and variables → Actions
   - Add:
     - `R2_ACCESS_KEY_ID`
     - `R2_SECRET_ACCESS_KEY`
     - `R2_ENDPOINT`
     - `R2_BUCKET_NAME`

3. **Push to main branch**:
   ```bash
   git push origin main
   ```

GitHub Actions will automatically build and deploy your site.

### Custom Domain (Optional)

1. Add `CNAME` file in `public/` with your domain
2. Configure DNS:
   ```
   A     @    185.199.108.153
   A     @    185.199.109.153
   A     @    185.199.110.153
   A     @    185.199.111.153
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run sync-photos` - Auto-tag photos and update metadata

### Build Process

The build runs these scripts in order:
1. `generate-timeline.js` - Create timeline from data
2. `generate-skills.js` - Process skills content
3. `convert-heic.js` - Convert HEIC images to JPG
4. `copy-assets.js` - Copy assets to public folder
5. `build-with-admin-exclusion.js` - Build site (excludes admin pages)

### Admin Tools

Access admin tools at `/admin/photo-tagger` (development only):
- Auto-tag photos with AI-generated descriptions
- Manage photo metadata
- Bulk operations

**Note**: Admin pages are excluded from production builds.

## Documentation

Additional documentation in `docs/`:
- `R2_SETUP_INSTRUCTIONS.md` - Cloudflare R2 setup guide
- `EXTERNAL_ASSETS_MIGRATION_PLAN.md` - Asset storage architecture
- `IMPLEMENTATION_LOG.md` - Development history
- `TECHNICAL_DESIGN.md` - Technical architecture
- `PHOTOGRAPHY_DESIGN.md` - Photo gallery design
- `TIMELINE_DESIGN.md` - Timeline feature design

## Troubleshooting

### Assets Not Loading

1. Check if `content/assets/` exists and has files
2. In production, verify R2 credentials are correct in GitHub Secrets
3. Check GitHub Actions logs for R2 download errors

### Build Failures

1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
3. Check for TypeScript errors: `npm run lint`

### Photo Gallery Issues

1. Run photo sync: `npm run sync-photos`
2. Verify photo metadata in `content/photos-metadata.json`
3. Check image formats are supported (JPG, PNG, WEBP)

## Contributing

This is a personal site template, but feel free to:
- Report bugs via GitHub Issues
- Suggest features
- Submit pull requests for improvements

## License

MIT License - feel free to use this as a template for your own site!

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Deployed on [GitHub Pages](https://pages.github.com/)
- Assets hosted on [Cloudflare R2](https://www.cloudflare.com/products/r2/)
