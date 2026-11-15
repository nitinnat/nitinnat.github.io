"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe2 } from "lucide-react";
import type { Place } from "@/lib/photo-geo";
import { AtlasMap } from "./atlas-map";
import { GlobeMap } from "./globe-map";
import { EASE_OUT } from "./map-shared";

// Starts on the globe with the journey drawn as arcs; choosing a place hands off to the flat map
// zoomed into that region.
export function GlobeAtlasMap({ places }: { places: Place[] }) {
  const [focus, setFocus] = useState<Place | null>(null);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {focus ? (
        <motion.div
          key="atlas"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <button
            type="button"
            onClick={() => setFocus(null)}
            className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Globe2 className="size-4" /> Back to globe
          </button>
          <AtlasMap places={places} initialFocus={focus} />
        </motion.div>
      ) : (
        <motion.div
          key="globe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.12 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <p className="mb-2 text-center font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Drag to spin · click a place to fly in
          </p>
          <GlobeMap places={places} showArcs onSelect={setFocus} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
