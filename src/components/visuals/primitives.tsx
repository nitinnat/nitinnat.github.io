"use client";

import { createContext, useContext, type ReactNode } from "react";

// Every animation in a scene shares one cycle length so loops never drift apart.
export const Cycle = createContext(8);

const EASE_OUT = "0.23 1 0.32 1";
export const EASE_IN_OUT = "0.77 0 0.175 1";

function timeline(T: number, at: number[], values: (string | number)[], ease: string) {
  const times = [...at];
  const vals = [...values];
  if (times[0] > 0) {
    times.unshift(0);
    vals.unshift(vals[0]);
  }
  if (times[times.length - 1] < T) {
    times.push(T);
    vals.push(vals[vals.length - 1]);
  }
  return {
    dur: `${T}s`,
    keyTimes: times.map((t) => +(t / T).toFixed(4)).join(";"),
    values: vals.join(";"),
    keySplines: Array(times.length - 1).fill(ease).join(";"),
  };
}

interface AnimProps {
  attr: string;
  at: number[];
  values: (string | number)[];
  transform?: "translate" | "rotate" | "scale";
  linear?: boolean;
  ease?: string;
}

export function A({ attr, at, values, transform, linear, ease }: AnimProps) {
  const { keySplines, ...t } = timeline(useContext(Cycle), at, values, ease ?? (transform ? EASE_IN_OUT : EASE_OUT));
  const timing = linear
    ? { ...t, calcMode: "linear" }
    : { ...t, calcMode: "spline", keySplines };

  if (transform) {
    return (
      <animateTransform
        attributeName="transform"
        type={transform}
        additive="sum"
        repeatCount="indefinite"
        {...timing}
      />
    );
  }
  return <animate attributeName={attr} repeatCount="indefinite" {...timing} />;
}

export function Show({ at, fade = 0.3 }: { at: [number, number]; fade?: number }) {
  const [start, end] = at;
  return <A attr="opacity" at={[start, start + fade, end, end + fade]} values={[0, 1, 1, 0]} />;
}

export function Layer({ children }: { children: ReactNode }) {
  const T = useContext(Cycle);
  return (
    <g>
      <A attr="opacity" at={[T - 0.7, T - 0.2]} values={[1, 0]} />
      {children}
    </g>
  );
}

export function Draw({
  d,
  at,
  className,
  width = 1.2,
  opacity = 1,
}: {
  d: string;
  at: [number, number];
  className?: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <path
      d={d}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1}
    >
      <A attr="stroke-dashoffset" at={at} values={[1, 0]} />
    </path>
  );
}

export function Packet({
  d,
  at,
  className = "viz-a",
  r = 2.2,
}: {
  d: string;
  at: [number, number];
  className?: string;
  r?: number;
}) {
  const [start, end] = at;
  const { keySplines, values, ...t } = timeline(useContext(Cycle), at, [0, 1], EASE_IN_OUT);
  return (
    <circle r={r} className={className} fill="currentColor" opacity={0}>
      <animateMotion
        path={d}
        repeatCount="indefinite"
        calcMode="spline"
        keyPoints={values}
        keySplines={keySplines}
        {...t}
      />
      <A attr="opacity" at={[start, start + 0.08, end - 0.08, end]} values={[0, 1, 1, 0]} />
    </circle>
  );
}

export function Box({
  x,
  y,
  w,
  h,
  label,
  hot = [],
  hotClass = "viz-a",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  hot?: [number, number][];
  hotClass?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} className="viz-surface" stroke="currentColor" strokeOpacity={0.3} />
      {hot.length > 0 && (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={3}
          className={hotClass}
          fill="currentColor"
          fillOpacity={0.1}
          stroke="currentColor"
          opacity={0}
        >
          <A
            attr="opacity"
            at={hot.flatMap(([s, e]) => [s, s + 0.2, e, e + 0.3])}
            values={hot.flatMap(() => [0, 1, 1, 0])}
          />
        </rect>
      )}
      {label && (
        <text x={x + w / 2} y={y + h / 2 + 2.4} textAnchor="middle" className="viz-text">
          {label}
        </text>
      )}
    </g>
  );
}
