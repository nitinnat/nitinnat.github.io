import type { ReactNode } from "react";
import type { Place } from "@/lib/photo-geo";

// Drawn in screen pixels with the base centred on the origin (y grows down), like landmarks.tsx.

export type CityTier = "spot" | "town" | "city";

export function cityTier(photoCount: number): CityTier {
  return photoCount >= 10 ? "city" : photoCount >= 3 ? "town" : "spot";
}

interface Tone {
  lit: string;
  shade: string;
  edge: string;
}

const tone = (lit: string, shade: string, edge: string): Tone => ({ lit, shade, edge });

const C = {
  cream: tone("#f8f0de", "#e3d4b4", "#a8977a"),
  stone: tone("#e6dfd0", "#c3b8a3", "#8a806d"),
  deco: tone("#efe3c6", "#cdbb93", "#8f7d58"),
  brick: tone("#c96b4d", "#a45038", "#753827"),
  red: tone("#d65a3f", "#a33b29", "#7d2a1d"),
  roof: tone("#7b829f", "#5e6584", "#454b66"),
  glass: tone("#9fc6e6", "#719bc7", "#4b6e98"),
  teal: tone("#8fd3c9", "#5eab9f", "#3e7f76"),
  wood: tone("#c48a56", "#9a663c", "#6c4527"),
  log: tone("#b8784a", "#8f5833", "#663c20"),
  bark: tone("#b0543a", "#863b27", "#5c2818"),
  adobe: tone("#dfa77a", "#c08558", "#8d5c37"),
  terracotta: tone("#e07a4f", "#b95b37", "#88401f"),
  white: tone("#fdfdfb", "#e1e5ea", "#a1abb8"),
  metal: tone("#d4dae1", "#a8b1bc", "#737d8a"),
  pine: tone("#4f8a52", "#33663c", "#24502e"),
  redwood: tone("#3f7a4a", "#2c5e38", "#1f4429"),
  leaf: tone("#7fbf5e", "#5e9d45", "#41763a"),
  autumn: tone("#ee9840", "#cc6d2b", "#94471f"),
  maple: tone("#e2583c", "#b83d2b", "#86291d"),
  hill: tone("#9fd07a", "#7fb35e", "#5f8f45"),
  dry: tone("#d3bd82", "#b49e63", "#8a7745"),
  mountain: tone("#9aa2d4", "#7a82b6", "#5a6194"),
  water: tone("#86cfe6", "#64b6d6", "#3f8fb2"),
  gold: tone("#f3c85a", "#d6a53a", "#9c7424"),
  thatch: tone("#e2bd6e", "#c39a4c", "#8e6c2e"),
  mustard: tone("#e8c15e", "#c9a043", "#8f6f22"),
};

const PASTEL = [
  tone("#f4a9bd", "#d9849b", "#a95c72"),
  tone("#a6dcc4", "#7dbea3", "#4f8f74"),
  tone("#f6d67c", "#dcb655", "#a2822e"),
  tone("#c5b3ea", "#a28fd0", "#6f5fa3"),
  tone("#a3cbef", "#7aa9d6", "#4e78a6"),
];

type GroundTone = [fill: string, edge: string];

const GROUND: Record<string, GroundTone> = {
  pave: ["#f1e4c3", "#c9b183"],
  salt: ["#fbfbf6", "#c9c8bc"],
  snow: ["#f3f8fd", "#b4c4d8"],
  sand: ["#f6e2a8", "#d1b066"],
  field: ["#c4dd90", "#8db25e"],
  clay: ["#f0d3a6", "#c99c63"],
  grass: ["#b9d98f", "#7fa75a"],
};

const SW = 0.6;
const WIN = "#fff3c4";
const DARK = "#4a4258";

const r2 = (v: number) => Math.round(v * 100) / 100;
const poly = (...p: number[]) => `M${p.map(r2).join(" ")}Z`;
const line = (...p: number[]) => `M${p.map(r2).join(" ")}`;
const rect = (x: number, y: number, w: number, h: number) => `M${r2(x)} ${r2(y)}h${r2(w)}v${r2(h)}h${r2(-w)}Z`;
const grid = (x: number, y: number, cols: number, rows: number, dx = 2.2, dy = 2.8, w = 1.1, h = 1.5) =>
  Array.from({ length: cols * rows }, (_, i) => rect(x + (i % cols) * dx, y + Math.floor(i / cols) * dy, w, h)).join("");

function Solid({ d, s, c }: { d: string; s?: string; c: Tone }) {
  return (
    <>
      <path d={d} fill={c.lit} />
      {s && <path d={s} fill={c.shade} />}
      <path d={d} fill="none" stroke={c.edge} strokeWidth={SW} strokeLinejoin="round" />
    </>
  );
}

function Stroke({ d, color, w = SW }: { d: string; color: string; w?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

interface At {
  x: number;
  y?: number;
}

function Box({ x, y = 0, w, h, c }: At & { w: number; h: number; c: Tone }) {
  return <Solid d={rect(x - w / 2, y - h, w, h)} s={rect(x + w / 6, y - h, w / 3, h)} c={c} />;
}

function Tower({ x, y = 0, w, h, c, win = WIN }: At & { w: number; h: number; c: Tone; win?: string }) {
  const cols = Math.max(1, Math.floor((w - 0.6) / 2.2));
  const rows = Math.max(1, Math.floor((h - 2) / 2.8));
  return (
    <>
      <Box x={x} y={y} w={w} h={h} c={c} />
      <path d={grid(x - (cols * 2.2 - 1.1) / 2, y - h + 1.4, cols, rows)} fill={win} />
    </>
  );
}

function Gable({ x, y, w, rise, c, snow }: At & { y: number; w: number; rise: number; c: Tone; snow?: boolean }) {
  return (
    <>
      <Solid d={poly(x - w / 2, y, x, y - rise, x + w / 2, y)} s={poly(x, y - rise, x + w / 2, y, x, y)} c={c} />
      {snow && <Stroke d={line(x - w / 2 + 0.4, y - 0.3, x, y - rise, x + w / 2 - 0.4, y - 0.3)} color="#fff" w={1.4} />}
    </>
  );
}

function House({ x, y = 0, w = 7, h = 5, wall = C.cream, roof = C.red, snow, logs }: At & {
  w?: number;
  h?: number;
  wall?: Tone;
  roof?: Tone;
  snow?: boolean;
  logs?: boolean;
}) {
  const top = y - h;
  return (
    <>
      <Box x={x} y={y} w={w} h={h} c={wall} />
      {logs && <Stroke d={[1.3, 2.6, 3.9].filter((d) => d < h).map((d) => line(x - w / 2, y - d, x + w / 2, y - d)).join("")} color={wall.edge} w={0.4} />}
      <Gable x={x} y={top + 0.3} w={w + 2} rise={w * 0.5} c={roof} snow={snow} />
      <path d={rect(x - 0.8, y - 2.4, 1.6, 2.4)} fill={wall.edge} />
      {w >= 6 && <path d={rect(x - w / 2 + 1, y - h + 1.4, 1.3, 1.4) + rect(x + w / 2 - 2.3, y - h + 1.4, 1.3, 1.4)} fill={WIN} />}
    </>
  );
}

function Pine({ x, y = 0, h = 10, c = C.pine, snow }: At & { h?: number; c?: Tone; snow?: boolean }) {
  const w = h * 0.55;
  return (
    <>
      <path d={rect(x - 0.5, y - 1.6, 1, 1.6)} fill="#7a5233" />
      <Solid d={poly(x, y - h, x + w / 2, y - 1.4, x - w / 2, y - 1.4)} s={poly(x, y - h, x + w / 2, y - 1.4, x, y - 1.4)} c={c} />
      {snow && <Stroke d={line(x - w * 0.2, y - h * 0.62, x, y - h + 0.3, x + w * 0.2, y - h * 0.62)} color="#fff" w={1.2} />}
    </>
  );
}

function Redwood({ x, y = 0, h }: At & { h: number }) {
  const w = h * 0.3;
  return (
    <>
      <Solid d={rect(x - 0.9, y - h * 0.4, 1.8, h * 0.4)} s={rect(x, y - h * 0.4, 0.9, h * 0.4)} c={C.bark} />
      <Solid
        d={poly(x, y - h, x + w * 0.35, y - h * 0.72, x + w * 0.5, y - h * 0.3, x - w * 0.5, y - h * 0.3, x - w * 0.35, y - h * 0.72)}
        s={poly(x, y - h, x + w * 0.35, y - h * 0.72, x + w * 0.5, y - h * 0.3, x, y - h * 0.3)}
        c={C.redwood}
      />
    </>
  );
}

function Tree({ x, y = 0, s = 3, c = C.leaf }: At & { s?: number; c?: Tone }) {
  return (
    <>
      <path d={rect(x - 0.5, y - s * 0.9, 1, s * 0.9)} fill="#7a5233" />
      <circle cx={x} cy={y - s * 1.5} r={s} fill={c.lit} stroke={c.edge} strokeWidth={SW} />
      <path d={`M${r2(x + s * 0.2)} ${r2(y - s * 2.45)}a${s} ${s} 0 0 1 0 ${r2(s * 1.9)}Z`} fill={c.shade} />
    </>
  );
}

function Palm({ x, y = 0, h, lean = 2 }: At & { h: number; lean?: number }) {
  const tx = x + lean;
  const ty = y - h;
  const fronds = [
    [-4.4, 1.2, -2.4, -1.8],
    [4.4, 1.2, 2.4, -1.8],
    [-3.2, -1.4, -1.6, -2.6],
    [3.2, -1.4, 1.6, -2.6],
    [-1.6, 3, -2, 0.4],
    [1.8, 3, 2, 0.4],
  ]
    .map(([ex, ey, cx, cy]) => `M${r2(tx)} ${r2(ty)}q${cx} ${cy} ${ex} ${ey}`)
    .join("");
  return (
    <>
      <Stroke d={`M${x} ${y}q${r2(lean * 0.15)} ${r2(-h * 0.6)} ${lean} ${-h}`} color="#7d5634" w={1.5} />
      <Stroke d={`M${x} ${y}q${r2(lean * 0.15)} ${r2(-h * 0.6)} ${lean} ${-h}`} color="#b88a58" w={0.8} />
      <Stroke d={fronds} color="#2f6b3a" w={1.7} />
      <Stroke d={fronds} color="#5fae55" w={0.9} />
    </>
  );
}

function Peak({ x, y = 0, w, h, c = C.mountain, snow = 0.32 }: At & { w: number; h: number; c?: Tone; snow?: number }) {
  const sx = (w / 2) * snow;
  const sy = y - h + h * snow;
  return (
    <>
      <Solid d={poly(x - w / 2, y, x, y - h, x + w / 2, y)} s={poly(x, y - h, x + w / 2, y, x + w * 0.1, y)} c={c} />
      {snow > 0 && (
        <path
          d={poly(x - sx, sy, x, y - h, x + sx, sy, x + sx * 0.4, sy - h * 0.06, x, sy + h * 0.02, x - sx * 0.45, sy - h * 0.07)}
          fill="#fff"
          stroke={c.edge}
          strokeWidth={0.4}
          strokeLinejoin="round"
        />
      )}
    </>
  );
}

function Hump({ x, y = 0, w, h, c }: At & { w: number; h: number; c: Tone }) {
  return (
    <Solid
      d={`M${x - w / 2} ${y}Q${x - w / 4} ${y - h} ${x} ${y - h}T${x + w / 2} ${y}Z`}
      s={`M${x} ${y - h}Q${x + w / 4} ${y - h} ${x + w / 2} ${y}H${x + w * 0.12}Z`}
      c={c}
    />
  );
}

function Water({ x0, x1, y0, y1 }: { x0: number; x1: number; y0: number; y1: number }) {
  const waves = [0.3, 0.65].map((t) => {
    const wy = y0 + (y1 - y0) * t + 0.5;
    const wx = x0 + (x1 - x0) * (t === 0.3 ? 0.2 : 0.55);
    return `M${r2(wx)} ${r2(wy)}q1 -1 2 0t2 0`;
  });
  return (
    <>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={(y1 - y0) / 2} fill={C.water.lit} stroke={C.water.edge} strokeWidth={SW} />
      <Stroke d={waves.join("")} color="#fff" w={0.6} />
    </>
  );
}

function Smoke({ x, y }: { x: number; y: number }) {
  return (
    <g fill="#fff" stroke="#c9cfd8" strokeWidth={0.4} opacity={0.9}>
      <circle cx={x} cy={y} r={1.1} />
      <circle cx={x + 1.6} cy={y - 2} r={1.5} />
    </g>
  );
}

// ---- New York ----------------------------------------------------------

function DecoTower({ x, h }: { x: number; h: number }) {
  const t1 = -h;
  const t2 = t1 - h * 0.35;
  const crown = t2 - 6;
  return (
    <>
      <Box x={x} w={8} h={h} c={C.deco} />
      <Box x={x} y={t1} w={6} h={h * 0.35} c={C.deco} />
      <path d={grid(x - 2.7, t1 + 1.2, 3, Math.floor(h / 2.6) - 1, 2.1, 2.6, 0.9, 1.4) + grid(x - 1.7, t2 + 1, 2, 1, 2.4, 2.6, 0.9, 1.4)} fill={C.deco.edge} />
      <Solid d={`M${x - 2.6} ${t2}Q${x - 2.6} ${crown + 1} ${x} ${crown}Q${x + 2.6} ${crown + 1} ${x + 2.6} ${t2}Z`} s={`M${x} ${crown}Q${x + 2.6} ${crown + 1} ${x + 2.6} ${t2}H${x}Z`} c={C.metal} />
      <Stroke d={`M${x - 1.5} ${t2}Q${x - 1.5} ${crown + 2.4} ${x} ${crown + 1.6}Q${x + 1.5} ${crown + 2.4} ${x + 1.5} ${t2}`} color={C.metal.edge} w={0.4} />
      <path d={poly(x - 1.1, t2 - 0.4, x - 0.6, t2 - 1.6, x - 0.1, t2 - 0.4) + poly(x + 0.1, t2 - 0.4, x + 0.6, t2 - 1.6, x + 1.1, t2 - 0.4)} fill={C.metal.edge} />
      <Solid d={poly(x - 0.6, crown + 0.4, x, crown - 7, x + 0.6, crown + 0.4)} c={C.metal} />
    </>
  );
}

function WaterTower({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Stroke d={line(x - 1.6, y, x - 1.6, y - 2) + line(x + 1.6, y, x + 1.6, y - 2) + line(x - 1.6, y - 1, x + 1.6, y - 2)} color={C.wood.edge} w={0.5} />
      <Solid d={rect(x - 2.2, y - 6.2, 4.4, 4.4)} s={rect(x + 0.6, y - 6.2, 1.6, 4.4)} c={C.wood} />
      <Stroke d={line(x - 2.2, y - 4.8, x + 2.2, y - 4.8) + line(x - 2.2, y - 3.3, x + 2.2, y - 3.3)} color={C.wood.edge} w={0.4} />
      <Solid d={poly(x - 2.7, y - 6.1, x, y - 8.6, x + 2.7, y - 6.1)} s={poly(x, y - 8.6, x + 2.7, y - 6.1, x, y - 6.1)} c={C.roof} />
    </>
  );
}

const SKYLINE: [number, number, number][] = [
  [-25, 5, 13],
  [-20, 6, 19],
  [-8, 5, 24],
  [13, 5, 21],
  [19, 6, 26],
  [25, 5, 15],
];

function NewYork({ r }: { r: number }) {
  return (
    <>
      {r > 1 && <path d={SKYLINE.map(([x, w, h]) => rect(x - w / 2, -h, w, h)).join("")} fill="#b6bcd8" stroke="#8c93b7" strokeWidth={SW} />}
      {r > 1 && <Tower x={-21} w={6} h={11} c={C.stone} />}
      {r > 0 && <Tower x={-14.5} w={6.5} h={18} c={C.glass} win="#d9ecfa" />}
      <Tower x={-7} w={7} h={8} c={C.brick} />
      <WaterTower x={-7.5} y={-8} />
      <DecoTower x={2} h={[11, 14, 17][r]} />
      {r > 0 && <Tower x={10.5} w={6} h={13} c={C.brick} />}
      {r > 1 && <Tower x={17} w={6} h={20} c={C.glass} win="#d9ecfa" />}
      {r > 1 && <Tower x={23} w={5} h={9} c={C.stone} />}
    </>
  );
}

// ---- Buffalo / Niagara -------------------------------------------------

function Elevator({ x, bins, h }: { x: number; bins: number; h: number }) {
  const w = bins * 2.6;
  const x0 = x - w / 2;
  return (
    <>
      <Solid
        d={rect(x0, -h, w, h)}
        s={Array.from({ length: bins }, (_, i) => rect(x0 + i * 2.6 + 1.5, -h, 1.1, h)).join("")}
        c={C.stone}
      />
      <Stroke d={Array.from({ length: bins - 1 }, (_, i) => line(x0 + (i + 1) * 2.6, -h, x0 + (i + 1) * 2.6, 0)).join("")} color={C.stone.edge} w={0.4} />
      <Box x={x0 + 2.2} y={-h} w={4.4} h={h * 0.45} c={C.stone} />
      <path d={grid(x0 + 1, -h - h * 0.45 + 1, 2, 2, 1.6, 2.4, 0.9, 1.2)} fill={C.stone.edge} />
    </>
  );
}

function Freighter({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Solid d={poly(x - 8, y - 2, x + 8, y - 2, x + 6.8, y, x - 7, y)} s={rect(x - 7.6, y - 0.9, 15, 0.9)} c={C.red} />
      <Box x={x + 5} y={y - 2} w={3} h={2.4} c={C.white} />
      <path d={rect(x - 5, y - 2.8, 2.4, 0.8) + rect(x - 1.8, y - 2.8, 2.4, 0.8)} fill={C.stone.shade} />
    </>
  );
}

function Falls({ x }: { x: number }) {
  return (
    <>
      <Solid d={poly(x - 4, 1, x - 4, -10, x + 5, -11, x + 5, 1)} s={rect(x + 2, -10.7, 3, 11.7)} c={C.hill} />
      <path d={rect(x - 3, -10.2, 4.4, 11)} fill={C.water.lit} />
      <Stroke d={line(x - 2, -9.5, x - 2, 0) + line(x - 0.4, -9.5, x - 0.4, 0) + line(x + 0.9, -9.5, x + 0.9, 0)} color="#fff" w={0.6} />
      <g fill="#fff" stroke="#c7dbe6" strokeWidth={0.4}>
        <circle cx={x - 2.6} cy={0.6} r={1.6} />
        <circle cx={x} cy={0.2} r={1.9} />
        <circle cx={x + 2.2} cy={0.8} r={1.4} />
      </g>
    </>
  );
}

function Niagara({ r, w }: { r: number; w: number }) {
  return (
    <>
      {r > 0 && <Elevator x={9} bins={3} h={11} />}
      {r > 1 && <Falls x={20} />}
      <Elevator x={-2} bins={[4, 5, 6][r]} h={[12, 15, 18][r]} />
      {r > 0 && <House x={-14} w={6} h={5} wall={C.brick} roof={C.roof} />}
      <Water x0={-w / 2 + 3} x1={r > 1 ? 14 : w / 2 - 3} y0={0.8} y1={w * 0.17 - 0.6} />
      {r > 1 && <Freighter x={-6} y={w * 0.17 - 1.6} />}
    </>
  );
}

// ---- San Francisco -----------------------------------------------------

function Victorian({ x, y, c }: { x: number; y: number; c: Tone }) {
  const top = y - 7;
  return (
    <>
      <Box x={x} y={y + 1.5} w={4.4} h={8.5} c={c} />
      <Gable x={x} y={top} w={5.4} rise={4} c={C.roof} />
      <path d={rect(x - 1.7, top + 1.6, 2.2, 2.8)} fill="#fffaf0" stroke={c.edge} strokeWidth={0.4} />
      <path d={rect(x + 0.8, y - 1.6, 1, 2.6)} fill={c.edge} />
      <circle cx={x} cy={top - 1.3} r={0.6} fill="#fffaf0" />
    </>
  );
}

function Pyramid({ x, h }: { x: number; h: number }) {
  const hw = (y: number) => 4 - ((4 - 0.9) * -y) / (h - 4);
  const bands = Array.from({ length: Math.floor((h - 6) / 2.5) }, (_, i) => -2 - i * 2.5)
    .map((y) => line(x - hw(y) + 0.5, y, x + hw(y) - 0.5, y))
    .join("");
  return (
    <>
      <Solid d={poly(x - 4, 0, x - 0.9, -h + 4, x, -h, x + 0.9, -h + 4, x + 4, 0)} s={poly(x, -h, x + 0.9, -h + 4, x + 4, 0, x + 0.5, 0)} c={C.white} />
      <Stroke d={bands} color={C.white.edge} w={0.35} />
      <Solid d={rect(x - 2.4, -h * 0.68, 1.1, 2.2) + rect(x + 1.3, -h * 0.68, 1.1, 2.2)} c={C.white} />
    </>
  );
}

function CableCar({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Stroke d={line(x - 6, y + 0.6, x + 6, y + 0.6)} color={C.roof.edge} w={0.5} />
      <Solid d={rect(x - 4.5, y - 5.2, 9, 5)} s={rect(x - 4.5, y - 2.4, 9, 2.2)} c={tone("#f3e5c4", "#cf4a3c", "#7d2a1d")} />
      <path d={grid(x - 3.6, y - 4.4, 4, 1, 2, 2, 1.4, 1.6)} fill="#6b8fb8" />
      <path d={rect(x - 5, y - 6.2, 10, 1.1)} fill="#cf4a3c" stroke="#7d2a1d" strokeWidth={0.5} />
      <circle cx={x - 2.6} cy={y} r={0.8} fill={DARK} />
      <circle cx={x + 2.6} cy={y} r={0.8} fill={DARK} />
    </>
  );
}

const LADIES = [-21, -16.8, -12.6, -8.4, -4.2];

function SanFrancisco({ r }: { r: number }) {
  const shown = LADIES.slice([3, 1, 0][r]);
  const ladyY = (x: number) => (x + 21) * 0.24;
  return (
    <>
      {r > 1 && <Tower x={16} w={6} h={14} c={C.glass} win="#d9ecfa" />}
      {r > 1 && <Tower x={21.5} w={5} h={10} c={C.stone} />}
      {r > 0 && <Tower x={12} w={4.5} h={10} c={C.stone} />}
      <path d={poly(shown[0] - 3, 1.5, shown[0] - 3, -ladyY(shown[0]) + 0.5, -1.5, -ladyY(-1.5) - 0.5, -1.5, 1.5)} fill={C.hill.lit} stroke={C.hill.edge} strokeWidth={SW} />
      {shown.map((x, i) => (
        <Victorian key={x} x={x} y={-ladyY(x)} c={PASTEL[(i + 5 - shown.length) % PASTEL.length]} />
      ))}
      <Pyramid x={5} h={[18, 23, 27][r]} />
      {r > 0 && <CableCar x={13} y={2.4} />}
    </>
  );
}

// ---- Los Angeles -------------------------------------------------------

function Stucco({ x, w = 9, h = 5, c = tone("#f8e6d2", "#e5c9ab", "#a98a6a") }: At & { w?: number; h?: number; c?: Tone }) {
  return (
    <>
      <Box x={x} w={w} h={h} c={c} />
      <Solid d={poly(x - w / 2 - 0.8, -h + 0.2, x - w / 2 + 1.4, -h - 1.8, x + w / 2 - 1.4, -h - 1.8, x + w / 2 + 0.8, -h + 0.2)} s={poly(x + 1, -h - 1.8, x + w / 2 - 1.4, -h - 1.8, x + w / 2 + 0.8, -h + 0.2, x + 1, -h + 0.2)} c={C.terracotta} />
      <path d={`M${x - 1} 0v-1.8a1 1 0 0 1 2 0v1.8Z`} fill={c.edge} />
      <path d={`M${x - w / 2 + 1.2} -2.2v-1a0.8 0.8 0 0 1 1.6 0v1Z M${x + w / 2 - 2.8} -2.2v-1a0.8 0.8 0 0 1 1.6 0v1Z`} fill="#7aa3c9" />
    </>
  );
}

function LosAngeles({ r }: { r: number }) {
  return (
    <>
      {r > 0 && <Hump x={-8} y={-1} w={30} h={13} c={C.dry} />}
      {r > 0 && <Hump x={14} y={-1} w={22} h={10} c={C.dry} />}
      {r > 1 && <Tower x={13} w={5} h={22} c={C.glass} win="#d9ecfa" />}
      {r > 0 && <Tower x={7.5} w={5} h={15} c={C.stone} />}
      {r > 0 && <Tower x={18} w={5.5} h={12} c={C.glass} win="#d9ecfa" />}
      {r > 1 && <Stucco x={-17} w={8} h={4.5} c={tone("#f9dccd", "#e8bca5", "#a87a63")} />}
      <Stucco x={-3} w={[10, 11, 11][r]} />
      <Palm x={5.5} h={[15, 19, 21][r]} lean={1.5} />
      <Palm x={-10} h={[11, 14, 16][r]} lean={-1.5} />
      {r > 1 && <Palm x={-22} h={13} lean={1} />}
      {r > 1 && <Palm x={23} y={1} h={11} lean={-1} />}
    </>
  );
}

// ---- Humboldt / redwood forest -----------------------------------------

function Cabin({ x, y = 0, w = 7, snow }: At & { w?: number; snow?: boolean }) {
  return (
    <>
      <path d={rect(x + w / 4 - 0.6, y - 9, 1.6, 4)} fill={C.brick.shade} stroke={C.brick.edge} strokeWidth={0.4} />
      {snow ? <Smoke x={x + w / 4 + 0.6} y={y - 10.8} /> : null}
      <House x={x} y={y} w={w} h={4.4} wall={C.log} roof={snow ? C.roof : tone("#5d7a4f", "#465f3b", "#33462b")} snow={snow} logs />
    </>
  );
}

function Mill({ x }: { x: number }) {
  return (
    <>
      <path d={rect(x + 3.5, -14, 1.6, 9)} fill={C.brick.lit} stroke={C.brick.edge} strokeWidth={0.5} />
      <Smoke x={x + 4.4} y={-15.6} />
      <Box x={x} w={10} h={5} c={C.wood} />
      <Solid d={poly(x - 5.4, -4.8, x - 5.4, -7, x - 1.8, -5, x - 1.8, -7, x + 1.8, -5, x + 1.8, -7, x + 5.4, -4.8)} c={C.roof} />
      <g fill={C.log.lit} stroke={C.log.edge} strokeWidth={0.4}>
        {[
          [-7.4, -0.8],
          [-5.6, -0.8],
          [-6.5, -2.3],
        ].map(([dx, dy]) => (
          <circle key={dx + dy} cx={x + dx} cy={dy} r={0.9} />
        ))}
      </g>
    </>
  );
}

function Humboldt({ r }: { r: number }) {
  return (
    <>
      {r > 1 && <Redwood x={-22} h={22} />}
      {r > 0 && <Redwood x={15} h={25} />}
      <Redwood x={-9} h={[20, 26, 30][r]} />
      <Redwood x={7.5} h={[22, 28, 33][r]} />
      {r > 0 && <Redwood x={-15} h={18} />}
      {r > 1 && <Mill x={18} />}
      {r > 0 && <Cabin x={-14} y={1.5} w={6} />}
      <Cabin x={-1} w={7} />
      {r > 1 && <Redwood x={3} y={2} h={13} />}
    </>
  );
}

// ---- Harbour / lighthouse ----------------------------------------------

function Lighthouse({ x, h }: { x: number; h: number }) {
  const band = (y0: number, y1: number) => {
    const hw = (y: number) => 2.4 - (0.8 * -y) / h;
    return poly(x - hw(y0), y0, x + hw(y0), y0, x + hw(y1), y1, x - hw(y1), y1);
  };
  return (
    <>
      <Solid d={poly(x - 5, 1, x - 4, -1.6, x - 1, -2.4, x + 3, -2, x + 5, 0.4, x + 4, 1.4)} s={poly(x + 1, -2.2, x + 3, -2, x + 5, 0.4, x + 4, 1.4, x + 1, 1.4)} c={C.stone} />
      <Solid d={band(-1.8, -h)} s={poly(x, -1.8, x + 2.3, -1.8, x + 1.6, -h, x, -h)} c={C.white} />
      <path d={band(-h * 0.33, -h * 0.5) + band(-h * 0.7, -h * 0.85)} fill={C.red.lit} />
      <path d={rect(x - 2.2, -h - 0.7, 4.4, 0.9)} fill={DARK} />
      <Solid d={rect(x - 1.3, -h - 3.2, 2.6, 2.5)} c={tone("#ffe28a", "#f2c75a", "#9c7424")} />
      <Solid d={poly(x - 2, -h - 3.1, x, -h - 5.3, x + 2, -h - 3.1)} s={poly(x, -h - 5.3, x + 2, -h - 3.1, x, -h - 3.1)} c={C.red} />
    </>
  );
}

function Hut({ x, c }: { x: number; c: Tone }) {
  return (
    <>
      <Stroke d={line(x - 2, -0.6, x - 2, 2) + line(x + 2, -0.6, x + 2, 2)} color={C.wood.edge} w={0.6} />
      <House x={x} y={-0.6} w={5.5} h={4.2} wall={c} roof={C.roof} />
    </>
  );
}

function Boat({ x, y, sail = true }: { x: number; y: number; sail?: boolean }) {
  return (
    <>
      {sail && <Solid d={poly(x, y - 1.6, x, y - 8, x + 3.2, y - 1.8)} c={C.white} />}
      {sail && <Stroke d={line(x - 0.3, y - 1.4, x - 0.3, y - 8.6)} color={C.wood.edge} w={0.5} />}
      <Solid d={poly(x - 3.4, y - 1.6, x + 3.6, y - 1.6, x + 2.4, y, x - 2.4, y)} s={rect(x - 2.8, y - 0.8, 5.8, 0.8)} c={C.red} />
    </>
  );
}

function Harbour({ r, w, pines }: { r: number; w: number; pines?: boolean }) {
  const shore = w * 0.17 - 0.6;
  return (
    <>
      {pines && r > 0 && [-18, -12.5, 12, 17].map((x, i) => <Pine key={x} x={x} y={-1} h={[13, 16, 11, 14][i]} />)}
      {pines && r > 1 && <Pine x={22} y={-1} h={10} />}
      {r > 1 && <House x={-17} y={-0.6} w={6} h={4.6} wall={PASTEL[2]} roof={C.red} />}
      {r > 0 && <Hut x={-10} c={C.teal} />}
      {r > 0 && <Hut x={-4} c={C.red} />}
      <Water x0={-w / 2 + 3} x1={w / 2 - 3} y0={0.8} y1={shore} />
      {r > 1 && <path d={rect(-13, 0.4, 10, 1)} fill={C.wood.lit} stroke={C.wood.edge} strokeWidth={0.5} />}
      <Lighthouse x={r > 0 ? 6 : 1} h={[15, 18, 21][r]} />
      {r > 0 && <Boat x={-10} y={shore - 0.4} sail={r > 1} />}
      {r > 1 && <Boat x={14} y={shore - 0.8} />}
    </>
  );
}

// ---- Farm --------------------------------------------------------------

function Barn({ x, w = 10 }: At & { w?: number }) {
  const h = w * 0.55;
  const t = -h;
  return (
    <>
      <Box x={x} w={w} h={h} c={C.red} />
      <Solid
        d={poly(x - w / 2 - 0.8, t + 0.4, x - w * 0.4, t - w * 0.28, x, t - w * 0.48, x + w * 0.4, t - w * 0.28, x + w / 2 + 0.8, t + 0.4)}
        s={poly(x, t - w * 0.48, x + w * 0.4, t - w * 0.28, x + w / 2 + 0.8, t + 0.4, x, t + 0.4)}
        c={C.roof}
      />
      <path d={rect(x - w * 0.2, -h * 0.68, w * 0.4, h * 0.68)} fill={C.red.shade} stroke="#fff" strokeWidth={0.6} />
      <Stroke d={line(x - w * 0.2, -h * 0.68, x + w * 0.2, 0) + line(x + w * 0.2, -h * 0.68, x - w * 0.2, 0)} color="#fff" w={0.5} />
      <path d={rect(x - 0.9, t - w * 0.24, 1.8, 1.6)} fill="#fff" stroke={C.red.edge} strokeWidth={0.4} />
    </>
  );
}

function Silo({ x, h }: { x: number; h: number }) {
  return (
    <>
      <Solid d={rect(x - 2, -h, 4, h)} s={rect(x + 0.6, -h, 1.4, h)} c={C.metal} />
      <Stroke d={[0.25, 0.5, 0.75].map((t) => line(x - 2, -h * t, x + 2, -h * t)).join("")} color={C.metal.edge} w={0.35} />
      <Solid d={`M${x - 2.2} ${-h}a2.2 2.2 0 0 1 4.4 0Z`} c={C.metal} />
    </>
  );
}

function Windmill({ x }: { x: number }) {
  return (
    <>
      <Stroke d={line(x - 2.2, 0, x, -15, x + 2.2, 0) + line(x - 1.5, -5, x + 1.5, -5) + line(x - 0.8, -10, x + 0.8, -10)} color={C.metal.edge} w={0.6} />
      <g transform={`translate(${x} -15)`}>
        <Stroke d="M-3.4 0H3.4M0 -3.4V3.4M-2.4 -2.4L2.4 2.4M-2.4 2.4L2.4 -2.4" color={C.metal.lit} w={1.2} />
        <circle r={0.8} fill={C.red.lit} />
      </g>
    </>
  );
}

function Rows({ w, rows, color, dash }: { w: number; rows: number; color: string; dash: string }) {
  return (
    <path
      d={Array.from({ length: rows }, (_, i) => {
        const y = 1.6 + i * 1.6;
        const half = Math.sqrt(1 - (y / (w * 0.18)) ** 2) * (w / 2 - 3);
        return line(-half, y, half, y);
      }).join("")}
      stroke={color}
      strokeWidth={1}
      strokeDasharray={dash}
      strokeLinecap="round"
    />
  );
}

function Farm({ r, w, crop }: { r: number; w: number; crop: "vines" | "wheat" }) {
  return (
    <>
      {crop === "wheat" && r > 1 && <Windmill x={21} />}
      {r > 0 && <Silo x={9} h={crop === "wheat" ? 15 : 12} />}
      {crop === "wheat" && r > 1 && <Silo x={13.8} h={12} />}
      {crop === "vines" && r > 1 && [15, 20].map((x) => <Tree key={x} x={x} s={2.6} />)}
      {r > 0 && <House x={-11} w={6.5} h={5} wall={C.white} roof={C.roof} />}
      {crop === "vines" && r > 1 && <Pine x={-20} h={10} />}
      <Barn x={0} w={[10, 11, 12][r]} />
      <Rows w={w} rows={[2, 3, 4][r]} color={crop === "vines" ? "#4f8a3c" : "#e1b64a"} dash={crop === "vines" ? "1.4 0.9" : "3 0.6"} />
    </>
  );
}

// ---- Salt flats outpost ------------------------------------------------

function GasStation({ x }: { x: number }) {
  return (
    <>
      <Stroke d={line(x - 5.5, 0, x - 5.5, -7) + line(x + 5.5, 0, x + 5.5, -7)} color={C.metal.edge} w={0.9} />
      {[-2.2, 2.2].map((dx) => (
        <g key={dx}>
          <Solid d={rect(x + dx - 1, -3.6, 2, 3.6)} s={rect(x + dx + 0.3, -3.6, 0.7, 3.6)} c={C.red} />
          <path d={rect(x + dx - 0.6, -3, 1.2, 1)} fill="#fff" />
        </g>
      ))}
      <Solid d={rect(x - 7, -9, 14, 2.2)} s={rect(x - 7, -7.6, 14, 0.8)} c={tone("#fdfdfb", "#d65a3f", "#7d2a1d")} />
    </>
  );
}

function Sign({ x, h }: { x: number; h: number }) {
  return (
    <>
      <Stroke d={line(x, 0, x, -h)} color={C.metal.edge} w={0.9} />
      <circle cx={x} cy={-h - 2.4} r={2.6} fill={C.gold.lit} stroke={C.gold.edge} strokeWidth={SW} />
      <circle cx={x} cy={-h - 2.4} r={1.3} fill={C.red.lit} />
    </>
  );
}

function SaltFlats({ r, w }: { r: number; w: number }) {
  const s = w / 2 - 4;
  return (
    <>
      <Stroke d={line(-s, 2, -s * 0.5, 3.2, -s * 0.1, 2.2) + line(-s * 0.5, 3.2, -s * 0.4, w * 0.15) + line(s * 0.2, 1.6, s * 0.55, 3, s, 2.2) + line(s * 0.55, 3, s * 0.45, w * 0.15)} color="#d9d8cb" w={0.5} />
      {r > 1 && <Box x={-17} w={9} h={4} c={tone("#f6d9a0", "#e0bc7a", "#a68443")} />}
      {r > 1 && <path d={grid(-20, -3, 3, 1, 2.4, 2, 1.2, 2.6)} fill={C.teal.shade} />}
      {r > 0 && <Box x={-8} w={7} h={5.5} c={C.cream} />}
      {r > 0 && <path d={rect(-10.5, -3.6, 3, 2) + rect(-7.2, -3.6, 1.4, 3.6)} fill="#7aa3c9" />}
      <GasStation x={r > 0 ? 3 : -2} />
      <Sign x={r > 0 ? 13 : 8.5} h={[11, 13, 15][r]} />
    </>
  );
}

// ---- Capitol -----------------------------------------------------------

function Capitol({ x, w, c = C.stone, dome = C.stone }: At & { w: number; c?: Tone; dome?: Tone }) {
  return (
    <>
      <Box x={x} w={w} h={5} c={c} />
      <path d={grid(x - w / 2 + 1.2, -3.8, Math.floor((w - 1.6) / 2), 1, 2, 2, 1, 2.2)} fill={c.edge} opacity={0.6} />
      <Box x={x} w={7} h={7} c={c} />
      <Stroke d={[-2.4, -0.8, 0.8, 2.4].map((dx) => line(x + dx, -0.6, x + dx, -5.4)).join("")} color={c.edge} w={0.6} />
      <Gable x={x} y={-6.8} w={8} rise={2} c={c} />
      <Box x={x} y={-8.4} w={5} h={3} c={c} />
      <Solid d={`M${x - 3} -11.2a3 3.2 0 0 1 6 0Z`} s={`M${x + 0.6} -14.3a3 3.2 0 0 1 2.4 3.1H${x + 0.6}Z`} c={dome} />
      <Solid d={rect(x - 0.7, -16, 1.4, 1.8)} c={c} />
      <Stroke d={line(x, -16, x, -17.4)} color={c.edge} w={0.6} />
    </>
  );
}

function Obelisk({ x, h }: { x: number; h: number }) {
  return <Solid d={poly(x - 1.3, 0, x - 0.9, -h, x, -h - 1.6, x + 0.9, -h, x + 1.3, 0)} s={poly(x, -h - 1.6, x + 0.9, -h, x + 1.3, 0, x, 0)} c={C.white} />;
}

function SaltLakeCity({ r }: { r: number }) {
  return (
    <>
      <Peak x={-7} y={-2} w={[20, 24, 30][r]} h={[14, 18, 22][r]} />
      {r > 0 && <Peak x={10} y={-2} w={22} h={15} />}
      {r > 1 && <Peak x={21} y={-2} w={16} h={11} c={tone("#8f98cc", "#7179ad", "#5a6194")} />}
      {r > 1 && [-21, -17].map((x) => <House key={x} x={x} w={4.5} h={3.6} wall={C.cream} roof={C.red} />)}
      {r > 0 && [-13, 14.5].map((x) => <Tree key={x} x={x} s={2.4} />)}
      <Capitol x={0} w={[14, 20, 22][r]} dome={tone("#dfe3d6", "#b6bcae", "#7e8476")} />
      {r > 1 && <Tower x={20} w={5} h={11} c={C.glass} win="#d9ecfa" />}
    </>
  );
}

function Washington({ r }: { r: number }) {
  return (
    <>
      {r > 0 && <Obelisk x={15} h={[0, 22, 26][r]} />}
      {r > 1 && [-20, -15, 21].map((x) => <Tree key={x} x={x} s={2.4} />)}
      <Capitol x={-2} w={[16, 20, 24][r]} c={C.white} dome={C.white} />
      {r > 0 && <Tree x={9.5} s={2.2} />}
    </>
  );
}

// ---- Ski / mountain village --------------------------------------------

function AFrame({ x, y = 0, s = 1 }: At & { s?: number }) {
  const w = 10 * s;
  const h = 10 * s;
  return (
    <>
      <Solid d={poly(x - w / 2, y, x, y - h, x + w / 2, y)} s={poly(x, y - h, x + w / 2, y, x + w * 0.32, y)} c={tone("#8f5a3a", "#6e4229", "#4f2e1b")} />
      <Solid d={poly(x - w * 0.32, y, x, y - h * 0.64, x + w * 0.32, y)} c={C.wood} />
      <path d={poly(x - w * 0.16, y - h * 0.3, x, y - h * 0.5, x + w * 0.16, y - h * 0.3)} fill={WIN} />
      <path d={rect(x - 0.8 * s, y - 2.6 * s, 1.6 * s, 2.6 * s)} fill={C.wood.edge} />
      <Stroke d={line(x - w * 0.36, y - h * 0.62, x, y - h + 0.4, x + w * 0.36, y - h * 0.62)} color="#fff" w={1.6} />
      <Stroke d={line(x - w / 2 + 0.4, y - 0.5, x - w * 0.36, y - h * 0.28)} color="#fff" w={1} />
    </>
  );
}

function Gondola({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const at = (t: number) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  const [cx, cy] = at(0.42);
  const [px, py] = at(0.75);
  return (
    <>
      <Stroke d={line(px, 0, px, py) + line(px - 1, 0, px, py)} color={C.metal.edge} w={0.6} />
      <Stroke d={line(x0, y0, x1, y1)} color={C.roof.edge} w={0.5} />
      <Stroke d={line(cx, cy, cx, cy + 2)} color={C.roof.edge} w={0.5} />
      <Solid d={`M${r2(cx - 1.8)} ${r2(cy + 2)}h3.6v3a0.8 0.8 0 0 1 -0.8 0.8h-2a0.8 0.8 0 0 1 -0.8 -0.8Z`} s={rect(cx - 1.8, cy + 3.6, 3.6, 1.4)} c={C.red} />
      <path d={rect(cx - 1.2, cy + 2.6, 2.4, 1)} fill="#d9ecfa" />
    </>
  );
}

function Alpine({ r, gondola }: { r: number; gondola?: boolean }) {
  return (
    <>
      {r > 1 && <Peak x={8} y={-1} w={34} h={30} snow={0.45} />}
      {gondola && r > 0 && <Gondola x0={-19} y0={-14} x1={19} y1={r > 1 ? -27 : -22} />}
      {!gondola && r > 0 && <Peak x={10} y={-1} w={22} h={18} snow={0.5} />}
      {r > 0 && <AFrame x={-11} y={1} s={0.75} />}
      {r > 1 && <AFrame x={14} y={1.2} s={0.7} />}
      <AFrame x={-1} s={[0.95, 1.05, 1.1][r]} />
      <Pine x={8} y={0.5} h={10} snow />
      {r > 0 && <Pine x={-18} y={0.5} h={8} snow />}
      {r > 1 && <Pine x={20} y={1.5} h={8} snow />}
    </>
  );
}

// ---- Adobe -------------------------------------------------------------

const TURQUOISE = "#3fa6a8";

function Pueblo({ x, s = 1 }: { x: number; s?: number }) {
  const blocks: [number, number, number, number][] = [
    [0, 0, 14, 5],
    [-2, -5, 9, 4.2],
    [-3.5, -9.2, 4.6, 3.4],
  ];
  return (
    <g transform={`translate(${x} 0) scale(${s})`}>
      {blocks.map(([bx, by, w, h]) => (
        <g key={by}>
          <Solid d={`M${bx - w / 2} ${by}v${-h + 0.8}q0 -0.8 0.8 -0.8h${w - 1.6}q0.8 0 0.8 0.8v${h - 0.8}Z`} s={rect(bx + w / 6, by - h + 0.3, w / 3 - 0.3, h - 0.3)} c={C.adobe} />
          <path d={Array.from({ length: Math.floor(w / 2.4) }, (_, i) => rect(bx - w / 2 + 1 + i * 2.4, by - h + 0.6, 0.8, 0.6)).join("")} fill={C.wood.edge} />
        </g>
      ))}
      <path d={rect(-5.5, -3.2, 1.8, 3.2) + rect(2.2, -3.4, 1.6, 1.6) + rect(-3, -7.6, 1.4, 1.5) + rect(4.4, -3.4, 1.6, 1.6)} fill={TURQUOISE} />
      <Stroke d={line(5.6, -5, 4.4, 0.4) + line(7.2, -5, 6, 0.4) + [-0.8, -2.2, -3.6].map((y) => line(4.6 + (y / -5.4) * -1.2, y, 6.2 + (y / -5.4) * -1.2, y)).join("")} color={C.wood.edge} w={0.5} />
    </g>
  );
}

function Cactus({ x, h = 6 }: { x: number; h?: number }) {
  return (
    <>
      <Stroke d={line(x, 0, x, -h) + `M${x} ${-h * 0.45}h-1.8v-2 M${x} ${-h * 0.6}h1.6v-1.6`} color={C.pine.edge} w={2} />
      <Stroke d={line(x, 0, x, -h) + `M${x} ${-h * 0.45}h-1.8v-2 M${x} ${-h * 0.6}h1.6v-1.6`} color={C.leaf.lit} w={1} />
    </>
  );
}

function Balloon({ x, y, colors }: { x: number; y: number; colors: [string, string] }) {
  const body = `M${x} ${y + 6}C${x - 4} ${y + 3} ${x - 4.6} ${y - 4} ${x} ${y - 4}S${x + 4} ${y + 3} ${x} ${y + 6}Z`;
  return (
    <>
      <path d={body} fill={colors[0]} />
      <path d={`M${x} ${y + 6}C${x - 1.6} ${y + 3} ${x - 1.8} ${y - 4} ${x} ${y - 4}S${x + 1.6} ${y + 3} ${x} ${y + 6}Z`} fill={colors[1]} />
      <path d={body} fill="none" stroke="#7d2a1d" strokeWidth={0.5} />
      <Stroke d={line(x - 1, y + 6, x - 0.6, y + 7.6) + line(x + 1, y + 6, x + 0.6, y + 7.6)} color={C.wood.edge} w={0.4} />
      <path d={rect(x - 0.8, y + 7.6, 1.6, 1.2)} fill={C.wood.lit} stroke={C.wood.edge} strokeWidth={0.4} />
    </>
  );
}

function Mission({ x }: { x: number }) {
  return (
    <>
      <Solid d={`M${x - 3.5} 0v-8h1.2v-2.4q2.3 -2 4.6 0v2.4h1.2v8Z`} s={rect(x + 1.2, -8, 2.3, 8)} c={C.adobe} />
      <path d={`M${x - 0.6} -8.4v-1a0.6 0.6 0 0 1 1.2 0v1Z M${x - 1} 0v-2.4a1 1 0 0 1 2 0v2.4Z`} fill={C.wood.edge} />
    </>
  );
}

function Adobe({ r, extra }: { r: number; extra?: "balloon" | "mission" }) {
  return (
    <>
      {extra === "balloon" && r > 0 && <Balloon x={11} y={-24} colors={["#e85b4a", "#f7cf4a"]} />}
      {extra === "balloon" && r > 1 && <Balloon x={-15} y={-20} colors={["#5aa9e6", "#f39ac0"]} />}
      {extra === "mission" && r > 0 && <Mission x={-13} />}
      {extra !== "mission" && r > 0 && <Box x={-13} w={7} h={4} c={C.adobe} />}
      {r > 0 && <path d={rect(-14, -2.6, 1.6, 1.4)} fill={TURQUOISE} />}
      <Pueblo x={0} s={[0.9, 1, 1.15][r]} />
      {r > 0 && <Cactus x={13} />}
      {r > 1 && <Box x={19} w={6} h={3.6} c={C.adobe} />}
      {r > 1 && <Cactus x={-21} h={5} />}
    </>
  );
}

// ---- Playa research outpost --------------------------------------------

function Quonset({ x, w = 12 }: { x: number; w?: number }) {
  const h = w * 0.48;
  return (
    <>
      <Solid d={`M${x - w / 2} 0A${w / 2} ${h} 0 0 1 ${x + w / 2} 0Z`} s={`M${x + w / 6} ${-h * 0.94}A${w / 2} ${h} 0 0 1 ${x + w / 2} 0H${x + w / 6}Z`} c={C.metal} />
      <Stroke d={[-0.6, -0.2, 0.2].map((t) => line(x + (w / 2) * t, -h * Math.sqrt(1 - t * t), x + (w / 2) * t, 0)).join("")} color={C.metal.edge} w={0.35} />
      <path d={rect(x - 3.2, -2.6, 1.6, 2.6) + rect(x + 1.6, -2.8, 1.4, 1.2)} fill={DARK} />
    </>
  );
}

function Antenna({ x, h }: { x: number; h: number }) {
  return (
    <>
      <Stroke d={line(x - 1.4, 0, x, -h, x + 1.4, 0) + line(x - 0.9, -h * 0.35, x + 0.9, -h * 0.35) + line(x - 0.45, -h * 0.68, x + 0.45, -h * 0.68)} color={C.metal.edge} w={0.5} />
      <circle cx={x} cy={-h - 0.6} r={0.8} fill={C.red.lit} />
    </>
  );
}

function Dish({ x }: { x: number }) {
  return (
    <>
      <Stroke d={line(x, 0, x, -4)} color={C.metal.edge} w={0.8} />
      <Solid d={`M${x - 3.2} -7.6Q${x - 1} -2 ${x + 3.2} -3.8Z`} c={C.white} />
      <Stroke d={line(x - 0.2, -5.4, x - 1.6, -7.6)} color={C.metal.edge} w={0.4} />
    </>
  );
}

function Playa({ r }: { r: number }) {
  return (
    <>
      {r > 1 && <circle cx={-18} cy={-20} r={2.2} fill="#fff" stroke={C.metal.edge} strokeWidth={SW} />}
      {r > 1 && <Stroke d={line(-18, -17.8, -17, -9, -18.5, -2)} color={C.metal.edge} w={0.4} />}
      <Antenna x={r > 0 ? 9 : 7.5} h={[16, 19, 22][r]} />
      {r > 0 && <Dish x={-11} />}
      {r > 1 && <Box x={18} w={8} h={4} c={tone("#e9a03d", "#c97f24", "#8f5714")} />}
      {r > 1 && <Box x={-19} w={5} h={3.6} c={C.white} />}
      <Quonset x={-1} w={[11, 12, 13][r]} />
      {r > 0 && (
        <g>
          <path d={poly(11, 2.6, 13, 0.6, 17, 0.6, 15, 2.6) + poly(15.6, 2.6, 17.6, 0.6, 21.6, 0.6, 19.6, 2.6)} fill="#5f86c4" stroke="#3f5f8f" strokeWidth={0.5} />
        </g>
      )}
    </>
  );
}

// ---- Alaska ------------------------------------------------------------

function Aurora({ x, y, w, color }: { x: number; y: number; w: number; color: string }) {
  const d = `M${x - w / 2} ${y}C${x - w / 4} ${y - 6} ${x} ${y + 4} ${x + w / 5} ${y - 1}S${x + w * 0.4} ${y - 4} ${x + w / 2} ${y - 2}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={color} strokeWidth={w * 0.16} opacity={0.4} />
      <path d={d} stroke={color} strokeWidth={w * 0.16} strokeDasharray="0.9 1.3" strokeLinecap="butt" opacity={0.75} />
    </g>
  );
}

function Fairbanks({ r }: { r: number }) {
  return (
    <>
      {r > 1 && <Aurora x={3} y={-33} w={40} color="#e07fd0" />}
      <Aurora x={0} y={[-19, -23, -25][r]} w={[22, 32, 44][r]} color="#33d17f" />
      {r > 0 && <Pine x={-17} y={-0.5} h={12} snow />}
      {r > 0 && <Pine x={16} y={-0.5} h={13} snow />}
      {r > 1 && <Cabin x={-10} y={-0.5} w={5.5} snow />}
      {r > 0 && <Cabin x={10} y={1} w={6} snow />}
      <Cabin x={-1} y={0.5} w={[7, 7.5, 8][r]} snow />
      <Pine x={r > 0 ? -9 : 7} y={1.5} h={r > 0 ? 8 : 9} snow />
      {r > 1 && <Pine x={21} y={1.8} h={8} snow />}
    </>
  );
}

function Lodge({ x }: { x: number }) {
  return (
    <>
      <Box x={x} w={12} h={6} c={C.log} />
      <Stroke d={[1.5, 3, 4.5].map((d) => line(x - 6, -d, x + 6, -d)).join("")} color={C.log.edge} w={0.4} />
      <Solid d={poly(x - 7.2, -5.7, x - 3, -10.4, x + 3, -10.4, x + 7.2, -5.7)} s={poly(x + 1, -10.4, x + 3, -10.4, x + 7.2, -5.7, x + 1, -5.7)} c={tone("#5d7a4f", "#465f3b", "#33462b")} />
      <Stroke d={line(x - 6.8, -6, x - 3, -10.2, x + 3, -10.2, x + 6.8, -6)} color="#fff" w={1} />
      <path d={grid(x - 4.6, -4.4, 4, 1, 2.6, 2, 1.4, 1.8)} fill={WIN} />
    </>
  );
}

function Deck({ x }: { x: number }) {
  return (
    <>
      <Stroke d={line(x - 4, 0, x - 4, -3.4) + line(x + 4, 0, x + 4, -3.4)} color={C.wood.edge} w={0.8} />
      <path d={rect(x - 5, -4, 10, 1)} fill={C.wood.lit} stroke={C.wood.edge} strokeWidth={0.5} />
      <Stroke d={line(x - 5, -6.2, x + 5, -6.2) + [-4.6, -2.3, 0, 2.3, 4.6].map((dx) => line(x + dx, -4, x + dx, -6.2)).join("")} color={C.wood.edge} w={0.45} />
      <Stroke d={line(x + 2.4, -4, x + 2.4, -7.4) + line(x + 1.6, -7.8, x + 3.6, -8.6)} color={DARK} w={0.7} />
    </>
  );
}

function Massif({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Solid
        d={poly(-w / 2, 0, -w * 0.22, -h * 0.72, -w * 0.12, -h * 0.66, -w * 0.04, -h, w * 0.1, -h * 0.84, w * 0.18, -h * 0.88, w / 2, 0)}
        s={poly(-w * 0.04, -h, w * 0.1, -h * 0.84, w * 0.18, -h * 0.88, w / 2, 0, w * 0.06, 0)}
        c={tone("#f6f8fc", "#d6dcea", "#8f97bd")}
      />
      <path d={poly(-w / 2, 0, -w * 0.36, -h * 0.4, -w * 0.28, -h * 0.22, -w * 0.18, -h * 0.34, -w * 0.04, -h * 0.16, w * 0.12, -h * 0.3, w * 0.3, -h * 0.14, w / 2, 0)} fill={C.mountain.lit} stroke={C.mountain.edge} strokeWidth={SW} strokeLinejoin="round" />
    </>
  );
}

function Denali({ r }: { r: number }) {
  return (
    <>
      <Massif w={[24, 34, 44][r]} h={[16, 21, 26][r]} />
      {r > 0 && <Peak x={-18} y={-1} w={14} h={10} snow={0.3} />}
      {r > 1 && <Peak x={20} y={-1} w={14} h={9} snow={0.3} />}
      {r > 0 && <Pine x={-12} y={0.5} h={10} />}
      {r > 1 && <Pine x={-20} y={1.5} h={8} />}
      {r > 1 && <Cabin x={17} y={1} w={5.5} />}
      <Lodge x={-3} />
      <Deck x={r > 0 ? 7.5 : 6.5} />
      {r > 0 && <Pine x={14} y={1.6} h={8} />}
    </>
  );
}

// ---- New England -------------------------------------------------------

function Church({ x }: { x: number }) {
  return (
    <>
      <Solid d={poly(x - 1.6, -10, x, -20, x + 1.6, -10)} s={poly(x, -20, x + 1.6, -10, x, -10)} c={C.white} />
      <Box x={x} y={-7} w={3.6} h={3.4} c={C.white} />
      <path d={`M${x - 0.8} -7.6v-1.6a0.8 0.8 0 0 1 1.6 0v1.6Z`} fill={DARK} />
      <Box x={x} w={7} h={7} c={C.white} />
      <Gable x={x} y={-6.8} w={8.6} rise={3.4} c={C.roof} />
      <path d={`M${x - 1} 0v-2.6a1 1 0 0 1 2 0v2.6Z M${x - 2.8} -3.2v-1.8a0.6 0.6 0 0 1 1.2 0v1.8Z M${x + 1.6} -3.2v-1.8a0.6 0.6 0 0 1 1.2 0v1.8Z`} fill={DARK} />
    </>
  );
}

function CoveredBridge({ x }: { x: number }) {
  return (
    <>
      <Solid d={rect(x - 7, -4.4, 14, 4.4)} s={rect(x + 3, -4.4, 4, 4.4)} c={C.red} />
      <path d={rect(x - 5, -3, 10, 1)} fill={C.red.edge} />
      <Solid d={poly(x - 7.8, -4.2, x - 6.6, -6.4, x + 6.6, -6.4, x + 7.8, -4.2)} s={poly(x, -6.4, x + 6.6, -6.4, x + 7.8, -4.2, x, -4.2)} c={C.roof} />
    </>
  );
}

function NewEngland({ r, w }: { r: number; w: number }) {
  return (
    <>
      {r > 1 && <Hump x={-8} y={-1} w={30} h={18} c={tone("#7fb36a", "#62964f", "#4a7a3b")} />}
      {r > 1 && <House x={-19} w={6} h={4.6} wall={PASTEL[4]} roof={C.roof} />}
      {r > 0 && <Tree x={-12} y={0.6} s={3} c={C.autumn} />}
      {r > 1 && <Tree x={-23} y={0.6} s={2.4} c={C.maple} />}
      <Church x={-3} />
      {r > 0 && <Tree x={4} y={0.6} s={2.6} c={C.maple} />}
      {r > 0 && <Water x0={5} x1={w / 2 - 4} y0={-1.2} y1={w * 0.13} />}
      {r > 0 && <CoveredBridge x={12.5} />}
      {r > 1 && <Tree x={22} y={-3} s={2.2} c={C.gold} />}
    </>
  );
}

// ---- Goa ---------------------------------------------------------------

function GoanChurch({ x }: { x: number }) {
  return (
    <>
      {[-5.4, 5.4].map((dx) => (
        <g key={dx}>
          <Box x={x + dx} w={3.6} h={12} c={C.white} />
          <Solid d={`M${x + dx - 1.8} -12a1.8 2.2 0 0 1 3.6 0Z`} c={C.white} />
          <path d={`M${x + dx - 0.6} -8v-1.4a0.6 0.6 0 0 1 1.2 0v1.4Z`} fill={DARK} />
        </g>
      ))}
      <Solid
        d={`M${x - 3.6} 0v-10q0 -1.4 1.4 -1.4q0 -2 2.2 -3q2.2 1 2.2 3q1.4 0 1.4 1.4v10Z`}
        s={`M${x + 1.2} 0v-14q1 1 1 2.6q1.4 0 1.4 1.4v10Z`}
        c={C.white}
      />
      <Stroke d={line(x - 3.6, -7, x + 3.6, -7) + line(x - 7.2, -7, x + 7.2, -7)} color="#7ab0d8" w={0.6} />
      <path d={`M${x - 1.2} 0v-3.2a1.2 1.2 0 0 1 2.4 0v3.2Z`} fill={DARK} />
      <circle cx={x} cy={-9.4} r={0.9} fill="#7ab0d8" />
    </>
  );
}

function Shack({ x, c }: { x: number; c: Tone }) {
  return (
    <>
      <Stroke d={line(x - 2.4, 0, x - 2.4, -4) + line(x + 2.4, 0, x + 2.4, -4)} color={C.wood.edge} w={0.6} />
      <Box x={x} y={-0.6} w={5} h={3.2} c={c} />
      <Solid d={poly(x - 4, -3.4, x, -6.6, x + 4, -3.4)} s={poly(x, -6.6, x + 4, -3.4, x, -3.4)} c={C.thatch} />
    </>
  );
}

function Goa({ r, w }: { r: number; w: number }) {
  return (
    <>
      {r > 0 && <Palm x={-17} h={14} lean={2} />}
      <GoanChurch x={-3} />
      {r > 1 && <Shack x={-15} c={PASTEL[0]} />}
      {r > 0 && <Shack x={10} c={C.teal} />}
      {r > 1 && <Shack x={17} c={PASTEL[2]} />}
      <Palm x={5.5} h={[13, 15, 17][r]} lean={2.5} />
      {r > 1 && <Palm x={22} y={1} h={11} lean={-2} />}
      {r > 0 && <Water x0={-w / 2 + 3} x1={w / 2 - 3} y0={w * 0.07} y1={w * 0.17 - 0.4} />}
      {r > 1 && <Solid d={poly(-12, 2.2, -4, 2.2, -5, 3.4, -11, 3.4)} c={C.wood} />}
    </>
  );
}

// ---- Bengaluru ---------------------------------------------------------

function VidhanaSoudha({ x, w }: { x: number; w: number }) {
  const sandstone = tone("#efe2cf", "#d3bfa3", "#94806a");
  const cupola = (cx: number, y: number, s: number) => (
    <Solid key={cx} d={`M${cx - s} ${y}a${s} ${s * 1.1} 0 0 1 ${s * 2} 0Z`} s={`M${cx + s * 0.2} ${y - s * 1.08}a${s} ${s * 1.1} 0 0 1 ${s * 0.8} ${s * 1.08}H${cx + s * 0.2}Z`} c={sandstone} />
  );
  return (
    <>
      <Box x={x} w={w} h={5.6} c={sandstone} />
      <path d={grid(x - w / 2 + 1.2, -4.4, Math.floor((w - 1.6) / 2), 1, 2, 2, 1, 2.4)} fill={sandstone.edge} opacity={0.55} />
      {[x - w / 2 + 1.8, x + w / 2 - 1.8].map((cx) => (
        <g key={cx}>
          <Box x={cx} y={-5.6} w={3} h={1.6} c={sandstone} />
          {cupola(cx, -7.2, 1.4)}
        </g>
      ))}
      <Box x={x} w={9} h={8} c={sandstone} />
      <Stroke d={[-3.2, -1.6, 0, 1.6, 3.2].map((dx) => line(x + dx, -0.6, x + dx, -6.4)).join("")} color={sandstone.edge} w={0.6} />
      <Gable x={x} y={-7.8} w={9.6} rise={2.2} c={sandstone} />
      <Box x={x} y={-9.6} w={5.4} h={2.8} c={sandstone} />
      {cupola(x, -12.4, 3)}
      <path d={rect(x - 0.4, -17.2, 0.8, 1.6)} fill={C.gold.lit} stroke={C.gold.edge} strokeWidth={0.4} />
    </>
  );
}

function GlassTower({ x, w, h, slant = 0 }: { x: number; w: number; h: number; slant?: number }) {
  const c = tone("#8fd0d6", "#5aa4b3", "#3d7584");
  return (
    <>
      <Solid d={poly(x - w / 2, 0, x - w / 2, -h + slant, x + w / 2, -h, x + w / 2, 0)} s={poly(x + w / 6, -h + slant / 3, x + w / 2, -h, x + w / 2, 0, x + w / 6, 0)} c={c} />
      <Stroke d={Array.from({ length: Math.floor(h / 2.4) - 1 }, (_, i) => line(x - w / 2 + 0.4, -2 - i * 2.4, x + w / 2 - 0.4, -2 - i * 2.4)).join("")} color="#d8f2f3" w={0.4} />
    </>
  );
}

function Bengaluru({ r }: { r: number }) {
  return (
    <>
      {r > 0 && <GlassTower x={-10} w={6} h={21} slant={3} />}
      {r > 0 && <GlassTower x={10} w={6.5} h={24} />}
      {r > 1 && <GlassTower x={-17} w={5} h={15} />}
      {r > 1 && <GlassTower x={17} w={5.5} h={18} slant={2.5} />}
      <VidhanaSoudha x={0} w={[18, 26, 28][r]} />
      {r > 1 && [-24, 24].map((x) => <Tree key={x} x={x} y={1.4} s={2.6} />)}
    </>
  );
}

// ---- Himalayan hill station --------------------------------------------

function ChristChurch({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Box x={x + 3.4} y={y} w={6} h={5} c={C.mustard} />
      <Gable x={x + 3.4} y={y - 4.8} w={7} rise={2.6} c={C.roof} />
      <Box x={x} y={y} w={3.6} h={12} c={C.mustard} />
      <path d={rect(x - 1.8, y - 12, 3.6, 0.6) + rect(x - 1.8, y - 6.4, 3.6, 0.5)} fill="#fff" />
      <circle cx={x} cy={y - 9.4} r={0.9} fill="#fff" stroke={C.mustard.edge} strokeWidth={0.4} />
      <path d={rect(x - 2, y - 13.6, 0.8, 1.6) + rect(x + 1.2, y - 13.6, 0.8, 1.6)} fill={C.mustard.lit} stroke={C.mustard.edge} strokeWidth={0.4} />
    </>
  );
}

function Gompa({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Box x={x} y={y} w={8} h={6} c={C.white} />
      <path d={rect(x - 4, y - 6, 8, 1.2)} fill={C.maple.shade} />
      <Solid d={`M${x - 6} ${y - 5.6}q2 -0.2 3 -2.2h6q1 2 3 2.2Z`} s={`M${x + 1} ${y - 7.8}h2q1 2 3 2.2h-5Z`} c={C.gold} />
      <path d={rect(x - 0.4, y - 9.6, 0.8, 1.8)} fill={C.gold.edge} />
      <path d={`M${x - 1} ${y}v-2.6a1 1 0 0 1 2 0v2.6Z`} fill={C.maple.edge} />
    </>
  );
}

function PrayerFlags({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const colors = ["#4f7fd6", "#fdfdfb", "#e2583c", "#5fae55", "#f3c85a"];
  return (
    <>
      <Stroke d={`M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + 3} ${x1} ${y1}`} color={C.wood.edge} w={0.3} />
      {Array.from({ length: 7 }, (_, i) => {
        const t = (i + 1) / 8;
        const fx = (1 - t) ** 2 * x0 + 2 * t * (1 - t) * ((x0 + x1) / 2) + t ** 2 * x1;
        const fy = (1 - t) ** 2 * y0 + 2 * t * (1 - t) * ((y0 + y1) / 2 + 3) + t ** 2 * y1;
        return <path key={i} d={rect(fx - 0.6, fy, 1.2, 1.4)} fill={colors[i % colors.length]} />;
      })}
    </>
  );
}

const SLOPE: [number, number, number][] = [
  [-6, -7, 0],
  [3, -5, 2],
  [-14, -3, 4],
  [10, -2.6, 1],
  [-20, -0.4, 3],
  [18, 0, 4],
];

function HillStation({ r, w, flags }: { r: number; w: number; flags?: boolean }) {
  const roofs = [C.red, tone("#6fae5a", "#4f8a3c", "#3a6a2c"), tone("#5f86c4", "#4a6ca6", "#344f80"), C.maple, C.teal];
  const peak = [-11, -14, -16][r];
  return (
    <>
      <Hump x={0} y={1.2} w={w - 5} h={-peak} c={C.hill} />
      {r > 0 && <Pine x={-w / 2 + 6} y={-2} h={11} c={tone("#5a8f63", "#3e6d48", "#2b5034")} />}
      {r > 1 && <Pine x={w / 2 - 5} y={-1} h={12} c={tone("#5a8f63", "#3e6d48", "#2b5034")} />}
      {flags ? <Gompa x={-1} y={peak + 1} /> : <ChristChurch x={-2} y={peak + 1} />}
      {flags && r > 0 && <PrayerFlags x0={3} y0={peak - 2} x1={14} y1={peak + 6} />}
      {SLOPE.slice(0, [2, 4, 6][r]).map(([x, y, i]) => (
        <House key={x} x={x} y={y + 2.5} w={5} h={3.6} wall={PASTEL[i]} roof={roofs[i]} />
      ))}
    </>
  );
}

// ---- South Indian temple town ------------------------------------------

function Gopuram({ x, tiers }: { x: number; tiers: number }) {
  const colors = [tone("#f1b25a", "#d68f36", "#9a5f1d"), tone("#ef8a6d", "#cf654a", "#94402b")];
  const tierH = 3;
  return (
    <>
      <Box x={x} w={10} h={5} c={C.stone} />
      <path d={`M${x - 1.4} 0v-3a1.4 1.4 0 0 1 2.8 0v3Z`} fill={DARK} />
      {Array.from({ length: tiers }, (_, i) => {
        const y = -5 - i * tierH;
        const w0 = 10 - i * 1.6;
        const w1 = w0 - 1.6;
        return (
          <g key={i}>
            <Solid d={poly(x - w0 / 2, y, x - w1 / 2, y - tierH, x + w1 / 2, y - tierH, x + w0 / 2, y)} s={poly(x + w0 / 6, y, x + w1 / 6, y - tierH, x + w1 / 2, y - tierH, x + w0 / 2, y)} c={colors[i % 2]} />
            <path d={grid(x - w1 / 2 + 1, y - 2.2, Math.floor(w1 / 2), 1, 2, 2, 0.9, 1.3)} fill="#5aa9b0" />
          </g>
        );
      })}
      <Solid d={`M${x - 3.2} ${-5 - tiers * tierH}v-1.4a1.6 1.6 0 0 1 1.6 -1.6h3.2a1.6 1.6 0 0 1 1.6 1.6v1.4Z`} c={colors[tiers % 2]} />
      <g fill={C.gold.lit} stroke={C.gold.edge} strokeWidth={0.3}>
        {[-2, 0, 2].map((dx) => (
          <circle key={dx} cx={x + dx} cy={-5 - tiers * tierH - 3.6} r={0.6} />
        ))}
      </g>
    </>
  );
}

function FlatHouse({ x, w = 6, h = 5, c }: { x: number; w?: number; h?: number; c: Tone }) {
  return (
    <>
      <Box x={x} w={w} h={h} c={c} />
      <path d={rect(x - w / 2 - 0.4, -h - 0.8, w + 0.8, 0.9) + rect(x - w / 2 + 1, -h + 1.2, 1.2, 1.4) + rect(x + w / 2 - 2.2, -h + 1.2, 1.2, 1.4)} fill={c.edge} />
    </>
  );
}

function TempleTown({ r }: { r: number }) {
  return (
    <>
      {r > 1 && <Palm x={-22} h={14} lean={1.5} />}
      {r > 1 && <Palm x={22} h={13} lean={-1.5} />}
      <Gopuram x={0} tiers={[3, 4, 5][r]} />
      {r > 0 && <FlatHouse x={-9.5} c={PASTEL[0]} />}
      {r > 0 && <FlatHouse x={10} w={6.5} h={4.2} c={PASTEL[1]} />}
      {r > 1 && <FlatHouse x={-16} w={5} h={3.6} c={PASTEL[2]} />}
      {r > 1 && <FlatHouse x={16.5} w={5} h={5.4} c={PASTEL[3]} />}
    </>
  );
}

// ---- Generic metro -----------------------------------------------------

function Metro({ r }: { r: number }) {
  return (
    <>
      {r > 1 && <path d={SKYLINE.map(([x, w, h]) => rect(x - w / 2, -h * 0.8, w, h * 0.8)).join("")} fill="#b6bcd8" stroke="#8c93b7" strokeWidth={SW} />}
      {r > 0 && <Tower x={-10} w={6} h={16} c={C.stone} />}
      <Tower x={-3} w={6} h={[16, 20, 23][r]} c={C.glass} win="#d9ecfa" />
      <Stroke d={line(4, -[22, 26, 30][r], 4, -[27, 32, 37][r])} color={C.metal.edge} w={0.7} />
      <Tower x={4} w={5} h={[22, 26, 30][r]} c={C.teal} win="#e2f6f3" />
      {r > 0 && <Tower x={10.5} w={6} h={12} c={C.brick} />}
      {r > 1 && <Tower x={17} w={5} h={17} c={C.glass} win="#d9ecfa" />}
      {r > 1 && [-21, 22].map((x) => <Tree key={x} x={x} y={1} s={2.4} />)}
    </>
  );
}

// ---- Matching ----------------------------------------------------------

interface Model {
  ground: GroundTone;
  draw: (r: number, w: number) => ReactNode;
}

const MODELS = {
  newYork: { ground: GROUND.pave, draw: (r) => <NewYork r={r} /> },
  niagara: { ground: GROUND.grass, draw: (r, w) => <Niagara r={r} w={w} /> },
  sanFrancisco: { ground: GROUND.pave, draw: (r) => <SanFrancisco r={r} /> },
  losAngeles: { ground: GROUND.clay, draw: (r) => <LosAngeles r={r} /> },
  redwoods: { ground: GROUND.grass, draw: (r) => <Humboldt r={r} /> },
  olympic: { ground: GROUND.grass, draw: (r, w) => <Harbour r={r} w={w} pines /> },
  harbour: { ground: GROUND.sand, draw: (r, w) => <Harbour r={r} w={w} /> },
  vineyard: { ground: GROUND.field, draw: (r, w) => <Farm r={r} w={w} crop="vines" /> },
  farm: { ground: GROUND.field, draw: (r, w) => <Farm r={r} w={w} crop="wheat" /> },
  saltFlats: { ground: GROUND.salt, draw: (r, w) => <SaltFlats r={r} w={w} /> },
  saltLakeCity: { ground: GROUND.pave, draw: (r) => <SaltLakeCity r={r} /> },
  washington: { ground: GROUND.grass, draw: (r) => <Washington r={r} /> },
  ski: { ground: GROUND.snow, draw: (r) => <Alpine r={r} gondola /> },
  alpine: { ground: GROUND.snow, draw: (r) => <Alpine r={r} /> },
  albuquerque: { ground: GROUND.clay, draw: (r) => <Adobe r={r} extra="balloon" /> },
  santaFe: { ground: GROUND.clay, draw: (r) => <Adobe r={r} extra="mission" /> },
  adobe: { ground: GROUND.clay, draw: (r) => <Adobe r={r} /> },
  playa: { ground: GROUND.salt, draw: (r) => <Playa r={r} /> },
  aurora: { ground: GROUND.snow, draw: (r) => <Fairbanks r={r} /> },
  denali: { ground: GROUND.grass, draw: (r) => <Denali r={r} /> },
  newEngland: { ground: GROUND.grass, draw: (r, w) => <NewEngland r={r} w={w} /> },
  goa: { ground: GROUND.sand, draw: (r, w) => <Goa r={r} w={w} /> },
  bengaluru: { ground: GROUND.pave, draw: (r) => <Bengaluru r={r} /> },
  hillStation: { ground: GROUND.grass, draw: (r, w) => <HillStation r={r} w={w} /> },
  himalayan: { ground: GROUND.grass, draw: (r, w) => <HillStation r={r} w={w} flags /> },
  temple: { ground: GROUND.pave, draw: (r) => <TempleTown r={r} /> },
  metro: { ground: GROUND.pave, draw: (r) => <Metro r={r} /> },
} satisfies Record<string, Model>;

export type CityModelKey = keyof typeof MODELS;

const NAMED: [RegExp, CityModelKey][] = [
  [/niagara|buffalo/, "niagara"],
  [/new york|manhattan|\bnyc\b|brooklyn|statue of liberty|liberty state|jersey city/, "newYork"],
  [/marin|headlands|tillamook|haystack|cannon beach|spouting horn|monterey|anchorage|seward|juneau|lighthouse/, "harbour"],
  [/san francisco|^sf\b/, "sanFrancisco"],
  [/los angeles|^la\b|hollywood|santa monica/, "losAngeles"],
  [/humboldt|redwood|mariposa|yosemite|lemolo|columbia (river )?gorge|portland/, "redwoods"],
  [/olympic/, "olympic"],
  [/umpqua|napa|sonoma|willamette|vineyard|winery/, "vineyard"],
  [/salt lake city/, "saltLakeCity"],
  [/bonneville|salt flats|salt lakes/, "saltFlats"],
  [/^washington\b|district of columbia/, "washington"],
  [/breckenridge|keystone|vail|aspen|ecker|park city|telluride|ski/, "ski"],
  [/albuquerque|\babq\b/, "albuquerque"],
  [/santa fe|taos/, "santaFe"],
  [/playa|white sands|gypsum/, "playa"],
  [/fairbanks|aurora|chena|north pole/, "aurora"],
  [/denali|talkeetna/, "denali"],
  [/frankenstein|white mountains|franconia|crawford|new hampshire|vermont/, "newEngland"],
  [/goa|palolem|salcete|calangute|panaji|margao|colva/, "goa"],
  [/bengaluru|bangalore|mysore|mysuru/, "bengaluru"],
  [/shimla|simla|manali|darjeeling|mussoorie|ooty|nainital/, "hillStation"],
  [/sikkim|gangtok|ladakh|\bleh\b|dharamshala|kathmandu|bhutan/, "himalayan"],
  [/madurai|chennai|tamil|thanjavur|hampi|kerala/, "temple"],
  [/chicago|seattle|boston|dallas|houston|atlanta|toronto|mumbai|delhi|london|tokyo|singapore/, "metro"],
];

const within = (v: number, lo: number, hi: number) => v >= lo && v <= hi;

export function cityModelKey({ name, lat, lng, photos }: Place): CityModelKey {
  const lower = name.toLowerCase();
  const named = NAMED.find(([pattern]) => pattern.test(lower));
  if (named) return named[1];
  if (/beach|coast|\bbay\b|harbou?r|island|\bpoint\b|\bcape\b|\bport\b|cove|shore|pier|\bsea\b/.test(lower)) return "harbour";
  if (within(lat, 6, 37) && within(lng, 68, 98)) return lat > 29.5 || (lat > 26.5 && lng > 87.5) ? "himalayan" : "temple";
  if (/mount|\bmt\b|peak|\bpass\b|alpine|ridge|notch|summit|glacier/.test(lower) || Math.abs(lat) >= 55) return "alpine";
  if (photos.length >= 12) return "metro";
  if (within(lat, 31, 42.5) && within(lng, -121, -103)) return "adobe";
  if (within(lat, 38.5, 47.5) && within(lng, -80.5, -66)) return "newEngland";
  if (within(lat, 32, 49.5) && within(lng, -126, -123)) return "harbour";
  return "farm";
}

const WIDTH: Record<CityTier, number> = { spot: 26, town: 40, city: 56 };
const RANK: Record<CityTier, number> = { spot: 0, town: 1, city: 2 };

function Ground({ w, g: [fill, edge] }: { w: number; g: GroundTone }) {
  const h = w * 0.34;
  return (
    <>
      <rect x={-w / 2} y={-h / 2 + 1.6} width={w} height={h} rx={h * 0.42} fill={edge} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.42} fill={fill} stroke={edge} strokeWidth={0.8} />
    </>
  );
}

export function CityModel({ place, tier }: { place: Place; tier: CityTier }) {
  const { ground, draw }: Model = MODELS[cityModelKey(place)];
  const w = WIDTH[tier];
  return (
    <g>
      <Ground w={w} g={ground} />
      {draw(RANK[tier], w)}
    </g>
  );
}
