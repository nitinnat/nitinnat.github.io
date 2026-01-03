"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TimelineProps } from "./timeline-types";
import { TimelineEntryCard } from "./timeline-entry";

export function Timeline({ entries, className, variant = "work" }: TimelineProps) {
  const reduceMotion = useReducedMotion();

  const containerVariants: Variants | undefined = reduceMotion
    ? undefined
    : {
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.05, delayChildren: 0.05 }
        }
      };

  return (
    <motion.div
      className={cn("relative", className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <TimelineEntryCard
            key={entry.id}
            entry={entry}
            index={index}
            variant={variant}
          />
        ))}
      </div>
    </motion.div>
  );
}
