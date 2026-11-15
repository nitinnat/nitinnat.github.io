import type { VisualName } from "@/components/visuals/project-visual";
import type { SkillId } from "@/data/skills-data";

export interface TimelineEntry {
  id: string;
  title: string;
  company: string;
  dateRange: string;
  description: string;
  expandedContent?: string;
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
  link?: {
    href: string;
    label: string;
  };
  skills?: SkillId[];
  visual?: VisualName;
  backgroundImage?: string; // Background image for education entries on hover
  type: "work" | "education" | "research";
}

export interface TimelineProps {
  entries: TimelineEntry[];
  className?: string;
  variant?: "work" | "education";
}
