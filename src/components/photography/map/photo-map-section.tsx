"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/photo-geo";
import { AtlasMap } from "./atlas-map";
import { GlobeMap } from "./globe-map";
import { JourneyMap } from "./journey-map";
import { GlobeAtlasMap } from "./globe-atlas-map";

const variants = {
  atlas: { label: "1 · Atlas", summary: "Flat map. Hover a place or state and its photos fan out; click to zoom in.", Map: AtlasMap },
  globe: { label: "2 · Globe", summary: "Spinning dotted globe. Hover a pin to pause and fan out photos; click to turn there.", Map: GlobeMap },
  journey: { label: "3 · Journey", summary: "Trips in date order: the camera follows each leg as the route draws.", Map: JourneyMap },
  hybrid: { label: "4 · Globe → Atlas", summary: "Globe with journey arcs; picking a place flies into the flat map.", Map: GlobeAtlasMap },
};

type Variant = keyof typeof variants;
const order: Variant[] = ["atlas", "globe", "journey", "hybrid"];

export function PhotoMapSection({ places }: { places: Place[] }) {
  const [variant, setVariant] = useState<Variant>("atlas");
  const { Map, summary } = variants[variant];

  if (places.length === 0) return null;

  return (
    <section className="container mx-auto max-w-6xl px-4 pb-6 pt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Where these were taken</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">The map</h2>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="max-w-md rounded-xl border border-dashed border-border p-2 font-mono text-xs">
            <div className="flex flex-wrap gap-1">
              {order.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={variant === key}
                  onClick={() => setVariant(key)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 transition-colors",
                    variant === key ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {variants[key].label}
                </button>
              ))}
            </div>
            <p className="px-1 pt-2 leading-relaxed text-muted-foreground">{summary}</p>
          </div>
        )}
      </div>
      <Map key={variant} places={places} />
    </section>
  );
}
