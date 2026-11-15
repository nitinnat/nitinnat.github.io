"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimate, useInView, useReducedMotion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "./timeline-types";
import { SkillBadges } from "./skill-badges";
import { ProjectVisual } from "@/components/visuals/project-visual";

interface TimelineEntryCardProps {
  entry: TimelineEntry;
  index: number;
  variant?: "work" | "education";
}

export function TimelineEntryCard({ entry, index, variant = "work" }: TimelineEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  // Hover-only photos are fetched on first hover; loading them eagerly delays the window
  // load event, which is when the project visuals' SVG animation clock starts.
  const [backgroundRequested, setBackgroundRequested] = useState(false);
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [cardRef, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(cardRef, { once: true, margin: "0px 0px -60px 0px" });
  const deferred = useRef(false);

  // Cards render visible; only those still below the fold at mount wait to be revealed,
  // so a card scrolled past before hydration can never get stuck hidden.
  useEffect(() => {
    if (reduceMotion) return;
    const card = cardRef.current;
    if (!inView && !deferred.current && card.getBoundingClientRect().top > window.innerHeight) {
      deferred.current = true;
      animate(card, { opacity: 0, y: 12 }, { duration: 0 });
    } else if (inView && deferred.current) {
      animate(card, { opacity: 1, y: 0 }, { duration: 0.5, ease: [0.23, 1, 0.32, 1] });
    }
  }, [inView, reduceMotion, animate, cardRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (expanded && !dialog.open) dialog.showModal();
    if (!expanded && dialog.open) dialog.close();
  }, [expanded]);

  const closeDialog = () => {
    setExpanded(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={cardRef} className="relative grid grid-cols-[20px_1fr] gap-4 pb-6 md:pb-8">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center border-2",
            variant === "education"
              ? "bg-background border-emerald-500"
              : "bg-background border-primary"
          )}
        >
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              variant === "education" ? "bg-emerald-500" : "bg-primary"
            )}
          />
        </div>
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
      <article
        className={cn(
          "rounded-md transition-colors duration-300 relative overflow-hidden group",
          "grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 md:gap-4",
          (entry.visual || entry.image) && "items-start",
          entry.backgroundImage ? "bg-card" : "bg-card/40 hover:bg-card/60",
          variant === "education"
            ? "border border-emerald-500/10 hover:border-emerald-500/20 focus-within:ring-2 focus-within:ring-emerald-500/50"
            : "border border-primary/10 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/50"
        )}
        onPointerEnter={entry.backgroundImage ? () => setBackgroundRequested(true) : undefined}
      >
        {/* Background image layer for education entries */}
        {entry.backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
            style={backgroundRequested ? { backgroundImage: `url('${entry.backgroundImage}')` } : undefined}
          />
        )}

        {entry.visual ? (
          <ProjectVisual name={entry.visual} className="relative z-10 m-3 mb-0 md:mb-3 md:mr-0 md:w-64 md:flex-shrink-0" />
        ) : entry.image && (
          <figure className="md:flex md:flex-col md:w-56 md:flex-shrink-0 relative z-10">
            <img
              src={entry.image.src}
              alt={entry.image.alt}
              className="rounded h-32 md:h-40 w-full md:w-56 object-cover"
              loading="lazy"
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
              ref={triggerRef}
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
      </article>

      <dialog
        ref={dialogRef}
        aria-labelledby={`timeline-dialog-${variant}-${index}`}
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg bg-transparent p-0 backdrop:bg-black/55 backdrop:backdrop-blur-sm"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
      >
        <div className={cn(
          "rounded-lg border bg-card p-4 shadow-2xl md:p-8",
          variant === "education" ? "border-emerald-500/20" : "border-primary/20"
        )}>
                {/* Close button */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1" />
                  <button
                    onClick={closeDialog}
                    className="inline-flex size-11 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal header */}
                <div className="mb-6 pr-2">
                  <h2 id={`timeline-dialog-${variant}-${index}`} className="text-lg md:text-2xl font-bold text-foreground mb-1">{entry.title}</h2>
                  <p className="text-muted-foreground text-xs md:text-sm">{entry.company} • {entry.dateRange}</p>
                  {entry.skills && <SkillBadges skillIds={entry.skills} className="mt-3" />}
                </div>

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
      </dialog>
    </div>
  );
}
