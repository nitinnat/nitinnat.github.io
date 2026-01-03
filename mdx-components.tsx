import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/mdx/code-block";
import { Mermaid } from "@/components/mdx/mermaid";
import { SkillsGrid } from "@/components/skills/skills-grid";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: CodeBlock,
    Mermaid,
    SkillsGrid,
    ...components,
  };
}
