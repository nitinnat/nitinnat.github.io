"use client";

import { skillsData, skillCategories } from "@/data/skills-data";
import { skillIcons } from "./skill-icons";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, { border: string; borderMuted: string; text: string; textMuted: string; bg: string }> = {
  frontend: { border: "border-l-blue-500", borderMuted: "border-l-slate-300", text: "text-blue-400", textMuted: "text-slate-400", bg: "hover:bg-blue-500/10" },
  backend: { border: "border-l-purple-500", borderMuted: "border-l-slate-300", text: "text-purple-400", textMuted: "text-slate-400", bg: "hover:bg-purple-500/10" },
  ml: { border: "border-l-amber-500", borderMuted: "border-l-slate-300", text: "text-amber-400", textMuted: "text-slate-400", bg: "hover:bg-amber-500/10" },
  tools: { border: "border-l-emerald-500", borderMuted: "border-l-slate-300", text: "text-emerald-400", textMuted: "text-slate-400", bg: "hover:bg-emerald-500/10" },
  domain: { border: "border-l-rose-500", borderMuted: "border-l-slate-300", text: "text-rose-400", textMuted: "text-slate-400", bg: "hover:bg-rose-500/10" },
};

export function SkillsSection() {
  const groupedSkills = skillsData.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, (typeof skillsData)[number][]>
  );

  return (
    <div className="space-y-8 my-12">
      <p className="mb-6 text-xs text-muted-foreground">
        <span className="font-medium">Legend:</span> Skills marked with <span className="font-semibold">*</span> are skills I haven&apos;t actively worked with in a while.
      </p>
      {Object.entries(groupedSkills).map(([category, skills]) => {
        const colors = categoryColors[category] || categoryColors.tools;

        return (
          <div key={category}>
            <h3
              className={cn(
                "font-serif text-xl tracking-tight mb-6 pb-2 border-l-4 pl-3",
                colors.border,
                colors.text
              )}
            >
              {skillCategories[category as keyof typeof skillCategories]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {skills.map((skill) => {
                const Icon = skillIcons[skill.id];
                const isHighProficiency = skill.proficiency >= 3;
                const skillBorder = isHighProficiency ? colors.border : colors.borderMuted;
                const skillText = isHighProficiency ? colors.text : colors.textMuted;

                return (
                  <div
                    key={skill.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 border-r border-t border-b border-border transition-all duration-200",
                      colors.bg,
                      skillBorder
                    )}
                  >
                    <Icon className={cn("w-5 h-5 flex-shrink-0", skillText)} />
                    <span className="text-sm font-medium text-foreground">
                      {skill.name}
                      {!isHighProficiency && <span className="font-bold text-foreground ml-1">*</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Keep SkillsCloud as alias for backward compatibility
export const SkillsCloud = SkillsSection;
