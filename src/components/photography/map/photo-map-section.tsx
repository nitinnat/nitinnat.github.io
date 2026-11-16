"use client";

import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/photo-geo";
import { AtlasMap } from "./atlas-map";

// The map's rounded game-map face, self-hosted so builds never depend on Google Fonts.
const mapFont = localFont({
  src: "../../../../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2",
  weight: "200 1000",
  variable: "--font-map",
});

export function PhotoMapSection({ places }: { places: Place[] }) {
  if (places.length === 0) return null;

  return (
    <section className={cn("container mx-auto max-w-6xl px-4 pb-6 pt-12", mapFont.variable)}>
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Routes travelled so far</p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight text-foreground md:text-4xl">Everywhere the camera&apos;s been</h2>
      </div>
      <AtlasMap places={places} />
    </section>
  );
}
