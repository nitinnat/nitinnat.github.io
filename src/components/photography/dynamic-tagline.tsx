"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface DynamicTaglineProps {
  phrases: string[];
  intervalMs?: number;
}

export function DynamicTagline({
  phrases,
  intervalMs = 3200,
}: DynamicTaglineProps) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (phrases.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [phrases, intervalMs]);

  if (phrases.length === 0) return null;

  return (
    <div className="mt-14 text-center">
      <p className="text-lg sm:text-2xl font-semibold tracking-wide text-foreground">
        COME FOR THE PHOTOS, STAY FOR THE{" "}
        <span className="inline-flex min-w-[10ch]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.span
              key={phrases[index]}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="ml-2"
            >
              {phrases[index]}
            </motion.span>
          </AnimatePresence>
        </span>
      </p>
    </div>
  );
}
