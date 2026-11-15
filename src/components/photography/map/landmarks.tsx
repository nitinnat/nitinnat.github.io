"use client";

import type { ComponentType } from "react";
import { Forest, Mountain } from "./terrain";

// Illustrations are drawn in screen pixels with the base centred on the origin (y grows down).

const ORANGE = { lit: "#d65a3f", shade: "#a33b29", edge: "#7d2a1d" };
const ROCK = { lit: "#cd6e48", shade: "#94442d", edge: "#6e2f1f", base: "#e0a77c", band: "#e49a72" };
const STONE = { lit: "#d4ccba", shade: "#a39986", edge: "#7f7564" };
const VERDIGRIS = { lit: "#72b8a6", shade: "#438a79", edge: "#2f6a5c" };
const PINE = { lit: "#4f8a52", shade: "#33663c", edge: "#24502e" };
const GRASS = { lit: "#a6cd7b", shade: "#88b55f", edge: "#6f9b4c" };

type Point = [number, number];

const quad = ([x0, y0]: Point, [cx, cy]: Point, [x1, y1]: Point, t: number): Point => [
  (1 - t) ** 2 * x0 + 2 * t * (1 - t) * cx + t ** 2 * x1,
  (1 - t) ** 2 * y0 + 2 * t * (1 - t) * cy + t ** 2 * y1,
];

function Water({ width }: { width: number }) {
  return (
    <g>
      <ellipse cx={0} cy={1.5} rx={width / 2} ry={width / 9} className="gm-water" />
      <path
        d={`M${-width / 3} 2 q${width / 12} -1.6 ${width / 6} 0 t${width / 6} 0 t${width / 6} 0 t${width / 6} 0`}
        className="gm-water-line"
        strokeWidth={0.9}
        strokeLinecap="round"
      />
    </g>
  );
}

function GoldenGate() {
  const tower = (x: number) => (
    <g>
      <rect x={x - 2.2} y={-32} width={4.4} height={33} fill={ORANGE.lit} stroke={ORANGE.edge} strokeWidth={0.6} />
      <rect x={x + 0.2} y={-32} width={2} height={33} fill={ORANGE.shade} />
      <path d={`M${x - 2.2} -26 h4.4 M${x - 2.2} -18 h4.4`} stroke={ORANGE.edge} strokeWidth={1.3} />
    </g>
  );
  const cables: [Point, Point, Point][] = [
    [[-31, -9], [-22, -10], [-13, -31]],
    [[-13, -31], [0, -12], [13, -31]],
    [[13, -31], [22, -10], [31, -9]],
  ];
  return (
    <g>
      <Water width={66} />
      <path d="M-34 2 Q-33 -9 -24 -8 Q-21 -4 -21 2 Z" fill={GRASS.lit} stroke={GRASS.edge} strokeWidth={0.7} />
      <path d="M34 2 Q33 -9 24 -8 Q21 -4 21 2 Z" fill={GRASS.shade} stroke={GRASS.edge} strokeWidth={0.7} />
      {cables.flatMap(([a, c, b], i) =>
        [0.2, 0.4, 0.6, 0.8].map((t) => {
          const [x, y] = quad(a, c, b, t);
          return <path key={`${i}-${t}`} d={`M${x.toFixed(1)} ${y.toFixed(1)} V-9`} stroke={ORANGE.lit} strokeWidth={0.6} />;
        }),
      )}
      <rect x={-31} y={-10} width={62} height={3.2} rx={1} fill={ORANGE.lit} stroke={ORANGE.edge} strokeWidth={0.6} />
      <rect x={-31} y={-8} width={62} height={1.2} fill={ORANGE.shade} />
      {tower(-13)}
      {tower(13)}
      <path d={cables.map(([a, c, b], i) => `${i ? "" : `M${a[0]} ${a[1]}`} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`).join(" ")} fill="none" stroke={ORANGE.shade} strokeWidth={1.4} />
    </g>
  );
}

function Liberty() {
  return (
    <g>
      <ellipse cx={0} cy={0} rx={14} ry={4} fill={GRASS.lit} stroke={GRASS.edge} strokeWidth={0.7} />
      <path d="M-7.5 0 L7.5 0 L6.5 -5 L-6.5 -5 Z" fill={STONE.lit} stroke={STONE.edge} strokeWidth={0.6} />
      <path d="M1.5 0 L7.5 0 L6.5 -5 L1.5 -5 Z" fill={STONE.shade} />
      <rect x={-4.6} y={-14} width={9.2} height={9} fill={STONE.lit} stroke={STONE.edge} strokeWidth={0.6} />
      <rect x={0.8} y={-14} width={3.8} height={9} fill={STONE.shade} />
      <rect x={-5.6} y={-15.4} width={11.2} height={1.8} rx={0.5} fill={STONE.lit} stroke={STONE.edge} strokeWidth={0.6} />
      <path d="M-4 -15.4 Q-4.8 -23 -2.6 -30 L2.6 -30 Q4.4 -23 4 -15.4 Z" fill={VERDIGRIS.lit} stroke={VERDIGRIS.edge} strokeWidth={0.7} />
      <path d="M0.4 -30 L2.6 -30 Q4.4 -23 4 -15.4 L1 -15.4 Q2 -23 0.4 -30 Z" fill={VERDIGRIS.shade} />
      <path d="M-4.2 -25.5 l-2.2 3.8 l2.6 1.1 l1.3 -3.2 Z" fill={VERDIGRIS.shade} stroke={VERDIGRIS.edge} strokeWidth={0.5} />
      <path d="M2 -28.5 L5 -40.5" stroke={VERDIGRIS.edge} strokeWidth={2.8} strokeLinecap="round" />
      <path d="M2 -28.5 L5 -40.5" stroke={VERDIGRIS.lit} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M-2.8 -33.4 l-1.8 -1.8 M-1.2 -34.6 l-0.5 -2.4 M1.2 -34.6 l0.5 -2.4 M2.8 -33.4 l1.8 -1.8" stroke={VERDIGRIS.edge} strokeWidth={0.9} strokeLinecap="round" />
      <circle cx={0} cy={-32} r={2.5} fill={VERDIGRIS.lit} stroke={VERDIGRIS.edge} strokeWidth={0.6} />
      <rect x={3.9} y={-43} width={2.4} height={2} fill="#c88a2e" />
      <path d="M5.1 -49 q3 3 0.7 5.8 q-3 -1 -0.7 -5.8 Z" fill="#f0a73c" />
      <path d="M5.2 -46.6 q1.4 1.5 0.3 3 q-1.4 -0.6 -0.3 -3 Z" fill="#f8d66d" />
    </g>
  );
}

function Niagara() {
  const lip = (t: number) => -12 + 24 * t * (1 - t);
  return (
    <g>
      <path d="M-25 4 L-23 -12 L-20 -12 Q0 0 20 -12 L23 -12 L25 4 Z" fill={STONE.shade} stroke={STONE.edge} strokeWidth={0.7} />
      <path d="M-20 -12 Q0 0 20 -12 L20 -18 Q0 -8 -20 -18 Z" className="gm-water" />
      <path d="M-20 -12 Q0 0 20 -12 L20 -3 Q0 9 -20 -3 Z" fill="#d6eef6" stroke="#8cc0d4" strokeWidth={0.6} />
      {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((t) => (
        <path key={t} d={`M${-20 + 40 * t} ${lip(t) + 1} v8`} className="map-falls" stroke="#ffffff" strokeWidth={0.9} strokeDasharray="2 2" />
      ))}
      <ellipse cx={0} cy={4} rx={19} ry={4} className="gm-water" />
      <ellipse cx={0} cy={3} rx={14} ry={2.4} fill="#ffffff" fillOpacity={0.85} />
      <path d="M-29 -10 Q-28 -21 -20 -19 L-20 -12 L-23 -8 Z" fill={GRASS.lit} stroke={GRASS.edge} strokeWidth={0.7} />
      <path d="M29 -10 Q28 -21 20 -19 L20 -12 L23 -8 Z" fill={GRASS.shade} stroke={GRASS.edge} strokeWidth={0.7} />
      <g transform="translate(-24 -14)">
        <Forest seed={1} size={0.32} />
      </g>
      <g transform="translate(24 -14)">
        <Forest seed={3} size={0.32} />
      </g>
    </g>
  );
}

function DelicateArch() {
  return (
    <g>
      <ellipse cx={0} cy={0} rx={18} ry={3.8} fill={ROCK.base} stroke={ROCK.shade} strokeWidth={0.6} />
      <path
        d="M-13 0 L-11 -17 Q-9 -31 0 -31 Q10 -31 11 -16 L13 0 L7 0 L6.5 -13 Q5.5 -22 0 -22 Q-5.5 -22 -6 -13 L-7 0 Z"
        fill={ROCK.lit}
        stroke={ROCK.edge}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <path d="M7 0 L6.5 -13 Q5.5 -22 0 -22 L0 -31 Q10 -31 11 -16 L13 0 Z" fill={ROCK.shade} />
      <path d="M-12.3 -6 H-6.6 M-11.6 -12 H-6.3 M-10.6 -18 H-7" stroke={ROCK.band} strokeWidth={0.9} />
      <path d="M-8 -25.5 Q-4.5 -29.5 0 -29.6" fill="none" stroke={ROCK.band} strokeWidth={1.1} strokeLinecap="round" />
      <path d="M-17 1 q2 -4 5 -2 q1 -2 3 0.5 Z M10 1 q2 -3.5 4.5 -1.5 q2 -1 3 1.5 Z" fill={ROCK.shade} />
    </g>
  );
}

function Denali() {
  return (
    <g>
      <g transform="translate(-20 1)">
        <Mountain elevation={3800} size={0.7} variant={1} />
      </g>
      <g transform="translate(19 2)">
        <Mountain elevation={3400} size={0.62} variant={2} />
      </g>
      <Mountain elevation={6200} />
    </g>
  );
}

function HaystackRock() {
  return (
    <g>
      <Water width={46} />
      <path d="M11 1 L12.6 -9 Q13.6 -11.5 15 -9 L16.6 1 Z" fill="#77706a" stroke="#3f3a35" strokeWidth={0.6} />
      <path d="M14 -10.6 Q15 -9 16.6 1 L14.6 1 Z" fill="#514b45" />
      <path d="M-11 1 L-9 -15 Q-7 -27 0 -29 Q7 -25 9 -13 L12 1 Z" fill="#7a736b" stroke="#3f3a35" strokeWidth={0.8} strokeLinejoin="round" />
      <path d="M0 -29 Q7 -25 9 -13 L12 1 L3 1 Q4 -14 0 -29 Z" fill="#544e47" />
      <path d="M-6.5 -22.5 Q0 -31 6.5 -23.5 Q2 -21 -1 -23 Q-3.5 -21 -6.5 -22.5 Z" fill={GRASS.lit} stroke={GRASS.edge} strokeWidth={0.6} />
      <ellipse cx={0} cy={1.5} rx={13} ry={1.8} fill="#ffffff" fillOpacity={0.8} />
      <path d="M13 -27 l2.2 -1.6 l2.2 1.6 M18 -32 l1.8 -1.3 l1.8 1.3" fill="none" stroke="#4a443e" strokeWidth={0.8} strokeLinecap="round" />
    </g>
  );
}

function Redwoods() {
  const tree = (x: number, height: number) => (
    <g key={x}>
      <rect x={x - 1.1} y={-5} width={2.2} height={5} fill="#7a4a2c" />
      {[0, 1, 2].map((tier) => {
        const base = -4 - tier * height * 0.27;
        const top = base - height * 0.42;
        const half = 6.8 - tier * 1.7;
        return (
          <g key={tier}>
            <path d={`M${x - half} ${base} L${x} ${top} L${x + half} ${base} Z`} fill={PINE.lit} stroke={PINE.edge} strokeWidth={0.7} strokeLinejoin="round" />
            <path d={`M${x} ${top} L${x + half} ${base} L${x + 0.8} ${base} Z`} fill={PINE.shade} />
          </g>
        );
      })}
    </g>
  );
  return (
    <g>
      <ellipse cx={0} cy={0} rx={17} ry={3.6} className="gm-forest-floor" />
      {tree(-9, 27)}
      {tree(9, 24)}
      {tree(0, 38)}
    </g>
  );
}

function Balloons() {
  const balloon = (x: number, y: number, [main, stripe, shade]: [string, string, string], delay: string) => (
    <g className="map-float" style={{ animationDelay: delay }}>
      <g transform={`translate(${x} ${y})`}>
        <path d="M-2.8 2.5 L-2 7 M2.8 2.5 L2 7" stroke="#6b4a2e" strokeWidth={0.6} />
        <rect x={-2.2} y={6.6} width={4.4} height={3} rx={0.6} fill="#a06a3c" stroke="#6b4a2e" strokeWidth={0.5} />
        <path d="M0 -17 C-11 -17 -11 -3 -3.2 2.5 L3.2 2.5 C11 -3 11 -17 0 -17 Z" fill={main} stroke={shade} strokeWidth={0.7} />
        <path d="M0 -17 C-3.6 -17 -3.6 -3 -1.4 2.5 L1.4 2.5 C3.6 -3 3.6 -17 0 -17 Z" fill={stripe} />
        <path d="M0 -17 C11 -17 11 -3 3.2 2.5 L2 2.5 C7 -3 7.5 -15 0 -17 Z" fill={shade} />
        <circle cx={-4.6} cy={-11} r={1.6} fill="#ffffff" fillOpacity={0.55} />
      </g>
    </g>
  );
  return (
    <g>
      {balloon(-8, -12, ["#e05d44", "#f2b84b", "#a8392a"], "0s")}
      {balloon(8, -25, ["#4a9fd1", "#f2f0e6", "#2f6e99"], "-1.6s")}
    </g>
  );
}

function Palms() {
  const palm = (x: number, lean: number) => {
    const crown: Point = [x + lean, -24];
    return (
      <g key={x}>
        <path d={`M${x} 0 Q${x + lean * 0.3} -12 ${crown[0]} ${crown[1]}`} fill="none" stroke="#6b4d2c" strokeWidth={3.2} strokeLinecap="round" />
        <path d={`M${x} 0 Q${x + lean * 0.3} -12 ${crown[0]} ${crown[1]}`} fill="none" stroke="#a07a4a" strokeWidth={1.8} strokeLinecap="round" />
        {[-165, -125, -60, -20, 25, 155].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const tip: Point = [crown[0] + Math.cos(rad) * 12, crown[1] + Math.sin(rad) * 8 + 3];
          const mid: Point = [(crown[0] + tip[0]) / 2, (crown[1] + tip[1]) / 2 - 3];
          return (
            <path
              key={angle}
              d={`M${crown[0]} ${crown[1]} Q${mid[0]} ${mid[1] - 2.6} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)} Q${mid[0]} ${mid[1] + 2.2} ${crown[0]} ${crown[1]} Z`}
              fill={i % 2 ? PINE.shade : "#5ea55a"}
              stroke={PINE.edge}
              strokeWidth={0.5}
            />
          );
        })}
        <circle cx={crown[0] - 1} cy={crown[1] + 1.6} r={1.3} fill="#7a5230" />
        <circle cx={crown[0] + 1.2} cy={crown[1] + 1.8} r={1.3} fill="#5e3e22" />
      </g>
    );
  };
  return (
    <g>
      <Water width={44} />
      <ellipse cx={0} cy={0} rx={16} ry={3.6} fill="#eedba8" stroke="#c9b07a" strokeWidth={0.7} />
      {palm(-5, -4)}
      {palm(6, 5)}
    </g>
  );
}

function SpaceNeedle() {
  return (
    <g>
      <ellipse cx={0} cy={0} rx={11} ry={3} fill={GRASS.lit} stroke={GRASS.edge} strokeWidth={0.7} />
      <path d="M-6 0 L-1.4 -18 L-2.8 -30 M6 0 L1.4 -18 L2.8 -30" fill="none" stroke={STONE.edge} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M-6 0 L-1.4 -18 L-2.8 -30 M6 0 L1.4 -18 L2.8 -30" fill="none" stroke={STONE.lit} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M-2.4 -18 h4.8" stroke={STONE.edge} strokeWidth={1.4} />
      <ellipse cx={0} cy={-31} rx={9.5} ry={3} fill={STONE.lit} stroke={STONE.edge} strokeWidth={0.7} />
      <path d="M0 -34 A9.5 3 0 0 1 9.5 -31 A9.5 3 0 0 1 0 -28 Z" fill={STONE.shade} />
      <path d="M-6 -34.4 h12 l-1.8 2.2 h-8.4 Z" fill="#e0ab45" stroke="#a87a26" strokeWidth={0.5} />
      <path d="M-2.4 -34.4 L0 -37.4 L2.4 -34.4 Z" fill={STONE.lit} stroke={STONE.edge} strokeWidth={0.5} />
      <path d="M0 -37.4 V-46" stroke={STONE.edge} strokeWidth={1} strokeLinecap="round" />
    </g>
  );
}

export interface Landmark {
  id: string;
  name: string;
  lng: number;
  lat: number;
  minZoom: number;
  Art: ComponentType;
}

export const landmarks: Landmark[] = [
  { id: "golden-gate", name: "Golden Gate Bridge", lng: -122.4783, lat: 37.8199, minZoom: 3, Art: GoldenGate },
  { id: "liberty", name: "Statue of Liberty", lng: -74.0445, lat: 40.6892, minZoom: 3, Art: Liberty },
  { id: "niagara", name: "Niagara Falls", lng: -79.0742, lat: 43.0799, minZoom: 4.5, Art: Niagara },
  { id: "delicate-arch", name: "Delicate Arch", lng: -109.4993, lat: 38.7436, minZoom: 3, Art: DelicateArch },
  { id: "denali", name: "Denali", lng: -151.007, lat: 63.0692, minZoom: 2.2, Art: Denali },
  { id: "haystack", name: "Haystack Rock", lng: -123.9686, lat: 45.8844, minZoom: 4.5, Art: HaystackRock },
  { id: "redwoods", name: "Redwoods", lng: -123.95, lat: 40.35, minZoom: 5, Art: Redwoods },
  { id: "balloons", name: "Albuquerque Balloon Fiesta", lng: -106.5946, lat: 35.1958, minZoom: 3, Art: Balloons },
  { id: "palms", name: "Goa beaches", lng: 73.76, lat: 15.54, minZoom: 3, Art: Palms },
  { id: "space-needle", name: "Space Needle", lng: -122.3493, lat: 47.6205, minZoom: 4.5, Art: SpaceNeedle },
];
