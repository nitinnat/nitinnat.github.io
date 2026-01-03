"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { skillsData, type Skill, skillCategories } from "@/data/skills-data";

const categoryColors: Record<string, { bg: string; bar: string; glow: string }> = {
  frontend: { bg: "from-blue-500/20 to-cyan-500/20", bar: "from-blue-400 to-cyan-400", glow: "0 0 12px rgba(59, 130, 246, 0.5)" },
  backend: { bg: "from-purple-500/20 to-pink-500/20", bar: "from-purple-400 to-pink-400", glow: "0 0 12px rgba(168, 85, 247, 0.5)" },
  ml: { bg: "from-amber-500/20 to-orange-500/20", bar: "from-amber-400 to-orange-400", glow: "0 0 12px rgba(251, 146, 60, 0.5)" },
  tools: { bg: "from-emerald-500/20 to-teal-500/20", bar: "from-emerald-400 to-teal-400", glow: "0 0 12px rgba(16, 185, 129, 0.5)" },
  domain: { bg: "from-rose-500/20 to-red-500/20", bar: "from-rose-400 to-red-400", glow: "0 0 12px rgba(244, 63, 94, 0.5)" },
};

interface SkillBarProps {
  name: string;
  proficiency: number;
  category: string;
  index: number;
}

function SkillBar({ name, proficiency, category, index }: SkillBarProps) {
  const reduceMotion = useReducedMotion();
  const percentage = (proficiency / 5) * 100;
  const colors = categoryColors[category] || categoryColors.tools;

  const variants: Variants | undefined = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0, x: -20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      };

  return (
    <motion.div
      variants={variants}
      className="group"
    >
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-xs font-medium text-foreground truncate group-hover:text-foreground transition-colors">
          {name}
        </span>
        <span className="text-xs font-semibold whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
          {proficiency}/5
        </span>
      </div>

      {/* Bar background */}
      <div className={`h-2.5 rounded-full overflow-hidden bg-gradient-to-r ${colors.bg}`}>
        {/* Animated bar fill */}
        <motion.div
          className={`h-full bg-gradient-to-r ${colors.bar} rounded-full`}
          initial={reduceMotion ? {} : { width: 0 }}
          whileInView={reduceMotion ? {} : { width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{
            delay: index * 0.03,
            duration: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          whileHover={reduceMotion ? {} : { boxShadow: colors.glow }}
        />
      </div>
    </motion.div>
  );
}

interface SkillCategorySectionProps {
  category: keyof typeof skillCategories;
  skills: Skill[];
  sectionIndex: number;
}

function SkillCategorySection({ category, skills, sectionIndex }: SkillCategorySectionProps) {
  const reduceMotion = useReducedMotion();

  const containerVariants: Variants | undefined = reduceMotion
    ? undefined
    : {
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.03, delayChildren: 0.08 }
        }
      };

  return (
    <motion.div
      initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ delay: sectionIndex * 0.1, duration: 0.5 }}
      className="space-y-2.5"
    >
      <h4 className="text-xs font-bold uppercase tracking-widest opacity-70">
        {skillCategories[category]}
      </h4>

      <motion.div
        className="space-y-2"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        {skills.map((skill, i) => (
          <SkillBar
            key={skill.id}
            name={skill.name}
            proficiency={skill.proficiency}
            category={category}
            index={i}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

export function SkillsBars() {
  const reduceMotion = useReducedMotion();

  // Group skills by category and sort by proficiency (descending)
  const skillsByCategory = Object.keys(skillCategories).reduce((acc, cat) => {
    const categorySkills = skillsData
      .filter((s) => s.category === cat)
      .sort((a, b) => b.proficiency - a.proficiency);
    if (categorySkills.length > 0) {
      acc[cat as keyof typeof skillCategories] = categorySkills;
    }
    return acc;
  }, {} as Record<keyof typeof skillCategories, Skill[]>);

  return (
    <motion.div
      initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5">
          Expertise
        </h3>
      </div>

      {Object.entries(skillsByCategory).map(([category, skills], idx) => (
        <SkillCategorySection
          key={category}
          category={category as keyof typeof skillCategories}
          skills={skills}
          sectionIndex={idx}
        />
      ))}
    </motion.div>
  );
}
