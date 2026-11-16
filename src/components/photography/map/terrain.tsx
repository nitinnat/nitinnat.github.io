"use client";

import { useEffect, useState } from "react";
import { project } from "./map-shared";

export interface Peak {
  id: number;
  x: number;
  y: number;
  lat: number;
  elevation: number;
}

// Peaks come from scripts/generate-terrain.js (AWS Terrain Tiles); loaded lazily with the map.
export function usePeaks() {
  const [peaks, setPeaks] = useState<Peak[]>([]);

  useEffect(() => {
    let active = true;
    import("@/data/terrain-peaks.json").then(({ default: data }) => {
      if (!active) return;
      setPeaks(
        data.map(([lng, lat, elevation], id) => {
          const [x, y] = project({ lat, lng });
          return { id, x, y, lat, elevation };
        }),
      );
    });
    return () => {
      active = false;
    };
  }, []);

  return peaks;
}

interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// Greedily keeps the highest items in view that are at least `spacing` apart (map units),
// skipping anything too close to already-occupied points such as landmarks. Items that fail `drawn`
// still claim their space but don't count towards `limit`.
export function selectSpaced<T extends { x: number; y: number }>(
  items: T[],
  bounds: Bounds,
  spacing: number,
  occupied: { x: number; y: number }[],
  limit: number,
  drawn: (item: T) => boolean = () => true,
) {
  const grid = new Map<string, { x: number; y: number }[]>();
  const key = (x: number, y: number) => `${Math.floor(x / spacing)},${Math.floor(y / spacing)}`;
  const add = (point: { x: number; y: number }) => {
    const cell = key(point.x, point.y);
    grid.set(cell, [...(grid.get(cell) ?? []), point]);
  };
  const crowded = (point: { x: number; y: number }) => {
    const cx = Math.floor(point.x / spacing);
    const cy = Math.floor(point.y / spacing);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (const other of grid.get(`${cx + dx},${cy + dy}`) ?? []) {
          if (Math.hypot(other.x - point.x, other.y - point.y) < spacing) return true;
        }
      }
    }
    return false;
  };

  occupied.forEach(add);
  const chosen: T[] = [];
  const margin = spacing * 2;
  let count = 0;
  for (const item of items) {
    if (count >= limit) break;
    if (item.x < bounds.x0 - margin || item.x > bounds.x1 + margin || item.y < bounds.y0 - margin || item.y > bounds.y1 + margin) continue;
    if (crowded(item)) continue;
    add(item);
    chosen.push(item);
    if (drawn(item)) count += 1;
  }
  return chosen;
}

// Painted, game-map style symbols in screen pixels, base centred on the origin.

type Point = [number, number];

interface Summit {
  top: Point;
  left: Point;
  right: Point;
  crease: Point;
}

// Silhouettes in units of the mountain's width and height: sharp, double-peak and broad.
const RANGES: { width: number; outline: Point[]; mid: Point[][]; shade: Point[][]; summits: Summit[] }[] = [
  {
    width: 1.3,
    outline: [[-0.5, 0], [-0.3, -0.42], [-0.16, -0.66], [0, -1], [0.14, -0.7], [0.3, -0.44], [0.5, 0]],
    mid: [
      [[0, -1], [0.05, -0.45], [0.1, 0], [-0.08, 0], [-0.05, -0.5]],
      [[-0.16, -0.66], [-0.2, -0.3], [-0.24, 0], [-0.34, 0], [-0.27, -0.3]],
    ],
    shade: [[[0, -1], [0.14, -0.7], [0.3, -0.44], [0.5, 0], [0.1, 0], [0.05, -0.45]]],
    summits: [{ top: [0, -1], left: [-0.16, -0.66], right: [0.14, -0.7], crease: [0.05, -0.45] }],
  },
  {
    width: 1.45,
    outline: [[-0.5, 0], [-0.34, -0.5], [-0.12, -1], [0.04, -0.64], [0.2, -0.8], [0.34, -0.5], [0.5, 0]],
    mid: [
      [[-0.12, -1], [-0.06, -0.5], [0, 0], [-0.18, 0], [-0.15, -0.5]],
      [[-0.34, -0.5], [-0.32, -0.22], [-0.34, 0], [-0.43, 0], [-0.38, -0.22]],
      [[0.2, -0.8], [0.22, -0.4], [0.24, 0], [0.14, 0], [0.16, -0.4]],
    ],
    shade: [
      [[-0.12, -1], [0.04, -0.64], [0.06, -0.4], [0, 0], [-0.06, -0.5]],
      [[0.2, -0.8], [0.34, -0.5], [0.5, 0], [0.24, 0], [0.22, -0.4]],
    ],
    summits: [
      { top: [-0.12, -1], left: [-0.34, -0.5], right: [0.04, -0.64], crease: [-0.06, -0.5] },
      { top: [0.2, -0.8], left: [0.04, -0.64], right: [0.34, -0.5], crease: [0.22, -0.4] },
    ],
  },
  {
    width: 1.6,
    outline: [[-0.5, 0], [-0.38, -0.3], [-0.22, -0.62], [-0.04, -0.92], [0.06, -0.96], [0.2, -0.72], [0.32, -0.5], [0.42, -0.28], [0.5, 0]],
    mid: [
      [[0.06, -0.96], [0.08, -0.6], [0.12, -0.3], [0.12, 0], [-0.06, 0], [-0.03, -0.55]],
      [[-0.22, -0.62], [-0.24, -0.3], [-0.27, 0], [-0.36, 0], [-0.3, -0.3]],
    ],
    shade: [[[0.06, -0.96], [0.2, -0.72], [0.32, -0.5], [0.42, -0.28], [0.5, 0], [0.12, 0], [0.12, -0.3], [0.08, -0.6]]],
    summits: [{ top: [0.06, -0.96], left: [-0.22, -0.62], right: [0.2, -0.72], crease: [0.08, -0.6] }],
  },
];

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const shape = (points: Point[]) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")} Z`;

export function Mountain({
  elevation,
  size = 1,
  variant = 0,
  snowy = true,
}: {
  elevation: number;
  size?: number;
  variant?: number;
  snowy?: boolean;
}) {
  const range = RANGES[variant % RANGES.length];
  const height = Math.min(1, Math.max(0, (elevation - 2500) / 3000));
  const h = (30 + height * 16) * size;
  const w = h * range.width;
  const scale = (points: Point[]) => points.map(([x, y]): Point => [x * w, y * h]);
  const snowline = 0.62 + Math.min(1, Math.max(0, (elevation - 2500) / 2000)) * 0.38;
  return (
    <g>
      <ellipse cx={w * 0.06} cy={0} rx={w * 0.56} ry={h * 0.09} className="gm-shadow" />
      <path d={shape(scale(range.outline))} className="gm-mtn-lit gm-mtn-edge" strokeWidth={1.1} strokeLinejoin="round" />
      {range.mid.map((points, i) => <path key={`m${i}`} d={shape(scale(points))} className="gm-mtn-mid" />)}
      {range.shade.map((points, i) => <path key={`s${i}`} d={shape(scale(points))} className="gm-mtn-shade" />)}
      {snowy && range.summits.map((summit, i) => {
        const [top, left, right, crease] = scale([summit.top, summit.left, summit.right, summit.crease]);
        const l = lerp(top, left, snowline);
        const r = lerp(top, right, snowline);
        const c = lerp(top, crease, snowline * 0.85);
        const drip = (a: Point, b: Point, t: number, dy: number): Point => {
          const [x, y] = lerp(a, b, t);
          return [x, y + dy * h];
        };
        return (
          <g key={`p${i}`}>
            <path d={`M${left[0].toFixed(1)} ${left[1].toFixed(1)} L${top[0].toFixed(1)} ${top[1].toFixed(1)}`} className="gm-mtn-highlight" strokeWidth={1.2} strokeLinecap="round" />
            <path d={shape([top, l, drip(l, c, 0.3, 0.09), drip(l, c, 0.6, -0.02), drip(l, c, 0.8, 0.07), c])} className="gm-snow" />
            <path d={shape([top, c, drip(c, r, 0.45, 0.07), r])} className="gm-snow-shade" />
          </g>
        );
      })}
    </g>
  );
}

const FOREST_SLOTS: Point[] = [[-9, -6], [1, -7], [10, -5], [-14, -1], [-4, -2], [6, -1], [14, 1], [-8, 3], [3, 4]];

export function Forest({ seed = 0, size = 1 }: { seed?: number; size?: number }) {
  const count = 5 + (seed % 5);
  const jitter = (i: number, salt: number) => Math.sin((seed + 1) * 12.9898 + i * 78.233 + salt) * 0.5;
  const trees = FOREST_SLOTS.filter((_, i) => (i * 7 + seed * 4) % 9 < count)
    .map(([x, y], i) => ({ x: x + jitter(i, 1) * 3, y: y + jitter(i, 2) * 2, r: 5.2 + jitter(i, 3) * 1.6 }))
    .sort((a, b) => a.y - b.y);
  return (
    <g transform={`scale(${size})`}>
      <ellipse cx={0} cy={2} rx={18} ry={5} className="gm-forest-floor" />
      {trees.map(({ x, y, r }) => {
        const cy = y - r - 1.2;
        return (
          <g key={`${x}-${y}`}>
            <rect x={x - 0.9} y={y - 2} width={1.8} height={3} className="gm-trunk" />
            <circle cx={x} cy={cy} r={r} className="gm-tree-shade gm-tree-edge" strokeWidth={0.8} />
            <circle cx={x - r * 0.2} cy={cy - r * 0.2} r={r * 0.76} className="gm-tree" />
            <circle cx={x - r * 0.38} cy={cy - r * 0.42} r={r * 0.32} className="gm-tree-light" />
          </g>
        );
      })}
    </g>
  );
}

const seeded = (seed: number, i: number, salt: number) => Math.sin((seed + 1) * 12.9898 + i * 78.233 + salt) * 0.5;

const ACACIA_SLOTS: Point[] = [[-9, -1], [7, -3], [1, 3]];

export function Acacia({ seed = 0 }: { seed?: number }) {
  const trees = ACACIA_SLOTS.slice(0, 2 + (seed % 2))
    .map(([x, y], i) => ({ x: x + seeded(seed, i, 1) * 4, y, w: 8 + seeded(seed, i, 2) * 2, h: 9 + seeded(seed, i, 3) * 2 }))
    .sort((a, b) => a.y - b.y);
  return (
    <g className="gm-acacia">
      <ellipse cx={0} cy={2} rx={16} ry={4.5} className="gm-savanna-floor" />
      {trees.map(({ x, y, w, h }) => (
        <g key={x}>
          <path d={`M${x} ${y} V${y - h * 0.55} L${x - w * 0.35} ${y - h} M${x} ${y - h * 0.55} L${x + w * 0.4} ${y - h}`} fill="none" className="gm-trunk-stroke" strokeWidth={1.3} strokeLinecap="round" />
          <path d={`M${x - w} ${y - h + 1} Q${x - w * 0.9} ${y - h - 3.6} ${x} ${y - h - 3.8} Q${x + w * 0.9} ${y - h - 3.6} ${x + w} ${y - h + 1} Z`} className="gm-acacia-shade gm-tree-edge" strokeWidth={0.7} strokeLinejoin="round" />
          <path d={`M${x - w * 0.82} ${y - h - 0.2} Q${x - w * 0.7} ${y - h - 3.4} ${x - w * 0.05} ${y - h - 3.5} Q${x + w * 0.5} ${y - h - 3.3} ${x + w * 0.55} ${y - h - 0.8} Z`} className="gm-acacia-lit" />
        </g>
      ))}
    </g>
  );
}

// Overlapping round puffs, outlined as one mass: every outline first, then every fill on top.
function Canopy({ puffs, shade, lit }: { puffs: [number, number, number, number][]; shade: string; lit: string }) {
  return (
    <g>
      {puffs.map(([cx, cy, rx, ry]) => <ellipse key={`e${cx}${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} className={`${shade} gm-tree-edge`} strokeWidth={1.4} />)}
      {puffs.map(([cx, cy, rx, ry]) => <ellipse key={`f${cx}${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} className={shade} />)}
      {puffs.slice(0, 2).map(([cx, cy, rx, ry]) => <ellipse key={`l${cx}${cy}`} cx={cx - rx * 0.25} cy={cy - ry * 0.3} rx={rx * 0.55} ry={ry * 0.5} className={lit} />)}
    </g>
  );
}

const GRASS_SLOTS: Point[] = [[-12, 2], [11, 1], [-2, 4], [4, -3]];

function Grass({ seed }: { seed: number }) {
  return (
    <g>
      {GRASS_SLOTS.slice(0, 2 + (seed % 3)).map(([x, y]) => (
        <path key={x} d={`M${x - 2} ${y - 2.6} Q${x - 0.8} ${y - 0.8} ${x} ${y} Q${x} ${y - 2.2} ${x + 0.3} ${y - 3.8} M${x} ${y} Q${x + 0.8} ${y - 1.2} ${x + 2.2} ${y - 2.6}`} fill="none" className="gm-savanna-grass" strokeWidth={1} strokeLinecap="round" />
      ))}
    </g>
  );
}

const CERRADO_SLOTS: Point[] = [[-7, -1], [6, -2], [0, 3]];

// Brazil's cerrado: low, gnarled shrubby trees in tufted grass.
export function Cerrado({ seed = 0 }: { seed?: number }) {
  const trees = CERRADO_SLOTS.slice(0, 2 + (seed % 2))
    .map(([x, y], i) => ({ x: x + seeded(seed, i, 1) * 3, y, lean: seeded(seed, i, 2) * 6, h: 6.5 + seeded(seed, i, 3) * 2 }))
    .sort((a, b) => a.y - b.y);
  return (
    <g className="gm-cerrado">
      <ellipse cx={0} cy={2} rx={15} ry={4.2} className="gm-savanna-floor" />
      <Grass seed={seed} />
      {trees.map(({ x, y, lean, h }) => {
        const [tx, ty] = [x + lean, y - h];
        return (
          <g key={x}>
            <path d={`M${x} ${y} C${x - lean * 0.8} ${y - h * 0.35} ${x + lean * 1.3} ${y - h * 0.6} ${tx} ${ty}`} fill="none" className="gm-trunk-stroke" strokeWidth={1.5} strokeLinecap="round" />
            <path d={`M${x + lean * 0.35} ${y - h * 0.5} Q${x - 2} ${y - h * 0.62} ${x - 3.5 + lean * 0.4} ${y - h * 0.9}`} fill="none" className="gm-trunk-stroke" strokeWidth={1} strokeLinecap="round" />
            <Canopy puffs={[[tx - 3.2, ty, 3.4, 2.6], [tx + 2.6, ty - 0.4, 3, 2.4], [tx - 0.2, ty - 2, 2.8, 2.2], [tx - 4.4 + lean * 0.4, ty + h * 0.12, 2.2, 1.8]]} shade="gm-cerrado-shade" lit="gm-cerrado-lit" />
          </g>
        );
      })}
    </g>
  );
}

const GUM_SLOTS: Point[] = [[-6, 0], [7, -2]];

// Northern Australia's savanna: scattered eucalypts, tall pale trunks under loose blue-green crowns.
export function Eucalypt({ seed = 0 }: { seed?: number }) {
  const trees = GUM_SLOTS
    .map(([x, y], i) => ({ x: x + seeded(seed, i, 1) * 4, y, bend: seeded(seed, i, 2) * 3, h: 16 + seeded(seed, i, 3) * 4 }))
    .sort((a, b) => a.y - b.y);
  return (
    <g className="gm-eucalypt">
      <ellipse cx={0} cy={2} rx={14} ry={4} className="gm-savanna-floor" />
      <Grass seed={seed + 1} />
      {trees.map(({ x, y, bend, h }) => {
        const [tx, ty] = [x + bend, y - h];
        const trunk = `M${x} ${y} Q${x + bend * 0.2} ${y - h * 0.55} ${tx} ${ty + 3} M${x + bend * 0.5} ${y - h * 0.62} L${tx - 3.6} ${ty + 1.5} M${x + bend * 0.7} ${y - h * 0.75} L${tx + 3.4} ${ty + 0.8}`;
        return (
          <g key={x}>
            <path d={trunk} fill="none" className="gm-gum-edge" strokeWidth={2.6} strokeLinecap="round" />
            <path d={trunk} fill="none" className="gm-gum-trunk" strokeWidth={1.5} strokeLinecap="round" />
            <Canopy puffs={[[tx - 3.8, ty + 0.6, 3.2, 2.2], [tx + 3.6, ty, 3, 2.1], [tx + 0.2, ty - 2.6, 3.2, 2.2]]} shade="gm-gum-shade" lit="gm-gum-lit" />
          </g>
        );
      })}
    </g>
  );
}

export function Tufts({ seed = 0 }: { seed?: number }) {
  return (
    <g className="gm-tufts">
      {[[-7, 0], [4, -2], [9, 2]].slice(0, 2 + (seed % 2)).map(([x, y]) => (
        <path key={x} d={`M${x - 2.5} ${y - 3} Q${x - 1} ${y - 1} ${x} ${y} Q${x} ${y - 2.5} ${x + 0.4} ${y - 4.5} M${x} ${y} Q${x + 1} ${y - 1.5} ${x + 2.6} ${y - 3}`} fill="none" className="gm-tuft" strokeWidth={1.1} strokeLinecap="round" />
      ))}
    </g>
  );
}

// Galar-style relief: flat slate peaks with a lit left face and a scalloped snowcap.
function Peak({ cx, base, w, h, snowy, back = false }: { cx: number; base: number; w: number; h: number; snowy: boolean; back?: boolean }) {
  const top = base - h;
  const cap = h * 0.36;
  return (
    <g>
      <path
        d={`M${cx - w / 2} ${base} L${cx - w * 0.09} ${base - h * 0.94} Q${cx} ${base - h * 1.04} ${cx + w * 0.09} ${base - h * 0.94} L${cx + w / 2} ${base} Z`}
        className={back ? "gm-peak-back" : "gm-peak"}
      />
      <path d={`M${cx + w * 0.02} ${base - h * 0.97} L${cx + w / 2} ${base} L${cx + w * 0.12} ${base} Z`} className={back ? "gm-peak" : "gm-peak-shade"} />
      {snowy && (
        <path
          d={`M${cx - w * 0.09 - cap * 0.3} ${top + cap} L${cx - w * 0.09} ${top + h * 0.06} Q${cx} ${top - h * 0.04} ${cx + w * 0.09} ${top + h * 0.06} L${cx + w * 0.09 + cap * 0.3} ${top + cap} L${cx + cap * 0.2} ${top + cap * 0.72} L${cx} ${top + cap * 1.05} L${cx - cap * 0.22} ${top + cap * 0.7} Z`}
          className="gm-snow"
        />
      )}
    </g>
  );
}

const heightOf = (elevation: number) => Math.min(1, Math.max(0, (elevation - 2500) / 3000));

// A range of overlapping peaks, back to front; `lone` draws a single cone for an isolated volcano.
export function Massif({ elevation, scale, snowy, flip, lone = false }: { elevation: number; scale: number; snowy: boolean; flip: boolean; lone?: boolean }) {
  const t = heightOf(elevation);
  const w = (36 + 34 * t) * scale;
  const h = (28 + 30 * t) * scale;
  return (
    <g transform={flip ? "scale(-1 1)" : undefined}>
      <ellipse cx={0} cy={h * 0.02} rx={w * (lone ? 0.5 : 0.8)} ry={h * 0.1} className="gm-shadow" />
      {!lone && (
        <>
          <Peak cx={-w * 0.42} base={-h * 0.04} w={w * 0.62} h={h * 0.66} snowy={snowy && t > 0.3} back />
          <Peak cx={w * 0.4} base={-h * 0.02} w={w * 0.58} h={h * 0.6} snowy={false} back />
        </>
      )}
      <Peak cx={0} base={0} w={lone ? w * 1.1 : w} h={h} snowy={snowy} />
    </g>
  );
}

// Desert relief: a flat-topped mesa or a cluster of rock outcrops, never a pyramid.
export function Mesa({ seed, scale }: { seed: number; scale: number }) {
  const w = 34 * scale;
  const h = 15 * scale;
  if (seed % 3 === 2) {
    return (
      <g>
        {[[-w * 0.22, h * 0.9, w * 0.36], [w * 0.18, h * 0.65, w * 0.3]].map(([x, rh, rw]) => (
          <g key={x}>
            <path d={`M${x - rw / 2} 0 L${x - rw * 0.32} ${-rh} H${x + rw * 0.3} L${x + rw / 2} 0 Z`} className="gm-mesa gm-mesa-edge" strokeWidth={1} strokeLinejoin="round" />
            <path d={`M${x + rw * 0.08} ${-rh} H${x + rw * 0.3} L${x + rw / 2} 0 H${x + rw * 0.12} Z`} className="gm-mesa-shade" />
          </g>
        ))}
      </g>
    );
  }
  return (
    <g>
      <ellipse cx={0} cy={0} rx={w * 0.55} ry={h * 0.16} className="gm-shadow" />
      <path d={`M${-w / 2} 0 L${-w * 0.32} ${-h} H${w * 0.3} L${w / 2} 0 Z`} className="gm-mesa gm-mesa-edge" strokeWidth={1.1} strokeLinejoin="round" />
      <path d={`M${w * 0.12} ${-h} H${w * 0.3} L${w / 2} 0 H${w * 0.2} Z`} className="gm-mesa-shade" />
      <path d={`M${-w * 0.42} ${-h * 0.45} H${w * 0.4}`} className="gm-mesa-band" strokeWidth={1.2} strokeLinecap="round" />
      <path d={`M${-w * 0.33} ${-h * 0.94} H${w * 0.29}`} className="gm-mesa-top" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

// A rounded grassy hump, khaki on dry ground.
export function Hump({ size, dry }: { size: number; dry: boolean }) {
  return (
    <g className={dry ? "gm-dry" : undefined}>
      <path d={`M${-size / 2} 0 C${-size / 2} ${-size * 0.55} ${size / 2} ${-size * 0.55} ${size / 2} 0 Z`} className="gm-hump" />
      <path d={`M${size * 0.05} ${-size * 0.4} C${size * 0.35} ${-size * 0.36} ${size / 2} ${-size * 0.2} ${size / 2} 0 L${size * 0.15} 0 Z`} className="gm-hump-shade" />
    </g>
  );
}

export function Cactus() {
  return (
    <g className="gm-cactus" strokeWidth={1}>
      <rect x={-2.5} y={-14} width={5} height={14} rx={2.5} />
      <path d="M-2.5 -6 h-3.5 a2 2 0 0 1 -2 -2 v-4.5 a1.6 1.6 0 0 1 3.2 0 v3.3 h2.3 z" />
      <path d="M2.5 -8 h3 a1.8 1.8 0 0 0 1.8 -1.8 v-3.6 a1.6 1.6 0 0 0 -3.2 0 v2.2 h-1.6 z" />
    </g>
  );
}

export function Dunes({ seed }: { seed: number }) {
  return (
    <g transform={seed % 2 ? "scale(-1 1)" : undefined}>
      <path d="M-14 0 q5 -6 10 -3 t8 1" className="gm-dune" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M-2 6 q5 -5 9 -2.5 t7 1" className="gm-dune" strokeWidth={1.7} fill="none" strokeLinecap="round" />
    </g>
  );
}
