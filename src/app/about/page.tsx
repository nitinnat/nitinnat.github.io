import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { getPageBySlug } from "@/lib/content";
import { compileMDX } from "@/lib/mdx";
import { Timeline } from "@/components/timeline/timeline";
import { professionalTimeline, educationTimeline } from "@/data/timeline-data";
import { SkillsSection } from "@/components/skills/skills-cloud";
import { ProjectVisual, type VisualName } from "@/components/visuals/project-visual";

function ProfessionalTimeline() {
  return <Timeline entries={professionalTimeline} variant="work" />;
}

function EducationTimeline() {
  return <Timeline entries={educationTimeline} variant="education" />;
}

function SkillsComponent() {
  return <SkillsSection />;
}

function PaperVisual({ name }: { name: VisualName }) {
  return <ProjectVisual name={name} className="not-prose my-6 max-w-md" />;
}

function Abstract({ children }: { children: ReactNode }) {
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-mono text-sm text-cyan-700 dark:text-cyan-300 [&::-webkit-details-marker]:hidden">
        Read abstract
        <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      {children}
    </details>
  );
}

export const metadata = {
  title: "About",
  description: "Nitin Nataraj's engineering background, skills, research, and experience.",
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
    SkillsComponent,
    PaperVisual,
    Abstract,
  });

  return (
    <div className="technical-grid min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16 md:px-10 md:pb-20 md:pt-24">
        <p className="mb-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-300 dark:shadow-[0_0_16px_#6ee7b7]" />
          Senior Software Engineer · GenAI
        </p>
        <h1 className="max-w-5xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] sm:text-7xl md:text-8xl">
          Production AI,<br /><span className="text-cyan-700 dark:text-cyan-300">engineered</span> end to end.
        </h1>
        <p className="mt-10 max-w-3xl font-serif text-xl leading-relaxed text-muted-foreground">
          Agent systems, retrieval pipelines, memory architectures, and the evaluation and platform work required to run them with confidence.
        </p>
      </section>
      <article className="prose prose-neutral mx-auto max-w-4xl px-5 pb-20 prose-headings:font-serif prose-headings:tracking-tight prose-a:text-cyan-700 dark:prose-invert dark:prose-a:text-cyan-300 [&>h1:first-child]:hidden md:px-10">
        <MDXContent />
      </article>
    </div>
  );
}
