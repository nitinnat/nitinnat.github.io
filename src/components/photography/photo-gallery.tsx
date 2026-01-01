"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Slide } from "yet-another-react-lightbox";
import { PhotoLightbox } from "./photo-lightbox";

export interface PhotoItem {
  id: string;
  thumb?: string;
  full?: string;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  tags?: string[];
}

interface PhotoGalleryProps {
  items: PhotoItem[];
}

export function PhotoGallery({ items }: PhotoGalleryProps) {
  const [index, setIndex] = useState(-1);
  const reduceMotion = useReducedMotion();

  const validItems = useMemo(
    () => items.filter((item) => item.full || item.thumb),
    [items]
  );

  const slides = useMemo<Slide[]>(
    () =>
      validItems.map((item) => ({
        src: item.full || item.thumb || "",
        width: item.width,
        height: item.height,
        alt: item.alt,
      })),
    [validItems]
  );

  if (validItems.length === 0) return null;

  const revealProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <section className="mt-10">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
        {validItems.map((item, itemIndex) => {
          const src = item.thumb || item.full;
          return (
            <motion.button
              key={item.id}
              type="button"
              className="mb-4 break-inside-avoid rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              onClick={() => setIndex(itemIndex)}
              aria-label={item.alt ? `Open ${item.alt}` : "Open photo"}
              data-tags={item.tags?.join(",") || undefined}
              {...revealProps}
            >
              <img
                src={src}
                alt={item.alt || ""}
                loading="lazy"
                className="w-full h-auto rounded-lg shadow-sm transition-transform duration-300 hover:scale-[1.02]"
              />
            </motion.button>
          );
        })}
      </div>

      <PhotoLightbox slides={slides} index={index} onClose={() => setIndex(-1)} />
    </section>
  );
}
