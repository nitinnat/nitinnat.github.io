"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/photo-geo";
import { FlatMap } from "./flat-map";
import {
  PhotoBloom,
  PlaceStrip,
  WORLD_VIEW,
  formatMonth,
  pathFor,
  placeDates,
  project,
  usePhotoLightbox,
  useVisitedRegions,
  useWorldShapes,
  viewForBounds,
} from "./map-shared";

const LEG_SECONDS = 1.4;
const STOP_MS = 3400;

export function JourneyMap({ places }: { places: Place[] }) {
  const shapes = useWorldShapes();
  const visited = useVisitedRegions(places, shapes);
  const lightbox = usePhotoLightbox();
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step >= places.length - 1) setPlaying(false);
      else setStep(step + 1);
    }, step < 0 ? 0 : STOP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, step, places.length]);

  const current = step >= 0 ? places[step] : null;
  const previous = step > 0 ? places[step - 1] : null;
  const view = current
    ? viewForBounds(previous ? boundsOf(project(previous), project(current)) : [project(current), project(current)], 180)
    : WORLD_VIEW;

  const togglePlay = () => {
    if (!playing && step >= places.length - 1) setStep(-1);
    setPlaying(!playing);
  };

  if (!shapes) return <div className="aspect-[960/500] w-full animate-pulse rounded-xl bg-muted/40" />;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? "Pause" : step >= places.length - 1 ? "Replay journey" : step >= 0 ? "Resume" : "Play journey"}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {current ? `${String(step + 1).padStart(2, "0")} / ${String(places.length).padStart(2, "0")}` : `${places.length} stops, in order`}
        </p>
      </div>
      <FlatMap
        shapes={shapes}
        visited={visited}
        view={view}
        duration={LEG_SECONDS}
        overlay={(toScreen) => (
          <AnimatePresence>
            {current && (() => {
              const { x, y } = toScreen(project(current));
              return (
                <motion.div key={current.id} className="absolute" style={{ left: x, top: y }} exit={{ opacity: 1 }}>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: LEG_SECONDS * 0.85 }}>
                    <PhotoBloom
                      photos={current.photos.slice(0, 4)}
                      caption={`${current.name} · ${placeDates(current)}`}
                      direction={y < 180 ? "down" : "up"}
                      onOpen={(photo) => lightbox.open(current.photos, photo)}
                    />
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        )}
      >
        {(scale) => (
          <>
            {places.slice(1).map((place, index) => {
              const leg = index + 1;
              if (leg > step) return null;
              const d = pathFor({ type: "LineString", coordinates: [[places[index].lng, places[index].lat], [place.lng, place.lat]] }) ?? undefined;
              return (
                <motion.path
                  key={place.id}
                  d={d}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  className={leg === step ? "stroke-cyan-700 dark:stroke-cyan-300" : "stroke-cyan-700/45 dark:stroke-cyan-300/40"}
                  strokeWidth={leg === step ? 2 : 1.25}
                  strokeLinecap="round"
                  initial={{ pathLength: leg === step ? 0 : 1 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: LEG_SECONDS, ease: [0.77, 0, 0.175, 1] }}
                />
              );
            })}
            {places.map((place, index) => {
              const [x, y] = project(place);
              const reached = index <= step;
              return (
                <motion.circle
                  key={place.id}
                  cx={x}
                  cy={y}
                  initial={false}
                  animate={{ r: (index === step ? 5 : reached ? 3.5 : 2.5) * scale, opacity: reached || step < 0 ? 1 : 0.35 }}
                  transition={{ duration: LEG_SECONDS, ease: [0.23, 1, 0.32, 1] }}
                  className={index === step ? "fill-foreground" : "fill-cyan-700 dark:fill-cyan-300"}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </>
        )}
      </FlatMap>
      <ol className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {places.map((place, index) => (
          <li key={place.id} className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStep(index);
              }}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-left text-xs transition-colors",
                index === step
                  ? "border-foreground bg-foreground text-background"
                  : index < step
                    ? "border-cyan-700/40 text-foreground dark:border-cyan-300/40"
                    : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-medium">{place.name}</span>
              <span className="ml-2 font-mono opacity-70">{formatMonth(place.start)}</span>
            </button>
          </li>
        ))}
      </ol>
      <PlaceStrip place={current} onOpen={(photo) => current && lightbox.open(current.photos, photo)} />
      {lightbox.element}
    </div>
  );
}

function boundsOf(a: [number, number], b: [number, number]): [[number, number], [number, number]] {
  return [
    [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
    [Math.max(a[0], b[0]), Math.max(a[1], b[1])],
  ];
}
