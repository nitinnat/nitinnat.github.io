import { skillsData } from "@/data/skills-data";
import { cn } from "@/lib/utils";

// Import icons from react-icons
import {
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiNextdotjs,
  SiFramer,
  SiPython,
  SiPostgresql,
  SiDocker,
  SiKubernetes,
  SiTensorflow,
  SiPytorch,
  SiScikitlearn,
  SiApachespark,
  SiGit,
  SiGoogle,
  SiElasticsearch,
  SiRedis,
  SiOpencv,
} from "react-icons/si";
import {
  FaDatabase,
  FaNetworkWired,
  FaBrain,
  FaCube,
  FaAws,
  FaCogs,
} from "react-icons/fa";

// Map skill IDs to their icon components
const skillIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  // Frontend
  react: SiReact,
  typescript: SiTypescript,
  tailwindcss: SiTailwindcss,
  "next-js": SiNextdotjs,
  "framer-motion": SiFramer,

  // Backend
  python: SiPython,
  fastapi: FaCogs,
  sql: FaDatabase,
  docker: SiDocker,
  kubernetes: SiKubernetes,

  // ML & GenAI
  "llms-transformers": FaBrain,
  tensorflow: SiTensorflow,
  pytorch: SiPytorch,
  "scikit-learn": SiScikitlearn,
  pyspark: SiApachespark,
  langchain: FaNetworkWired,
  "rag-systems": FaNetworkWired,

  // Tools & Infra
  git: SiGit,
  postgresql: SiPostgresql,
  aws: FaAws,
  gcp: SiGoogle,
  elasticsearch: SiElasticsearch,
  redis: SiRedis,

  // Domain Knowledge
  "computer-vision": SiOpencv,
  nlp: FaBrain,
  "time-series-forecasting": FaCube,
  "federated-learning": FaNetworkWired,
  automl: FaBrain,
};

// Map category to color
const categoryColors: Record<string, { text: string; bg: string }> = {
  frontend: { text: "text-blue-400", bg: "hover:bg-blue-500/20" },
  backend: { text: "text-purple-400", bg: "hover:bg-purple-500/20" },
  ml: { text: "text-amber-400", bg: "hover:bg-amber-500/20" },
  tools: { text: "text-emerald-400", bg: "hover:bg-emerald-500/20" },
  domain: { text: "text-rose-400", bg: "hover:bg-rose-500/20" },
};

interface SkillBadgesProps {
  skillIds?: string[];
  className?: string;
  showLabels?: boolean;
}

export function SkillBadges({ skillIds = [], className, showLabels = false }: SkillBadgesProps) {
  if (!skillIds.length) return null;

  const skills = skillIds
    .map((id) => skillsData.find((s) => s.id === id))
    .filter((s) => s !== undefined);

  if (!skills.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-3 mt-3", className)}>
      {skills.map((skill) => {
        const Icon = skillIcons[skill.id];
        const colors = categoryColors[skill.category] || categoryColors.tools;
        const IconComponent = Icon || SiPython;

        return (
          <span
            key={skill.id}
            title={skill.name}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg p-2 transition-colors",
              colors.bg,
            )}
          >
            <IconComponent aria-hidden="true" className={cn("h-5 w-5", colors.text)} />
            {showLabels && <span className="text-xs text-muted-foreground">{skill.name}</span>}
          </span>
        );
      })}
    </div>
  );
}
