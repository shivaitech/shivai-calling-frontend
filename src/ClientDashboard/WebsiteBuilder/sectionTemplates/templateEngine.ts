import type {
  WebsiteTemplateData,
  SectionTemplate,
  SectionType,
  TemplateSelection,
  AssembledWebsite,
} from "./types";
import { getDefaultTemplateId } from "./industryConfig";

// ── Section registry imports ─────────────────────────────────────────────────
import { headerTemplates } from "./header/templates";
import { heroTemplates } from "./hero/templates";
import { featuresTemplates } from "./features/templates";
import { ctaTemplates } from "./cta/templates";
import { statsTemplates } from "./stats/templates";
import { aboutTemplates } from "./about/templates";
import { testimonialsTemplates } from "./testimonials/templates";
import { pricingTemplates } from "./pricing/templates";
import { contactTemplates } from "./contact/templates";
import { footerTemplates } from "./footer/templates";
import { portfolioTemplates } from "./portfolio/templates";
import { teamTemplates } from "./team/templates";

// ─────────────────────────────────────────────────────────────────────────────
// ALL TEMPLATES — unified lookup registry
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_TEMPLATES: SectionTemplate[] = [
  ...headerTemplates,
  ...heroTemplates,
  ...featuresTemplates,
  ...ctaTemplates,
  ...statsTemplates,
  ...aboutTemplates,
  ...testimonialsTemplates,
  ...pricingTemplates,
  ...contactTemplates,
  ...footerTemplates,
  ...portfolioTemplates,
  ...teamTemplates,
];

/** Fast lookup by template id */
const TEMPLATE_MAP = new Map<string, SectionTemplate>(
  ALL_TEMPLATES.map((t) => [t.id, t])
);

export function getTemplateById(id: string): SectionTemplate | undefined {
  return TEMPLATE_MAP.get(id);
}

export function getTemplatesForSection(section: SectionType): SectionTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.section === section);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SECTION ORDER
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SECTION_ORDER: SectionType[] = [
  "header",
  "hero",
  "features",
  "stats",
  "about",
  "testimonials",
  "cta",
  "pricing",
  "portfolio",
  "team",
  "contact",
  "footer",
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateEngineOptions {
  /** Which sections to include and in what order. Defaults to DEFAULT_SECTION_ORDER. */
  sections?: SectionType[];
  /** Manual template selections; sections not listed will use the industry default. */
  selections?: TemplateSelection[];
}

/**
 * Assembles a full HTML website from section templates.
 *
 * @param data        WebsiteTemplateData with all business/design values
 * @param options     Optional section list and manual template overrides
 * @returns           AssembledWebsite { html, sectionsUsed }
 */
export function assembleWebsite(
  data: WebsiteTemplateData,
  options: TemplateEngineOptions = {}
): AssembledWebsite {
  const sections = options.sections ?? DEFAULT_SECTION_ORDER;
  const selectionMap = new Map<SectionType, string>(
    (options.selections ?? []).map((s) => [s.section, s.templateId])
  );

  const sectionsUsed: TemplateSelection[] = [];
  const sectionHtml: string[] = [];

  for (const section of sections) {
    const templateId =
      selectionMap.get(section) ?? getDefaultTemplateId(data.industry, section);

    const template = TEMPLATE_MAP.get(templateId);
    if (!template) continue;

    try {
      sectionHtml.push(template.generate(data));
      sectionsUsed.push({ section, templateId });
    } catch (err) {
      console.warn(`[templateEngine] Failed to generate section "${section}" with template "${templateId}":`, err);
    }
  }

  const googleFonts = buildGoogleFontsUrl(data.headingFont, data.bodyFont);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(data.businessName)}</title>
  <meta name="description" content="${escHtml(data.description)}">
  ${googleFonts ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFonts}" rel="stylesheet">` : ""}
  <!-- Icon libraries -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" crossorigin="anonymous">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: ${data.bodyFont}, sans-serif; color: ${data.textColor}; background: ${data.bgColor}; line-height: 1.6; }
    img { max-width: 100%; height: auto; display: block; }
    a { color: inherit; }
    /* Lucide icon baseline alignment */
    i[data-lucide] { display: inline-block; vertical-align: middle; }
    @media (max-width: 768px) {
      [style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr 1fr !important; }
      [style*="grid-template-columns: repeat(4"] { grid-template-columns: 1fr 1fr !important; }
      [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
      [style*="grid-template-columns: 2fr 1fr"] { grid-template-columns: 1fr !important; }
      [style*="grid-template-columns: 1fr 2fr"] { grid-template-columns: 1fr !important; }
      [style*="display: grid"] { gap: 20px !important; }
    }
  </style>
</head>
<body>
${sectionHtml.join("\n")}
<script>
  // Initialize Lucide icons after DOM is ready
  if (typeof lucide !== 'undefined') { lucide.createIcons(); }
</script>
</body>
</html>`;

  return { html, sectionsUsed };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const FONT_NAME_RE = /^[a-zA-Z0-9 +]+$/;

function buildGoogleFontsUrl(heading: string, body: string): string {
  const fonts = [...new Set([heading, body])].filter(
    (f) => f && !f.includes(",") && FONT_NAME_RE.test(f)
  );
  if (!fonts.length) return "";
  const families = fonts.map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800;900`).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
