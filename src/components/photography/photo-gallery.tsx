"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Slide } from "yet-another-react-lightbox";
import { MapPin, Calendar } from "lucide-react";
import { PhotoLightbox } from "./photo-lightbox";

interface MetadataOverlayProps {
  location?: string;
  date?: string;
}

function MetadataOverlay({ location, date }: MetadataOverlayProps) {
  if (!location && !date) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
      {location && (
        <div className="flex items-start gap-2 text-white text-xs mb-1">
          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>
      )}
      {date && (
        <div className="flex items-start gap-2 text-white text-xs">
          <Calendar className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{date}</span>
        </div>
      )}
    </div>
  );
}

export interface PhotoItem {
  id: string;
  thumb?: string;
  full?: string;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  tags?: string[];
  location?: string;
  date?: string;
  tagged?: boolean;
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
      validItems.map((item) => {
        const parts: string[] = [];
        if (item.location) parts.push(item.location);
        if (item.date) parts.push(item.date);
        const description = parts.length > 0 ? parts.join(" • ") : undefined;

        return {
          src: item.full || item.thumb || "",
          width: item.width,
          height: item.height,
          alt: item.alt,
          description,
        };
      }),
    [validItems]
  );

  if (validItems.length === 0) return null;

  const revealProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.5 },
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
              className="mb-4 break-inside-avoid rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 relative group"
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
              <MetadataOverlay location={item.location} date={item.date} />
            </motion.button>
          );
        })}
      </div>

      <PhotoLightbox slides={slides} index={index} onClose={() => setIndex(-1)} />
    </section>
  );
}
