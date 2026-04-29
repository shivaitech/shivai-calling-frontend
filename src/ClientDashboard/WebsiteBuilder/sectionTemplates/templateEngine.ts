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
    body { font-family: ${data.bodyFont}, sans-serif; color: ${data.textColor}; background: ${data.bgColor}; line-height: 1.6; overflow-x: hidden; }
    img { max-width: 100%; height: auto; display: block; }
    a { color: inherit; }
    i[data-lucide] { display: inline-block; vertical-align: middle; }

    /* ── Mobile hamburger menu ── */
    #mobile-menu-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      z-index: 1001;
      flex-shrink: 0;
    }
    #mobile-menu-toggle span {
      display: block;
      width: 24px;
      height: 2px;
      background: currentColor;
      border-radius: 2px;
      transition: transform 0.3s, opacity 0.3s;
    }
    #mobile-menu-toggle.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    #mobile-menu-toggle.open span:nth-child(2) { opacity: 0; }
    #mobile-menu-toggle.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
    #mobile-nav-drawer {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 80px 24px 40px;
      overflow-y: auto;
    }
    #mobile-nav-drawer.open { display: flex; }
    #mobile-nav-drawer a {
      font-size: 20px;
      font-weight: 600;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      width: 100%;
      text-align: center;
      transition: background 0.2s;
    }

    /* ── Responsive grid overrides ── */
    @media (max-width: 768px) {
      /* All multi-column grids collapse to 1 column */
      [style*="grid-template-columns:1fr 1fr"],
      [style*="grid-template-columns: 1fr 1fr"],
      [style*="grid-template-columns:2fr 1fr"],
      [style*="grid-template-columns: 2fr 1fr"],
      [style*="grid-template-columns:1fr 2fr"],
      [style*="grid-template-columns: 1fr 2fr"],
      [style*="grid-template-columns:1fr 1fr 1fr"],
      [style*="grid-template-columns: 1fr 1fr 1fr"],
      [style*="grid-template-columns:220px"],
      [style*="grid-template-columns: 220px"] {
        grid-template-columns: 1fr !important;
      }
      /* 3-col grids → 2 cols */
      [style*="grid-template-columns:repeat(3"],
      [style*="grid-template-columns: repeat(3"] {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      /* 4+ col grids → 2 cols */
      [style*="grid-template-columns:repeat(4"],
      [style*="grid-template-columns: repeat(4"],
      [style*="grid-template-columns:repeat(5"],
      [style*="grid-template-columns: repeat(5"],
      [style*="grid-template-columns:repeat(6"],
      [style*="grid-template-columns: repeat(6"] {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      /* Reduce gaps in grids */
      [style*="display:grid"],
      [style*="display: grid"] {
        gap: 16px !important;
      }
      /* Flex rows that should stack */
      [style*="flex-direction:row"],
      [style*="flex-direction: row"] {
        flex-wrap: wrap !important;
      }
      /* Section padding reductions */
      section {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      [style*="padding:96px"],
      [style*="padding: 96px"] {
        padding-top: 56px !important;
        padding-bottom: 56px !important;
      }
      [style*="padding:100px"],
      [style*="padding: 100px"],
      [style*="padding:110px"],
      [style*="padding: 110px"],
      [style*="padding:120px"],
      [style*="padding: 120px"] {
        padding-top: 64px !important;
        padding-bottom: 56px !important;
      }
      /* max-width inner containers — full-width on mobile */
      [style*="max-width:1200px"],
      [style*="max-width: 1200px"],
      [style*="max-width:1280px"],
      [style*="max-width: 1280px"],
      [style*="max-width:1100px"],
      [style*="max-width: 1100px"],
      [style*="max-width:1400px"],
      [style*="max-width: 1400px"] {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      /* Header nav desktop → hidden, toggle visible */
      #site-header nav { display: none !important; }
      #site-header .header-cta-desktop { display: none !important; }
      #mobile-menu-toggle { display: flex !important; }
      /* Full-screen hero min-height reduction */
      [style*="min-height:92vh"],
      [style*="min-height: 92vh"],
      [style*="min-height:100vh"],
      [style*="min-height: 100vh"] {
        min-height: 70vh !important;
      }
      /* Stat counters: keep 2-col on phones */
      [style*="display:flex;gap:40px"],
      [style*="display: flex; gap: 40px"] {
        flex-wrap: wrap !important;
        gap: 20px !important;
      }
      /* Trust badges row */
      [style*="display:flex;gap:24px"],
      [style*="display: flex; gap: 24px"] {
        flex-wrap: wrap !important;
        gap: 12px !important;
      }
      /* Dual-row header top bar */
      [style*="justify-content:flex-end;align-items:center;gap:24px"],
      [style*="justify-content: flex-end; align-items: center; gap: 24px"] {
        justify-content: center !important;
        flex-wrap: wrap !important;
      }
    }

    @media (max-width: 480px) {
      /* 3-col and 4-col → 1 col on very small screens */
      [style*="grid-template-columns:repeat(3"],
      [style*="grid-template-columns: repeat(3"],
      [style*="grid-template-columns:repeat(4"],
      [style*="grid-template-columns: repeat(4"],
      [style*="grid-template-columns:repeat(5"],
      [style*="grid-template-columns: repeat(5"] {
        grid-template-columns: 1fr !important;
      }
      /* Pricing plans */
      [style*="grid-template-columns:repeat(2"],
      [style*="grid-template-columns: repeat(2"] {
        grid-template-columns: 1fr !important;
      }
      /* Reduce button sizes slightly */
      a[style*="padding:14px 32px"],
      a[style*="padding: 14px 32px"],
      a[style*="padding:15px 36px"],
      a[style*="padding: 15px 36px"] {
        padding: 12px 20px !important;
        font-size: 15px !important;
      }
    }
  </style>
</head>
<body>
${sectionHtml.join("\n")}
<script>
  // ── Initialize Lucide icons ──
  if (typeof lucide !== 'undefined') { lucide.createIcons(); }

  // ── Mobile hamburger menu ──
  (function() {
    var header = document.getElementById('site-header');
    if (!header) return;

    var nav = header.querySelector('nav');
    var primaryColor = '${data.primaryColor}';
    var bgColor = '${data.bgColor}';
    var isDark = bgColor === '#0f172a' || bgColor.startsWith('#0') || bgColor.startsWith('#1');

    // Create toggle button
    var toggle = document.createElement('button');
    toggle.id = 'mobile-menu-toggle';
    toggle.setAttribute('aria-label', 'Toggle menu');
    toggle.style.color = isDark ? '#fff' : '${data.textColor}';
    for (var i = 0; i < 3; i++) {
      var span = document.createElement('span');
      toggle.appendChild(span);
    }

    // Create mobile drawer
    var drawer = document.createElement('div');
    drawer.id = 'mobile-nav-drawer';
    drawer.style.background = isDark ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)';
    drawer.style.backdropFilter = 'blur(12px)';
    drawer.style.webkitBackdropFilter = 'blur(12px)';

    // Clone nav links into drawer
    if (nav) {
      var links = nav.querySelectorAll('a');
      links.forEach(function(a) {
        var link = document.createElement('a');
        link.href = a.href;
        link.textContent = a.textContent;
        link.style.color = isDark ? '#f1f5f9' : '${data.textColor}';
        link.style.background = 'transparent';
        link.addEventListener('mouseover', function() { this.style.background = primaryColor + '18'; });
        link.addEventListener('mouseout', function() { this.style.background = 'transparent'; });
        link.addEventListener('click', function() {
          drawer.classList.remove('open');
          toggle.classList.remove('open');
        });
        drawer.appendChild(link);
      });
    }

    // CTA button in drawer
    var ctaEl = header.querySelector('a[style*="padding:10px 24px"],a[style*="padding: 10px 24px"],a[style*="padding:9px 22px"],a[style*="padding: 9px 22px"]');
    if (ctaEl) {
      var ctaClone = document.createElement('a');
      ctaClone.href = ctaEl.getAttribute('href') || '#';
      ctaClone.textContent = ctaEl.textContent;
      ctaClone.style.cssText = 'margin-top:16px;background:' + primaryColor + ';color:#fff;font-size:16px;font-weight:700;padding:14px 32px;border-radius:8px;width:auto;display:inline-block;text-decoration:none;';
      ctaClone.addEventListener('click', function() {
        drawer.classList.remove('open');
        toggle.classList.remove('open');
      });
      drawer.appendChild(ctaClone);
    }

    // Close on outside click
    drawer.addEventListener('click', function(e) {
      if (e.target === drawer) {
        drawer.classList.remove('open');
        toggle.classList.remove('open');
      }
    });

    toggle.addEventListener('click', function() {
      toggle.classList.toggle('open');
      drawer.classList.toggle('open');
    });

    header.appendChild(toggle);
    document.body.appendChild(drawer);
  })();
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
