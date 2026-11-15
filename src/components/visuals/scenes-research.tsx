"use client";

import { useContext } from "react";
import { A, Box, Cycle, Draw, EASE_IN_OUT, Layer, Packet, Show } from "./primitives";

export function CursorTracking() {
  const path = "M60 112 C80 60 140 46 168 66 S204 118 152 114 L23 58";
  // keyPoints/offsets share one schedule so the trail, cursor and detection box stay in sync.
  const at = [0.4, 4.6, 5.1];
  const progress = [0, 0.64, 1];
  const T = useContext(Cycle);
  const motion = (lag: number) => ({
    path,
    dur: `${T}s`,
    repeatCount: "indefinite",
    calcMode: "spline",
    keyTimes: [0, ...at.map((t) => (t + lag) / T), 1].map((t) => t.toFixed(4)).join(";"),
    keyPoints: [0, ...progress, 1].join(";"),
    keySplines: Array(4).fill(EASE_IN_OUT).join(";"),
  });
  return (
    <>
      <rect x={14} y={14} width={212} height={122} rx={4} fill="none" stroke="currentColor" strokeOpacity={0.3} />
      <path d="M14 24 H226 M30 24 V136" stroke="currentColor" strokeOpacity={0.2} />
      {[20, 25, 30].map((cx) => (
        <circle key={cx} cx={cx} cy={19} r={1.3} fill="currentColor" opacity={0.35} />
      ))}
      <text x={220} y={21} textAnchor="end" className="viz-text viz-muted">screen recording</text>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={18} y={30 + i * 13} width={8} height={8} rx={1.5} fill="currentColor" opacity={0.15} />
      ))}
      <Box x={18} y={56} w={8} h={8} hot={[[5.1, 6.4]]} hotClass="viz-b" />
      <circle cx={112} cy={84} r={24} fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.15} />
      <rect x={150} y={36} width={56} height={34} rx={2} fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.15} />
      <Layer>
        <path d={path} className="viz-a" fill="none" stroke="currentColor" strokeOpacity={0.5} strokeDasharray="1 1" pathLength={1} strokeDashoffset={1}>
          <A attr="stroke-dashoffset" at={at} values={progress.map((p) => 1 - p)} ease={EASE_IN_OUT} />
        </path>
        <g>
          <animateMotion {...motion(0)} />
          <path d="M0 0 L0 11 L3 8.4 L5.4 13 L7.4 12 L5 7.6 L9 7.6 Z" fill="currentColor" className="viz-surface-stroke" strokeWidth={0.8} />
        </g>
        <g className="viz-a">
          <animateMotion {...motion(0.12)} />
          <rect x={-5} y={-5} width={18} height={21} fill="none" stroke="currentColor" strokeDasharray="2 2" />
          <text x={-5} y={-7.5} className="viz-text" fontSize={7}>cursor 0.97</text>
        </g>
      </Layer>
    </>
  );
}

const GOSSIP_NODES = [
  { x: 44, y: 40, angle: -50 },
  { x: 120, y: 24, angle: 20 },
  { x: 196, y: 40, angle: 75 },
  { x: 196, y: 108, angle: -15 },
  { x: 120, y: 124, angle: 50 },
  { x: 44, y: 108, angle: -75 },
];

export function GossipSVM() {
  const consensus = 30;
  const exchanges: [number, number][] = [[0, 1], [3, 4], [1, 2], [5, 0], [2, 3], [4, 5], [1, 0], [3, 2]];
  const edge = (a: number, b: number) =>
    `M${GOSSIP_NODES[a].x} ${GOSSIP_NODES[a].y} L${GOSSIP_NODES[b].x} ${GOSSIP_NODES[b].y}`;
  return (
    <>
      {GOSSIP_NODES.map((_, i) => (
        <path key={i} d={edge(i, (i + 1) % 6)} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="2 3" />
      ))}
      <Layer>
        {exchanges.map(([a, b], i) => (
          <Packet key={i} d={edge(a, b)} at={[0.4 + i * 0.6, 1.1 + i * 0.6]} />
        ))}
      </Layer>
      {GOSSIP_NODES.map(({ x, y, angle }) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={14} className="viz-surface" stroke="currentColor" strokeOpacity={0.3} />
          <circle cx={x} cy={y} r={14} className="viz-b" fill="currentColor" fillOpacity={0.1} stroke="currentColor" opacity={0}>
            <Show at={[5.2, 7.3]} />
          </circle>
          <circle cx={x - 5} cy={y - 4} r={1.3} fill="currentColor" opacity={0.5} />
          <circle cx={x - 2} cy={y - 7} r={1.3} fill="currentColor" opacity={0.5} />
          <circle cx={x + 5} cy={y + 5} r={1.3} className="viz-a" fill="currentColor" />
          <circle cx={x + 3} cy={y + 8} r={1.3} className="viz-a" fill="currentColor" />
          <path d={`M${x - 10} ${y} H${x + 10}`} stroke="currentColor" strokeWidth={1.3} strokeLinecap="round">
            <A
              attr="transform"
              transform="rotate"
              at={[0.6, 3, 5, 7.3, 7.9]}
              values={[angle, (angle + consensus) / 2, consensus, consensus, angle].map((a) => `${a} ${x} ${y}`)}
            />
          </path>
        </g>
      ))}
      <text x={120} y={77} textAnchor="middle" className="viz-text viz-b" opacity={0}>
        consensus
        <Show at={[5.4, 7.3]} />
      </text>
    </>
  );
}

export function HybridTracking() {
  const times = [0.3, 1.2, 1.95, 2.15, 2.8, 3.55, 3.75, 4.4, 5.2];
  const object = [[30, 80], [70, 64], [102, 77], [111, 75], [140, 60], [166, 74], [174, 76], [200, 62], [214, 72]];
  const drift = [[0, 0], [5, 6], [11, 12], [0, 0], [4, -5], [10, -11], [0, 0], [5, 6], [10, 10]];
  const xy = (points: number[][]) => points.map(([x, y]) => `${x} ${y}`);
  const tracker = object.map(([x, y], i) => [x + drift[i][0], y + drift[i][1]]);
  return (
    <>
      <path d="M16 96 H224" stroke="currentColor" strokeOpacity={0.15} strokeDasharray="1 4" />
      <text x={16} y={137} className="viz-text viz-muted">drift</text>
      <rect x={46} y={132} width={120} height={4} rx={1} fill="currentColor" opacity={0.08} />
      <Layer>
        <rect x={46} y={132} height={4} rx={1} width={0} className="viz-a" fill="currentColor">
          <A attr="width" at={times} values={drift.map(([dx, dy]) => Math.round(Math.hypot(dx, dy) * 6))} linear />
        </rect>
        <g opacity={0}>
          <Show at={[0.1, 5.4]} />
          <A attr="transform" transform="translate" at={times} values={xy(object)} linear />
          <rect x={-7} y={-5} width={14} height={10} rx={3} fill="currentColor" opacity={0.75} />
          {[[1.95, 2.45], [3.55, 4.05]].map(([s, e]) => (
            <g key={s} className="viz-b" opacity={0}>
              <Show at={[s, e]} fade={0.1} />
              <rect x={-10} y={-8} width={20} height={16} fill="none" stroke="currentColor" strokeWidth={1.4} />
              <text x={-10} y={13} className="viz-text" fontSize={7}>detect</text>
            </g>
          ))}
        </g>
        <g className="viz-a" opacity={0}>
          <Show at={[0.1, 5.4]} />
          <A attr="transform" transform="translate" at={times} values={xy(tracker)} linear />
          <rect x={-11} y={-9} width={22} height={18} fill="none" stroke="currentColor" strokeDasharray="2 2" />
          <text x={-11} y={-11.5} className="viz-text" fontSize={7}>track</text>
        </g>
      </Layer>
    </>
  );
}

const GLYPH = ["00011000", "00111100", "01100110", "01100110", "01111110", "01100110", "01100110", "00000000"];

export function OCRFeatures() {
  const features = [12, 22, 8, 18, 26, 10, 16, 20];
  const clusters = [
    { className: "viz-b", points: [[176, 44], [184, 52], [170, 54], [180, 40], [190, 46]] },
    { className: undefined, points: [[206, 90], [214, 98], [200, 100], [212, 84]] },
    { className: undefined, points: [[166, 104], [176, 110], [170, 96]] },
  ];
  const query = [186, 62];
  return (
    <>
      {["glyph", "features", "k-nn"].map((label, i) => (
        <text key={label} x={[50, 118, 192][i]} y={22} textAnchor="middle" className="viz-text viz-muted">{label}</text>
      ))}
      <rect x={14} y={30} width={72} height={72} fill="none" stroke="currentColor" strokeOpacity={0.25} />
      <path d="M100 102 H136 M142 66 H152" stroke="currentColor" strokeOpacity={0.25} />
      <rect x={156} y={30} width={72} height={90} rx={3} fill="none" stroke="currentColor" strokeOpacity={0.2} />
      {clusters.map(({ className, points }) =>
        points.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2} className={className} fill="currentColor" opacity={className ? 0.8 : 0.3} />
        ))
      )}
      <Layer>
        {GLYPH.map((row, r) =>
          [...row].map((bit, c) =>
            bit === "1" ? (
              <rect key={`${r}-${c}`} x={14 + c * 9} y={30 + r * 9} width={8} height={8} rx={1} fill="currentColor" opacity={0}>
                <A attr="opacity" at={[0.2 + r * 0.08, 0.5 + r * 0.08]} values={[0, 0.75]} />
              </rect>
            ) : null
          )
        )}
        <path d="M14 28 V104" className="viz-a" stroke="currentColor" strokeWidth={1.4} opacity={0}>
          <Show at={[1.2, 2.3]} fade={0.15} />
          <A attr="transform" transform="translate" at={[1.2, 2.4]} values={["0 0", "72 0"]} />
        </path>
        {features.map((h, i) => (
          <rect key={i} x={100 + i * 4.6} width={3} y={102} height={0} className="viz-a" fill="currentColor">
            <A attr="height" at={[1.6 + i * 0.1, 2.2 + i * 0.1]} values={[0, h]} />
            <A attr="y" at={[1.6 + i * 0.1, 2.2 + i * 0.1]} values={[102, 102 - h]} />
          </rect>
        ))}
        <circle cx={query[0]} cy={query[1]} r={3.2} className="viz-a" fill="currentColor" opacity={0}>
          <Show at={[3.4, 7.6]} />
        </circle>
        {clusters[0].points.slice(0, 3).map(([x, y]) => (
          <Draw key={`${x}-${y}`} d={`M${query[0]} ${query[1]} L${x} ${y}`} at={[4, 4.6]} className="viz-a" width={0.8} />
        ))}
        <text x={206} y={64} className="viz-text viz-b" fontSize={9} opacity={0}>
          “A”
          <Show at={[4.8, 7.6]} />
        </text>
      </Layer>
    </>
  );
}

const PEERS = [
  { x: 14, y: 14 },
  { x: 150, y: 14 },
  { x: 150, y: 88 },
  { x: 14, y: 88 },
];

export function ConsensusMLP() {
  const layers = [[10, 24, 38], [6, 18, 30, 42], [16, 32]];
  const links = [
    ["M90 38 H150", [0.6, 1.4]],
    ["M188 62 V88", [1.2, 2.0]],
    ["M150 112 H90", [2.0, 2.8]],
    ["M52 88 V62", [2.6, 3.4]],
    ["M150 38 H90", [3.4, 4.2]],
    ["M52 62 V88", [4.0, 4.8]],
  ] as const;
  return (
    <>
      {links.slice(0, 4).map(([d]) => (
        <path key={d} d={d} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="2 3" />
      ))}
      <Layer>
        {links.map(([d, at]) => (
          <Packet key={d + at[0]} d={d} at={[...at]} />
        ))}
      </Layer>
      {PEERS.map(({ x, y }, peer) => (
        <g key={peer}>
          <Box x={x} y={y} w={76} h={48} hot={[[5, 7.3]]} hotClass="viz-b" />
          {Array.from({ length: 3 }, (_, col) => (
            <rect
              key={col}
              x={x + 6 + col * 6}
              y={y + 8}
              width={4.5}
              height={30}
              rx={1}
              className={col === peer % 3 ? "viz-a" : undefined}
              fill="currentColor"
              opacity={col === peer % 3 ? 0.8 : 0.12}
            />
          ))}
          {layers.slice(1).flatMap((layer, l) =>
            layer.flatMap((ly) =>
              layers[l].map((py) => (
                <path key={`${l}-${py}-${ly}`} d={`M${x + 34 + l * 16} ${y + py} L${x + 50 + l * 16} ${y + ly}`} stroke="currentColor" strokeWidth={0.5} opacity={0.15}>
                  <A attr="opacity" at={[1 + peer * 0.3, 4.6, 7.2, 7.8]} values={[0.15, 0.55, 0.55, 0.15]} />
                </path>
              ))
            )
          )}
          {layers.map((layer, l) =>
            layer.map((ly) => <circle key={`${l}-${ly}`} cx={x + 34 + l * 16} cy={y + ly} r={2} fill="currentColor" />)
          )}
          <text x={x + 6} y={y + 46} className="viz-text viz-muted" fontSize={6.5}>
            loss {(0.8 + peer * 0.04).toFixed(2)}
            <A attr="opacity" at={[4.4, 4.7, 7.6, 7.9]} values={[1, 0, 0, 1]} />
          </text>
          <text x={x + 6} y={y + 46} className="viz-text viz-b" fontSize={6.5} opacity={0}>
            loss 0.1{peer + 1}
            <Show at={[4.7, 7.3]} />
          </text>
        </g>
      ))}
    </>
  );
}
