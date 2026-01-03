"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { skillsData, skillCategories } from "@/data/skills-data";

interface SkillCardProps {
  name: string;
  proficiency: number;
  index: number;
}

function SkillCard({ name, proficiency, index }: SkillCardProps) {
  const reduceMotion = useReducedMotion();

  const variants: Variants | undefined = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      };

  const getColor = () => {
    switch (proficiency) {
      case 5:
        return "from-primary via-primary/80 to-primary/60";
      case 4:
        return "from-primary/90 via-primary/70 to-primary/50";
      default:
        return "from-primary/70 via-primary/50 to-primary/30";
    }
  };

  return (
    <motion.div variants={variants} className="group">
      <div className="relative h-24 rounded-xl overflow-hidden cursor-default">
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getColor()} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-3 text-center">
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-foreground group-hover:text-background transition-colors duration-300 line-clamp-2">
              {name}
            </h4>
          </div>

          {/* Proficiency bar */}
          <div className="w-full flex gap-0.5 justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i <= proficiency
                    ? "bg-primary group-hover:bg-background/80"
                    : "bg-primary/20 group-hover:bg-background/30"
                }`}
                initial={reduceMotion ? {} : { scaleX: 0 }}
                whileInView={reduceMotion ? {} : { scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 + i * 0.05, duration: 0.3 }}
              />
            ))}
          </div>

          {/* Proficiency text */}
          <p className="text-xs text-muted-foreground group-hover:text-background/70 transition-colors duration-300 mt-1.5 font-medium">
            {proficiency}/5
          </p>
        </div>

        {/* Border */}
        <div className="absolute inset-0 rounded-xl border border-primary/20 group-hover:border-primary/50 transition-colors duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
}

interface SkillCategoryProps {
  category: keyof typeof skillCategories;
  index: number;
}

function SkillCategory({ category, index }: SkillCategoryProps) {
  const reduceMotion = useReducedMotion();
  const skills = skillsData.filter((s) => s.category === category);

  const containerVariants: Variants | undefined = reduceMotion
    ? undefined
    : {
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.04, delayChildren: 0.02 }
        }
      };

  return (
    <motion.div
      initial={reduceMotion ? {} : { opacity: 0, y: 15 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <h3 className="text-xs font-bold text-primary/80 mb-3 uppercase tracking-widest">
        {skillCategories[category]}
      </h3>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {skills.map((skill, i) => (
          <SkillCard
            key={skill.id}
            name={skill.name}
            proficiency={skill.proficiency}
            index={i}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

export function SkillsGrid() {
  const categories = Object.keys(skillCategories) as Array<
    keyof typeof skillCategories
  >;

  return (
    <div className="space-y-8">
      {categories.map((category, index) => (
        <SkillCategory key={category} category={category} index={index} />
      ))}
    </div>
  );
}
