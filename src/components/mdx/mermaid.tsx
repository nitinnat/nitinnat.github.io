"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const currentTheme = resolvedTheme || theme || "dark";

    mermaid.initialize({
      startOnLoad: false,
      theme: currentTheme === "dark" ? "dark" : "default",
      securityLevel: "loose",
    });

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(7)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        setSvg(
          `<pre class="text-destructive p-4 bg-muted rounded">Error rendering diagram: ${error instanceof Error ? error.message : "Unknown error"}</pre>`
        );
      }
    };

    renderDiagram();
  }, [chart, theme, resolvedTheme, mounted]);

  if (!mounted) {
    return (
      <div className="p-4 bg-muted rounded-lg animate-pulse text-muted-foreground">
        Loading diagram...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container my-6 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
