"use client";

import { useMemo, type ReactNode } from "react";
import { Globe2, Images, Minus, Plus } from "lucide-react";
import type { Place } from "@/lib/photo-geo";
import { CityModel, cityTier } from "./cities";
import { placeDates } from "./map-shared";

// Game-map chrome for the Atlas: pattern fills, name plates, route badges, the cursor, the player
// marker and the HTML overlays (header plate, info panel, controls, cloud frame).

// Tree textures for the forest blobs and wave glyphs for the open sea, drawn in screen pixels.
// patternTransform keeps each tile at a constant on-screen size (see `screenPatterns`).
export function MapPatterns({ scale }: { scale: number }) {
  const transform = `scale(${scale})`;
  return (
    <defs>
      <pattern id="gm-waves" data-screen="" width={64} height={36} patternUnits="userSpaceOnUse" patternTransform={transform}>
        <path d="M6 20 q6 -6 12 0 t12 0" className="gm-wave" strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d="M38 4 q6 -6 12 0 t12 0" className="gm-wave" strokeWidth={2} fill="none" strokeLinecap="round" />
      </pattern>
      <pattern id="gm-broadleaf" data-screen="" width={18} height={20} patternUnits="userSpaceOnUse" patternTransform={transform}>
        {[[4.5, 9], [13.5, 19]].map(([x, y]) => (
          <g key={x}>
            <path d={`M${x} ${y - 7.8} C${x + 4.2} ${y - 6.6} ${x + 4.8} ${y - 0.6} ${x + 1} ${y} V${y + 1.4} H${x - 1} V${y} C${x - 4.8} ${y - 0.6} ${x - 4.2} ${y - 6.6} ${x} ${y - 7.8} Z`} className="gm-tree" />
            <path d={`M${x - 0.9} ${y - 6} c-1.8 1.2 -2.1 3 -1.2 4.2`} className="gm-tree-light" strokeWidth={1} fill="none" strokeLinecap="round" />
          </g>
        ))}
      </pattern>
      <pattern id="gm-pine" data-screen="" width={14} height={18} patternUnits="userSpaceOnUse" patternTransform={transform}>
        {[[3.5, 8.5], [10.5, 17.5]].map(([x, y]) => (
          <g key={x}>
            <path d={`M${x} ${y - 8} L${x + 3.4} ${y - 1} H${x - 3.4} Z`} className="gm-pine" />
            <path d={`M${x} ${y - 8} L${x + 3.4} ${y - 1} H${x + 0.4} Z`} className="gm-pine-shade" />
            <rect x={x - 0.6} y={y - 1} width={1.2} height={1.2} className="gm-trunk" />
          </g>
        ))}
      </pattern>
      <pattern id="gm-jungle" data-screen="" width={16} height={14} patternUnits="userSpaceOnUse" patternTransform={transform}>
        {[[4, 6.5, 3.6], [12, 13, 3.8], [12, 0, 3.8]].map(([x, y, r]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={r} className="gm-jungle-tree" />
            <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.45} className="gm-jungle-light" />
          </g>
        ))}
      </pattern>
    </defs>
  );
}

// Writes the live zoom into every screen-sized pattern without touching React state.
export function screenPatterns(svg: SVGSVGElement, scale: number) {
  svg.querySelectorAll("pattern[data-screen]").forEach((pattern) => pattern.setAttribute("patternTransform", `scale(${scale})`));
}

export function NamePlate({ name, y }: { name: string; y: number }) {
  const w = name.length * 6.3 + 16;
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x={-w / 2} y={-9} width={w} height={17} rx={8.5} className="gm-plate" strokeWidth={1.5} />
      <text y={3.6} textAnchor="middle" className="gm-plate-text text-[10.5px] font-extrabold">
        {name}
      </text>
    </g>
  );
}

// A ribbon plate with notched ends, for landmarks.
export function LandmarkPlate({ name, y }: { name: string; y: number }) {
  const w = name.length * 5.4 + 20;
  return (
    <g transform={`translate(0 ${y})`}>
      <path d={`M${-w / 2} -8 h${w} l-5 8 l5 8 h${-w} l5 -8 z`} className="gm-ribbon" strokeWidth={1.2} strokeLinejoin="round" />
      <text y={3.2} textAnchor="middle" className="gm-plate-text text-[9px] font-bold">
        {name}
      </text>
    </g>
  );
}

export function RouteBadge({ n }: { n: number }) {
  return (
    <g>
      <circle r={9.5} className="gm-badge" strokeWidth={1.6} />
      <circle r={7.3} fill="none" className="gm-badge-ring" strokeWidth={1.8} />
      <text y={3.4} textAnchor="middle" className="gm-badge-text text-[9.5px] font-black">
        {n}
      </text>
    </g>
  );
}

export function Bridge({ angle }: { angle: number }) {
  return (
    <g transform={`rotate(${angle})`}>
      <rect x={-7} y={-4.5} width={14} height={9} rx={1.5} className="gm-bridge" strokeWidth={1.2} />
      <path d="M-7 -2.6 H7 M-7 2.6 H7" className="gm-bridge-rail" strokeWidth={1} />
    </g>
  );
}

// Corner brackets around the selected town.
export function Brackets({ w, h }: { w: number; h: number }) {
  const arm = 8;
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => {
    const [x, y] = [(sx * w) / 2, (sy * h) / 2];
    return `M${x} ${y - sy * arm} V${y} H${x - sx * arm}`;
  });
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={corners.join(" ")} className="gm-cursor-halo" strokeWidth={6.5} />
      <path d={corners.join(" ")} className="gm-cursor" strokeWidth={3.5} />
    </g>
  );
}

// An original player marker: a round kid's head in a mustard bucket hat with a sprout on top.
export function Player() {
  return (
    <g>
      <ellipse cx={0} cy={22} rx={11} ry={3} className="gm-player-shadow" />
      <g className="gm-bob">
        <path d="M-6 8 L0 20 L6 8 Z" className="gm-player-pin" strokeWidth={2.2} strokeLinejoin="round" />
        <circle cx={0} cy={-6} r={17} className="gm-player-pin" strokeWidth={2.4} />
        <circle cx={0} cy={-4} r={12.5} className="gm-player-skin" strokeWidth={1.8} />
        <path d="M-15 -9 C-14 -24 14 -24 15 -9 L19 -8 C20 -5 -20 -5 -19 -8 Z" className="gm-player-hat" strokeWidth={1.8} strokeLinejoin="round" />
        <path d="M-8 -14 h16" className="gm-player-band" strokeWidth={2.4} strokeLinecap="round" />
        <path d="M0 -19 q-2 -6 -7 -7 q4 -3 7 2 q3 -6 8 -4 q-5 2 -8 9 z" className="gm-player-sprout" strokeWidth={1.3} strokeLinejoin="round" />
        <circle cx={-4.5} cy={-2.5} r={1.8} className="gm-player-ink" />
        <circle cx={4.5} cy={-2.5} r={1.8} className="gm-player-ink" />
        <ellipse cx={-8} cy={1.5} rx={2.4} ry={1.4} className="gm-player-cheek" />
        <ellipse cx={8} cy={1.5} rx={2.4} ry={1.4} className="gm-player-cheek" />
        <path d="M-2.4 2.6 q2.4 2.2 4.8 0" className="gm-player-mouth" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

// Coarse regions for the header plate, most specific first: [name, west, south, east, north, minZoom].
const REGIONS: [string, number, number, number, number, number][] = [
  ["Alaska", -170, 54, -130, 72, 2.5],
  ["North America · West", -130, 24, -102, 54, 2.5],
  ["North America · Central", -102, 24, -88, 54, 2.5],
  ["North America · East", -88, 24, -50, 54, 2.5],
  ["Central America", -118, 7, -60, 24, 1.6],
  ["North America", -170, 7, -50, 84, 1.6],
  ["South America", -92, -57, -30, 13, 1.6],
  ["Europe", -25, 35, 45, 72, 1.6],
  ["Middle East", 34, 12, 63, 42, 1.6],
  ["Africa", -20, -36, 55, 37, 1.6],
  ["South Asia", 60, 5, 98, 30, 1.6],
  ["Southeast Asia", 92, -11, 155, 22, 1.6],
  ["East Asia", 98, 18, 150, 55, 1.6],
  ["Central Asia", 45, 30, 98, 55, 1.6],
  ["Northern Asia", 45, 50, 180, 80, 1.6],
  ["Oceania", 110, -50, 180, -10, 1.6],
];

export function regionName([lng, lat]: [number, number], k: number) {
  if (k < 1.6) return "World Map";
  return REGIONS.find(([, w, s, e, n, minZoom]) => k >= minZoom && lng >= w && lng <= e && lat >= s && lat <= n)?.[0] ?? "Open Sea";
}

const ink = "border-[#2b3250] bg-[#fbf5e2] text-[#2b3250]";
const double = "shadow-[inset_0_0_0_3px_#fbf5e2,inset_0_0_0_4.5px_#2b3250,3px_4px_0_rgba(0,0,0,0.18)]";

export function HeaderPlate({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="pointer-events-none absolute left-2 top-2 z-10 font-[family-name:var(--font-map)] sm:left-4 sm:top-4">
      <div className="bg-[#2b3250] py-1 pl-2 pr-5 [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)] sm:py-2 sm:pl-4 sm:pr-9">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white sm:text-lg">{title}</p>
      </div>
      <p className={`mt-1.5 hidden w-fit rounded-full border-2 px-3 py-0.5 text-[11px] font-extrabold sm:block ${ink}`}>{summary}</p>
    </div>
  );
}

export function InfoPanel({ place, visit, routes, onOpen }: { place: Place; visit: number | null; routes: number[]; onOpen: () => void }) {
  const count = place.photos.length;
  return (
    <div className={`pointer-events-auto absolute bottom-2 left-1/2 z-20 flex w-[min(42rem,calc(100%-1rem))] -translate-x-1/2 items-center gap-3 rounded-2xl border-[3px] px-3 py-2 font-[family-name:var(--font-map)] sm:bottom-4 sm:gap-4 sm:px-5 sm:py-3 ${ink} ${double}`}>
      <svg viewBox="-30 -24 60 40" className="hidden h-10 w-14 shrink-0 sm:block" aria-hidden="true">
        <CityModel place={place} tier={cityTier(count)} />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-black sm:text-xl">{place.name}</p>
        <p className="truncate text-xs font-extrabold text-[#6a6f86] sm:text-sm">
          {count} {count === 1 ? "photo" : "photos"} · {placeDates(place)}
        </p>
      </div>
      {routes.length > 0 && (
        <div className="hidden shrink-0 rounded-lg border-2 border-[#2b3250] bg-white px-3 py-1 text-center md:block">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#6a6f86]">{visit ? `Visit #${visit} · ` : ""}Routes</p>
          <p className="text-xs font-black text-[#e23a4a]">{routes.map((n) => `Route ${n}`).join(" · ")}</p>
        </div>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-[#2b3250] bg-[#ec4452] px-3 py-1.5 text-xs font-black text-white shadow-[0_2px_0_#8e2333] transition-transform hover:-translate-y-px active:translate-y-px"
      >
        <Images className="size-3.5" />
        Open photos
      </button>
    </div>
  );
}

export function MapControls({ onZoomIn, onZoomOut, onWorld }: { onZoomIn: () => void; onZoomOut: () => void; onWorld: () => void }) {
  const button = (label: string, onClick: () => void, icon: ReactNode) => (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-6 place-items-center rounded-md hover:bg-[#efe2bf] sm:size-9 sm:rounded-lg">
      {icon}
    </button>
  );
  return (
    <div className={`absolute right-2 top-2 z-10 flex flex-col gap-0.5 rounded-lg border-2 p-0.5 sm:right-4 sm:rounded-xl sm:border-[3px] sm:p-1.5 sm:top-4 ${ink} ${double}`}>
      {button("Zoom in", onZoomIn, <Plus className="size-4" strokeWidth={3} />)}
      {button("Zoom out", onZoomOut, <Minus className="size-4" strokeWidth={3} />)}
      {button("World map", onWorld, <Globe2 className="size-4" strokeWidth={2.5} />)}
    </div>
  );
}

const random = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

// Soft clouds around the map's edges, sized to the container so they stay small on phones.
export function CloudFrame({ width, height }: { width: number; height: number }) {
  const puffs = useMemo(() => {
    const next = random(11);
    const scale = Math.min(1, Math.max(0.45, width / 1300));
    const perimeter = 2 * (width + height);
    const result: [number, number, number][] = [];
    for (let t = 0; t < perimeter; t += (34 + next() * 26) * scale) {
      const inset = next() * 10 * scale;
      const [x, y] =
        t < width ? [t, inset] : t < width + height ? [width - inset, t - width] : t < 2 * width + height ? [width - (t - width - height), height - inset] : [inset, perimeter - t];
      result.push([x, y, (16 + next() * 22) * scale]);
    }
    for (const [x, y] of [[0, 0], [width, 0], [0, height], [width, height]]) result.push([x, y, 52 * scale]);
    return result;
  }, [width, height]);
  if (width === 0) return null;
  return (
    <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {puffs.map(([x, y, r], i) => <circle key={`s${i}`} cx={x} cy={y + r * 0.22} r={r} className="gm-cloud-shadow" />)}
      {puffs.map(([x, y, r], i) => <circle key={`c${i}`} cx={x} cy={y} r={r} className="gm-cloud" />)}
      {puffs.map(([x, y, r], i) => <circle key={`h${i}`} cx={x + r * 0.12} cy={y + r * 0.3} r={r * 0.55} className="gm-cloud-shade" />)}
      {puffs.map(([x, y, r], i) => <circle key={`l${i}`} cx={x - r * 0.1} cy={y - r * 0.12} r={r * 0.78} className="gm-cloud" />)}
    </svg>
  );
}
