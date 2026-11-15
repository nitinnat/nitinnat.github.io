"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function PostOutline({ headings }: { headings: string[] }) {
  const enabled = headings.length >= 3;
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!enabled) return;
    const sections = [...document.querySelectorAll(".mdx-content h2")];
    sections.forEach((heading, index) => {
      heading.id ||= `section-${index + 1}`;
    });
    // The active section is the last heading above the top 30% of the viewport.
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.3;
        setActive(sections.findLastIndex((heading) => heading.getBoundingClientRect().top < line));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <nav
      aria-label="On this page"
      className="fixed top-28 hidden w-56 min-[1320px]:block"
      style={{ left: "calc(50% + 26rem)" }}
    >
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">On this page</p>
      <ol className="space-y-2 border-l border-border">
        {headings.map((heading, index) => (
          <li key={heading}>
            <a
              href={`#section-${index + 1}`}
              aria-current={index === active ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-0.5 pl-3 text-sm leading-snug transition-colors",
                index === active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
