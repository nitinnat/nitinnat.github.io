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
  skills?: string[]; // Skill IDs to display as badges
  backgroundImage?: string; // Background image for education entries on hover
  type: "work" | "education" | "research";
}

export interface TimelineProps {
  entries: TimelineEntry[];
  className?: string;
  variant?: "work" | "education";
}
