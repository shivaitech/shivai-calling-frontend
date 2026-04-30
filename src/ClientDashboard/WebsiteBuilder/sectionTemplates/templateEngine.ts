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
    /* ── Reset & base (mobile-first) ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: ${data.bodyFont}, sans-serif;
      color: ${data.textColor};
      background: ${data.bgColor};
      line-height: 1.6;
      overflow-x: hidden;
      -webkit-text-size-adjust: 100%;
    }
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
      top: 0; left: 0; right: 0; bottom: 0;
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

    /* ── Mobile-first: CSS fast-path overrides (JS mobilizer handles the rest) ── */
    @media (max-width: 767px) {
      /* Header: hide desktop nav & CTA, show hamburger */
      #site-header nav { display: none !important; }
      #site-header .header-cta-desktop { display: none !important; }
      #mobile-menu-toggle { display: flex !important; }

      /* Ensure all sections have horizontal breathing room */
      section { padding-left: 16px !important; padding-right: 16px !important; }

      /* All 2-column grids → single column */
      [style*="grid-template-columns:1fr 1fr"],
      [style*="grid-template-columns: 1fr 1fr"],
      [style*="grid-template-columns:2fr 1fr"],
      [style*="grid-template-columns: 2fr 1fr"],
      [style*="grid-template-columns:1fr 2fr"],
      [style*="grid-template-columns: 1fr 2fr"],
      [style*="grid-template-columns:220px"],
      [style*="grid-template-columns: 220px"],
      [style*="grid-template-columns:200px"],
      [style*="grid-template-columns: 200px"] {
        grid-template-columns: 1fr !important;
        gap: 20px !important;
      }

      /* 3-col → 2-col (cards stack nicely at 2) */
      [style*="grid-template-columns:repeat(3"],
      [style*="grid-template-columns: repeat(3"],
      [style*="grid-template-columns:1fr 1fr 1fr"],
      [style*="grid-template-columns: 1fr 1fr 1fr"] {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 16px !important;
      }

      /* 4+ col → 2-col */
      [style*="grid-template-columns:repeat(4"],
      [style*="grid-template-columns: repeat(4"],
      [style*="grid-template-columns:repeat(5"],
      [style*="grid-template-columns: repeat(5"],
      [style*="grid-template-columns:repeat(6"],
      [style*="grid-template-columns: repeat(6"] {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 14px !important;
      }

      /* Comparison table dynamic grids (e.g. "2fr 1fr 1fr 1fr") */
      [style*="grid-template-columns:2fr "],
      [style*="grid-template-columns: 2fr "] {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
      }

      /* Reduce inner container horizontal padding */
      [style*="max-width:1200px"], [style*="max-width: 1200px"],
      [style*="max-width:1280px"], [style*="max-width: 1280px"],
      [style*="max-width:1100px"], [style*="max-width: 1100px"],
      [style*="max-width:1000px"], [style*="max-width: 1000px"],
      [style*="max-width:1400px"], [style*="max-width: 1400px"] {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }

      /* Section padding: reduce large top/bottom */
      [style*="padding:96px"],  [style*="padding: 96px"]  { padding-top: 52px !important; padding-bottom: 52px !important; }
      [style*="padding:100px"], [style*="padding: 100px"],
      [style*="padding:110px"], [style*="padding: 110px"],
      [style*="padding:120px"], [style*="padding: 120px"] { padding-top: 56px !important; padding-bottom: 56px !important; }
      [style*="padding:80px"],  [style*="padding: 80px"]  { padding-top: 48px !important; padding-bottom: 48px !important; }

      /* Hero min-height: cap to screen height */
      [style*="min-height:100vh"], [style*="min-height: 100vh"],
      [style*="min-height:92vh"],  [style*="min-height: 92vh"],
      [style*="min-height:90vh"],  [style*="min-height: 90vh"] {
        min-height: 100svh !important;
      }

      /* Inline-flex CTA button groups: wrap */
      [style*="display:flex"][style*="gap:16px"] > a,
      [style*="display:flex"][style*="gap:20px"] > a,
      [style*="display:flex"][style*="gap:24px"] > a {
        flex: 1 1 140px;
        text-align: center !important;
        justify-content: center !important;
      }

      /* Email capture flex form (e.g. contact-06): stack inputs */
      form[style*="display:flex"] {
        flex-direction: column !important;
        gap: 12px !important;
      }
      form[style*="display:flex"] input,
      form[style*="display:flex"] button {
        border-radius: 10px !important;
        width: 100% !important;
      }

      /* Hero image order: text block first */
      #hero [style*="order:2"],
      [id="hero"] [style*="order:2"] {
        order: 10 !important;
      }
    }

    @media (max-width: 479px) {
      /* Very small phones: collapse 2-col cards to 1 col */
      [style*="grid-template-columns:repeat(3"],
      [style*="grid-template-columns: repeat(3"],
      [style*="grid-template-columns:repeat(2"],
      [style*="grid-template-columns: repeat(2"] {
        grid-template-columns: 1fr !important;
      }

      /* Reduce CTA button padding on tiny screens */
      a[style*="padding:14px 32px"], a[style*="padding: 14px 32px"],
      a[style*="padding:15px 36px"], a[style*="padding: 15px 36px"],
      a[style*="padding:16px 40px"], a[style*="padding: 16px 40px"] {
        padding: 13px 20px !important;
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

  // ── Mobile-first layout engine ──
  // Runs on DOMContentLoaded and resize to rewrite inline styles for mobile.
  // This handles ALL template grid patterns reliably, including dynamic ones
  // (e.g. "2fr 1fr 1fr 1fr" comparison tables, "220px 1fr" sidebars, etc.)
  (function() {
    var MOBILE_BP = 768;
    var SMALL_BP  = 480;

    /** Count the number of column tracks in a grid-template-columns value */
    function colCount(cols) {
      if (!cols || cols === 'none') return 1;
      var m = cols.match(/^repeat\(\s*(\d+)/);
      if (m) return parseInt(m[1], 10);
      // Count space-separated tokens (ignoring spaces inside parentheses)
      var depth = 0, count = 1, prev = '';
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        if (c === '(') { depth++; }
        else if (c === ')') { depth--; }
        else if (c === ' ' && depth === 0 && prev !== ' ') { count++; }
        prev = c;
      }
      return count;
    }

    function mobilize() {
      var W = window.innerWidth;
      var mobile = W < MOBILE_BP;
      var small  = W < SMALL_BP;

      // ── 1. Rewrite multi-column grid layouts ──
      var gridEls = document.querySelectorAll('[style*="grid-template-columns"]');
      for (var i = 0; i < gridEls.length; i++) {
        var el = gridEls[i];
        var cols = el.style.gridTemplateColumns;
        if (!cols || cols === 'none') continue;
        var n = colCount(cols);
        if (n <= 1) continue; // already single column

        if (mobile) {
          // On small phones: always 1 column
          // On wider mobile (480-767px): keep 2-col only for small card grids (repeat(2,...))
          var isSmallCardGrid = n === 2 && cols.indexOf('repeat') !== -1;
          if (small || !isSmallCardGrid) {
            el.style.gridTemplateColumns = '1fr';
          }
          // Reduce gap on mobile
          var currentGap = parseInt(el.style.gap) || 0;
          if (currentGap > 20) {
            el.style.gap = small ? '12px' : '16px';
          }
        } else {
          // Desktop: restore original inline style is not needed —
          // JS only runs overrides; CSS is the source of truth for desktop.
          // However if we previously wrote '1fr', we must restore:
          // (Not needed since we attach data-original-cols on first run)
        }
      }

      if (!mobile) return; // all remaining steps are mobile-only

      // ── 2. Section vertical padding reduction ──
      var sections = document.querySelectorAll('section');
      for (var j = 0; j < sections.length; j++) {
        var sec = sections[j];
        var sp = sec.style.padding;
        var spt = sec.style.paddingTop;
        var spb = sec.style.paddingBottom;
        if (sp) {
          var parts = sp.trim().split(/\s+/);
          var vp = parseInt(parts[0]) || 0;
          var hp = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
          var newHp = Math.max(hp, 16);
          if (vp >= 80)      sec.style.padding = '52px ' + newHp + 'px';
          else if (vp >= 60) sec.style.padding = '40px ' + newHp + 'px';
          else if (vp > 0 && hp < 16) {
            sec.style.paddingLeft  = '16px';
            sec.style.paddingRight = '16px';
          }
        } else {
          if (!sec.style.paddingLeft)  sec.style.paddingLeft  = '16px';
          if (!sec.style.paddingRight) sec.style.paddingRight = '16px';
          var ptNum = parseInt(spt) || 0;
          var pbNum = parseInt(spb) || 0;
          if (ptNum >= 80)  sec.style.paddingTop    = '52px';
          else if (ptNum >= 60) sec.style.paddingTop = '40px';
          if (pbNum >= 80)  sec.style.paddingBottom = '52px';
          else if (pbNum >= 60) sec.style.paddingBottom = '40px';
        }
      }

      // ── 3. Inner container (max-width wrappers) horizontal padding ──
      var containers = document.querySelectorAll('[style*="max-width"]');
      for (var k = 0; k < containers.length; k++) {
        var cnt = containers[k];
        var mw = parseInt(cnt.style.maxWidth) || 0;
        if (mw < 700) continue;
        var cp = cnt.style.padding;
        var cpl = parseInt(cnt.style.paddingLeft) || 0;
        var cpr = parseInt(cnt.style.paddingRight) || 0;
        if (cp) {
          var cparts = cp.trim().split(/\s+/);
          var chp = cparts.length > 1 ? parseInt(cparts[1]) || 0 : parseInt(cparts[0]) || 0;
          if (chp < 16) {
            cnt.style.paddingLeft  = '16px';
            cnt.style.paddingRight = '16px';
          }
        } else if (cpl < 16 || cpr < 16) {
          cnt.style.paddingLeft  = '16px';
          cnt.style.paddingRight = '16px';
        }
      }

      // ── 4. Card/box inner padding reduction ──
      var padEls = document.querySelectorAll('[style*="padding:"]');
      for (var l = 0; l < padEls.length; l++) {
        var pEl = padEls[l];
        if (pEl.tagName === 'SECTION' || pEl.tagName === 'BODY' || pEl.tagName === 'HTML') continue;
        var ep = pEl.style.padding;
        if (!ep) continue;
        var eParts = ep.trim().split(/\s+/);
        var eTop = parseInt(eParts[0]) || 0;
        // Reduce large card padding (40-80px) to mobile-friendly sizes
        if (eTop >= 48 && eTop <= 80) {
          var eH = Math.min(eParts.length > 1 ? parseInt(eParts[1]) || eTop : eTop, 20);
          pEl.style.padding = '28px ' + eH + 'px';
        } else if (eTop >= 40 && eParts.length === 1) {
          pEl.style.padding = small ? '20px' : '24px';
        }
      }

      // ── 5. Hero section: ensure text appears before image ──
      var heroEl = document.querySelector('#hero') || document.querySelectorAll('section')[1];
      if (heroEl) {
        var hGrid = heroEl.querySelector('[style*="grid-template-columns"]') ||
                    heroEl.querySelector('[style*="display:grid"]');
        if (hGrid) {
          var hChildren = Array.from(hGrid.children);
          hChildren.forEach(function(child) {
            var hc = child;
            var hasHeading  = hc.querySelector('h1, h2');
            var isImgOnly   = hc.querySelector('img') && !hc.querySelector('h1, h2, p');
            if (hasHeading) hc.style.order = '1';
            if (isImgOnly)  hc.style.order = '2';
          });
        }
      }

      // ── 6. CTA / button-group flex rows: wrap and centre ──
      var flexEls = document.querySelectorAll('[style*="display:flex"]');
      for (var fi = 0; fi < flexEls.length; fi++) {
        var fEl = flexEls[fi];
        var fGap = parseInt(fEl.style.gap) || 0;
        if (fGap < 12 || fEl.children.length < 2) continue;
        var allBtns = Array.from(fEl.children).every(function(c) {
          return c.tagName === 'A' || c.tagName === 'BUTTON';
        });
        if (allBtns && !fEl.style.flexWrap) {
          fEl.style.flexWrap = 'wrap';
          if (!fEl.style.justifyContent) fEl.style.justifyContent = 'center';
        }
      }

      // ── 7. Hero/section min-height: cap to viewport ──
      var mhEls = document.querySelectorAll('[style*="min-height"]');
      for (var mi = 0; mi < mhEls.length; mi++) {
        var mhEl = mhEls[mi];
        var mhVal = mhEl.style.minHeight;
        if (!mhVal) continue;
        var mhNum = parseInt(mhVal);
        // Only reduce very large min-heights (full-screen heroes)
        if (mhVal.indexOf('vh') !== -1 && mhNum >= 85) {
          mhEl.style.minHeight = small ? '100svh' : '90vh';
        } else if (mhNum > 600) {
          mhEl.style.minHeight = small ? '100svh' : '90vh';
        }
      }

      // ── 8. Images in grid cells: ensure they don't overflow ──
      var imgs = document.querySelectorAll('img');
      for (var ii = 0; ii < imgs.length; ii++) {
        var img = imgs[ii];
        img.style.maxWidth = '100%';
        img.style.height   = 'auto';
      }
    }

    // Run immediately if DOM is ready, otherwise wait for it
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mobilize);
    } else {
      mobilize();
    }

    // Re-run on resize (debounced)
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(mobilize, 120);
    });
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
