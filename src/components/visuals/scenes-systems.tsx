"use client";

import { A, Box, Draw, Layer, Packet, Show } from "./primitives";

export function GenAIAgent() {
  const edges = {
    query: "M50 75 H92",
    retrieve: "M148 68 C168 68 168 26 184 26",
    tools: "M148 75 H184",
    memory: "M148 82 C168 82 168 124 184 124",
    reply: "M120 92 C120 132 30 132 30 86",
  };
  return (
    <>
      {Object.values(edges).map((d) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeDasharray="2 3" />
      ))}
      <Box x={10} y={64} w={40} h={22} label="query" hot={[[0.2, 1.1]]} />
      <Box x={92} y={58} w={56} h={34} label="agent" hot={[[1.1, 5.8]]} />
      <Box x={184} y={16} w={48} h={20} label="retrieve" hot={[[2.2, 2.8]]} />
      <Box x={184} y={65} w={48} h={20} label="tools" hot={[[3.9, 4.4]]} />
      <Box x={184} y={114} w={48} h={20} label="memory" hot={[[5.5, 6.6]]} />
      <Layer>
        <Packet d={edges.query} at={[0.3, 1.1]} />
        <Packet d={edges.retrieve} at={[1.5, 2.2]} />
        <Packet d="M184 26 C168 26 168 68 148 68" at={[2.6, 3.3]} />
        <Packet d={edges.tools} at={[3.3, 3.9]} />
        <Packet d="M184 75 H148" at={[4.2, 4.8]} />
        <Packet d={edges.memory} at={[4.8, 5.5]} />
        <Draw d={edges.reply} at={[5.6, 6.6]} className="viz-b" width={1.4} />
        <Packet d={edges.reply} at={[5.6, 6.6]} className="viz-b" />
        <text x={30} y={58} textAnchor="middle" className="viz-text viz-b" opacity={0}>
          ✓ answer
          <Show at={[6.5, 7.6]} />
        </text>
      </Layer>
    </>
  );
}

export function AutoMLForecast() {
  const history = "M16 96 L28 88 L40 98 L52 80 L64 86 L76 70 L88 78 L100 62 L112 72 L124 56 L140 64";
  const winner = "M140 64 L152 54 L164 62 L176 48 L188 56 L200 42 L212 50 L226 38";
  const rejected = ["M140 64 L160 74 L180 70 L200 82 L226 78", "M140 64 L160 40 L180 30 L200 26 L226 18"];
  const models = [
    { name: "gbm", width: 46 },
    { name: "lstm", width: 30 },
    { name: "arima", width: 22 },
  ];
  return (
    <>
      <path d="M16 20 V128 H226" fill="none" stroke="currentColor" strokeOpacity={0.25} />
      <path d="M140 24 V128" stroke="currentColor" strokeOpacity={0.25} strokeDasharray="2 3" />
      <text x={140} y={20} textAnchor="middle" className="viz-text" opacity={0.6}>now</text>
      <Layer>
        <Draw d={history} at={[0.2, 2.2]} />
        {rejected.map((d) => (
          <g key={d}>
            <A attr="opacity" at={[4, 4.4]} values={[1, 0.2]} />
            <Draw d={d} at={[2.4, 3.4]} opacity={0.4} />
          </g>
        ))}
        <Draw d={winner} at={[2.4, 3.4]} opacity={0.4} />
        <Draw d={winner} at={[4, 4.8]} className="viz-a" width={1.8} />
        <path d="M140 64 L176 40 L226 24 L226 54 L176 58 Z" className="viz-a" fill="currentColor" fillOpacity={0.12} opacity={0}>
          <A attr="opacity" at={[4.6, 5.2]} values={[0, 1]} />
        </path>
        {models.map(({ name, width }, i) => (
          <g key={name}>
            <text x={24} y={30 + i * 9} className="viz-text" opacity={0.7}>{name}</text>
            <rect x={54} y={25 + i * 9} height={4} rx={1} width={0} className={i === 0 ? "viz-a" : undefined} fill="currentColor" fillOpacity={i === 0 ? 0.9 : 0.3}>
              <A attr="width" at={[2.6 + i * 0.08, 3.4 + i * 0.08]} values={[0, width]} />
            </rect>
          </g>
        ))}
      </Layer>
    </>
  );
}

export function DataPlatform() {
  const nodeY = [36, 52, 68, 84, 100];
  const flows: [number, [number, number]][] = [
    [0, [0.6, 1.4]], [1, [1.0, 1.8]], [2, [1.4, 2.2]], [0, [2.6, 3.4]],
    [3, [3.8, 4.6]], [4, [4.4, 5.2]], [1, [5.0, 5.8]], [3, [5.6, 6.4]],
  ];
  return (
    <>
      <text x={34} y={22} textAnchor="middle" className="viz-text" opacity={0.6}>stores</text>
      {Array.from({ length: 5 }, (_, col) => (
        <g key={col}>
          <A attr="opacity" at={[0.4 + col * 0.15, 0.7 + col * 0.15, 1.2 + col * 0.15, 3.4 + col * 0.15, 3.7 + col * 0.15, 4.2 + col * 0.15]} values={[0.35, 1, 0.35, 0.35, 1, 0.35]} />
          {Array.from({ length: 6 }, (_, row) => (
            <circle key={row} cx={16 + col * 9} cy={32 + row * 14} r={1.8} fill="currentColor" />
          ))}
        </g>
      ))}
      <rect x={92} y={26} width={56} height={92} rx={4} fill="none" stroke="currentColor" strokeOpacity={0.3} />
      <text x={120} y={22} textAnchor="middle" className="viz-text" opacity={0.6}>spark cluster</text>
      {nodeY.map((y, i) => (
        <g key={y} opacity={i < 3 ? 1 : 0}>
          {i >= 3 && <A attr="opacity" at={[2.8 + (i - 3) * 0.4, 3.3 + (i - 3) * 0.4, 7.2, 7.6]} values={[0, 1, 1, 0]} />}
          <Box x={100} y={y} w={40} h={12} />
          <circle cx={107} cy={y + 6} r={1.6} className="viz-b" fill="currentColor" />
          <path d={`M112 ${y + 6} H133`} stroke="currentColor" strokeOpacity={0.25} />
        </g>
      ))}
      <text x={120} y={128} textAnchor="middle" className="viz-text viz-b" opacity={0}>
        +2 nodes
        <Show at={[3.4, 5]} />
      </text>
      <path d="M148 56 H164" stroke="currentColor" strokeOpacity={0.25} strokeDasharray="2 3" />
      <Box x={164} y={26} w={64} h={60} />
      <text x={170} y={36} className="viz-text" opacity={0.6}>monitor</text>
      <Box x={164} y={94} w={64} h={24} hot={[[5, 7.2]]} hotClass="viz-b" />
      <Layer>
        {flows.map(([node, at]) => (
          <Packet key={at[0]} d={`M62 ${nodeY[node] + 6} H100`} at={at} r={1.8} />
        ))}
        <Draw d="M170 72 L178 66 L186 70 L194 52 L202 60 L210 48 L222 54" at={[1, 3]} className="viz-a" />
        <text x={196} y={108.5} textAnchor="middle" className="viz-text viz-b" opacity={0}>
          jobs healthy
          <Show at={[5.1, 7]} />
        </text>
      </Layer>
    </>
  );
}

export function Chatbot() {
  const stages = ["embed", "intent", "entities", "rank"];
  return (
    <>
      <rect x={12} y={14} width={118} height={122} rx={4} fill="none" stroke="currentColor" strokeOpacity={0.3} />
      <path d="M12 28 H130" stroke="currentColor" strokeOpacity={0.2} />
      <text x={20} y={24} className="viz-text" opacity={0.6}>support chat</text>
      {stages.map((label, i) => (
        <Box key={label} x={146} y={18 + i * 30} w={82} h={18} label={label} hot={[[0.9 + i * 0.5, 1.4 + i * 0.5]]} />
      ))}
      <Layer>
        <g opacity={0}>
          <Show at={[0.3, 7.6]} />
          <A attr="transform" transform="translate" at={[0.3, 0.7]} values={["0 4", "0 0"]} />
          <rect x={60} y={36} width={62} height={18} rx={6} fill="currentColor" fillOpacity={0.1} />
          <rect x={66} y={42} width={40} height={2.5} rx={1} fill="currentColor" fillOpacity={0.5} />
          <rect x={66} y={47} width={28} height={2.5} rx={1} fill="currentColor" fillOpacity={0.5} />
        </g>
        <Packet d="M122 45 C134 45 134 27 146 27" at={[0.6, 1.0]} />
        {stages.slice(1).map((label, i) => (
          <Packet key={label} d={`M187 ${36 + i * 30} V${48 + i * 30}`} at={[1.3 + i * 0.5, 1.6 + i * 0.5]} r={1.8} />
        ))}
        <Packet d="M146 117 C120 117 120 78 98 78" at={[2.9, 3.6]} className="viz-b" />
        {[24, 30, 36].map((cx, i) => (
          <circle key={cx} cx={cx} cy={78} r={1.6} fill="currentColor" opacity={0}>
            <A attr="opacity" at={[2.6 + i * 0.1, 2.8 + i * 0.1, 3.0 + i * 0.1, 3.2 + i * 0.1, 3.5, 3.6]} values={[0, 0.8, 0.2, 0.8, 0.8, 0]} />
          </circle>
        ))}
        <g className="viz-a" opacity={0}>
          <Show at={[3.6, 7.6]} />
          <A attr="transform" transform="translate" at={[3.6, 4]} values={["0 4", "0 0"]} />
          <rect x={20} y={64} width={78} height={28} rx={6} fill="currentColor" fillOpacity={0.12} />
          <rect x={26} y={71} width={60} height={2.5} rx={1} fill="currentColor" fillOpacity={0.7} />
          <rect x={26} y={77} width={52} height={2.5} rx={1} fill="currentColor" fillOpacity={0.7} />
          <rect x={26} y={83} width={34} height={2.5} rx={1} fill="currentColor" fillOpacity={0.7} />
        </g>
      </Layer>
    </>
  );
}

export function KPIDashboard() {
  const tiles = [
    { label: "sla", value: "98.2%" },
    { label: "csat", value: "4.6" },
    { label: "volume", value: "12.4k" },
  ];
  const bars = [30, 44, 38, 56, 50, 66, 72];
  return (
    <>
      {tiles.map(({ label }, i) => (
        <g key={label}>
          <Box x={12 + i * 76} y={14} w={64} h={30} />
          <text x={18 + i * 76} y={23} className="viz-text" opacity={0.6}>{label}</text>
        </g>
      ))}
      <path d="M12 132 H140" stroke="currentColor" strokeOpacity={0.25} />
      <circle cx={190} cy={94} r={26} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={8} />
      <Layer>
        {tiles.map(({ label, value }, i) => (
          <text key={label} x={18 + i * 76} y={38} className="viz-text" fontSize={10} opacity={0}>
            {value}
            <tspan className="viz-b" fontSize={7}> ▲</tspan>
            <Show at={[0.4 + i * 0.1, 7.6]} />
          </text>
        ))}
        {bars.map((h, i) => (
          <rect key={i} x={18 + i * 17} width={11} rx={1.5} y={132} height={0} fill="currentColor" fillOpacity={0.22}>
            <A attr="height" at={[1 + i * 0.07, 1.7 + i * 0.07]} values={[0, h]} />
            <A attr="y" at={[1 + i * 0.07, 1.7 + i * 0.07]} values={[132, 132 - h]} />
          </rect>
        ))}
        <Draw d={bars.map((h, i) => `${i ? "L" : "M"}${23.5 + i * 17} ${126 - h}`).join(" ")} at={[2, 3]} className="viz-a" width={1.6} />
        <circle
          cx={190}
          cy={94}
          r={26}
          fill="none"
          className="viz-b"
          stroke="currentColor"
          strokeWidth={8}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1}
          transform="rotate(-90 190 94)"
        >
          <A attr="stroke-dashoffset" at={[1.4, 2.6]} values={[1, 0.28]} />
        </circle>
        <text x={190} y={97} textAnchor="middle" className="viz-text" fontSize={9} opacity={0}>
          72%
          <Show at={[2.2, 7.6]} />
        </text>
      </Layer>
    </>
  );
}
