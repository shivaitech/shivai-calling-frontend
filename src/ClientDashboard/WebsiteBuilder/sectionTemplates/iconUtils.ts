// ─────────────────────────────────────────────────────────────────────────────
// Icon Rendering Utilities
// Used by all section templates to render icons from Lucide (CDN) or emoji
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detects if a string contains emoji characters.
 * Lucide icon names are kebab-case ASCII (e.g. "rocket", "chart-bar").
 * Emoji icons are Unicode characters (e.g. "🚀", "✨").
 */
function isEmoji(str: string): boolean {
  // If it contains any non-ASCII or emoji-range chars, treat as emoji
  return /[^\x00-\x7F]/.test(str) || /^\p{Emoji}/u.test(str);
}

/**
 * Render an icon as either:
 * - A Lucide `<i data-lucide="name">` element (for kebab-case ASCII names)
 * - A styled emoji span (for Unicode emoji)
 *
 * The Lucide CDN must be loaded in the page head (added by templateEngine.ts).
 *
 * @param icon      Lucide icon name (e.g. "rocket") or emoji (e.g. "🚀")
 * @param size      Icon size in px (default 28)
 * @param color     Icon stroke color (default #6366f1)
 * @returns         HTML string
 */
export function renderIcon(icon: string, size = 28, color = "#6366f1"): string {
  if (!icon) {
    return `<i data-lucide="sparkles" style="width:${size}px;height:${size}px;color:${color};stroke-width:1.5"></i>`;
  }
  if (isEmoji(icon)) {
    return `<span style="font-size:${size}px;line-height:1;display:inline-block">${icon}</span>`;
  }
  // Lucide icon name
  return `<i data-lucide="${icon}" style="width:${size}px;height:${size}px;color:${color};stroke-width:1.5;display:inline-block"></i>`;
}

/**
 * Render an icon inside a styled box/badge (common for feature cards).
 * @param icon    Lucide icon name or emoji
 * @param size    Icon size in px
 * @param color   Icon / accent color
 * @param bg      Box background color (defaults to color + "18")
 * @param radius  Border radius in px (default 10)
 * @param boxSize Box width/height in px (default size + 20)
 */
export function renderIconBox(
  icon: string,
  size = 28,
  color = "#6366f1",
  bg?: string,
  radius = 10,
  boxSize?: number
): string {
  const box = boxSize ?? size + 20;
  const background = bg ?? `${color}1a`;
  return `<div style="width:${box}px;height:${box}px;background:${background};border-radius:${radius}px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
    ${renderIcon(icon, size, color)}
  </div>`;
}

/**
 * Render a circular icon badge (used in testimonials, team, etc.)
 */
export function renderIconCircle(icon: string, size = 24, color = "#6366f1", bg?: string): string {
  const background = bg ?? `${color}18`;
  const circle = size + 20;
  return `<div style="width:${circle}px;height:${circle}px;background:${background};border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
    ${renderIcon(icon, size, color)}
  </div>`;
}
