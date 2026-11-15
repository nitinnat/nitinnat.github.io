"use client";

import { useEffect, useState } from "react";
import { project } from "./map-shared";

export interface Peak {
  id: number;
  x: number;
  y: number;
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
          return { id, x, y, elevation };
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
// skipping anything too close to already-occupied points such as landmarks.
export function selectSpaced<T extends { x: number; y: number }>(
  items: T[],
  bounds: Bounds,
  spacing: number,
  occupied: { x: number; y: number }[],
  limit: number,
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
  for (const item of items) {
    if (chosen.length >= limit) break;
    if (item.x < bounds.x0 - margin || item.x > bounds.x1 + margin || item.y < bounds.y0 - margin || item.y > bounds.y1 + margin) continue;
    if (crowded(item)) continue;
    add(item);
    chosen.push(item);
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

export function Mountain({ elevation, size = 1, variant = 0 }: { elevation: number; size?: number; variant?: number }) {
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
      {range.summits.map((summit, i) => {
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

const HILLS = [
  { w: 26, h: 11, peak: 0 },
  { w: 22, h: 9, peak: 0.12 },
  { w: 32, h: 13, peak: -0.08 },
];

export function Hill({ variant = 0 }: { variant?: number }) {
  const { w, h, peak } = HILLS[variant % HILLS.length];
  const p = peak * w;
  return (
    <g>
      <path d={`M${-w / 2} 0 C${p - w * 0.32} ${-h * 1.33} ${p + w * 0.32} ${-h * 1.33} ${w / 2} 0`} className="gm-hill-lit gm-hill-edge" strokeWidth={0.9} />
      <path
        d={`M${p + w * 0.06} ${-h} C${p + w * 0.26} ${-h * 0.98} ${w * 0.42} ${-h * 0.5} ${w / 2 - 0.4} -0.2 L${p + w * 0.12} -0.2 C${p + w * 0.16} ${-h * 0.4} ${p + w * 0.12} ${-h * 0.75} ${p + w * 0.06} ${-h} Z`}
        className="gm-hill-shade"
      />
      <path d={`M${p - w * 0.3} ${-h * 0.5} Q${p - w * 0.2} ${-h * 0.92} ${p - w * 0.02} ${-h * 0.94}`} className="gm-hill-highlight" fill="none" strokeWidth={1.3} strokeLinecap="round" />
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

export function Trees() {
  return <Forest seed={2} size={0.6} />;
}

const ROOFS = ["gm-roof", "gm-roof-brown", "gm-roof", "gm-roof-slate", "gm-roof-brown"];

function House({ x, y, w, h, roof }: { x: number; y: number; w: number; h: number; roof: string }) {
  const top = y - h;
  const ridge = top - w * 0.42;
  return (
    <g>
      <rect x={x - w / 2} y={top} width={w} height={h} className="gm-wall" />
      <rect x={x + w * 0.15} y={top} width={w * 0.35} height={h} className="gm-wall-shade" />
      <path d={`M${x - w / 2 - 1.2} ${top + 0.6} L${x - w / 2 + 1.4} ${ridge} H${x + w / 2 - 1.4} L${x + w / 2 + 1.2} ${top + 0.6} Z`} className={roof} />
      <path d={`M${x + w * 0.2} ${ridge} H${x + w / 2 - 1.4} L${x + w / 2 + 1.2} ${top + 0.6} H${x + w * 0.3} Z`} className={`${roof}-shade`} />
      <path d={`M${x - w / 2 - 1.2} ${top + 0.6} H${x + w / 2 + 1.2}`} className={`${roof}-edge`} strokeWidth={1.1} strokeLinecap="round" />
      <rect x={x - w * 0.3} y={y - 2.8} width={1.8} height={2.8} className="gm-door" />
      <rect x={x + w * 0.05} y={top + 1.6} width={1.5} height={1.5} className="gm-door" />
    </g>
  );
}

function Tower({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 1, 2].map((tier) => {
        const base = y - tier * 6.2;
        const half = 4 - tier * 0.8;
        return (
          <g key={tier}>
            <rect x={x - half} y={base - 5} width={half * 2} height={5} className="gm-wall" />
            <rect x={x + half * 0.2} y={base - 5} width={half * 0.8} height={5} className="gm-wall-shade" />
            <path d={`M${x - half - 2.6} ${base - 4.2} Q${x - half} ${base - 5} ${x - half + 0.8} ${base - 7.2} H${x + half - 0.8} Q${x + half} ${base - 5} ${x + half + 2.6} ${base - 4.2} Z`} className="gm-roof-brown" />
            <path d={`M${x + half * 0.3} ${base - 7.2} H${x + half - 0.8} Q${x + half} ${base - 5} ${x + half + 2.6} ${base - 4.2} H${x + half * 0.5} Z`} className="gm-roof-brown-shade" />
          </g>
        );
      })}
      <path d={`M${x} ${y - 19.6} V${y - 24}`} className="gm-roof-brown-edge" strokeWidth={1} strokeLinecap="round" />
    </g>
  );
}

const SMALL_TOWN = [[-7, -3, 8, 6], [5, -4, 9, 6.5], [-2, 2, 10, 7], [9, 2, 7, 5.5]];
const LARGE_TOWN = [[-11, -4, 8, 6], [12, -3, 9, 6.5], [-5, 2, 10, 7], [7, 3, 9, 6.5], [-15, 3, 7, 5.5], [16, 4, 7, 5], [-1, -6, 7, 5.5]];

export function Town({ size = "small", seed = 0 }: { size?: "small" | "large"; seed?: number }) {
  const large = size === "large";
  const houses = (large ? LARGE_TOWN.slice(0, 5 + (seed % 3)) : SMALL_TOWN.slice(0, 3 + (seed % 2)))
    .map(([x, y, w, h], i) => ({ x, y, w, h, roof: ROOFS[(i + seed) % ROOFS.length] }))
    .sort((a, b) => a.y - b.y);
  const back = houses.filter((house) => house.y < 0);
  return (
    <g>
      <ellipse cx={0} cy={1} rx={large ? 22 : 15} ry={large ? 6.5 : 4.8} className="gm-ground gm-ground-edge" strokeWidth={0.8} />
      {back.map((house) => <House key={`${house.x}`} {...house} />)}
      {large && <Tower x={2} y={-1} />}
      {houses.filter((house) => house.y >= 0).map((house) => <House key={`${house.x}`} {...house} />)}
    </g>
  );
}
