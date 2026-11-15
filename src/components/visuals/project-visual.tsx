"use client";

import { useEffect, useRef, type ComponentType } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Cycle } from "./primitives";
import { AutoMLForecast, Chatbot, DataPlatform, GenAIAgent, KPIDashboard } from "./scenes-systems";
import { ConsensusMLP, CursorTracking, GossipSVM, HybridTracking, OCRFeatures } from "./scenes-research";

interface Scene {
  Scene: ComponentType;
  label: string;
  cycle: number;
  // Frame shown when reduced motion is requested.
  still: number;
}

const scenes = {
  "genai-agent": { Scene: GenAIAgent, label: "Agent loop · RAG · memory", cycle: 8, still: 6.8 },
  "automl-forecast": { Scene: AutoMLForecast, label: "AutoML model selection", cycle: 8, still: 6 },
  "data-platform": { Scene: DataPlatform, label: "Spark scaling · monitoring", cycle: 8, still: 5.8 },
  "cursor-tracking": { Scene: CursorTracking, label: "Unsupervised cursor tracking", cycle: 8, still: 3.4 },
  "gossip-svm": { Scene: GossipSVM, label: "Gossip-based consensus", cycle: 8, still: 6 },
  "hybrid-tracking": { Scene: HybridTracking, label: "Tracking with detection resets", cycle: 6, still: 3.65 },
  chatbot: { Scene: Chatbot, label: "Intent → retrieval pipeline", cycle: 8, still: 5 },
  "kpi-dashboard": { Scene: KPIDashboard, label: "KPI reporting", cycle: 8, still: 5 },
  "ocr-features": { Scene: OCRFeatures, label: "Features → k-NN classification", cycle: 8, still: 5.5 },
  "consensus-mlp": { Scene: ConsensusMLP, label: "Vertically partitioned consensus MLPs", cycle: 8, still: 5.6 },
} satisfies Record<string, Scene>;

export type VisualName = keyof typeof scenes;

export function ProjectVisual({ name, className }: { name: VisualName; className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { margin: "120px" });
  const reduceMotion = useReducedMotion();
  const { Scene, label, cycle, still } = scenes[name];

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (reduceMotion) {
      svg.pauseAnimations();
      svg.setCurrentTime(still);
    } else if (inView) {
      svg.unpauseAnimations();
    } else {
      svg.pauseAnimations();
    }
  }, [inView, reduceMotion, still]);

  return (
    <figure className={cn("viz technical-grid m-0 overflow-hidden rounded-md border border-border/70 bg-card", className)}>
      <svg ref={svgRef} viewBox="0 0 240 150" role="img" aria-label={label} fontSize={9} className="block h-auto w-full font-mono">
        <Cycle.Provider value={cycle}>
          <Scene />
        </Cycle.Provider>
      </svg>
      <figcaption className="m-0 border-t border-border/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}
