"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { Feature, Geometry } from "geojson";
import { cn } from "@/lib/utils";
import { MAP_HEIGHT, MAP_WIDTH, pathFor, viewBoxString, type ViewBox, type WorldShapes } from "./map-shared";

export type Region = Feature<Geometry, { name: string }>;
export type ToScreen = (point: [number, number]) => { x: number; y: number };

interface FlatMapProps {
  shapes: WorldShapes;
  visited: { countries: Set<string>; states: Set<string> };
  view: ViewBox;
  initialView?: ViewBox;
  highlighted?: string | null;
  duration?: number;
  onRegionEnter?: (region: Region, pointer: { x: number; y: number }) => void;
  onRegionLeave?: () => void;
  onRegionClick?: (region: Region) => void;
  children?: (scale: number) => ReactNode;
  overlay?: (toScreen: ToScreen) => ReactNode;
}

export function FlatMap({
  shapes,
  visited,
  view,
  initialView,
  highlighted,
  duration = 0.9,
  onRegionEnter,
  onRegionLeave,
  onRegionClick,
  children,
  overlay,
}: FlatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(containerRef.current!);
    return () => observer.disconnect();
  }, []);

  const height = (width * MAP_HEIGHT) / MAP_WIDTH;
  const toScreen: ToScreen = ([ux, uy]) => ({
    x: ((ux - view.x) / view.w) * width,
    y: ((uy - view.y) / view.h) * height,
  });
  // Map-space sizes (pins, labels) shrink as the view zooms in so they stay constant on screen.
  const scale = view.w / MAP_WIDTH;

  const region = (feature: Region, isVisited: boolean) => (
    <path
      key={feature.id ?? feature.properties.name}
      d={pathFor(feature) ?? undefined}
      vectorEffect="non-scaling-stroke"
      className={cn(
        "stroke-foreground/20 transition-[fill] duration-200",
        highlighted === feature.properties.name
          ? isVisited
            ? "fill-cyan-600/40 dark:fill-cyan-300/35"
            : "fill-foreground/[0.14]"
          : isVisited
            ? "fill-cyan-600/20 dark:fill-cyan-300/[0.16]"
            : "fill-foreground/[0.06]",
        onRegionClick && "cursor-pointer",
      )}
      strokeWidth={0.6}
      onPointerEnter={(event) => {
        const box = containerRef.current!.getBoundingClientRect();
        onRegionEnter?.(feature, { x: event.clientX - box.left, y: event.clientY - box.top });
      }}
      onPointerLeave={() => onRegionLeave?.()}
      onClick={() => onRegionClick?.(feature)}
    />
  );

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl border border-border bg-card/40">
      <motion.svg
        className="block h-auto w-full"
        viewBox={viewBoxString(initialView ?? view)}
        initial={initialView && { viewBox: viewBoxString(initialView) }}
        animate={{ viewBox: viewBoxString(view) }}
        transition={{ duration, ease: [0.77, 0, 0.175, 1] }}
        role="img"
        aria-label="World map of photo locations"
      >
        <path d={pathFor({ type: "Sphere" }) ?? undefined} className="fill-none stroke-foreground/10" vectorEffect="non-scaling-stroke" />
        {shapes.countries.filter((c) => c.properties.name !== "United States of America").map((c) => region(c, visited.countries.has(c.properties.name)))}
        {shapes.states.map((s) => region(s, visited.states.has(s.properties.name)))}
        {children?.(scale)}
      </motion.svg>
      {width > 0 && overlay?.(toScreen)}
    </div>
  );
}
