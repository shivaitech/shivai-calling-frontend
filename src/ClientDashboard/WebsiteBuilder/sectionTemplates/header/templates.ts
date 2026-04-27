import type { SectionTemplate, WebsiteTemplateData } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// HEADER TEMPLATES  (10 variants)
// Each returns a self-contained HTML <header> string with inline styles.
// ─────────────────────────────────────────────────────────────────────────────

const navLinks = (d: WebsiteTemplateData, color = "#fff") =>
  d.navItems
    .map(
      (n) =>
        `<a href="${n.href}" style="color:${color};text-decoration:none;font-size:15px;font-weight:500;transition:opacity .2s" onmouseover="this.style.opacity='.7'" onmouseout="this.style.opacity='1'">${n.label}</a>`
    )
    .join("");

const ctaBtn = (d: WebsiteTemplateData, bg: string, color = "#fff") =>
  `<a href="${d.ctaLink}" style="background:${bg};color:${color};padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;transition:opacity .2s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">${d.ctaText}</a>`;

export const headerTemplates: SectionTemplate[] = [

  // ── H-01  Minimal Sticky — white bg, left logo, right nav + CTA ───────────
  {
    id: "header-01",
    name: "Minimal Sticky",
    section: "header",
    industries: ["saas", "startup", "consulting", "finance", "general"],
    themeStyles: ["minimal", "modern", "corporate"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;background:#fff;border-bottom:1px solid #e5e7eb;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:68px;display:flex;align-items:center;justify-content:space-between">
    <a href="#" style="text-decoration:none;display:flex;align-items:center;gap:10px">
      ${d.logo ? `<img src="${d.logo}" alt="${d.businessName}" style="height:36px;object-fit:contain">` : `<span style="font-family:${d.headingFont};font-size:22px;font-weight:700;color:${d.primaryColor}">${d.businessName}</span>`}
    </a>
    <nav style="display:flex;align-items:center;gap:32px">
      ${navLinks(d, d.textColor)}
    </nav>
    <div style="display:flex;align-items:center;gap:12px">
      ${ctaBtn(d, d.primaryColor)}
    </div>
  </div>
</header>`,
  },

  // ── H-02  Dark Full-Width — dark bg, center logo, nav spread ──────────────
  {
    id: "header-02",
    name: "Dark Centered",
    section: "header",
    industries: ["agency", "media", "portfolio", "startup"],
    themeStyles: ["dark", "bold", "creative"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;background:#0f172a;font-family:${d.bodyFont}">
  <div style="max-width:1280px;margin:0 auto;padding:0 32px;height:72px;display:flex;align-items:center;justify-content:space-between">
    <a href="#" style="text-decoration:none">
      <span style="font-family:${d.headingFont};font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">${d.businessName}</span>
    </a>
    <nav style="display:flex;align-items:center;gap:36px">
      ${navLinks(d, "#cbd5e1")}
    </nav>
    ${ctaBtn(d, d.primaryColor)}
  </div>
</header>`,
  },

  // ── H-03  Gradient Bar — gradient bg with white text ──────────────────────
  {
    id: "header-03",
    name: "Gradient Bar",
    section: "header",
    industries: ["saas", "startup", "education", "fitness"],
    themeStyles: ["bold", "modern", "playful"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;background:linear-gradient(135deg,${d.primaryColor} 0%,${d.accentColor} 100%);font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 32px;height:70px;display:flex;align-items:center;justify-content:space-between">
    <a href="#" style="text-decoration:none">
      <span style="font-family:${d.headingFont};font-size:22px;font-weight:800;color:#fff">${d.businessName}</span>
    </a>
    <nav style="display:flex;align-items:center;gap:32px">
      ${navLinks(d, "rgba(255,255,255,0.9)")}
    </nav>
    <a href="${d.ctaLink}" style="background:rgba(255,255,255,0.2);border:1.5px solid rgba(255,255,255,0.7);color:#fff;padding:9px 22px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;backdrop-filter:blur(4px)">${d.ctaText}</a>
  </div>
</header>`,
  },

  // ── H-04  Transparent Hero Overlay — glass effect, for sites with big hero bg
  {
    id: "header-04",
    name: "Transparent Hero Overlay",
    section: "header",
    industries: ["travel", "realestate", "beauty", "restaurant", "fitness"],
    themeStyles: ["luxury", "elegant", "creative"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;background:rgba(0,0,0,0.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.1);font-family:${d.bodyFont}">
  <div style="max-width:1280px;margin:0 auto;padding:0 40px;height:72px;display:flex;align-items:center;justify-content:space-between">
    <a href="#" style="text-decoration:none">
      <span style="font-family:${d.headingFont};font-size:24px;font-weight:700;color:#fff;letter-spacing:1px;text-transform:uppercase">${d.businessName}</span>
    </a>
    <nav style="display:flex;align-items:center;gap:36px">
      ${navLinks(d, "rgba(255,255,255,0.88)")}
    </nav>
    <a href="${d.ctaLink}" style="border:1.5px solid #fff;color:#fff;padding:9px 22px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.5px">${d.ctaText}</a>
  </div>
</header>`,
  },

  // ── H-05  Dual-Row Corporate — top info bar + main nav ────────────────────
  {
    id: "header-05",
    name: "Dual-Row Corporate",
    section: "header",
    industries: ["legal", "finance", "healthcare", "construction", "manufacturing"],
    themeStyles: ["corporate", "classic", "minimal"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;font-family:${d.bodyFont}">
  <div style="background:${d.primaryColor};padding:6px 0">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;justify-content:flex-end;align-items:center;gap:24px">
      ${d.phone ? `<span style="color:rgba(255,255,255,0.9);font-size:13px">📞 ${d.phone}</span>` : ""}
      ${d.email ? `<span style="color:rgba(255,255,255,0.9);font-size:13px">✉ ${d.email}</span>` : ""}
    </div>
  </div>
  <div style="background:#fff;border-bottom:1px solid #e5e7eb">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:68px;display:flex;align-items:center;justify-content:space-between">
      <a href="#" style="text-decoration:none">
        <span style="font-family:${d.headingFont};font-size:22px;font-weight:700;color:${d.primaryColor}">${d.businessName}</span>
      </a>
      <nav style="display:flex;align-items:center;gap:32px">
        ${navLinks(d, d.textColor)}
      </nav>
      ${ctaBtn(d, d.primaryColor)}
    </div>
  </div>
</header>`,
  },

  // ── H-06  Split Layout — colored left panel + white right ─────────────────
  {
    id: "header-06",
    name: "Split Color Bar",
    section: "header",
    industries: ["agency", "consulting", "media", "ecommerce"],
    themeStyles: ["bold", "creative", "modern"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;font-family:${d.bodyFont};display:flex;height:68px">
  <div style="background:${d.primaryColor};display:flex;align-items:center;padding:0 32px;min-width:220px">
    <a href="#" style="text-decoration:none">
      <span style="font-family:${d.headingFont};font-size:21px;font-weight:800;color:#fff">${d.businessName}</span>
    </a>
  </div>
  <div style="flex:1;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;padding:0 32px">
    <nav style="display:flex;align-items:center;gap:32px">
      ${navLinks(d, d.textColor)}
    </nav>
    ${ctaBtn(d, d.primaryColor)}
  </div>
</header>`,
  },

  // ── H-07  Restaurant / Hospitality — elegant serif, centered ──────────────
  {
    id: "header-07",
    name: "Hospitality Elegant",
    section: "header",
    industries: ["restaurant", "travel", "beauty", "ecommerce"],
    themeStyles: ["elegant", "luxury", "classic"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;background:#faf7f4;border-bottom:1px solid #e8ddd5;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 32px;height:80px;display:flex;align-items:center;justify-content:space-between">
    <a href="#" style="text-decoration:none">
      <span style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:${d.primaryColor};letter-spacing:2px;text-transform:uppercase">${d.businessName}</span>
    </a>
    <nav style="display:flex;align-items:center;gap:36px">
      ${d.navItems.map((n) => `<a href="${n.href}" style="color:#5c4d3c;text-decoration:none;font-size:14px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500">${n.label}</a>`).join("")}
    </nav>
    <a href="${d.ctaLink}" style="background:transparent;border:1.5px solid ${d.primaryColor};color:${d.primaryColor};padding:10px 24px;border-radius:2px;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:600">${d.ctaText}</a>
  </div>
</header>`,
  },

  // ── H-08  E-Commerce / Retail — search + cart icons ───────────────────────
  {
    id: "header-08",
    name: "E-Commerce Retail",
    section: "header",
    industries: ["ecommerce", "beauty", "automotive", "fitness"],
    themeStyles: ["minimal", "modern", "bold"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.08);font-family:${d.bodyFont}">
  <div style="max-width:1280px;margin:0 auto;padding:0 24px;height:70px;display:flex;align-items:center;justify-content:space-between">
    <a href="#" style="text-decoration:none">
      <span style="font-family:${d.headingFont};font-size:22px;font-weight:900;color:${d.primaryColor};letter-spacing:-1px">${d.businessName}</span>
    </a>
    <nav style="display:flex;align-items:center;gap:28px">
      ${navLinks(d, d.textColor)}
    </nav>
    <div style="display:flex;align-items:center;gap:16px">
      <button style="background:none;border:none;cursor:pointer;font-size:20px" title="Search">🔍</button>
      <button style="background:none;border:none;cursor:pointer;font-size:20px" title="Cart">🛒</button>
      ${ctaBtn(d, d.primaryColor)}
    </div>
  </div>
</header>`,
  },

  // ── H-09  Startup / SaaS — announcement bar + main nav ────────────────────
  {
    id: "header-09",
    name: "Startup Announcement",
    section: "header",
    industries: ["saas", "startup", "media"],
    themeStyles: ["modern", "bold", "playful"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;font-family:${d.bodyFont}">
  <div style="background:${d.primaryColor};text-align:center;padding:8px 24px">
    <span style="color:#fff;font-size:13px;font-weight:500">🚀 ${d.tagline} — <a href="${d.ctaLink}" style="color:#fff;font-weight:700;text-decoration:underline">${d.ctaText}</a></span>
  </div>
  <div style="background:#fff;border-bottom:1px solid #e5e7eb">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between">
      <a href="#" style="text-decoration:none">
        <span style="font-family:${d.headingFont};font-size:21px;font-weight:800;color:${d.textColor}">${d.businessName}</span>
      </a>
      <nav style="display:flex;align-items:center;gap:28px">
        ${navLinks(d, d.textColor)}
      </nav>
      <div style="display:flex;align-items:center;gap:10px">
        <a href="#" style="color:${d.textColor};text-decoration:none;font-size:14px;font-weight:500">Log in</a>
        ${ctaBtn(d, d.primaryColor)}
      </div>
    </div>
  </div>
</header>`,
  },

  // ── H-10  Healthcare / Nonprofit — trust bar with phone ───────────────────
  {
    id: "header-10",
    name: "Trust & Care",
    section: "header",
    industries: ["healthcare", "nonprofit", "education", "legal"],
    themeStyles: ["corporate", "minimal", "classic"],
    generate: (d) => `
<header id="site-header" style="position:sticky;top:0;z-index:999;font-family:${d.bodyFont}">
  <div style="background:#f0f9ff;border-bottom:1px solid #bae6fd;padding:6px 0">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:center">
      <span style="color:#0369a1;font-size:13px">🏥 Trusted by thousands of patients & professionals</span>
      <div style="display:flex;gap:20px">
        ${d.phone ? `<a href="tel:${d.phone}" style="color:#0369a1;font-size:13px;font-weight:600;text-decoration:none">📞 ${d.phone}</a>` : ""}
        ${d.email ? `<a href="mailto:${d.email}" style="color:#0369a1;font-size:13px;font-weight:600;text-decoration:none">✉ ${d.email}</a>` : ""}
      </div>
    </div>
  </div>
  <div style="background:#fff;border-bottom:1px solid #e5e7eb">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:68px;display:flex;align-items:center;justify-content:space-between">
      <a href="#" style="text-decoration:none">
        <span style="font-family:${d.headingFont};font-size:22px;font-weight:700;color:${d.primaryColor}">${d.businessName}</span>
      </a>
      <nav style="display:flex;align-items:center;gap:28px">
        ${navLinks(d, d.textColor)}
      </nav>
      ${ctaBtn(d, d.primaryColor)}
    </div>
  </div>
</header>`,
  },
];
