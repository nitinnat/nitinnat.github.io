"use client";

import { useEffect } from "react";

// Deters casual saving (context menu, drag-to-desktop, long-press) of photos on the page and in
// the lightbox. Anything shown on screen can still be captured; this only removes the easy paths.
export function PhotoProtection() {
  useEffect(() => {
    const block = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && target.closest("[data-protected], .yarl__portal")) {
        event.preventDefault();
      }
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return null;
}
