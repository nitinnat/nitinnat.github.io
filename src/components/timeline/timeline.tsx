import { cn } from "@/lib/utils";
import type { TimelineProps } from "./timeline-types";
import { TimelineEntryCard } from "./timeline-entry";

export function Timeline({ entries, className, variant = "work" }: TimelineProps) {
  return (
    <div className={cn("relative space-y-2", className)}>
      {entries.map((entry, index) => (
        <TimelineEntryCard key={entry.id} entry={entry} index={index} variant={variant} />
      ))}
    </div>
  );
}
