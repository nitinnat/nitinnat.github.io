import { getPageBySlug } from "@/lib/content";
import { compileMDX } from "@/lib/mdx";
import { Timeline } from "@/components/timeline/timeline";
import { professionalTimeline, educationTimeline } from "@/data/timeline-data";
import { SkillsSection } from "@/components/skills/skills-cloud";

function ProfessionalTimeline() {
  return <Timeline entries={professionalTimeline} variant="work" />;
}

function EducationTimeline() {
  return <Timeline entries={educationTimeline} variant="education" />;
}

function SkillsComponent() {
  return <SkillsSection />;
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
    SkillsComponent,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <MDXContent />
      </article>
    </div>
  );
}
