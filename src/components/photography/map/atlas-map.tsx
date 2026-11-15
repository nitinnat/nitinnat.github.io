"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { geoCentroid, geoContains, geoDistance } from "d3-geo";
import type { GeoPhoto, Place } from "@/lib/photo-geo";
import { FlatMap, type Region } from "./flat-map";
import {
  EASE_OUT,
  PhotoBloom,
  PlaceStrip,
  WORLD_VIEW,
  pathFor,
  placeDates,
  project,
  usePhotoLightbox,
  useVisitedRegions,
  useWorldShapes,
  viewForBounds,
  type ViewBox,
} from "./map-shared";

interface Bloom {
  key: string;
  // A point on the map, or a fixed position in the map container (for regions without photos).
  anchor: [number, number] | { x: number; y: number };
  photos: GeoPhoto[];
  caption: string;
}

const EARTH_KM = 6371;

export function AtlasMap({ places, initialFocus = null }: { places: Place[]; initialFocus?: Place | null }) {
  const shapes = useWorldShapes();
  const visited = useVisitedRegions(places, shapes);
  const lightbox = usePhotoLightbox();
  const [view, setView] = useState<ViewBox>(() =>
    initialFocus ? viewForBounds([project(initialFocus), project(initialFocus)], 150) : WORLD_VIEW,
  );
  const [selected, setSelected] = useState<Place | null>(initialFocus);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [bloom, setBloom] = useState<Bloom | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const keepOpen = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    keepOpen();
    closeTimer.current = window.setTimeout(() => {
      setBloom(null);
      setHighlighted(null);
    }, 220);
  };

  const placesIn = (region: Region) => places.filter((p) => geoContains(region, [p.lng, p.lat]));

  const showPlace = (place: Place) => {
    keepOpen();
    setBloom({ key: place.id, anchor: project(place), photos: place.photos, caption: `${place.name} · ${placeDates(place)}` });
  };

  const showRegion = (region: Region, pointer: { x: number; y: number }) => {
    keepOpen();
    setHighlighted(region.properties.name);
    const inside = placesIn(region);
    if (inside.length > 0) {
      const photos = inside.flatMap((p) => p.photos);
      const anchor = project(inside.reduce((a, b) => (b.photos.length > a.photos.length ? b : a)));
      setBloom({ key: region.properties.name, anchor, photos, caption: `${region.properties.name} · ${photos.length} photos` });
      return;
    }
    // No photos here: surface the nearest place instead.
    const centre = geoCentroid(region);
    const nearest = places.reduce((a, b) =>
      geoDistance(centre, [b.lng, b.lat]) < geoDistance(centre, [a.lng, a.lat]) ? b : a,
    );
    const km = Math.round(geoDistance(centre, [nearest.lng, nearest.lat]) * EARTH_KM);
    setBloom({ key: region.properties.name, anchor: pointer, photos: nearest.photos.slice(0, 3), caption: `Nearest: ${nearest.name} · ${km.toLocaleString()} km` });
  };

  const focusPlace = (place: Place) => {
    setSelected(place);
    setBloom(null);
    setView(viewForBounds([project(place), project(place)], 150));
  };

  const focusRegion = (region: Region) => {
    const inside = placesIn(region);
    if (inside.length === 0) return;
    setSelected(inside.reduce((a, b) => (b.photos.length > a.photos.length ? b : a)));
    setBloom(null);
    setView(viewForBounds(pathFor.bounds(region)));
  };

  if (!shapes) return <div className="aspect-[960/500] w-full animate-pulse rounded-xl bg-muted/40" />;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {places.length} places · hover to preview, click to explore
        </p>
        <button
          type="button"
          onClick={() => {
            setView(WORLD_VIEW);
            setSelected(null);
          }}
          className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          disabled={view === WORLD_VIEW}
        >
          World view
        </button>
      </div>
      <FlatMap
        shapes={shapes}
        visited={visited}
        view={view}
        initialView={initialFocus ? WORLD_VIEW : undefined}
        highlighted={highlighted}
        onRegionEnter={showRegion}
        onRegionLeave={scheduleClose}
        onRegionClick={focusRegion}
        overlay={(toScreen) => (
          <div onPointerEnter={keepOpen} onPointerLeave={scheduleClose}>
            <AnimatePresence>
              {bloom && (() => {
                const { x, y } = Array.isArray(bloom.anchor) ? toScreen(bloom.anchor) : bloom.anchor;
                return (
                  <motion.div key={bloom.key} className="absolute" style={{ left: x, top: y }} exit={{ opacity: 1 }}>
                    <PhotoBloom
                      photos={bloom.photos}
                      caption={bloom.caption}
                      direction={y < 180 ? "down" : "up"}
                      onOpen={(photo) => lightbox.open(bloom.photos, photo)}
                    />
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        )}
      >
        {(scale) =>
          places.map((place) => {
            const [x, y] = project(place);
            const r = (3 + Math.min(place.photos.length, 8) * 0.4) * scale;
            return (
              <g key={place.id} className="cursor-pointer" onPointerEnter={() => showPlace(place)} onPointerLeave={scheduleClose} onClick={() => focusPlace(place)}>
                <motion.circle cx={x} cy={y} initial={false} animate={{ r: r * 2.6 }} transition={{ duration: 0.9, ease: EASE_OUT }} className="fill-transparent" />
                <motion.circle
                  cx={x}
                  cy={y}
                  initial={false}
                  animate={{ r }}
                  transition={{ duration: 0.9, ease: EASE_OUT }}
                  className={selected?.id === place.id ? "fill-foreground" : "fill-cyan-700 dark:fill-cyan-300"}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })
        }
      </FlatMap>
      <PlaceStrip place={selected} onOpen={(photo) => selected && lightbox.open(selected.photos, photo)} />
      {lightbox.element}
    </div>
  );
}
