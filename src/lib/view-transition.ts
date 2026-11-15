// Runs a DOM update inside a same-document View Transition when supported and motion is allowed.
export function withViewTransition(update: () => void): Promise<void> {
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return Promise.resolve();
  }
  return document.startViewTransition(update).finished;
}
