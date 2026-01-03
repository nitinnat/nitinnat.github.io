"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "./timeline-types";
import { SkillBadges } from "./skill-badges";

interface TimelineEntryCardProps {
  entry: TimelineEntry;
  index: number;
  variant?: "work" | "education";
}

export function TimelineEntryCard({ entry, index, variant = "work" }: TimelineEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  const variants: Variants | undefined = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      };

  return (
    <motion.div
      variants={variants}
      className="relative grid grid-cols-[20px_1fr] gap-4 pb-6 md:pb-8"
    >
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <motion.div
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center border-2",
            variant === "education"
              ? "bg-background border-emerald-500"
              : "bg-background border-primary"
          )}
          initial={reduceMotion ? {} : { scale: 0 }}
          whileInView={reduceMotion ? {} : { scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05, duration: 0.3, type: "spring", stiffness: 120 }}
        >
          <motion.div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              variant === "education" ? "bg-emerald-500" : "bg-primary"
            )}
            initial={reduceMotion ? {} : { scale: 0 }}
            whileInView={reduceMotion ? {} : { scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 + 0.1, duration: 0.2 }}
          />
        </motion.div>
        <div
          className={cn(
            "w-0.5 flex-1 mt-2",
            variant === "education"
              ? "bg-gradient-to-b from-emerald-500/30 to-transparent"
              : "bg-gradient-to-b from-primary/30 to-transparent"
          )}
        />
      </div>

      {/* Content */}
      <motion.article
        className={cn(
          "rounded-md transition-all duration-300 relative overflow-hidden group",
          "grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 md:gap-4",
          entry.image ? "items-start" : "",
          !entry.backgroundImage && "bg-card/40 hover:bg-card/60",
          variant === "education"
            ? "border border-emerald-500/10 hover:border-emerald-500/20 focus-within:ring-2 focus-within:ring-emerald-500/50"
            : "border border-primary/10 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/50"
        )}
        initial={reduceMotion ? {} : { opacity: 0, x: 10 }}
        whileInView={reduceMotion ? {} : { opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 + 0.05, duration: 0.5 }}
        whileHover={reduceMotion ? {} : { x: 4 }}
        style={entry.backgroundImage ? { backgroundColor: "hsl(var(--card))" } : {}}
      >
        {/* Background image layer for education entries */}
        {entry.backgroundImage && (
          <motion.div
            className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
            style={{
              backgroundImage: `url('${entry.backgroundImage}')`
            }}
            initial={false}
          />
        )}

        {/* Image on the left (only on md+ screens if present) */}
        {entry.image && (
          <figure className="md:flex md:flex-col md:w-56 md:flex-shrink-0 relative z-10">
            <motion.img
              src={entry.image.src}
              alt={entry.image.alt}
              className="rounded h-32 md:h-40 w-full md:w-56 object-cover"
              loading="lazy"
              initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              whileInView={reduceMotion ? {} : { opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 + 0.15, duration: 0.4 }}
            />
            {entry.image.caption && (
              <figcaption className="text-xs text-muted-foreground mt-1 hidden md:block">
                {entry.image.caption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Right side content */}
        <div className="p-3 md:p-4 flex flex-col w-full relative z-10">
          {/* Compact header */}
          <header className="mb-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="font-semibold text-sm md:text-base text-foreground">{entry.title}</h3>
              <p className="text-muted-foreground text-xs">
                {entry.company}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{entry.dateRange}</p>
            {entry.skills && <SkillBadges skillIds={entry.skills} />}
          </header>

          {/* Description */}
          <p className="text-xs md:text-sm text-foreground/80 leading-relaxed mb-2">
            {entry.description}
          </p>

          {/* More button */}
          {entry.expandedContent && (
            <button
              onClick={() => setExpanded(true)}
              className={cn(
                "inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80",
                "transition-colors font-medium"
              )}
              aria-expanded={expanded}
            >
              More
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          {/* Link */}
          {entry.link && (
            <a
              href={entry.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-2 inline-block text-xs font-medium text-primary hover:text-primary/80",
                "transition-colors"
              )}
            >
              {entry.link.label} ↗
            </a>
          )}
        </div>
      </motion.article>

      {/* Modal backdrop and content */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl max-h-[90vh] overflow-y-auto z-50"
            >
              <div className={cn(
                "bg-card rounded-lg border p-4 md:p-8",
                variant === "education"
                  ? "border-emerald-500/20"
                  : "border-primary/20"
              )}>
                {/* Close button */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1" />
                  <button
                    onClick={() => setExpanded(false)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal header */}
                <div className="mb-6 pr-2">
                  <h2 className="text-lg md:text-2xl font-bold text-foreground mb-1">{entry.title}</h2>
                  <p className="text-muted-foreground text-xs md:text-sm">{entry.company} • {entry.dateRange}</p>
                  {entry.skills && <SkillBadges skillIds={entry.skills} className="mt-3" />}
                </div>

                {/* Modal image - larger */}
                {entry.image && (
                  <figure className="mb-6">
                    <motion.img
                      src={entry.image.src}
                      alt={entry.image.alt}
                      className="rounded-lg w-full h-64 md:h-80 object-cover"
                      initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                      animate={reduceMotion ? {} : { opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    />
                    {entry.image.caption && (
                      <figcaption className="text-sm text-muted-foreground mt-2">
                        {entry.image.caption}
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* Main description */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">Overview</h3>
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                    {entry.description}
                  </p>
                </div>

                {/* Expanded content */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">Details</h3>
                  <p className="text-sm md:text-base text-foreground/70 leading-relaxed whitespace-pre-wrap">
                    {entry.expandedContent}
                  </p>
                </div>

                {/* Link */}
                {entry.link && (
                  <div className="pt-4 border-t border-primary/10">
                    <a
                      href={entry.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {entry.link.label} ↗
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
