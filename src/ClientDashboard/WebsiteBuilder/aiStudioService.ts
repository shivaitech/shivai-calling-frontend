// ─────────────────────────────────────────────────────────────────────────────
// AI Studio Service
// Generates full WebsiteTemplateData via Gemini + pollinations.ai images
// ─────────────────────────────────────────────────────────────────────────────

import type {
  WebsiteTemplateData,
  Industry,
  ThemeStyle,
  SectionType,
} from "./sectionTemplates/types";
import {
  pickDesignRef,
  fetchDesignMd,
  trimDesignMd,
} from "./designMdService";

// A valid CSS hex like #fff or #533afd — used to validate AI-provided tokens.
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const isHex = (v: unknown): v is string => typeof v === "string" && HEX_RE.test(v.trim());

const GEMINI_MODEL =
  (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-2.5-pro";
// TODO: replace direct Gemini calls with backend API once endpoint is available
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Input form shape ──────────────────────────────────────────────────────────

export interface StudioFormData {
  businessName: string;
  tagline: string;
  description: string;
  industry: Industry;
  themeStyle: ThemeStyle;
  tone: string;
  primaryColor: string;
  accentColor: string;
  email: string;
  phone: string;
  address: string;
}

// ── Theme presets ─────────────────────────────────────────────────────────────

const THEME_FONTS: Record<ThemeStyle, { heading: string; body: string }> = {
  modern:    { heading: "Inter",              body: "Inter" },
  minimal:   { heading: "DM Sans",            body: "DM Sans" },
  bold:      { heading: "Space Grotesk",      body: "Inter" },
  elegant:   { heading: "Playfair Display",   body: "Lora" },
  playful:   { heading: "Nunito",             body: "Nunito" },
  corporate: { heading: "Source Sans 3",      body: "Source Sans 3" },
  dark:      { heading: "Space Grotesk",      body: "Inter" },
  luxury:    { heading: "Cormorant Garamond", body: "Montserrat" },
  creative:  { heading: "Plus Jakarta Sans",  body: "Plus Jakarta Sans" },
  classic:   { heading: "Merriweather",       body: "Source Serif 4" },
};

const THEME_COLORS: Record<ThemeStyle, { bg: string; text: string; muted: string }> = {
  modern:    { bg: "#ffffff", text: "#111827", muted: "#6b7280" },
  minimal:   { bg: "#f9fafb", text: "#111827", muted: "#6b7280" },
  bold:      { bg: "#f8fafc", text: "#0f172a", muted: "#475569" },
  elegant:   { bg: "#faf9f7", text: "#2d2618", muted: "#8c7b6e" },
  playful:   { bg: "#fefce8", text: "#1c1917", muted: "#78716c" },
  corporate: { bg: "#f8fafc", text: "#0f172a", muted: "#64748b" },
  dark:      { bg: "#0f172a", text: "#f1f5f9", muted: "#94a3b8" },
  luxury:    { bg: "#1a0f0a", text: "#f5efe6", muted: "#a08c7a" },
  creative:  { bg: "#ffffff", text: "#0f172a", muted: "#64748b" },
  classic:   { bg: "#fdfbf7", text: "#1a1a1a", muted: "#6b7280" },
};

// ── Industry → default sections (ordered, max coverage) ──────────────────────

export const INDUSTRY_SECTIONS: Record<Industry, SectionType[]> = {
  saas:           ["header","hero","stats","features","about","testimonials","pricing","cta","team","contact","footer"],
  startup:        ["header","hero","features","stats","about","testimonials","pricing","cta","team","contact","footer"],
  agency:         ["header","hero","stats","features","portfolio","about","testimonials","team","cta","contact","footer"],
  ecommerce:      ["header","hero","features","stats","portfolio","testimonials","pricing","cta","contact","footer"],
  restaurant:     ["header","hero","features","about","portfolio","stats","testimonials","cta","contact","footer"],
  healthcare:     ["header","hero","features","stats","about","testimonials","team","pricing","cta","contact","footer"],
  realestate:     ["header","hero","features","stats","portfolio","about","testimonials","cta","contact","footer"],
  legal:          ["header","hero","features","stats","about","testimonials","team","pricing","cta","contact","footer"],
  finance:        ["header","hero","features","stats","about","testimonials","team","pricing","cta","contact","footer"],
  education:      ["header","hero","features","stats","about","testimonials","team","pricing","cta","contact","footer"],
  fitness:        ["header","hero","features","stats","testimonials","pricing","about","cta","contact","footer"],
  consulting:     ["header","hero","features","stats","about","testimonials","portfolio","team","pricing","cta","contact","footer"],
  construction:   ["header","hero","features","stats","portfolio","about","testimonials","team","cta","contact","footer"],
  automotive:     ["header","hero","features","stats","portfolio","about","testimonials","pricing","cta","contact","footer"],
  beauty:         ["header","hero","features","stats","portfolio","about","testimonials","pricing","cta","contact","footer"],
  travel:         ["header","hero","features","stats","portfolio","about","testimonials","cta","contact","footer"],
  nonprofit:      ["header","hero","features","stats","about","testimonials","team","cta","contact","footer"],
  manufacturing:  ["header","hero","features","stats","about","portfolio","testimonials","team","cta","contact","footer"],
  media:          ["header","hero","features","stats","portfolio","about","testimonials","pricing","cta","contact","footer"],
  portfolio:      ["header","hero","portfolio","about","testimonials","cta","contact","footer"],
  general:        ["header","hero","features","stats","about","testimonials","pricing","cta","contact","footer"],
};

// ── Gemini content generation ─────────────────────────────────────────────────

const CONTENT_SCHEMA = {
  type: "OBJECT",
  properties: {
    siteName:        { type: "STRING" },
    tagline:         { type: "STRING" },
    description:     { type: "STRING" },
    heroHeadline:    { type: "STRING" },
    heroSubheadline: { type: "STRING" },
    ctaText:         { type: "STRING" },
    ctaSecondaryText:{ type: "STRING" },
    aboutTitle:      { type: "STRING" },
    aboutDescription:{ type: "STRING" },
    footerTagline:   { type: "STRING" },
    navItems: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { label: { type: "STRING" }, href: { type: "STRING" } },
        required: ["label", "href"],
      },
    },
    features: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title:       { type: "STRING" },
          description: { type: "STRING" },
          icon:        { type: "STRING" },
        },
        required: ["title", "description", "icon"],
      },
    },
    stats: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { value: { type: "STRING" }, label: { type: "STRING" } },
        required: ["value", "label"],
      },
    },
    testimonials: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name:    { type: "STRING" },
          role:    { type: "STRING" },
          company: { type: "STRING" },
          text:    { type: "STRING" },
          rating:  { type: "NUMBER" },
        },
        required: ["name", "role", "text"],
      },
    },
    pricingPlans: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name:        { type: "STRING" },
          price:       { type: "STRING" },
          period:      { type: "STRING" },
          description: { type: "STRING" },
          features:    { type: "ARRAY", items: { type: "STRING" } },
          highlighted: { type: "BOOLEAN" },
          ctaText:     { type: "STRING" },
        },
        required: ["name", "price", "features"],
      },
    },
    teamMembers: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          role: { type: "STRING" },
          bio:  { type: "STRING" },
        },
        required: ["name", "role"],
      },
    },
    portfolioItems: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title:       { type: "STRING" },
          category:    { type: "STRING" },
          description: { type: "STRING" },
        },
        required: ["title", "category"],
      },
    },
    imageSearchKeywords: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    // Visual design system distilled from the reference DESIGN.md (when provided).
    // These tokens override the basic theme presets so the look matches the
    // famous-site reference, not a generic template.
    designSystem: {
      type: "OBJECT",
      properties: {
        primaryColor:  { type: "STRING" }, // hex, main brand/CTA color
        accentColor:   { type: "STRING" }, // hex, secondary accent
        bgColor:       { type: "STRING" }, // hex, page background
        textColor:     { type: "STRING" }, // hex, body text
        mutedColor:    { type: "STRING" }, // hex, muted/secondary text
        headingFont:   { type: "STRING" }, // a web-safe / Google Font family that best approximates the reference
        bodyFont:      { type: "STRING" },
        borderRadius:  { type: "STRING" }, // "sharp" | "soft" | "rounded" | "pill"
        designNotes:   { type: "STRING" }, // 1-2 sentences on the visual language applied
      },
    },
  },
  required: [
    "siteName", "tagline", "description", "heroHeadline", "heroSubheadline",
    "ctaText", "ctaSecondaryText", "aboutTitle", "aboutDescription",
    "footerTagline", "navItems", "features", "stats", "testimonials",
    "pricingPlans", "teamMembers", "portfolioItems", "imageSearchKeywords",
  ],
};

function buildGeminiPrompt(form: StudioFormData, designRef?: { label: string; md: string }): string {
  const designBlock = designRef
    ? `

────────────────────────────────────────────────────────
DESIGN SYSTEM REFERENCE — emulate "${designRef.label}"
You are given a production-grade DESIGN.md describing a famous website's design
system. Treat it as the visual + structural North Star for THIS site. Adapt its
design language (color philosophy, typography, spacing, component style, layout
rhythm, and tone of voice) to the business above — do NOT copy its brand name or
copy verbatim, and keep all content about the business above.

From this reference you MUST populate the "designSystem" object with concrete
tokens that capture the reference's look, adapted to the business:
- primaryColor / accentColor / bgColor / textColor / mutedColor as HEX values
  inspired by the reference's palette (you may tune hue toward the business).
- headingFont / bodyFont: pick real Google/web-safe fonts that best approximate
  the reference's typography.
- borderRadius: one of "sharp" | "soft" | "rounded" | "pill" matching the reference.
- designNotes: 1-2 sentences naming the visual language you applied.
Also let the reference shape the copy's voice and the ordering/density of sections.

REFERENCE DESIGN.md:
"""
${designRef.md}
"""
────────────────────────────────────────────────────────
`
    : "";

  return `You are an expert web designer and copywriter. Generate rich, realistic, production-quality website content AND a cohesive visual design system for the following business. Every field must feel authentic and industry-specific — never generic.

BUSINESS DETAILS:
- Name: ${form.businessName}
- Industry: ${form.industry}
- Description: ${form.description || `A ${form.industry} business`}
- Tone: ${form.tone || "professional and friendly"}
- Theme Style: ${form.themeStyle}
- Contact: ${form.email || ""} | ${form.phone || ""} | ${form.address || ""}
${designBlock}
GENERATE:
- siteName: exact business name or refined brand version (≤5 words)
- tagline: punchy, memorable, industry-specific tagline (≤8 words)
- description: 2-sentence business description for website meta
- heroHeadline: bold, emotional, benefit-driven headline (≤12 words)
- heroSubheadline: 2-sentence elaboration of the headline (≤30 words)
- ctaText: primary call-to-action button label (2-4 words)
- ctaSecondaryText: secondary action label (2-4 words)
- aboutTitle: section heading for About page (≤6 words)
- aboutDescription: 3-paragraph about section text (≤200 words total), rich and authentic
- footerTagline: short brand tagline for footer (≤10 words)
- navItems: exactly 5 navigation items with industry-relevant labels and #anchor hrefs
- features: exactly 8 realistic feature/service items. Each: title (3-5 words), description (1 compelling sentence), icon (a valid Lucide icon name in kebab-case, e.g. "rocket", "zap", "shield-check", "chart-bar", "users", "star", "globe", "lock", "cpu", "layers", "mail", "phone", "map-pin", "clock", "dollar-sign", "target", "award", "briefcase", "calendar", "leaf", "lightbulb", "trending-up", "heart", "check-circle", "headphones", "wrench", "package", "truck", "home", "graduation-cap", "scissors", "camera", "music", "coffee", "dumbbell", "activity")
- stats: exactly 4-6 impressive realistic stats. Each: value (e.g. "2,400+", "98%", "$4.2M"), label (3-5 words)
- testimonials: exactly 4 detailed testimonials from realistic client names. Each: name, role (job title), company (realistic company name), text (2-3 sentence glowing review), rating (4 or 5)
- pricingPlans: exactly 3 plans. Middle plan highlighted:true. Each: name, price (realistic for industry), period ("/ month" or "/ project" or "one-time"), description (1 sentence), features (5-7 bullet strings), ctaText (2-3 words)
- teamMembers: exactly 4-5 team members with realistic names, roles, and 2-sentence bios
- portfolioItems: exactly 6 portfolio/project items relevant to the industry. Each: title, category (service type), description (1 sentence about the project)
- imageSearchKeywords: exactly 6 concise Pixabay search keywords for high-quality stock photos relevant to the business. Examples: "modern office team", "restaurant dining", "healthcare doctor", "fitness gym workout", "software developer laptop". Each should be 2-4 words, specific and visual.
- designSystem: a cohesive visual design system for this site. ${designRef ? `Derive it from the DESIGN SYSTEM REFERENCE above.` : `Craft a tasteful, modern system fitting the industry and theme.`} Include primaryColor, accentColor, bgColor, textColor, mutedColor (all HEX), headingFont, bodyFont (real font families), borderRadius ("sharp"|"soft"|"rounded"|"pill"), and designNotes.

Make every single piece of content feel like it was written by a professional copywriter for a real, established business, and make the design system feel intentional and premium. Avoid all clichés and generic filler text.`;
}

async function callGemini(prompt: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        responseMimeType: "application/json",
        responseSchema: CONTENT_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");

  return JSON.parse(text) as Record<string, unknown>;
}

// ── Image sources ─────────────────────────────────────────────────────────────

const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY as string | undefined;

/** Fetch a single image URL from Pixabay for a keyword. Returns null on failure. */
async function pixabayImage(keyword: string, index: number): Promise<string | null> {
  if (!PIXABAY_API_KEY) return null;
  try {
    const params = new URLSearchParams({
      key: PIXABAY_API_KEY,
      q: keyword,
      image_type: "photo",
      orientation: "horizontal",
      safesearch: "true",
      per_page: "5",
      page: "1",
      min_width: "1000",
    });
    const res = await fetch(`https://pixabay.com/api/?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json() as { hits?: Array<{ largeImageURL: string; webformatURL: string }> };
    const hits = json.hits ?? [];
    if (!hits.length) return null;
    // Pick a different hit per index to vary images
    const pick = hits[index % hits.length];
    return pick.largeImageURL || pick.webformatURL || null;
  } catch {
    return null;
  }
}

/** Pollinations.ai fallback URL for a keyword */
function pollinationsUrl(keyword: string, index: number): string {
  const seed = 9000 + index * 199;
  const prompt = encodeURIComponent(
    `${keyword}, professional photography, high quality, 8k, no text, no watermark, no logo`
  );
  return `https://image.pollinations.ai/prompt/${prompt}?width=1280&height=853&seed=${seed}&model=flux&nologo=true&enhance=true`;
}

/**
 * Build 6 image URLs using Pixabay (primary) with pollinations.ai fallback.
 * Keywords come from Gemini; generic industry fallbacks used if needed.
 */
async function buildImages(
  keywords: string[],
  industry: string,
  businessName: string
): Promise<string[]> {
  const fallbackKeywords = [
    `${industry} business professional`,
    `${businessName} team office`,
    `${industry} service professional`,
    `${industry} client meeting`,
    `${industry} workspace modern`,
    `${industry} brand lifestyle`,
  ];

  const base = keywords.length >= 6
    ? keywords.slice(0, 6)
    : [...keywords, ...fallbackKeywords].slice(0, 6);

  const urls: string[] = await Promise.all(
    base.map(async (kw, i) => {
      const pixabay = await pixabayImage(kw, i);
      return pixabay ?? pollinationsUrl(kw, i);
    })
  );

  return urls;
}

// ── Pixabay team avatar helper ────────────────────────────────────────────────

/** Generate a UI-Avatars URL for a team member name (no API key needed) */
export function avatarUrl(name: string, bgColor = "4f46e5"): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&size=200&background=${bgColor.replace("#","")}&color=fff&bold=true&format=png`;
}

// ── Main export: generate full WebsiteTemplateData ────────────────────────────

export async function generateStudioWebsite(
  form: StudioFormData,
  onProgress?: (msg: string) => void
): Promise<WebsiteTemplateData> {
  onProgress?.("Analyzing your business details...");

  // Auto-match a famous-site DESIGN.md reference and fetch it (best-effort).
  const ref = pickDesignRef(form.industry, form.themeStyle);
  onProgress?.(`Studying ${ref.label}'s design system…`);
  let designRef: { label: string; md: string } | undefined;
  const md = await fetchDesignMd(ref.brand);
  if (md) {
    designRef = { label: ref.label, md: trimDesignMd(md) };
  }

  const prompt = buildGeminiPrompt(form, designRef);

  onProgress?.(
    designRef
      ? `Designing your site, ${ref.label}-grade…`
      : "Generating website content with AI..."
  );
  const raw = await callGemini(prompt);

  onProgress?.("Generating professional images...");
  const imageKeywords = (raw.imageSearchKeywords as string[]) || [];
  const images = await buildImages(imageKeywords, form.industry, form.businessName);

  onProgress?.("Assembling your website...");

  const fonts = THEME_FONTS[form.themeStyle] ?? THEME_FONTS.modern;
  const colors = THEME_COLORS[form.themeStyle] ?? THEME_COLORS.modern;

  // ── Apply the AI-extracted design system (from the famous-site reference) ──
  // Each token only overrides the preset/form default when it's valid, so a
  // missing or malformed value never breaks the output.
  const ds = (raw.designSystem as Record<string, unknown> | undefined) || {};
  const dsPrimary = isHex(ds.primaryColor) ? (ds.primaryColor as string).trim() : form.primaryColor;
  const dsAccent  = isHex(ds.accentColor)  ? (ds.accentColor as string).trim()  : form.accentColor;
  const dsBg      = isHex(ds.bgColor)      ? (ds.bgColor as string).trim()      : colors.bg;
  const dsText    = isHex(ds.textColor)    ? (ds.textColor as string).trim()    : colors.text;
  const dsMuted   = isHex(ds.mutedColor)   ? (ds.mutedColor as string).trim()   : colors.muted;
  const dsHeading = typeof ds.headingFont === "string" && ds.headingFont.trim() ? (ds.headingFont as string).trim() : fonts.heading;
  const dsBody    = typeof ds.bodyFont === "string" && ds.bodyFont.trim() ? (ds.bodyFont as string).trim() : fonts.body;
  if (designRef && (ds.designNotes || ds.primaryColor)) {
    onProgress?.("Applying the reference design language…");
  }

  const navItems = (raw.navItems as Array<{ label: string; href: string }>) ?? [
    { label: "Home", href: "#hero" },
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];

  const features = (raw.features as Array<{ title: string; description: string; icon: string }>) ?? [];
  const stats    = (raw.stats    as Array<{ value: string; label: string }>)                      ?? [];
  const testimonials = (raw.testimonials as Array<{
    name: string; role: string; company?: string; text: string; rating?: number;
  }>) ?? [];

  const rawPricing = (raw.pricingPlans as Array<{
    name: string; price: string; period?: string; description?: string;
    features: string[]; highlighted?: boolean; ctaText?: string;
  }>) ?? [];

  const teamMembers = (raw.teamMembers as Array<{
    name: string; role: string; bio?: string;
  }>) ?? [];

  const portfolioItems = (raw.portfolioItems as Array<{
    title: string; category?: string; description?: string;
  }>) ?? [];

  const data: WebsiteTemplateData = {
    businessName:    (raw.siteName as string)        || form.businessName,
    tagline:         (raw.tagline as string)          || "",
    description:     (raw.description as string)      || form.description,
    industry:        form.industry,
    themeStyle:      form.themeStyle,
    tone:            form.tone || "professional",
    primaryColor:    dsPrimary,
    accentColor:     dsAccent,
    bgColor:         dsBg,
    textColor:       dsText,
    mutedColor:      dsMuted,
    headingFont:     dsHeading,
    bodyFont:        dsBody,
    navItems,
    ctaText:         (raw.ctaText as string)          || "Get Started",
    ctaLink:         "#contact",
    ctaSecondaryText:(raw.ctaSecondaryText as string) || "Learn More",
    heroHeadline:    (raw.heroHeadline as string)     || "",
    heroSubheadline: (raw.heroSubheadline as string)  || "",
    heroImage:       images[0],
    features:        features.slice(0, 8),
    stats,
    testimonials:    testimonials.map((t) => ({ ...t, rating: t.rating ?? 5, avatar: "" })),
    pricingPlans:    rawPricing,
    teamMembers:     teamMembers.map((m) => ({ ...m, avatar: avatarUrl(m.name, dsPrimary.replace(/^#/, "")), socialLinks: {} })),
    portfolioItems:  portfolioItems.map((p, i) => ({ ...p, image: images[i + 1] || images[0] || "" })),
    aboutTitle:      (raw.aboutTitle as string)       || "About Us",
    aboutDescription:(raw.aboutDescription as string) || "",
    aboutImage:      images[2] || images[0],
    email:           form.email   || (raw.email   as string) || "hello@example.com",
    phone:           form.phone   || (raw.phone   as string) || "+1 (555) 000-0000",
    address:         form.address || (raw.address as string) || "123 Main Street, City, State",
    socialLinks:     { facebook: "#", twitter: "#", instagram: "#", linkedin: "#" },
    images,
    footerTagline:   (raw.footerTagline as string)    || "",
  };

  return data;
}
