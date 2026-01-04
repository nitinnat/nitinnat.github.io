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

