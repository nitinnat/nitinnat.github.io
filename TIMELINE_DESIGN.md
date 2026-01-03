# About Page Implementation - Timeline & Skills

## Overview

Comprehensive redesign of the About page featuring:
1. **Interactive Timeline** - Animated vertical timeline with expandable modal details
2. **Skills Visualization** - Sidebar with category-based skill bars and proficiency indicators
3. **Markdown-Based Skills Data** - Easy-to-maintain skills definitions separate from code

## Architecture

### File Structure
```
src/components/
  timeline/
    timeline.tsx           # Container with vertical line
    timeline-entry.tsx     # Individual entry cards with modals
    timeline-types.ts      # TypeScript interfaces
    skill-badges.tsx       # Skill icon badges with tooltips
  skills/
    skills-bars.tsx        # Sidebar skill visualization component
    skills-grid.tsx        # Grid-based skill cards component

src/data/
  timeline-data.ts         # Professional and education timeline entries
  skills-data.ts           # Generated from content/skills.md

src/lib/
  content.ts               # Utilities for reading skills markdown

src/app/about/
  page.tsx                 # About page layout (sidebar + content)

content/
  skills.md                # Human-editable skills source file

scripts/
  generate-skills.js       # Build-time parser: markdown → TypeScript
```

### Data Structures

#### Timeline Entry
```typescript
interface TimelineEntry {
  id: string;
  title: string;           // "Senior Software Engineer, GenAI"
  company: string;         // "o9 Solutions"
  dateRange: string;       // "April 2025 - Present"
  description: string;     // Short summary in card
  expandedContent?: string; // Detailed description in modal
  image?: { src: string; alt: string; caption?: string };
  link?: { href: string; label: string };
  skills?: string[];       // Skill IDs to display as badges
  backgroundImage?: string; // Background image for education entries (appears on hover)
  type: "work" | "education" | "research";
}
```

#### Skill
```typescript
interface Skill {
  id: string;              // "react", "python", etc.
  name: string;            // "React", "Python"
  proficiency: number;     // 1-5 scale
  category: "frontend" | "backend" | "ml" | "tools" | "domain";
}
```

#### Skills Markdown Format
```markdown
## Category Name
- Skill Name | proficiency (1-5)

# Example:
## Frontend
- React | 4
- TypeScript | 4

## ML & GenAI
- LLMs & Transformers | 5
- RAG Systems | 4
```

## Key Features

### Timeline Component

#### 1. Vertical Timeline Line
- Desktop: Left-aligned vertical line (single column centered layout)
- Mobile: Left-aligned vertical line with entries flush right
- Gradient line: Primary color at top, fading to transparent at bottom
- Responsive positioning: `left-4` on mobile, centered on desktop via grid

#### 2. Timeline Entry Card
- **Side-by-side layout**: Image left (w-56 fixed width), content right on desktop
- **Image sizing**:
  - Mobile: h-32, full width
  - Desktop (md+): h-40, w-56 fixed, with flex-shrink-0 to prevent compression
  - Modal: h-64 mobile, h-80 desktop
- **Background images** (Education entries only):
  - University at Buffalo: buffalo_tagline.jpg (appears on hover)
  - National Institute of Technology Karnataka: nitk_tagline.webp (appears on hover)
  - Opacity: 30% on hover, transitions smoothly over 500ms
  - Text remains fully visible and readable
  - Uses group-hover for clean state management
- **Content sections**:
  - Header: Title + company (inline flex with baseline alignment)
  - Skills badges: Icon buttons with skill names in tooltips (rendered below title)
  - Description: Short summary text
  - More button: Opens expandable modal
  - Link: Optional external link with arrow icon

#### 2a. Skill Badges Component
- **Icon mapping**: Each skill ID maps to an icon from react-icons (SimpleIcons + FontAwesome)
  - Frontend: SiReact, SiTypescript, SiTailwindcss, SiNextdotjs, SiFramer
  - Backend: SiPython, FaCogs (FastAPI), FaDatabase (SQL), SiDocker, SiKubernetes
  - ML & GenAI: FaBrain (LLMs, NLP, AutoML), SiTensorflow, SiPytorch, SiScikitlearn, SiApachespark, FaNetworkWired (LangChain, RAG, Federated Learning)
  - Tools & Infra: SiGit, SiPostgresql, FaAws, SiGoogle (GCP), SiElasticsearch, SiRedis
  - Domain Knowledge: SiOpencv (Computer Vision), FaBrain (NLP), FaCube (Time Series), FaNetworkWired (Federated Learning)
- **Category colors**: Each skill category has unique hover background color (20% opacity)
  - Frontend: Blue (blue-500)
  - Backend: Purple (purple-500)
  - ML & GenAI: Amber (amber-500)
  - Tools & Infra: Emerald (emerald-500)
  - Domain Knowledge: Rose (rose-500)
- **Tooltip interaction**: Skill name appears below icon on hover
  - State-based rendering with `hoveredSkillId` state
  - Centered positioning with motion animation (opacity 0→1, y: -10→0)
  - Non-interactive (pointer-events-none) to avoid disrupting hover detection
- **Animation on load**: Spring-based scale animation (0.7→1) with staggered delay (index * 0.05)
- **Animation on hover**: Scale up (1→1.2) with immediate transition
- **Tap animation**: Scale down (1→0.95) for tactile feedback

#### 3. Expandable Modal System
- **Trigger**: "More" button on entry card
- **Animation**: Spring transition (damping: 25, stiffness: 300)
- **Layout**:
  - Mobile: Fixed inset-4 padding (full screen with margins)
  - Desktop: Centered with max-w-2xl
- **Content sections**:
  - Overview: Short description from card
  - Details: Full `expandedContent` with `whitespace-pre-wrap`
  - Larger image: h-64 mobile / h-80 desktop
  - Link: Prominent external link at bottom
- **Interaction**: Click backdrop or X button to close

#### 4. Scroll-Triggered Animations
- Entry cards: Fade + slide (opacity 0→1, x: 10→0)
- Timeline dots: Scale animation (0→1) with spring physics
- Stagger delay: index * 0.05 between entries
- Trigger: `whileInView` with `viewport={{ once: true }}`
- Accessibility: Disabled when `useReducedMotion()` is true

#### 5. Visual Differentiation
- **Work experience**: Primary color (blue) for dots, borders, focus rings
- **Education**: Emerald green for dots, borders, focus rings
- **Variant prop**: Passed to entry cards to apply correct color scheme

### Skills Sidebar Component (SkillsBars)

#### 1. Category-Based Organization
Five skill categories with unique color schemes:
- **Frontend**: Blue/Cyan gradient (`from-blue-400 to-cyan-400`)
- **Backend**: Purple/Pink gradient (`from-purple-400 to-pink-400`)
- **ML & GenAI**: Amber/Orange gradient (`from-amber-400 to-orange-400`)
- **Tools & Infra**: Emerald/Teal gradient (`from-emerald-400 to-teal-400`)
- **Domain Knowledge**: Rose/Red gradient (`from-rose-400 to-red-400`)

#### 2. Skill Bar Visualization
- Horizontal bar showing proficiency level (1-5)
- Background: Subtle gradient (20% opacity of category color)
- Fill: Animated from 0% to `(proficiency/5)*100%` on scroll
- Glow effect: Hover effect with box-shadow matching category color
- Proficiency label: `proficiency/5` displayed on right

#### 3. Layout & Responsiveness
- **About page**: Two-column grid
  - Sidebar: 280px fixed width on desktop (lg breakpoint)
  - Sticky on scroll: `lg:sticky lg:top-8`
  - Main content: Responsive prose + timelines
- **Mobile**: Single column, SkillsBars moved below timeline
- **Sorting**: Skills within each category sorted by proficiency (descending)

#### 4. Animations
- Category sections fade in on scroll with staggered delay
- Skill bars animate width from 0 to full with easing
- Hover effects on bar (glow) and skill names (color change)
- All animations respect `useReducedMotion()` preference

### Skills Markdown Data Management

#### 1. Human-Editable Source Format
Located in `content/skills.md` with simple format:
```markdown
## Category Name
- Skill Name | proficiency
```

#### 2. Build-Time Generation (scripts/generate-skills.js)
- **Trigger**: Runs in `prebuild` hook before Next.js build
- **Process**:
  1. Reads `content/skills.md`
  2. Parses markdown headings and list items
  3. Generates skill IDs (lowercase, hyphenated from names)
  4. Outputs typed TypeScript code to `src/data/skills-data.ts`
- **Error handling**: Validates proficiency is 1-5, returns 0 skills if file missing

#### 3. Advantages
- **Separation of concerns**: Content (markdown) vs. code (TypeScript)
- **Browser-safe**: Node.js APIs only used at build time, not runtime
- **Type-safe**: Generated TypeScript maintains full type safety
- **Easy updates**: Edit markdown, run build, changes propagate automatically
- **Git-friendly**: Markdown diffs are human-readable

## Responsive Design

### Timeline
| Breakpoint | Layout | Timeline | Entries | Skills |
|------------|--------|----------|---------|--------|
| Mobile <768px | Single column | Left-aligned (left-4) | Flush right | Below timeline |
| Desktop ≥768px | Side-by-side | Left column (20px) | Image + content grid | Sticky sidebar (280px) |

### About Page Layout
```
Mobile (<1024px):
┌─────────────────────────────┐
│ Prose content               │
├─────────────────────────────┤
│ Timeline (full width)       │
├─────────────────────────────┤
│ Skills bars (full width)    │
└─────────────────────────────┘

Desktop (≥1024px):
┌────────────┬──────────────────────────┐
│ Sidebar    │ Main Content             │
│ (280px)    │ ┌──────────────────────┐ │
│ • Links    │ │ Prose                │ │
│ • Skills   │ │ Timeline             │ │
│            │ │ Publications         │ │
│ (sticky)   │ └──────────────────────┘ │
└────────────┴──────────────────────────┘
```

## Animation Details

### Timeline Entry Card
```typescript
// Initial state when not in viewport
variants: {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0 }
}
// Trigger on scroll into view
whileInView: { opacity: 1, x: 0 }
viewport: { once: true }
transition: { delay: index * 0.05 + 0.05, duration: 0.5 }

// Hover effect
whileHover: { x: 4 }
```

### Timeline Dots (Scale)
```typescript
// Outer circle
initial: { scale: 0 }
whileInView: { scale: 1 }
transition: { delay: index * 0.05, duration: 0.3, type: "spring", stiffness: 120 }

// Inner dot
initial: { scale: 0 }
whileInView: { scale: 1 }
transition: { delay: index * 0.05 + 0.1, duration: 0.2 }
```

### Timeline Images (Fade + Scale)
```typescript
initial: { opacity: 0, scale: 0.95 }
whileInView: { opacity: 1, scale: 1 }
viewport: { once: true }
transition: { delay: index * 0.05 + 0.15, duration: 0.4 }
```

### Modal Animation (Spring Physics)
```typescript
motion.div // Backdrop
  initial: { opacity: 0 }
  animate: { opacity: 1 }
  exit: { opacity: 0 }

motion.div // Content
  initial: { opacity: 0, scale: 0.95, y: 20 }
  animate: { opacity: 1, scale: 1, y: 0 }
  exit: { opacity: 0, scale: 0.95, y: 20 }
  transition: { type: "spring", damping: 25, stiffness: 300 }
```

### Skill Bar Animation
```typescript
// Bar fill
initial: { width: 0 }
whileInView: { width: `${percentage}%` }
transition: {
  delay: index * 0.03,
  duration: 0.7,
  ease: [0.25, 0.46, 0.45, 0.94]  // cubic-bezier
}

// Hover glow
whileHover: { boxShadow: colors.glow }
```

### Easing Function
Used consistently across components:
```typescript
ease: [0.25, 0.46, 0.45, 0.94]  // Custom cubic-bezier
```

## Accessibility

1. **Reduced Motion**: Uses `useReducedMotion()` hook to disable animations
2. **Keyboard Navigation**: Native button elements with `aria-expanded`
3. **Focus Indicators**: `focus-within:ring-2` on cards
4. **Semantic HTML**: `<article>`, `<header>`, `<figure>`, `<figcaption>`
5. **Alt Text**: All images have descriptive alt attributes

## Maintenance Guide

### Updating Skills
Edit `content/skills.md` with format:
```markdown
## Category Name
- Skill Name | proficiency (1-5)
```

Then run build:
```bash
npm run build
# or
npm run dev
```

The `scripts/generate-skills.js` runs automatically in the prebuild hook and updates `src/data/skills-data.ts`.

### Adding Timeline Entries
Edit `src/data/timeline-data.ts` to add new entries:
```typescript
{
  id: "unique-id",
  title: "Position Title",
  company: "Company Name",
  dateRange: "Month YYYY - Present",
  description: "Short summary for card",
  expandedContent: "Full details for modal",
  image: { src: "/path/to/image.jpg", alt: "Description" },
  link: { href: "https://...", label: "Link text" }
}
```

### Color Scheme Reference
**Timeline:**
- Work (primary): Blue
- Education: Emerald-500

**Skills Categories:**
- Frontend: Blue/Cyan
- Backend: Purple/Pink
- ML & GenAI: Amber/Orange
- Tools & Infra: Emerald/Teal
- Domain Knowledge: Rose/Red

## File Manifest

| File | Purpose | Status |
|------|---------|--------|
| `src/components/timeline/timeline.tsx` | Timeline container with vertical line | ✓ Complete |
| `src/components/timeline/timeline-entry.tsx` | Individual entry card with modal | ✓ Complete |
| `src/components/timeline/timeline-types.ts` | TypeScript interfaces | ✓ Complete |
| `src/components/timeline/skill-badges.tsx` | Skill icon badges with tooltips | ✓ Complete |
| `src/components/skills/skills-bars.tsx` | Sidebar skills visualization | ✓ Complete |
| `src/components/skills/skills-grid.tsx` | Grid-based skills component | ✓ Complete |
| `src/data/timeline-data.ts` | Professional & education entries with skills | ✓ Complete |
| `src/data/skills-data.ts` | Generated from markdown | ✓ Generated |
| `src/app/about/page.tsx` | About page layout | ✓ Complete |
| `content/skills.md` | Human-editable skills source | ✓ Complete |
| `scripts/generate-skills.js` | Build-time markdown parser | ✓ Complete |
| `package.json` | Updated prebuild script & react-icons dependency | ✓ Complete |
| `mdx-components.tsx` | Timeline component export | ✓ Complete |
| `content/pages/about.mdx` | About page content | ✓ Complete |
