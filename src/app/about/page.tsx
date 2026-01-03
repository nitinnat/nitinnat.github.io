import { getPageBySlug } from "@/lib/content";
import { compileMDX } from "@/lib/mdx";
import { Mail, Linkedin, Github } from "lucide-react";
import { Timeline } from "@/components/timeline/timeline";
import { professionalTimeline, educationTimeline } from "@/data/timeline-data";
import { SkillsGrid } from "@/components/skills/skills-grid";
import { SkillsBars } from "@/components/skills/skills-bars";

function ProfessionalTimeline() {
  return <Timeline entries={professionalTimeline} variant="work" />;
}

function EducationTimeline() {
  return <Timeline entries={educationTimeline} variant="education" />;
}

export const metadata = {
  title: "About",
  description: "About this blog",
};

export default async function AboutPage() {
  const page = getPageBySlug("about");

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1>About</h1>
          <p className="text-muted-foreground">
            Create an{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
              about.mdx
            </code>{" "}
            file in{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
              content/pages/
            </code>{" "}
            to customize this page.
          </p>
          <div className="bg-muted p-4 rounded-lg text-sm mt-4">
            <p className="font-medium mb-2">Example content:</p>
            <pre className="text-xs">
              {`---
title: "About Me"
---

# About Me

Write your bio here...`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const MDXContent = await compileMDX(page.content, {
    ProfessionalTimeline,
    EducationTimeline,
    SkillsGrid,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 max-w-6xl mx-auto">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-8 h-fit">
          <div className="bg-card/40 border border-primary/10 rounded-lg p-4">
            <div className="flex gap-4 mb-6">
              <a
                href="mailto:nitinnataraj93@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/nitin-nataraj-aa37039b"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/nitinnat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
            <SkillsBars />
          </div>
        </aside>

        {/* Main content */}
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <MDXContent />
        </article>
      </div>
    </div>
  );
}
