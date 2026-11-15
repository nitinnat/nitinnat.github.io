import { skillsData, type SkillId } from "@/data/skills-data";
import { skillIcons } from "@/components/skills/skill-icons";
import { cn } from "@/lib/utils";

// Map category to color
const categoryColors: Record<string, { text: string; bg: string }> = {
  frontend: { text: "text-blue-400", bg: "hover:bg-blue-500/20" },
  backend: { text: "text-purple-400", bg: "hover:bg-purple-500/20" },
  ml: { text: "text-amber-400", bg: "hover:bg-amber-500/20" },
  tools: { text: "text-emerald-400", bg: "hover:bg-emerald-500/20" },
  domain: { text: "text-rose-400", bg: "hover:bg-rose-500/20" },
};

interface SkillBadgesProps {
  skillIds?: SkillId[];
  className?: string;
  showLabels?: boolean;
}

export function SkillBadges({ skillIds = [], className, showLabels = false }: SkillBadgesProps) {
  if (!skillIds.length) return null;

  const skills = skillsData.filter((s) => skillIds.includes(s.id));

  return (
    <div className={cn("flex flex-wrap gap-3 mt-3", className)}>
      {skills.map((skill) => {
        const Icon = skillIcons[skill.id];
        const colors = categoryColors[skill.category];

        return (
          <span
            key={skill.id}
            title={skill.name}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg p-2 transition-colors",
              colors.bg,
            )}
          >
            <Icon aria-hidden="true" className={cn("h-5 w-5", colors.text)} />
            {showLabels && <span className="text-xs text-muted-foreground">{skill.name}</span>}
          </span>
        );
      })}
    </div>
  );
}
