"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { geoContains, geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { GeoPhoto, Place } from "@/lib/photo-geo";
import { PhotoLightbox } from "../photo-lightbox";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 500;
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const projection = geoEqualEarth().fitExtent(
  [[8, 8], [MAP_WIDTH - 8, MAP_HEIGHT - 8]],
  { type: "Sphere" },
);
export const pathFor = geoPath(projection);

export function project(place: { lat: number; lng: number }): [number, number] {
  return projection([place.lng, place.lat]) ?? [0, 0];
}

export interface WorldShapes {
  land: Feature<Geometry, { name: string }>[];
  countries: Feature<Geometry, { name: string }>[];
  states: Feature<Geometry, { name: string }>[];
}

// Map outlines are imported lazily so they never weigh on the page's first load.
// Antarctica would only be a strip along the bottom edge of the map.
function withoutAntarctica(land: Feature<Geometry, { name: string }>) {
  if (land.geometry.type !== "MultiPolygon") return land;
  const coordinates = land.geometry.coordinates.filter((polygon) => polygon[0].some(([, lat]) => lat > -60));
  return { ...land, geometry: { ...land.geometry, coordinates } };
}

export function useWorldShapes() {
  const [shapes, setShapes] = useState<WorldShapes | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      import("world-atlas/countries-110m.json"),
      import("world-atlas/land-110m.json"),
      import("us-atlas/states-10m.json"),
    ]).then(
      ([world, land, us]) => {
        if (!active) return;
        const toFeatures = (topology: unknown, key: string) => {
          const typed = topology as Topology<Record<string, GeometryCollection<{ name: string }>>>;
          return feature(typed, typed.objects[key]).features;
        };
        setShapes({
          land: toFeatures(land.default, "land").map(withoutAntarctica),
          countries: toFeatures(world.default, "countries").filter((c) => c.properties.name !== "Antarctica"),
          states: toFeatures(us.default, "states"),
        });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return shapes;
}

type Point = [number, number];

// Rounds a polygon ring into a soft closed curve (quadratic segments through edge midpoints).
function smoothRing(ring: Point[]) {
  const points = ring.slice(0, -1);
  const n = points.length;
  const mid = (a: Point, b: Point) => `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
  let d = `M${mid(points[n - 1], points[0])}`;
  points.forEach((point, i) => {
    d += `Q${point[0].toFixed(1)} ${point[1].toFixed(1)} ${mid(point, points[(i + 1) % n])}`;
  });
  return `${d}Z`;
}

// Rounds an open line into a soft curve through its segment midpoints.
function smoothLine(line: Point[]) {
  if (line.length < 3) return `M${line.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}`;
  const mid = (a: Point, b: Point) => `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
  let d = `M${line[0][0].toFixed(1)} ${line[0][1].toFixed(1)}L${mid(line[0], line[1])}`;
  for (let i = 1; i < line.length - 1; i += 1) d += `Q${line[i][0].toFixed(1)} ${line[i][1].toFixed(1)} ${mid(line[i], line[i + 1])}`;
  const last = line[line.length - 1];
  return `${d}L${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
}

const toMap = ([lng, lat]: number[]): Point => projection([lng, lat]) ?? [0, 0];

// Rivers and lakes from scripts/generate-hydrology.js (Natural Earth), projected and smoothed once.
export function useHydrology() {
  const [water, setWater] = useState<{ rivers: { rank: number; d: string }[]; lakes: string }>({ rivers: [], lakes: "" });

  useEffect(() => {
    let active = true;
    import("@/data/hydrology.json").then(({ default: data }) => {
      if (!active) return;
      setWater({
        rivers: data.rivers.map(({ rank, lines }) => ({ rank, d: lines.map((line) => smoothLine(line.map(toMap))).join("") })),
        lakes: data.lakes.flatMap(({ polygons }) => polygons.flat().map((ring) => smoothRing(ring.map(toMap)))).join(""),
      });
    });
    return () => {
      active = false;
    };
  }, []);

  return water;
}

export type ClimateGroup = "D" | "S" | "P" | "T" | "V" | "M" | "B" | "N" | "I";

export interface Climate {
  climateAt: (lng: number, lat: number) => ClimateGroup | undefined;
  tints: { group: ClimateGroup; d: string }[];
}

const isClimateGroup = (char: string): char is ClimateGroup => "DSPTVMBNI".includes(char);

// Köppen–Geiger climate groups from scripts/generate-climate-grid.js: a lookup for choosing which
// symbols belong where, plus smoothed outlines to tint the land. The 0.5° grid's coastline differs
// from the map's, so a coastal point with no climate takes the nearest one within a cell or two.
export function useClimate() {
  const [climate, setClimate] = useState<Climate | null>(null);

  useEffect(() => {
    let active = true;
    import("@/data/climate-grid.json").then(({ default: data }) => {
      if (!active) return;
      const cells = data.rows.map((row) => row.replace(/(\D)(\d+)/g, (_, char: string, count: string) => char.repeat(Number(count))));
      const cols = 360 / data.step;
      const cell = (row: number, col: number) => cells[row]?.[(col + cols) % cols] ?? "";
      const climateAt = (lng: number, lat: number) => {
        const row = Math.floor((data.lat - lat) / data.step);
        const col = Math.floor((lng - data.lng) / data.step);
        for (let reach = 0; reach <= 2; reach += 1) {
          for (let dr = -reach; dr <= reach; dr += 1) {
            for (let dc = -reach; dc <= reach; dc += 1) {
              const char = cell(row + dr, col + dc);
              if (isClimateGroup(char)) return char;
            }
          }
        }
      };
      setClimate({
        climateAt,
        tints: Object.entries(data.tints).flatMap(([group, rings]) =>
          isClimateGroup(group)
            ? [{ group, d: rings.map((ring) => smoothRing(Array.from({ length: ring.length / 2 }, (_, i) => toMap([ring[2 * i], ring[2 * i + 1]])))).join("") }]
            : [],
        ),
      });
    });
    return () => {
      active = false;
    };
  }, []);

  return climate;
}

const isGreenland = (ring: number[][]) => ring.every(([lng, lat]) => lat > 58 && lng > -75 && lng < -10);

// Elevation bands from scripts/generate-terrain-bands.js, projected and smoothed once.
export function useTerrainBands() {
  const [bands, setBands] = useState<{ level: number; d: string }[]>([]);

  useEffect(() => {
    let active = true;
    import("@/data/terrain-bands.json").then(({ default: data }) => {
      if (!active) return;
      setBands(
        data.bands.map(({ level, polygons }) => ({
          level,
          d: polygons
            .flatMap((rings) => rings)
            .filter((ring) => !isGreenland(ring))
            .map((ring) => smoothRing(ring.map(([lng, lat]) => projection([lng, lat]) ?? [0, 0])))
            .join(""),
        })),
      );
    });
    return () => {
      active = false;
    };
  }, []);

  return bands;
}

export function formatMonth(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
}

export function placeDates(place: Place) {
  const start = formatMonth(place.start);
  const end = formatMonth(place.end);
  return start === end ? start : `${start} – ${end}`;
}

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const WORLD_VIEW: ViewBox = { x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT };

// Fits [x0, y0, x1, y1] map bounds into a padded view with the map's aspect ratio.
export function viewForBounds([[x0, y0], [x1, y1]]: [[number, number], [number, number]], minWidth = 120): ViewBox {
  const pad = 0.35;
  let w = Math.max((x1 - x0) * (1 + pad * 2), minWidth);
  let h = Math.max((y1 - y0) * (1 + pad * 2), (minWidth * MAP_HEIGHT) / MAP_WIDTH);
  if (w / h > MAP_WIDTH / MAP_HEIGHT) h = (w * MAP_HEIGHT) / MAP_WIDTH;
  else w = (h * MAP_WIDTH) / MAP_HEIGHT;
  return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
}

export const viewBoxString = ({ x, y, w, h }: ViewBox) => `${x} ${y} ${w} ${h}`;

interface BloomProps {
  photos: GeoPhoto[];
  caption?: string;
  direction?: "up" | "down";
  onOpen: (photo: GeoPhoto) => void;
}

// Thumbnails fan out from the anchor point (the parent positions this at the place).
export function PhotoBloom({ photos, caption, direction = "up", onOpen }: BloomProps) {
  const shown = photos.slice(0, 5);
  const spread = shown.length === 1 ? 0 : 120;
  const radius = 118;

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-30">
      <svg className="absolute overflow-visible" width="1" height="1" aria-hidden="true">
        {shown.map((photo, index) => {
          const { dx, dy } = fanOffset(index, shown.length, spread, radius, direction);
          return (
            <motion.line
              key={photo.id}
              x1={0}
              y1={0}
              x2={dx}
              y2={dy}
              className="stroke-cyan-700/60 dark:stroke-cyan-300/60"
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: index * 0.035 }}
            />
          );
        })}
      </svg>
      {shown.map((photo, index) => {
        const { dx, dy, tilt } = fanOffset(index, shown.length, spread, radius, direction);
        return (
          <motion.button
            key={photo.id}
            type="button"
            onClick={() => onOpen(photo)}
            className="pointer-events-auto absolute -ml-12 -mt-9 h-[72px] w-24 overflow-hidden rounded-md border border-white/70 bg-muted shadow-xl ring-1 ring-black/10"
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, x: dx, y: dy, rotate: tilt }}
            exit={{ opacity: 0, scale: 0.6, x: 0, y: 0, transition: { duration: 0.16, ease: EASE_OUT } }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.25, delay: index * 0.035 }}
            whileHover={{ scale: 1.08, rotate: 0, zIndex: 10 }}
            aria-label={`Open ${photo.alt}`}
          >
            <img src={photo.src} alt="" draggable={false} decoding="async" className="h-full w-full object-cover" />
          </motion.button>
        );
      })}
      {caption && (
        <motion.p
          className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-background/90 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground shadow-md backdrop-blur"
          style={{ top: direction === "up" ? 14 : -40 }}
          initial={{ opacity: 0, y: direction === "up" ? -4 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.1 }}
        >
          {caption}
        </motion.p>
      )}
    </div>
  );
}

function fanOffset(index: number, count: number, spread: number, radius: number, direction: "up" | "down") {
  const start = -90 - spread / 2;
  const angle = count === 1 ? -90 : start + (spread / (count - 1)) * index;
  const radians = ((direction === "up" ? angle : -angle) * Math.PI) / 180;
  return {
    dx: Math.cos(radians) * radius,
    dy: Math.sin(radians) * radius,
    tilt: (index - (count - 1) / 2) * 4,
  };
}

export function usePhotoLightbox() {
  const [state, setState] = useState<{ photos: GeoPhoto[]; index: number } | null>(null);
  const element = state && (
    <PhotoLightbox
      slides={state.photos.map((photo) => ({ src: photo.src, alt: photo.alt, description: photo.location }))}
      index={state.index}
      onClose={() => setState(null)}
    />
  );
  return {
    open: (photos: GeoPhoto[], photo: GeoPhoto) => setState({ photos, index: Math.max(0, photos.indexOf(photo)) }),
    element,
  };
}

export function PlaceStrip({ place, onOpen }: { place: Place | null; onOpen: (photo: GeoPhoto) => void }) {
  return (
    <div className="mt-6 min-h-[11rem]">
      <AnimatePresence mode="popLayout" initial={false}>
        {place && (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
              <h3 className="text-xl font-semibold text-foreground">{place.name}</h3>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {placeDates(place)} · {place.photos.length} {place.photos.length === 1 ? "photo" : "photos"}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
              {place.photos.map((photo, index) => (
                <motion.button
                  key={photo.id}
                  type="button"
                  onClick={() => onOpen(photo)}
                  className="h-32 w-44 shrink-0 overflow-hidden rounded-md bg-muted"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT, delay: Math.min(index, 6) * 0.04 }}
                  aria-label={`Open ${photo.alt}`}
                >
                  <img src={photo.src} alt="" draggable={false} loading="lazy" className="h-full w-full object-cover" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function useVisitedRegions(places: Place[], shapes: WorldShapes | null) {
  return useMemo(() => {
    const visited = (features: Feature<Geometry, { name: string }>[] = []) =>
      new Set(
        features
          .filter((f) => places.some((p) => geoContains(f, [p.lng, p.lat])))
          .map((f) => f.properties.name),
      );
    return { countries: visited(shapes?.countries), states: visited(shapes?.states) };
  }, [places, shapes]);
}
