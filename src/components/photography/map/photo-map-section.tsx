"use client";

import { Nunito } from "next/font/google";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/photo-geo";
import { AtlasMap } from "./atlas-map";

// The map's rounded game-map face, loaded only with this section.
const mapFont = Nunito({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-map" });

export function PhotoMapSection({ places }: { places: Place[] }) {
  if (places.length === 0) return null;

  return (
    <section className={cn("container mx-auto max-w-6xl px-4 pb-6 pt-12", mapFont.variable)}>
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Where these were taken</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">The map</h2>
      </div>
      <AtlasMap places={places} />
    </section>
  );
}
