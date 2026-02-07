# External Assets Migration Plan

## Problem Statement
Current setup stores 565MB of photos and documents in the public GitHub repo. Users can directly download all assets from the repo, bypassing the website. Need to move assets to external storage while maintaining fast CDN performance and build-time static generation.

## Requirements
- Assets NOT directly downloadable from GitHub repo
- Assets viewable on website
- Build-time fetching (static generation)
- Fast global CDN performance
- Prefer free tier solutions

## Solution Architecture

### High-Level Flow
1. Store assets in private location (external storage)
2. During GitHub Actions build, authenticate and fetch assets
3. Build static site with assets included in `public/assets/`
4. Deploy to GitHub Pages as usual
5. Assets served from GitHub Pages CDN, not source storage

### Key Insight
Since you need build-time fetching and GitHub Pages CDN delivery, the source storage doesn't need its own CDN. Assets are downloaded once during build, then served from GitHub Pages' global CDN.

## Solution Options

### Option 1: Private GitHub Repository (Recommended - FREE)

**How It Works:**
- Create private `blog-assets` repository
- Store all photos/documents there
- GitHub Actions uses Personal Access Token (PAT) to clone private repo during build
- Assets copied into build, deployed to GitHub Pages

**Pros:**
- Completely free
- No new tools/services to learn
- Same Git workflow you already use
- Simple GitHub Actions integration
- Assets served from GitHub Pages CDN (fast globally)

**Cons:**
- Repo size limits (5GB soft limit, 100GB hard limit)
- Cloning entire repo each build (slower builds with 565MB)
- Git not optimized for binary files (repo grows with history)

**Cost:** $0/month

**Build Performance:** ~2-3 minutes to clone 565MB repo

**Good For:** Your current 565MB that won't grow rapidly

---

### Option 2: Cloudflare R2 with Build-Time Fetch (Best Free + Performance)

**How It Works:**
- Upload assets to Cloudflare R2 bucket
- Create API token with read-only access
- GitHub Actions uses AWS S3 CLI (R2 is S3-compatible) to sync assets during build
- Assets copied into build, deployed to GitHub Pages

**Pros:**
- 10GB free storage forever
- Fast sync (only downloads changed files)
- No egress fees (downloading during build is free)
- Excellent for binary files
- Can organize assets however you want (folders, metadata)
- Assets ultimately served from GitHub Pages CDN

**Cons:**
- Need to learn Cloudflare R2 interface
- Requires storing R2 credentials in GitHub Secrets
- Manual upload process for new assets (or script it)

**Cost:** $0/month (under 10GB)

**Build Performance:** ~30-60 seconds (only syncs changed files)

**Good For:** Growing asset library, best free option long-term

---

### Option 3: Backblaze B2 + Cloudflare CDN (Free Tier)

**How It Works:**
- Upload assets to Backblaze B2
- GitHub Actions uses B2 CLI to download during build
- Assets served from GitHub Pages CDN

**Pros:**
- 10GB free storage
- 1GB/day free egress through Cloudflare
- Cheap scaling ($6/TB storage, $10/TB egress after free tier)
- Good for very large asset libraries

**Cons:**
- More complex setup (B2 + Cloudflare integration)
- Build downloads count toward daily egress limit
- Manual upload process

**Cost:** $0/month (under 10GB, <1GB/day downloads)

**Build Performance:** ~1-2 minutes

**Good For:** Very large asset libraries (>10GB future growth)

---

### Option 4: AWS S3 + CloudFront (Paid, Best Enterprise Solution)

**How It Works:**
- Upload assets to S3 bucket (private)
- GitHub Actions uses AWS CLI to sync during build
- Assets served from GitHub Pages CDN

**Pros:**
- Industry standard
- Unlimited scale
- Excellent tooling and documentation
- Fastest sync performance
- Can use S3 signed URLs if you ever want runtime fetching

**Cons:**
- Not free
- More complex AWS setup
- Overkill for personal blog

**Cost:** ~$1-3/month for 565MB + build downloads

**Build Performance:** ~30-45 seconds

**Good For:** Professional sites, very large scale, if cost doesn't matter

---

## Recommended Solution: Cloudflare R2

For your use case, **Cloudflare R2** is the best balance:
- Free for 10GB (room to grow from 565MB)
- Fast incremental syncs (only changed files)
- No egress fees for build downloads
- Simple S3-compatible interface
- Professional solution at zero cost

## Implementation Plan (Cloudflare R2)

### Phase 1: Setup Cloudflare R2
1. Create Cloudflare account
2. Create R2 bucket (e.g., `blog-assets`)
3. Generate API token with read access
4. Upload current `content/assets/` to R2 bucket

### Phase 2: Update GitHub Actions Workflow
1. Add R2 credentials to GitHub Secrets:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_ENDPOINT` (your R2 endpoint URL)
   - `R2_BUCKET_NAME`

2. Modify `.github/workflows/deploy.yml`:
   - Install AWS CLI (R2 is S3-compatible)
   - Sync R2 bucket to `content/assets/` before build
   - Continue with existing build/deploy steps

3. Assets downloaded to `content/assets/`, build copies to `public/assets/`, Next.js static export works as-is

### Phase 3: Update Repository
1. Add `content/assets/` to `.gitignore` (except `.gitkeep`)
2. Remove existing assets from git history (optional, to reduce repo size):
   ```bash
   git filter-repo --path content/assets --invert-paths
   ```
3. Update documentation about asset upload process

### Phase 4: Asset Upload Workflow
Create script `scripts/upload-assets.sh`:
- Syncs local `content/assets/` to R2 bucket
- Run manually when adding new photos
- Could be automated with pre-push hook if desired

### Phase 5: Testing
1. Test build locally with assets from R2
2. Test GitHub Actions build
3. Verify deployed site serves all assets correctly
4. Check build performance (should be faster with incremental sync)

### Phase 6: Documentation
Update README with:
- How to add new assets (upload to R2)
- How R2 sync works in builds
- Backup/restore procedures

## Migration Checklist
- [ ] Create Cloudflare account and R2 bucket
- [ ] Upload existing assets to R2
- [ ] Add R2 credentials to GitHub Secrets
- [ ] Update GitHub Actions workflow
- [ ] Test build with R2 assets
- [ ] Add `content/assets/*` to `.gitignore` (keep `.gitkeep`)
- [ ] Create asset upload script
- [ ] Remove assets from git (optional cleanup)
- [ ] Update documentation
- [ ] Deploy and verify production

## Fallback Plan (Private Repo)
If Cloudflare R2 proves too complex:
1. Create private `nitinnataraj/blog-assets` repo
2. Move `content/assets/` there
3. GitHub Actions clones private repo using PAT
4. Simpler but slower builds

## Security Notes
- Assets downloaded during build, stored in `public/assets/` in deployment
- Anyone can view assets on your website (as intended)
- Source storage (R2) is private, not directly accessible
- Only GitHub Actions can access R2 via API tokens
- No publicly listable directory of all assets
- Users can still download individual assets they find on your site (this is unavoidable for public websites)

## Build Performance Comparison
| Solution | Initial Build | Incremental Build | Complexity |
|----------|---------------|-------------------|------------|
| Private GitHub Repo | ~3 min | ~3 min | Low |
| Cloudflare R2 | ~1 min | ~30 sec | Medium |
| Backblaze B2 | ~2 min | ~1 min | Medium |
| AWS S3 | ~45 sec | ~30 sec | High |

## Cost Comparison (5 years)
| Solution | Storage | Egress | Total |
|----------|---------|--------|-------|
| Private GitHub Repo | $0 | $0 | $0 |
| Cloudflare R2 | $0 | $0 | $0 |
| Backblaze B2 | $0 | $0 | $0 |
| AWS S3 | ~$180 | ~$60 | ~$240 |

## Next Steps
1. Review this plan and confirm approach
2. Choose solution (recommend Cloudflare R2)
3. I'll implement the GitHub Actions workflow changes
4. Create asset upload scripts
5. Test thoroughly before removing assets from repo
