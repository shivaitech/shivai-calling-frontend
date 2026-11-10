/**
 * Scrolls the page to a section, frame by frame.
 *
 * Not `scrollIntoView({ behavior: "smooth" })`: Chrome cancels a smooth scroll as soon as any other
 * smooth scroll starts (e.g. a carousel centring its tabs), so menu links stopped halfway. Each frame
 * here is an instant jump, re-aimed at the section (so images loading above it don't throw it off)
 * and offset by its scroll-margin-top. Touching or wheeling the page hands control back.
 */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const targetY = () => {
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(max, el.getBoundingClientRect().top + window.scrollY - margin));
  };
  // "instant" so a page-wide `scroll-behavior: smooth` doesn't turn each step into its own animation.
  const jump = (top: number) => window.scrollTo({ top, behavior: "instant" as ScrollBehavior });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return jump(targetY());

  const startY = window.scrollY;
  const duration = Math.min(1100, Math.max(350, Math.abs(targetY() - startY) * 0.45));
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let start: number | null = null;
  let stopped = false;
  const stop = () => {
    stopped = true;
  };
  const opts = { passive: true, once: true } as const;
  window.addEventListener("wheel", stop, opts);
  window.addEventListener("touchstart", stop, opts);

  const step = (now: number) => {
    if (stopped) return;
    start ??= now;
    const t = Math.min(1, (now - start) / duration);
    jump(startY + (targetY() - startY) * ease(t));
    if (t < 1) requestAnimationFrame(step);
    else {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    }
  };
  requestAnimationFrame(step);
}
