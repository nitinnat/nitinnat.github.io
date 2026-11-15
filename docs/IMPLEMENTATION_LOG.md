# Implementation Log - Blogging Website

## Session 1: About Page Timeline & Skills Visualization

### Phase 1: Interactive Timeline Component Implementation
**Status:** Completed

Created an interactive, animated vertical timeline component for the About page with the following features:
- Vertical timeline with scroll-triggered animations using Framer Motion
- Responsive design: single-column mobile, centered line on desktop
- Staggered reveal animations for entries
- Expandable description modals with AnimatePresence
- Timeline dots and connecting lines
- Visual differentiation between work (primary color) and education (emerald) entries

**Files Created:**
- `src/components/timeline/timeline.tsx` - Main timeline container with vertical line
- `src/components/timeline/timeline-entry.tsx` - Individual entry cards with modal support
- `src/components/timeline/timeline-types.ts` - TypeScript interfaces
- `src/data/timeline-data.ts` - Extracted timeline entries in structured format

**Key Features:**
- Side-by-side layout on desktop: image left, content right (grid-cols-[auto_1fr])
- Modal system using AnimatePresence with backdrop blur
- Spring animations with whileInView triggers
- Accessibility: useReducedMotion() support, proper aria labels
- Mobile responsive: adjusted padding, font sizes, modal positioning

### Phase 2: Skills Visualization Redesign
**Status:** Completed

Replaced single skills grid with dual-component approach:
1. **SkillsBars** - Compact sidebar component with category-based color scheme
   - Animated horizontal bars showing proficiency levels (1-5)
   - Category-specific gradients: Frontend (blue/cyan), Backend (purple/pink), ML & GenAI (amber/orange), Tools & Infra (emerald/teal), Domain Knowledge (rose/red)
   - Glow effects on hover
   - Skills sorted by proficiency within each category

2. **SkillsGrid** - Full-page visualization (kept for SkillsGrid MDX component)
   - Enhanced card design with proficiency-based color intensity
   - Responsive grid layout

**Files Modified:**
- `src/components/skills/skills-bars.tsx` - New sidebar component
- `src/components/skills/skills-grid.tsx` - Enhanced card design
- `src/app/about/page.tsx` - Layout restructure with sticky sidebar
- `src/data/skills-data.ts` - Skills data structure

**Layout Changes:**
- About page: Two-column layout with 280px sidebar on desktop (lg breakpoint)
- Sidebar contains: Social links + SkillsBars component
- Sidebar is sticky (lg:sticky lg:top-8) on desktop
- Main content area for prose and timeline sections

### Phase 3: Markdown-Based Skills Data
**Status:** Completed

Converted hardcoded TypeScript skills data to markdown format for easier maintenance.

**Files Created:**
- `content/skills.md` - Markdown source file with skills organized by category
- `scripts/generate-skills.js` - Build script to parse markdown and generate TypeScript

**Files Modified:**
- `src/data/skills-data.ts` - Now generated from markdown source
- `src/lib/content.ts` - Added getSkillsFromMarkdown() utility function
- `package.json` - Added generate-skills.js to prebuild script

**Implementation Details:**

The markdown format is simple and maintainable:
```markdown
## Category Name
- Skill Name | proficiency (1-5)
```

The build script:
1. Parses content/skills.md at build time
2. Generates properly typed TypeScript code in src/data/skills-data.ts
3. Runs automatically during npm run build (prebuild hook)
4. Creates IDs automatically from skill names (lowercase, hyphenated)

**Why This Approach:**
- Client components (skills-bars.tsx) can't use Node.js APIs (fs module)
- Build-time generation keeps the TypeScript code optimized for the browser
- Markdown file is human-readable and easy to edit
- Changes to content/skills.md automatically propagate on next build

**Testing:**
- Build succeeds with generated skills (npm run build: ✓ Compiled successfully)
- All 28 skills correctly parsed from markdown
- TypeScript types are preserved
- Components work correctly with generated data
- Dev server can start with generated files

## Architecture Overview

### Component Hierarchy
```
about/page.tsx
├── Sidebar (sticky)
│   ├── Social Links
│   └── SkillsBars (categories with animated bars)
└── Main Content (prose)
    ├── ProfessionalTimeline
    │   └── TimelineEntryCard[] (with modals)
    ├── EducationTimeline
    │   └── TimelineEntryCard[] (with modals)
    └── Publications
```

### Data Flow
```
content/skills.md
    ↓
scripts/generate-skills.js (prebuild)
    ↓
src/data/skills-data.ts
    ↓
SkillsBars & SkillsGrid (import skillsData)
```

### Animation Patterns Used
- useReducedMotion() for accessibility
- whileInView with viewport triggers for scroll animations
- AnimatePresence for mount/unmount animations
- Spring transitions for interactive elements (damping: 25, stiffness: 300)
- Staggered children for sequential reveals

## Key Technical Decisions

1. **Sidebar Approach**: Moving skills to sidebar frees up main content area and creates visual balance
2. **Color Categories**: Category-based colors help users quickly identify skill types
3. **Build-Time Generation**: Markdown parsed at build time avoids browser runtime limitations
4. **Modal System**: Expandable details in modals rather than full-page navigation
5. **Sticky Sidebar**: Desktop-only (lg breakpoint) to maintain single-column mobile experience

## Files Changed Summary
- Created: 6 files (timeline components, skills data, build script, skills markdown)
- Modified: 5 files (about page, skills components, package.json, content.ts)
- Deleted: 1 file (unused parse-skills.ts utility)

## Future Maintenance

To update skills:
1. Edit `content/skills.md` with new skills/proficiency levels
2. Run `npm run build` or `npm run dev`
3. The generate-skills.js script automatically updates src/data/skills-data.ts

Format: `- Skill Name | proficiency` where proficiency is 1-5

## Session 2: Skill Badges Feature for Timeline Entries

### Phase 1: Skill Badges Component
**Status:** Completed

Implemented visual skill badges that appear below timeline entry titles, showing the technologies used in each job/project.

**Files Created:**
- `src/components/timeline/skill-badges.tsx` - Reusable component for rendering skill icons with tooltips

**Files Modified:**
- `src/components/timeline/timeline-types.ts` - Added `skills?: string[]` field to TimelineEntry interface
- `src/components/timeline/timeline-entry.tsx` - Integrated SkillBadges component in both card and modal headers
- `src/data/timeline-data.ts` - Added skills arrays to 8 timeline entries with relevant skill IDs
- `package.json` - Added `react-icons` dependency for comprehensive tech icon library

**Key Implementation Details:**

1. **Icon Library**: Uses react-icons (SimpleIcons + FontAwesome)
   - SimpleIcons (Si*): Professional tech logos (SiReact, SiPython, SiDocker, etc.)
   - FontAwesome (Fa*): Generic icons for skills without specific logos
   - Icon mapping: 25 skills mapped to appropriate icons across all categories

2. **Component Features:**
   - Renders skill icons as interactive buttons below timeline entry titles
   - Hover interaction displays skill name in animated tooltip
   - State-based tooltip rendering using `hoveredSkillId` state
   - Category-based color schemes: Frontend (blue), Backend (purple), ML & GenAI (amber), Tools & Infra (emerald), Domain Knowledge (rose)
   - Animations:
     - Load: Spring scale (0.7→1) with staggered delay (index * 0.05s)
     - Hover: Scale up (1→1.2)
     - Tap: Scale down (1→0.95)
     - Tooltip: Fade + slide (opacity 0→1, y: -10→0)

3. **Integration Points:**
   - Timeline card header: Skills rendered below title/company
   - Modal header: Skills rendered below dateRange for full context
   - Conditional rendering: Only shows if entry has skills array

**Data Updates:**
Added skills to timeline entries:
- Senior Software Engineer, GenAI: Python, FastAPI, LangChain, RAG Systems, LLMs & Transformers
- SDE II, ML: Python, TensorFlow, PySpark, Kubernetes, Docker, Time Series Forecasting
- SDE I, ML: Python, FastAPI, Kubernetes, Docker, PostgreSQL
- Graduate Research: Python, Computer Vision, TensorFlow
- Student Research: Python, scikit-learn, Federated Learning, NLP
- Clarifai Intern: Python, PyTorch, Computer Vision
- Fidelity SDE: Python, NLP, Docker, SQL, scikit-learn
- IISc Research: Computer Vision

**Problem Solving:**

1. **Icon Library Selection Challenge**
   - Initial approach used lucide-react but lacked comprehensive tech icons
   - Solution: Switched to react-icons which provides SimpleIcons (professional tech logos) and FontAwesome collections
   - Benefit: All skills now have appropriate visual representations

2. **Tooltip Implementation**
   - Initial CSS-based opacity approach didn't work reliably
   - Solution: Switched to state-based conditional rendering with motion animations
   - Result: Robust tooltip system that reliably shows/hides on hover

3. **Modal Skill Display**
   - Skills weren't visible when expanding modal details
   - Root cause: SkillBadges only rendered in card header, not modal
   - Fix: Added SkillBadges rendering in modal header section

**Testing:**
- Build successful: `npm run build` completes without errors
- All 25 skills have correct icon mappings
- Tooltips display on hover with smooth animations
- Icons render in both card and modal contexts
- Responsive on mobile and desktop
- Color scheme consistent with category definitions

**Build Verification:**
```
Compiled successfully
All TypeScript types validated
Dependencies installed: react-icons@5.5.0
Timeline entries with skills: 8
Total skills referenced: 25+ unique skill uses
```

## Session 2 (Continued): Education Background Images Feature

### Phase 2: Background Image Hover Effect
**Status:** Completed

Added background images to education timeline entries that appear on hover, showcasing university imagery.

**Files Modified:**
- `src/components/timeline/timeline-types.ts` - Added `backgroundImage?: string;` field to TimelineEntry interface
- `src/components/timeline/timeline-entry.tsx` - Implemented background image layer with hover effect
- `src/data/timeline-data.ts` - Added background image paths for both education entries

**Implementation Details:**

1. **Background Image Layer:**
   - Absolute positioned div that fills the entire article container
   - Initially invisible (opacity-0)
   - Becomes visible on group-hover with 30% opacity (opacity-30)
   - Smooth transition over 500ms
   - pointer-events-none to avoid interfering with interactions

2. **Z-Index Layering:**
   - Background image layer: z-0 (implicit, behind everything)
   - All content (text, images): relative z-10 (stays visible above background)
   - Ensures text readability even with background image visible

3. **Styling Approach:**
   - Uses Tailwind CSS group modifier for clean hover state
   - Conditional background color: only applies default card background when no backgroundImage
   - bg-cover bg-center for proper image positioning
   - Works on both mobile and desktop

4. **Image References:**
   - University at Buffalo (UB): /assets/photos/buffalo_tagline.jpg
   - National Institute of Technology Karnataka (NITK): /assets/photos/nitk_tagline.webp

**Visual Behavior:**
- Default: Education cards show solid card background with text
- Hover: University tagline image fades in at 30% opacity behind text
- All text remains fully readable and visible
- Smooth transition creates elegant visual enhancement

**Testing:**
- Build successful with no TypeScript errors
- All pages generate without warnings
- Background image paths resolve correctly
- Both .jpg and .webp formats work properly
- Responsive behavior verified across breakpoints

**Code Example (component structure):**
```typescript
// Background image layer
{entry.backgroundImage && (
  <motion.div
    className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
    style={{ backgroundImage: `url('${entry.backgroundImage}')` }}
  />
)}

// Content stays on top with relative z-10
<div className="p-3 md:p-4 flex flex-col w-full relative z-10">
  {/* content here */}
</div>
```

## Session 3: Markdown-Based Timeline Data Management

### Phase 1: Timeline Markdown Source & Build-Time Generation
**Status:** Completed

Converted hardcoded TypeScript timeline data to markdown format embedded in about.mdx for easier maintenance and editing, following the same pattern as the skills system.

**Files Created:**
- `scripts/generate-timeline.js` - Build script to parse timeline data from about.mdx HTML comment and generate TypeScript

**Files Modified:**
- `src/data/timeline-data.ts` - Now generated from markdown source
- `content/pages/about.mdx` - Timeline entries now stored in MDX comment block
- `package.json` - Added generate-timeline.js to prebuild script (runs first, before generate-skills.js)

**Markdown Format:**

Timeline entries are stored in an MDX comment block in `content/pages/about.mdx`, organized into two sections: "# Professional Timeline" and "# Education Timeline"

Each entry uses a simple key-value format (within the MDX comment):
```markdown
## Entry Title
Company: Organization Name
DateRange: Start - End
Description: Short summary
ExpandedContent: Detailed information
Image: /path/to/image.png | Alt Text | Optional Caption
Link: https://url | Link Label
Skills: skill-id-1, skill-id-2, skill-id-3
BackgroundImage: /path/to/bg-image.jpg
Type: work|research|education
```

**Key Implementation Details:**

1. **Section Organization:**
   - Professional Timeline: Work positions and internships
   - Education Timeline: Degrees and academic programs
   - Automatic section tracking via markdown headings

2. **Entry Parsing:**
   - ID generation: Lowercase, hyphenated from title (e.g., "Senior Software Engineer, GenAI" → "senior-software-engineer-genai")
   - Optional fields: expandedContent, image, link, skills, backgroundImage
   - Image parsing: Supports format "path | alt | caption" where caption is optional
   - Link parsing: Supports format "url | label"
   - Skills: Comma-separated list of skill IDs
   - Type field: Sets entry type (work, research, education)

3. **TypeScript Generation:**
   - Reads `content/pages/about.mdx` at build time
   - Extracts timeline data from MDX comment block using regex pattern matching
   - Generates properly typed TypeScript exports: `professionalTimeline` and `educationTimeline` arrays
   - Escapes strings properly (quotes, newlines, backslashes)
   - Runs automatically during `npm run build` via prebuild hook
   - Runs before skills generation to ensure timeline structure is ready

4. **Data Structure:**
   - Generated TimelineEntry objects match `TimelineEntry` interface from timeline-types.ts
   - All required fields: id, title, company, dateRange, description, type
   - Optional fields only included when present in markdown

**Testing:**
- Build succeeds: `npm run build` compiles without errors
- Correct parsing: Generated 7 professional + 3 education + research entries
- All entries have proper TypeScript types
- Images, links, skills, and background images parse correctly
- Skills reference existing skill IDs from skills-data
- Routes generate successfully: /, /about, /blog, /photography

**Build Output:**
```
✓ Generated 7 professional + 3 education timeline entries from about.mdx
✓ Generated 28 skills from content/skills.md
Assets copied successfully from content/assets to public/assets
✓ Compiled successfully
```

**Why This Approach:**

Same benefits as markdown-based skills system:
- **Separation of concerns**: Content (markdown) vs. code (TypeScript)
- **Browser-safe**: Node.js APIs only used at build time, not runtime
- **Type-safe**: Generated TypeScript maintains full type safety
- **Easy updates**: Edit markdown, run build, changes propagate automatically
- **Human-readable**: Markdown format is easier to read and edit than JSON/TS
- **Git-friendly**: Markdown diffs show actual content changes clearly

**Maintenance:**

To update timeline entries:
1. Edit the timeline entries in the MDX comment block at the top of `content/pages/about.mdx`
2. Run `npm run build` or `npm run dev`
3. The generate-timeline.js script automatically extracts from about.mdx and updates `src/data/timeline-data.ts`

The timeline data is stored as a markdown block inside an MDX comment (`{/* ... */}`) within about.mdx, keeping all related content in one place.

Format example:
```markdown
## Job Title
Company: Company Name
DateRange: Month YYYY - Present
Description: Short summary for the timeline card
ExpandedContent: Longer description that appears in the expanded modal
Image: /assets/image.png | Alt Text | Optional Caption
Link: https://example.com | Visit link text
Skills: python, react, kubernetes
Type: work
```

## Session 4: Photo Tagging System & Gallery Metadata

### Phase 1: Admin UI for Photo Tagging
**Status:** Completed

Built a local-only admin interface for tagging 148 photos with location and date metadata.

**Files Created:**
- `src/lib/photo-metadata.ts` - Metadata loading and merging utilities
- `src/components/admin/photo-tagger-client.tsx` - Admin UI component (700+ lines)
- `src/app/admin/photo-tagger/page.tsx` - Admin server component with auth gate
- `src/app/api/save-photo-metadata/route.ts` - API for persisting metadata to JSON
- `content/photos-metadata.json` - Single JSON file storing all photo tags
- `.env.example` - Configuration documentation
- `.env.local` - Development environment setup (git-ignored)

**Files Modified:**
- `src/components/photography/photo-gallery.tsx` - Added metadata overlay with location/date
- `src/components/photography/photo-lightbox.tsx` - Added Captions plugin for metadata display
- `src/app/photography/page.tsx` - Integrated metadata loading and merging
- `.gitignore` - Added .env.local

**Implementation Details:**

1. **Admin UI Features:**
   - Filter modes: all, untagged, has-location, has-date, fully-tagged
   - Thumbnail sidebar for quick photo selection
   - Location + Date form inputs (free-form text)
   - Auto-save on blur (debounced API calls)
   - Photo counter and status indicators
   - Safe bounds checking for array navigation

2. **Metadata Storage:**
   - Format: `{ [photoId]: { location?, date?, tagged: boolean } }`
   - Single JSON file for simplicity
   - Git-tracked so metadata persists across deploys
   - 128 photos with dates, 110+ with locations

3. **Gallery Integration:**
   - Hover overlay shows location + date with MapPin/Calendar icons
   - Slide-up animation on hover (translate-y-full → translate-y-0)
   - Lightbox captions show "location • date" format
   - Metadata extracted from JSON at build time

4. **Development Workflow:**
   - `ENABLE_PHOTO_TAGGER=true` in .env.local activates admin UI
   - Routes to `/admin/photo-tagger` in development
   - Admin route excluded from production build
   - API saves to `content/photos-metadata.json`

**Testing & Validation:**
- Build excludes admin routes from static export
- Metadata persists correctly to JSON
- Gallery displays metadata on hover and in lightbox
- Production build does not include admin route (404)

---

## Session 5: Photo Journey - 3D Experience & Clustering

### Phase 1: Photo Clustering Algorithm
**Status:** Completed

Implemented intelligent photo clustering to group photos into "trips" based on location and time proximity.

**Files Created:**
- `src/lib/photo-clustering.ts` - Clustering algorithm (150+ lines)
  - Parses date strings "Month, Year" → numeric {month, year}
  - Extracts location primary region (e.g., "Colorado" from "Breckenridge/Keystone Area, Colorado")
  - Groups photos within same location + 3-month time window
  - Merges adjacent clusters for multi-month trips
  - Returns PhotoCluster objects with: id, name, location, date range, photos, photo count, hero photo

**Key Algorithm Details:**
- Date parsing: Handles "Month, Year" format with month validation
- Location grouping: Primary location extracted from "Place, State" format
- Time window: 3-month threshold for same cluster
- Merging: Adjacent clusters with ≤2 months gap merge into single cluster
- Sorting: Clusters sorted by date (most recent first)
- Result: 20+ clusters from 120+ tagged photos

### Phase 2: 3D Space Positioning System
**Status:** Completed

Calculates 3D coordinates for clusters to visualize them in virtual space.

**Files Created:**
- `src/lib/photo-positioning.ts` - 3D positioning utilities (200+ lines)
  - X-axis: Geographic spread (location-based, normalized to [-1, 1])
  - Y-axis: Subtle random variation (deterministic, [-0.15, 0.15])
  - Z-axis: Temporal depth (older photos further back, normalized scale)
  - Scale: Based on cluster size (0.8-1.2 scale factor)
  - Depth: Normalized distance for visual layering
  - Camera system: Target calculation, position helpers

**Key Implementation:**
- Location mapping: Unique locations sorted alphabetically, evenly distributed on X-axis
- Date range: Min/max dates across all clusters determine Z-axis scale
- Deterministic pseudo-random Y: Uses sine hash for consistent positioning
- Camera functions: getCameraTarget() averages cluster positions, getCameraPosition() offsets from target

### Phase 3: PhotoJourney Component
**Status:** Completed

Main interactive component rendering clusters in 3D perspective with dual desktop/mobile interfaces.

**Files Created:**
- `src/components/photography/photo-journey.tsx` - Complete component (500+ lines)

**Desktop View Features:**
- 3D perspective transformation with scroll-based camera movement
- Cluster cards positioned in 3D space with perspective projection
- Smooth camera movement: scroll up (overview), scroll down (zoom in)
- Perspective projection: Objects closer to camera appear larger
- Scale based on cluster size and camera distance
- Hover effects: Scale up on active clusters
- Scroll indicator with animated chevron
- Progress indicator: Dot navigation showing cluster positions

**Mobile View Features:**
- Vertical timeline layout instead of 3D
- Swipe navigation (50px threshold per cluster)
- Card-based cluster preview: hero image + metadata
- Touch gestures for cluster selection
- Full-screen scrollable timeline

**Zoom Interaction (Desktop & Mobile):**
- Click cluster → Camera rushes toward it
- Desktop: Photos arranged in circular arc around viewer
- Mobile: Photos in 2-column grid
- Lightbox integration for full-size viewing
- Back button to return to overview

**Accessibility & Performance:**
- Reduced motion support via Framer Motion hooks
- No scroll events on mobile (uses touch instead)
- Lazy loading for images (loading="lazy")
- Scroll sensitivity configurable (0.001 default)
- Touch start/end event handlers for mobile swipe

### Phase 4: Photography Page Integration
**Status:** Completed

Connected clustering, positioning, and PhotoJourney components to main photography page.

**Files Modified:**
- `src/app/photography/page.tsx`
  - Imports clustering and positioning utilities
  - Calls clusterPhotos() on gallery with metadata
  - Calls positionClusters() on clusters
  - Renders PhotoJourney when clusters exist (falls back to PhotoGallery otherwise)
  - Removed photo shuffling (photos now organized by clusters)

**Data Flow:**
```
Load Photos → Load Metadata → Merge Metadata with Photos
                                      ↓
                            Filter Tagged Photos
                                      ↓
                            Cluster by Location + Time
                                      ↓
                            Position Clusters in 3D Space
                                      ↓
                            Render PhotoJourney
                                      ↓
                    Scroll/Swipe → Camera Moves → Perspective Updates
```

### Testing & Validation:
- 128 photos with complete metadata (location + date)
- 20+ clusters identified (Colorado trips, Utah trips, etc.)
- Desktop 3D perspective rendering correctly
- Mobile timeline fallback working
- Touch swipe navigation functional
- Lightbox opens for full-size viewing
- Reduced motion respected
- Build succeeds, no compilation errors

### Technical Architecture:

**Clustering Algorithm:**
- Input: PhotoItem[] with location/date metadata
- Process: Parse dates/locations → Group by primary location + 3-month window → Merge adjacent clusters
- Output: PhotoCluster[] with metadata and photo arrays

**Positioning System:**
- Input: PhotoCluster[]
- Process: Map locations to X-axis → Calculate Z from dates → Add Y variation → Calculate scale
- Output: PositionedCluster[] with 3D coordinates and depth

**Camera System:**
- Target: Centroid of all cluster positions
- Position: Offset from target based on scroll progress
- Movement: Interpolated between [overview, zoom-in] states
- Projection: Perspective math converts 3D→2D screen coordinates

**Component State Management:**
- scrollProgress: [0-1] from user input (scroll/swipe)
- camera: CameraState {x, y, z} based on scroll progress
- zoomedClusterId: Currently expanded cluster (null for overview)
- lightboxIndex: Selected photo in lightbox (-1 for closed)
- isMobile: Layout mode detection from viewport width
- viewportSize: Current container dimensions

### Known Limitations & Future Improvements:
- 3D effects are CSS-based (perspective transform), not WebGL
- Mobile timeline simplified (no 3D rotation)
- Touch swipe uses threshold detection (no momentum)
- Location clustering by name string (not actual distance math)
- Photo arc layout uses fixed circle (could be dynamic)
- Camera movement is linear (could be eased)

### Files Summary:
- **Created**: 4 new files (clustering, positioning, photo-journey component)
- **Modified**: 2 files (photography page, added imports)
- **Total Lines Added**: 900+ lines of code

## 2026-11-15: Portfolio UX Upgrade and Design Directions

**Status:** Unified production routes ready for local review on `codex/portfolio-ux-variants`; not committed.

### Implemented

- Added responsive primary navigation with active-page states, a mobile menu, larger touch targets, and consistent `Writing` terminology.
- Replaced the generic footer with portfolio-specific identity and navigation.
- Reworked timeline details around native `<dialog>` behavior for focus containment, Escape handling, backdrop dismissal, focus restoration, and unique accessible labels.
- Made code blocks keyboard-focusable and kept copy controls visible on touch devices.
- Converted skill icons to non-interactive, labelled presentation and removed unnecessary badge animation.
- Changed photography filters to a one-row horizontal mobile rail with `aria-pressed` states and removed ornamental scroll/hover scaling.
- Improved article hierarchy with a back link, reading time, responsive title scale, and wrapping tags.
- Prototyped three data-backed directions, then used their strongest traits as page-level accents instead of independent themes.
- Established one warm editorial canvas, shared typography hierarchy, navigation, surfaces, borders, spacing, and light/dark behavior across every route.
- Kept About technical through a subtle grid, monospaced display type, and restrained cyan/emerald accents without changing the site palette.
- Kept Photography cinematic through its full-bleed image hero, returning immediately to the shared editorial canvas below it.
- Replaced the root redirect with a visual homepage connecting engineering, writing, and photography within the same foundation.
- Removed the temporary preview switcher and routes after promotion.
- Removed the route-scoped palettes after review showed that they made the site feel like three unrelated templates.

### Validation

- Production build passed in Node 22 Docker; the homepage and all public content routes are statically generated.
- Playwright desktop and 390px mobile checks passed for Home, About, Writing, and Photography with no page errors or horizontal overflow.
- Focused Playwright checks passed for native dialog Escape behavior and keyboard focus on code blocks.
- Cross-route checks confirmed the same light-mode background token on Home, About, Writing, and Photography, with dark-mode preference persisting between routes.
- Screenshots reviewed at 1440×1000 and 390×844.

### Local Review URLs

- `http://localhost:3000/`
- `http://localhost:3000/about`
- `http://localhost:3000/blog`
- `http://localhost:3000/photography`

## 2026-11-15: Animated Project Visuals on About

**Status:** Implemented on `codex/portfolio-ux-variants`; not committed.

### Implemented

- Added `src/components/visuals/`: one animated SVG scene per project, explaining how the work functions (agent loop, AutoML model selection, Spark scaling, cursor tracking, gossip consensus, tracking with detection resets, chatbot pipeline, KPI dashboard, OCR features → k-NN, consensus MLPs).
- Scenes use SVG SMIL animations sharing a single per-scene cycle (`Cycle` context), so loops never drift. Primitives (`A`, `Show`, `Draw`, `Packet`, `Box`, `Layer`) keep each scene declarative.
- `ProjectVisual` pauses scenes off-screen (`useInView`) and freezes them on a representative `still` frame under `prefers-reduced-motion`.
- Timeline entries take a new `Visual:` field in `about.mdx` (parsed by `generate-timeline.js`); the visual replaces the static R2 image in both the card and the dialog. Publications use `<PaperVisual name="..." />`.
- Collapsed timeline motion to one entrance per card (removed container stagger, `scale(0)` dots, slide-in, image scale, ungated hover shift).
- Fixed cards that could stay invisible: SSR rendered them at `opacity: 0`, and a card scrolled past before hydration never received an in-view event. Cards now render visible and only defer the reveal if still below the fold on mount.
- Fixed `generate-timeline.js` assigning the last entry of a section to the next section (the IISc internship appeared under Education).
- Fixed an invalid `hsl(var(--card))` background on education cards (tokens are oklch).
- Dialog visuals mount only while the dialog is open.
- `compileMDX` now uses `MDXComponents` from `mdx/types` so MDX components can take props.

### Validation

- `tsc --noEmit` and ESLint clean for touched files (one pre-existing `<img>` warning).
- Playwright: repeated fast-scroll runs at 1440px and 390px leave no hidden cards and no horizontal overflow; no page errors.
- Frozen-frame contact sheets (t = 1.6/3.6/5.6s) reviewed in light and dark mode for all nine scenes.
- Reduced motion: every scene paused at its `still` time. Dialog opens with the visual, closes on Escape, and unmounts it.
- Production build not re-run in this pass.

## 2026-11-15: Text-only Timeline Dialogs

- The "More" dialog now shows only title, meta, skills, Overview, and Details; the visual/image were removed from it (the card already shows the visual).
- Installed `animate`, `choreograph`, and `animation-performance` from `emilkowalski/skills` (commit `64eb3de`) into `~/.claude/skills/`.
- Found that most timeline `Skills:` IDs don't match `skills-data.ts` IDs (e.g. `llms` vs `llms-genai-systems`), so their badges are silently dropped; the current GenAI role shows 1 of 5. Not yet fixed — pending user decision with the copy edits.

## 2026-11-15: Publication Cleanup

- Reordered publications: ICMLA 2021, arXiv 2021, 2019 tech report, arXiv 2018.
- Replaced emoji links with plain `Springer ↗` / `arXiv ↗` / `PDF ↗` labels.
- Abstracts collapse behind a native `<details>` "Read abstract" toggle (`Abstract` MDX component in the About page).
- Fixed visual labels ignoring per-label `fontSize`: the default size moved from the `.viz-text` class to the `<svg>` attribute so element attributes take precedence.
- Production build re-run in a throwaway Node 22 container: passed, all public routes static.

## 2026-11-15: Skill ID Consistency

- Root cause: three skill vocabularies had drifted — IDs generated from `content/skills.md`, timeline `Skills:` lines, and two hand-written icon maps. Unmatched timeline IDs were silently dropped (GenAI role showed 1 of 5), and the badge map fell back to a Python logo for any unknown ID (Java, Tableau, Hadoop, Databricks, Splunk, JupyterHub).
- `generate-skills.js` now emits `skillsData` `as const` plus a `SkillId` union, and throws on malformed lines (`OpenLens - 3` had been silently skipped; fixed to `| 3`).
- Single icon map `src/components/skills/skill-icons.ts` typed `Record<SkillId, IconType>`, shared by the Skills section and timeline badges; removed both old maps and the Python fallback.
- `TimelineEntry.skills` is `SkillId[]`, so an unknown ID in `about.mdx` now fails type-check/build (verified with a probe).
- Remapped timeline IDs to canonical ones. Dropped IDs with no entry in `skills.md`: FastAPI, agentic-ai, CI/CD, OpenCV (covered by Computer Vision), analytics, MATLAB. `distributed-systems` → Machine Learning; IISc gained Machine Learning (k-NN/SVM work).
- Production build passes.

## 2026-11-15: Visuals Frozen on First Visit; Dark Default

**Status:** PR open on `fix/dark-default-smil-start` (PR #29 merged before the skill-ID commit landed, so that commit is cherry-picked here).

- Symptom: on a first visit to the deployed About page the project visuals sat still until a tab switch.
- Root cause: an inline SVG's SMIL clock starts at the window `load` event. Verified with a local harness: before `load`, `unpauseAnimations()`, `setCurrentTime()`, and re-inserting the SVG all leave the clock at 0. The education cards set their hover-only photos as inline `background-image`, so 1.45 MB (`buffalo_tagline.jpg` 1.27 MB) downloaded eagerly and held the load event; cold-cache `load` fired exactly when that photo finished.
- Fix: hover photos are requested on first `pointerenter`; nothing on About besides fonts and JS gates `load` now. Verified: 0 photo requests at load, request on hover, visuals' clock running.
- Dark mode is now the default theme (`defaultTheme="dark"`); stored preferences still win.
- Follow-up (not in this PR): the homepage hero is a 3 MB PNG (`/assets/photos/001.png`), also preloaded when the homepage route is prefetched.

## 2026-11-15: Dark-mode Legibility and Theme Toggle

- Visual labels were dimmed with fixed opacity (0.5–0.7) and rendered ~7.5px on screen; in dark mode they read as faint grey on near-black. Labels now use a theme-aware `.viz-muted` (`--muted-foreground`), base label size is 9 (small labels 7, loss readouts 6.5), dark-mode label weight is 500, and card thumbnails are `md:w-64`. "jobs healthy" shortened to "healthy" to fit.
- Theme toggle: icon derived from the `dark` class via CSS (Sun in dark, Moon in light) and clicks use `resolvedTheme`. The old code keyed off `theme`, which is `"system"` for visitors with that stored value, showing a Moon while dark; it also had a setState-in-effect mount check (lint error) that is now gone.
- Dev environment gotcha: `npm run build` writes into the same `.next` as the dev server and leaves its Turbopack CSS cache stale (served CSS predates later `globals.css` edits). After a local production build, run `docker exec <dev> rm -rf /app/.next/dev` and restart the dev container.

## 2026-11-15: Scroll Wayfinding and Transitions

**Status:** Local branch `feature/scroll-motion-variants` (stacked on PR #30's branch); not pushed yet.

- Previewed three directions from the scroll research (Wayfinding, Continuity, Narrative) behind a temporary dev-only switcher; the user picked pieces from each. The switcher and unused variants were removed.
- Shipped (all gated on `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`; without support the page is today's static version):
  - About: timeline connector fills via `view(block 49.5% 50%)` (a 1% band at viewport centre) and nodes fill as they cross it.
  - About: "More" card morphs into its `<dialog>` and back via a same-document View Transition (`src/lib/view-transition.ts`); the shared `role-card` name is cleared after each transition so cards never collide.
  - Writing: 2px reading-progress bar (`scroll(root)`) and a wide-screen "On this page" list (posts with 3+ `##` headings, parsed server-side) with the active section tracked by a rAF-throttled scroll listener.
  - Photography: sticky trip headings under the filter bar; hero drifts/darkens and its title fades over the `exit` range.
- Dropped after review: photo-to-lightbox morph (little perceived difference, needed to intercept the lightbox's close triggers) and the sticky "role stage" on About.
- Gotchas: `overflow: hidden` makes an element a scroll container and silently deactivates a child's `view()` timeline (use `overflow: clip`); IntersectionObserver misses headings skipped by a jump scroll; rendering (and rAF) is suppressed during a View Transition's DOM update.
- For local Photography previews, 2 photos per location were mirrored from the live site into git-ignored `content/assets/photos` and copied to `public/assets` (excluded via `.git/info/exclude`).
- Verified: production build; Playwright checks for rail fill progress, dialog morph open/close with focus return, reading progress and active section, hero fade, sticky headings, normal lightbox, no page errors.

## 2026-11-15: Photo Map Variants (Local Preview)

**Status:** Local preview on `feature/photo-map-variants` (from `main` after PR #31). Not pushed; awaiting the user's pick.

- `src/lib/photo-geo.ts` reads GPS + capture time from each photo's EXIF at build/render time (`exifr`), rounds coordinates to 0.05° (~5 km), and groups photos within 60 km into date-ordered places. Reads the first 256 KB of each file and passes bytes to exifr: exifr's own file loading fails inside Next's server bundle ("Couldn't load fs"), and its `pick` option drops the raw GPS tags that `latitude`/`longitude` are computed from.
- Map section on Photography with a dev-only switcher between four variants (`src/components/photography/map/`):
  1. Atlas: flat d3-geo SVG (world-atlas countries + us-atlas states), visited regions tinted; hovering a place/state fans its photos out; regions without photos show the nearest place at the cursor; click zooms (animated `viewBox`) and fills a filmstrip.
  2. Globe: cobe WebGL dotted globe; DOM pins anchored with CSS anchor positioning to cobe's marker anchors (`--cobe-visible-*` lives on `:root`, absent when behind the globe); hover pauses rotation and fans photos; click turns the globe to the place; drag to spin. Canvas is created imperatively because cobe re-parents it.
  3. Journey: trips in date order; camera follows each leg, great-circle arc draws, photos bloom at each stop; stop chips to jump.
  4. Globe → Atlas: globe with journey arcs; choosing a place cross-fades into the Atlas zooming in from the world view.
- Download deterrence: right-click, drag, and long-press save blocked on photos (page and lightbox). Cannot stop screenshots; real protection needs resized, EXIF-stripped derivatives (not yet built).
- Gotcha: after `npm install` with the dev server running, Turbopack failed to resolve `d3-geo` from `d3`; clearing `.next/dev` and restarting fixed it.
- Verified in Chrome (SwiftShader WebGL): 17 places from 24 geotagged local photos; all four variants render and interact in dark and light; context menu blocked on gallery photos; no console errors.

## 2026-11-15: Pokémon-style Illustrated Atlas (Local Preview)

**Status:** Local on `feature/photo-map-variants`, not pushed. Built with two parallel subagents (terrain data, symbol art) plus main-session composition.

- **Look:** one watercolor game-map palette in both themes (`gm-*` classes): blue sea with pale shallows and foam, green land on a raised earthy edge, translucent elevation washes, winding rivers and lakes, painted mountain ranges, rolling hills, round-tree forests, multi-building towns, chunky landmarks, serif town names.
- **Zoom:** d3-zoom. Pinch or ⌘/Ctrl+scroll zooms; plain scroll keeps scrolling the page with a hint; two fingers on touch; +/−/World buttons; clicking a place or state flies in. A non-passive ctrl+wheel guard on the container stops a pinch that starts over an overlay from zooming the whole page. The live transform is written to the DOM; React only re-renders at zoom end. Symbols counter-scale via `--k`, set only on the symbol layer.
- **Level of detail:** symbols keep a constant on-screen spacing via `selectSpaced`, so detail increases with zoom.
  - Mountains (≥2,500 m) overlap into ranges, smaller at world view.
  - Hills (<2,500 m) and forests (a jittered land grid, hit-tested with `Path2D`/`isPointInPath`) appear from 2× zoom.
  - Towns replace dots at 2×. Labels collide-check by photo count. Landmarks lift above a town they would cover.
- **Roads:** a minimum spanning tree over places within 1,500 km, drawn as gentle quadratic curves.
- **Data (committed, small; regenerate with the scripts):**
  - `src/data/terrain-peaks.json` (`scripts/generate-terrain.js`)
  - `src/data/terrain-bands.json` (`scripts/generate-terrain-bands.js`, d3-contour, Douglas–Peucker; drawn smoothed, Greenland ice excluded)
  - `src/data/hydrology.json` (`scripts/generate-hydrology.js`, Natural Earth 1:50m rivers rank ≤5 and lakes rank ≤1)
  - Source downloads (AWS Terrain Tiles z4, Natural Earth GeoJSON) were fetched by the user and copied into git-excluded `.cache/`.
- **Fixes along the way:**
  - Peaks from the clamp ceiling (corrupt pixels) dropped.
  - Lake rings collapsed by line simplification (closed ring ends coincide); now simplified as two halves.
  - Antarctica filtered from the land outline.
  - Lakes are gaps between countries, so they're painted as water over the raised edge.
  - The world view no longer suppresses the Rockies (towns reserve space only when drawn).
  - The `.gm-ocean` fill on `<svg>` leaked into children; removed.
- **Gotcha:** the Turbopack dev CSS cache went stale repeatedly after `globals.css` edits and after production builds. Fix: `docker exec kind_kowalevski rm -rf /app/.next/dev` and restart the container.
- **Attribution to add before shipping:** Natural Earth (public domain, credit customary) and AWS Terrain Tiles (sources such as SRTM/ETOPO1 ask for attribution).
