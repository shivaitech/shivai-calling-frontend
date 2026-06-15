// ─────────────────────────────────────────────────────────────────────────────
// Design.md Service
// Fetches production-grade DESIGN.md references (from VoltAgent/awesome-design-md,
// the getdesign.md collection) and auto-matches the best famous-site design
// system for a given industry + theme. The reference is fed into the AI prompt
// so generated sites move from "template-basic" to "famous-site-grade".
// ─────────────────────────────────────────────────────────────────────────────

import type { Industry, ThemeStyle } from "./sectionTemplates/types";

const RAW_BASE =
  "https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md";

export interface DesignRef {
  /** Folder/slug in the awesome-design-md repo, e.g. "stripe", "linear.app". */
  brand: string;
  /** Human label shown in progress/UI. */
  label: string;
  /** One-line vibe for logs/UI. */
  vibe: string;
  /** Industries this reference fits best. */
  industries: Industry[];
  /** Theme styles this reference fits best. */
  themes: ThemeStyle[];
}

// Curated for breadth of look & full industry coverage. Only latest,
// high-quality design systems are included. Every Industry maps to ≥2 strong
// references; pickDesignRef() scores by industry (×3) + theme (×2).
export const DESIGN_REFS: DesignRef[] = [
  // ── Fintech / Finance ──
  { brand: "stripe",     label: "Stripe",     vibe: "Atmospheric gradients, weight-300 elegance, fintech polish", industries: ["finance", "saas", "startup", "consulting"], themes: ["modern", "elegant", "corporate"] },
  { brand: "revolut",    label: "Revolut",    vibe: "Modern fintech, gradient-rich, premium",                     industries: ["finance", "saas", "startup"], themes: ["modern", "bold", "dark"] },
  { brand: "wise",       label: "Wise",       vibe: "Trustworthy fintech, bright green, clear & friendly",        industries: ["finance", "startup", "consulting"], themes: ["modern", "minimal", "corporate"] },
  { brand: "coinbase",   label: "Coinbase",   vibe: "Clean crypto-fintech, deep blue, confident",                 industries: ["finance", "saas", "startup"], themes: ["modern", "corporate", "dark"] },
  { brand: "mastercard", label: "Mastercard", vibe: "Iconic corporate, bold circles, enterprise trust",           industries: ["finance", "consulting", "legal"], themes: ["corporate", "bold", "modern"] },

  // ── SaaS / Startup / Dev tools ──
  { brand: "linear.app", label: "Linear",     vibe: "Crisp dark UI, tight type, developer-grade minimalism",      industries: ["saas", "startup", "agency"],   themes: ["modern", "minimal", "dark"] },
  { brand: "vercel",     label: "Vercel",     vibe: "High-contrast black & white, precise, technical",            industries: ["saas", "startup", "agency"],   themes: ["minimal", "modern", "dark"] },
  { brand: "supabase",   label: "Supabase",   vibe: "Dark developer green, modern technical clarity",             industries: ["saas", "startup"],             themes: ["dark", "modern", "minimal"] },
  { brand: "posthog",    label: "PostHog",    vibe: "Playful-technical, hand-drawn energy, bold",                 industries: ["saas", "startup", "agency"],   themes: ["playful", "bold", "modern"] },
  { brand: "sentry",     label: "Sentry",     vibe: "Confident dark, purple accent, engineering-grade",           industries: ["saas", "startup"],             themes: ["dark", "modern", "bold"] },
  { brand: "mintlify",   label: "Mintlify",   vibe: "Clean docs aesthetic, soft, highly readable",                industries: ["saas", "education", "consulting"], themes: ["minimal", "modern", "elegant"] },
  { brand: "intercom",   label: "Intercom",   vibe: "Friendly SaaS, rounded, conversational",                     industries: ["saas", "consulting", "startup"], themes: ["modern", "playful", "corporate"] },
  { brand: "notion",     label: "Notion",     vibe: "Friendly editorial, soft neutrals, approachable",            industries: ["saas", "education", "consulting"], themes: ["minimal", "modern", "playful"] },

  // ── Premium / Professional (legal, consulting, healthcare-clean) ──
  { brand: "superhuman", label: "Superhuman", vibe: "Sleek premium, refined dark, high-end product feel",         industries: ["consulting", "legal", "saas"], themes: ["elegant", "dark", "modern"] },
  { brand: "cal",        label: "Cal.com",    vibe: "Clean scheduling, calm neutral, trustworthy",                industries: ["healthcare", "consulting", "education"], themes: ["minimal", "modern", "elegant"] },
  { brand: "claude",     label: "Claude",     vibe: "Warm terracotta accent, clean editorial calm",               industries: ["healthcare", "education", "nonprofit"], themes: ["minimal", "elegant", "modern"] },

  // ── Commerce / Retail / Beauty / Food ──
  { brand: "shopify",    label: "Shopify",    vibe: "Confident commerce, green accents, conversion-focused",      industries: ["ecommerce", "startup", "consulting"], themes: ["modern", "bold", "corporate"] },
  { brand: "apple",      label: "Apple",      vibe: "Premium minimal, huge type, immaculate whitespace",          industries: ["ecommerce", "manufacturing", "automotive", "realestate"], themes: ["minimal", "elegant", "modern"] },
  { brand: "starbucks",  label: "Starbucks",  vibe: "Warm, inviting, premium retail & food",                      industries: ["restaurant", "ecommerce", "beauty"], themes: ["elegant", "modern", "classic"] },
  { brand: "pinterest",  label: "Pinterest",  vibe: "Visual-first, soft, aesthetic & inspirational",              industries: ["beauty", "portfolio", "media", "ecommerce"], themes: ["playful", "modern", "elegant"] },

  // ── Travel / Hospitality / Real Estate ──
  { brand: "airbnb",     label: "Airbnb",     vibe: "Warm, human, photo-led hospitality",                         industries: ["travel", "realestate", "restaurant"], themes: ["modern", "elegant", "playful"] },
  { brand: "uber",       label: "Uber",       vibe: "Bold black, geometric, modern mobility",                     industries: ["travel", "consulting", "startup"], themes: ["bold", "modern", "minimal"] },

  // ── Fitness / Sports / Lifestyle ──
  { brand: "nike",       label: "Nike",       vibe: "High-energy, bold black & white, athletic",                  industries: ["fitness", "ecommerce", "media"], themes: ["bold", "modern", "playful"] },
  { brand: "spotify",    label: "Spotify",    vibe: "Vibrant dark, music-energy, bold color blocks",              industries: ["media", "fitness", "portfolio"], themes: ["bold", "dark", "playful"] },

  // ── Automotive / Manufacturing / Engineering ──
  { brand: "tesla",      label: "Tesla",      vibe: "Sleek futuristic minimal, full-bleed imagery",               industries: ["automotive", "manufacturing", "construction"], themes: ["minimal", "dark", "modern"] },
  { brand: "ferrari",    label: "Ferrari",    vibe: "Luxury performance, dramatic red & black, cinematic",        industries: ["automotive", "manufacturing"], themes: ["bold", "dark", "elegant"] },
  { brand: "bmw-m",      label: "BMW M",      vibe: "Precision engineering, dynamic, premium dark",               industries: ["automotive", "manufacturing", "construction"], themes: ["dark", "bold", "modern"] },
  { brand: "spacex",     label: "SpaceX",     vibe: "Aerospace minimal, deep-space black, monumental",            industries: ["manufacturing", "construction", "startup"], themes: ["dark", "minimal", "modern"] },

  // ── Creative / Agency / Media / Portfolio ──
  { brand: "figma",      label: "Figma",      vibe: "Playful color, rounded, creative-tool energy",               industries: ["agency", "media", "portfolio"], themes: ["playful", "bold", "creative"] },
  { brand: "framer",     label: "Framer",     vibe: "Bold motion-first design, vivid gradients",                  industries: ["agency", "portfolio", "media"], themes: ["bold", "creative", "playful"] },
  { brand: "webflow",    label: "Webflow",    vibe: "Designer-grade marketing, bold gradients",                   industries: ["agency", "portfolio", "media"], themes: ["bold", "modern", "creative"] },
  { brand: "runwayml",   label: "Runway",     vibe: "Cutting-edge AI-creative, sleek dark, futuristic",           industries: ["media", "agency", "portfolio"], themes: ["dark", "creative", "bold"] },
  { brand: "theverge",   label: "The Verge",  vibe: "Editorial media, bold typographic, vivid",                   industries: ["media", "nonprofit", "education"], themes: ["bold", "creative", "modern"] },
];

const DEFAULT_REF = DESIGN_REFS[0]; // Stripe — safe, premium default

/**
 * Pick the best design reference for an industry + theme. Scores each ref by
 * industry match (weighted) + theme match, falling back to a premium default.
 */
export function pickDesignRef(industry: Industry, theme: ThemeStyle): DesignRef {
  let best = DEFAULT_REF;
  let bestScore = -1;
  for (const ref of DESIGN_REFS) {
    let score = 0;
    if (ref.industries.includes(industry)) score += 3;
    if (ref.themes.includes(theme)) score += 2;
    // Light tiebreaker so the first listed (more iconic) wins ties.
    if (score > bestScore) {
      bestScore = score;
      best = ref;
    }
  }
  return best;
}

// ── Fetch + cache ──────────────────────────────────────────────────────────────

const memCache = new Map<string, string>();

function sessionGet(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function sessionSet(key: string, val: string): void {
  try { sessionStorage.setItem(key, val); } catch { /* ignore quota */ }
}

/**
 * Fetch a brand's DESIGN.md raw text. Cached in-memory + sessionStorage.
 * Returns null on any failure so generation can gracefully fall back.
 */
export async function fetchDesignMd(brand: string): Promise<string | null> {
  const key = `shivai_designmd_${brand}`;
  if (memCache.has(brand)) return memCache.get(brand)!;
  const cached = sessionGet(key);
  if (cached) {
    memCache.set(brand, cached);
    return cached;
  }
  try {
    const res = await fetch(`${RAW_BASE}/${brand}/DESIGN.md`);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.length < 200) return null;
    memCache.set(brand, text);
    sessionSet(key, text);
    return text;
  } catch {
    return null;
  }
}

/**
 * DESIGN.md files are ~2k+ words. To keep the AI prompt within budget while
 * preserving the design signal, trim to the most useful leading portion
 * (metadata, colors, typography, layout, components, do/don'ts usually lead).
 */
export function trimDesignMd(md: string, maxChars = 6000): string {
  if (md.length <= maxChars) return md;
  return md.slice(0, maxChars) + "\n\n… (reference truncated)";
}
