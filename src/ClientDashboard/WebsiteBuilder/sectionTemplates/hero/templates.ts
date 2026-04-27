import type { SectionTemplate, WebsiteTemplateData } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

const btnPrimary = (d: WebsiteTemplateData) =>
  `<a href="${d.ctaLink}" style="display:inline-block;background:${d.primaryColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,.2)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">${d.ctaText}</a>`;

const btnSecondary = (d: WebsiteTemplateData, color = d.primaryColor) =>
  d.ctaSecondaryText
    ? `<a href="#about-us" style="display:inline-block;border:2px solid ${color};color:${color};padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">${d.ctaSecondaryText}</a>`
    : "";

export const heroTemplates: SectionTemplate[] = [

  // ── HRO-01  Split — text left, image right ────────────────────────────────
  {
    id: "hero-01",
    name: "Split Text + Image",
    section: "hero",
    industries: ["saas", "startup", "consulting", "finance", "general"],
    themeStyles: ["modern", "minimal", "corporate"],
    generate: (d) => `
<section id="home" style="background:${d.bgColor};padding:96px 0 80px;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
    <div>
      <span style="display:inline-block;background:${d.primaryColor}18;color:${d.primaryColor};padding:6px 16px;border-radius:50px;font-size:13px;font-weight:600;margin-bottom:20px">${d.industry.toUpperCase()} SOLUTION</span>
      <h1 style="font-family:${d.headingFont};font-size:clamp(36px,4vw,58px);font-weight:800;color:${d.textColor};line-height:1.15;margin:0 0 20px">${d.heroHeadline}</h1>
      <p style="font-size:18px;color:${d.mutedColor};line-height:1.7;margin:0 0 36px;max-width:480px">${d.heroSubheadline}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap">${btnPrimary(d)}${btnSecondary(d)}</div>
      ${d.stats.length ? `<div style="display:flex;gap:40px;margin-top:48px">${d.stats.slice(0,3).map(s=>`<div><div style="font-family:${d.headingFont};font-size:28px;font-weight:800;color:${d.primaryColor}">${s.value}</div><div style="font-size:13px;color:${d.mutedColor};margin-top:4px">${s.label}</div></div>`).join("")}</div>` : ""}
    </div>
    <div style="position:relative">
      ${d.heroImage ? `<img src="${d.heroImage}" alt="${d.businessName}" style="width:100%;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.12);object-fit:cover;aspect-ratio:4/3">` : `<div style="background:linear-gradient(135deg,${d.primaryColor}22 0%,${d.accentColor}22 100%);border-radius:16px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center"><span style="font-size:80px">🚀</span></div>`}
    </div>
  </div>
</section>`,
  },

  // ── HRO-02  Full-Width Centered — bold headline, cta centered ─────────────
  {
    id: "hero-02",
    name: "Full-Width Centered",
    section: "hero",
    industries: ["agency", "media", "portfolio", "creative"],
    themeStyles: ["bold", "dark", "creative"],
    generate: (d) => `
<section id="home" style="background:#0f172a;padding:120px 24px;text-align:center;font-family:${d.bodyFont}">
  <div style="max-width:860px;margin:0 auto">
    <h1 style="font-family:${d.headingFont};font-size:clamp(42px,5vw,72px);font-weight:900;color:#fff;line-height:1.1;margin:0 0 24px;letter-spacing:-1.5px">${d.heroHeadline}</h1>
    <p style="font-size:20px;color:#94a3b8;line-height:1.7;margin:0 0 44px">${d.heroSubheadline}</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
      ${btnPrimary(d)}
      ${btnSecondary(d, "#fff")}
    </div>
  </div>
  ${d.images[0] ? `<div style="max-width:1100px;margin:64px auto 0;border-radius:16px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.4)"><img src="${d.images[0]}" style="width:100%;display:block;object-fit:cover;max-height:520px"></div>` : ""}
</section>`,
  },

  // ── HRO-03  Gradient Background Hero ──────────────────────────────────────
  {
    id: "hero-03",
    name: "Gradient Hero",
    section: "hero",
    industries: ["saas", "startup", "education", "fitness"],
    themeStyles: ["bold", "modern", "playful"],
    generate: (d) => `
<section id="home" style="background:linear-gradient(135deg,${d.primaryColor} 0%,${d.accentColor} 100%);padding:110px 24px 90px;text-align:center;font-family:${d.bodyFont}">
  <div style="max-width:760px;margin:0 auto">
    <h1 style="font-family:${d.headingFont};font-size:clamp(38px,4.5vw,64px);font-weight:900;color:#fff;line-height:1.15;margin:0 0 22px">${d.heroHeadline}</h1>
    <p style="font-size:19px;color:rgba(255,255,255,0.88);line-height:1.7;margin:0 0 40px">${d.heroSubheadline}</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
      <a href="${d.ctaLink}" style="background:#fff;color:${d.primaryColor};padding:14px 34px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">${d.ctaText}</a>
      ${d.ctaSecondaryText ? `<a href="#about-us" style="background:transparent;border:2px solid rgba(255,255,255,.8);color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">${d.ctaSecondaryText}</a>` : ""}
    </div>
  </div>
</section>`,
  },

  // ── HRO-04  Video / Big Background Image Hero ──────────────────────────────
  {
    id: "hero-04",
    name: "Full-Screen Image Hero",
    section: "hero",
    industries: ["travel", "restaurant", "realestate", "beauty"],
    themeStyles: ["luxury", "elegant", "bold"],
    generate: (d) => `
<section id="home" style="position:relative;min-height:92vh;display:flex;align-items:center;justify-content:center;text-align:center;font-family:${d.bodyFont};overflow:hidden">
  ${d.heroImage ? `<img src="${d.heroImage}" alt="hero" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0">` : `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});z-index:0"></div>`}
  <div style="position:absolute;inset:0;background:rgba(0,0,0,.55);z-index:1"></div>
  <div style="position:relative;z-index:2;max-width:760px;padding:0 24px">
    <h1 style="font-family:${d.headingFont};font-size:clamp(42px,5.5vw,74px);font-weight:800;color:#fff;line-height:1.1;margin:0 0 24px;text-shadow:0 2px 24px rgba(0,0,0,.4)">${d.heroHeadline}</h1>
    <p style="font-size:20px;color:rgba(255,255,255,.9);line-height:1.7;margin:0 0 44px;text-shadow:0 1px 8px rgba(0,0,0,.3)">${d.heroSubheadline}</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:15px 36px;border-radius:6px;text-decoration:none;font-weight:700;font-size:17px">${d.ctaText}</a>
      ${d.ctaSecondaryText ? `<a href="#contact" style="background:transparent;border:2px solid #fff;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:17px">${d.ctaSecondaryText}</a>` : ""}
    </div>
  </div>
</section>`,
  },

  // ── HRO-05  Healthcare / Professional Trust ────────────────────────────────
  {
    id: "hero-05",
    name: "Trust & Professional",
    section: "hero",
    industries: ["healthcare", "legal", "finance", "nonprofit"],
    themeStyles: ["corporate", "minimal", "classic"],
    generate: (d) => `
<section id="home" style="background:linear-gradient(to right,${d.bgColor} 50%,${d.primaryColor}08 100%);padding:100px 0 80px;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <div style="width:4px;height:40px;background:${d.primaryColor};border-radius:2px"></div>
        <span style="font-size:14px;color:${d.primaryColor};font-weight:600;letter-spacing:1px;text-transform:uppercase">${d.industry} Professionals</span>
      </div>
      <h1 style="font-family:${d.headingFont};font-size:clamp(34px,3.5vw,52px);font-weight:700;color:${d.textColor};line-height:1.2;margin:0 0 20px">${d.heroHeadline}</h1>
      <p style="font-size:17px;color:${d.mutedColor};line-height:1.8;margin:0 0 36px">${d.heroSubheadline}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:36px">${btnPrimary(d)}${btnSecondary(d)}</div>
      <div style="display:flex;gap:24px">
        <div style="display:flex;align-items:center;gap:8px"><span style="color:${d.primaryColor};font-size:18px">✓</span><span style="font-size:14px;color:${d.mutedColor}">Certified Experts</span></div>
        <div style="display:flex;align-items:center;gap:8px"><span style="color:${d.primaryColor};font-size:18px">✓</span><span style="font-size:14px;color:${d.mutedColor}">24/7 Support</span></div>
        <div style="display:flex;align-items:center;gap:8px"><span style="color:${d.primaryColor};font-size:18px">✓</span><span style="font-size:14px;color:${d.mutedColor}">Confidential</span></div>
      </div>
    </div>
    <div style="position:relative">
      ${d.heroImage ? `<img src="${d.heroImage}" alt="${d.businessName}" style="width:100%;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.1);object-fit:cover;aspect-ratio:4/3">` : `<div style="background:${d.primaryColor}12;border-radius:12px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center"><span style="font-size:90px">🏥</span></div>`}
    </div>
  </div>
</section>`,
  },

  // ── HRO-06  E-Commerce Product Showcase ───────────────────────────────────
  {
    id: "hero-06",
    name: "Product Showcase",
    section: "hero",
    industries: ["ecommerce", "beauty", "fitness", "automotive"],
    themeStyles: ["modern", "bold", "minimal"],
    generate: (d) => `
<section id="home" style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont};overflow:hidden">
  <div style="max-width:1280px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center">
      <div style="order:2">
        <span style="display:inline-block;background:${d.accentColor};color:#fff;padding:4px 14px;border-radius:4px;font-size:12px;font-weight:700;margin-bottom:20px;text-transform:uppercase;letter-spacing:1px">NEW ARRIVAL</span>
        <h1 style="font-family:${d.headingFont};font-size:clamp(38px,4vw,60px);font-weight:900;color:${d.textColor};line-height:1.1;margin:0 0 18px;letter-spacing:-1px">${d.heroHeadline}</h1>
        <p style="font-size:17px;color:${d.mutedColor};line-height:1.7;margin:0 0 32px">${d.heroSubheadline}</p>
        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
          ${btnPrimary(d)}
          <a href="#features" style="color:${d.primaryColor};font-weight:600;font-size:15px;text-decoration:none">View Products →</a>
        </div>
      </div>
      <div style="order:1">
        ${d.heroImage || d.images[0] ? `<img src="${d.heroImage || d.images[0]}" alt="product" style="width:100%;border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.15);object-fit:cover;aspect-ratio:1">` : `<div style="background:linear-gradient(135deg,${d.primaryColor}18,${d.accentColor}18);border-radius:20px;aspect-ratio:1;display:flex;align-items:center;justify-content:center"><span style="font-size:100px">🛍️</span></div>`}
      </div>
    </div>
  </div>
</section>`,
  },

  // ── HRO-07  Real Estate — search bar hero ─────────────────────────────────
  {
    id: "hero-07",
    name: "Real Estate Search",
    section: "hero",
    industries: ["realestate", "construction", "travel"],
    themeStyles: ["modern", "corporate", "elegant"],
    generate: (d) => `
<section id="home" style="position:relative;min-height:88vh;display:flex;align-items:center;font-family:${d.bodyFont};overflow:hidden">
  ${d.heroImage ? `<img src="${d.heroImage}" alt="hero" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0">` : `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});z-index:0"></div>`}
  <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,.7) 60%,transparent);z-index:1"></div>
  <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:0 24px">
    <h1 style="font-family:${d.headingFont};font-size:clamp(38px,4.5vw,64px);font-weight:800;color:#fff;line-height:1.15;margin:0 0 18px;max-width:640px">${d.heroHeadline}</h1>
    <p style="font-size:18px;color:rgba(255,255,255,.85);margin:0 0 36px;max-width:520px">${d.heroSubheadline}</p>
    <div style="background:rgba(255,255,255,.95);border-radius:12px;padding:8px;display:inline-flex;gap:0;max-width:580px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2)">
      <input type="text" placeholder="Enter city, neighborhood or ZIP..." style="flex:1;border:none;background:transparent;padding:12px 16px;font-size:15px;outline:none;color:#111;font-family:${d.bodyFont}">
      <button style="background:${d.primaryColor};color:#fff;border:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer">${d.ctaText}</button>
    </div>
  </div>
</section>`,
  },

  // ── HRO-08  Construction / Industrial — bold dark hero ────────────────────
  {
    id: "hero-08",
    name: "Industrial Bold",
    section: "hero",
    industries: ["construction", "manufacturing", "automotive"],
    themeStyles: ["bold", "dark", "corporate"],
    generate: (d) => `
<section id="home" style="background:#1a1a2e;padding:100px 0 80px;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
    <div>
      <div style="width:60px;height:4px;background:${d.accentColor};margin-bottom:24px"></div>
      <h1 style="font-family:${d.headingFont};font-size:clamp(36px,4vw,58px);font-weight:900;color:#fff;line-height:1.15;margin:0 0 20px;text-transform:uppercase;letter-spacing:-0.5px">${d.heroHeadline}</h1>
      <p style="font-size:17px;color:#94a3b8;line-height:1.7;margin:0 0 36px">${d.heroSubheadline}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <a href="${d.ctaLink}" style="background:${d.accentColor};color:#000;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:800;font-size:15px;text-transform:uppercase;letter-spacing:0.5px">${d.ctaText}</a>
        ${d.ctaSecondaryText ? `<a href="#about-us" style="border:2px solid #fff;color:#fff;padding:13px 30px;border-radius:4px;text-decoration:none;font-weight:600;font-size:15px;text-transform:uppercase;letter-spacing:0.5px">${d.ctaSecondaryText}</a>` : ""}
      </div>
    </div>
    <div>
      ${d.heroImage ? `<img src="${d.heroImage}" alt="${d.businessName}" style="width:100%;border-radius:8px;box-shadow:0 30px 80px rgba(0,0,0,.4);object-fit:cover;aspect-ratio:4/3">` : `<div style="background:#2d2d4e;border-radius:8px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center"><span style="font-size:100px">🏗️</span></div>`}
    </div>
  </div>
</section>`,
  },

  // ── HRO-09  Restaurant / Food — appetite-driven big image ─────────────────
  {
    id: "hero-09",
    name: "Food & Appetite",
    section: "hero",
    industries: ["restaurant", "travel", "beauty"],
    themeStyles: ["elegant", "luxury", "classic"],
    generate: (d) => `
<section id="home" style="position:relative;min-height:90vh;display:flex;align-items:flex-end;font-family:${d.bodyFont}">
  ${d.heroImage || d.images[0] ? `<img src="${d.heroImage || d.images[0]}" alt="hero" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor})"></div>`}
  <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 60%)"></div>
  <div style="position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:0 40px 80px;width:100%">
    <p style="color:${d.accentColor};font-size:14px;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;font-weight:600">Welcome to</p>
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:clamp(48px,6vw,84px);font-weight:700;color:#fff;line-height:1.1;margin:0 0 20px">${d.heroHeadline}</h1>
    <p style="font-size:18px;color:rgba(255,255,255,.85);margin:0 0 36px;max-width:480px">${d.heroSubheadline}</p>
    <div style="display:flex;gap:16px">
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:15px 36px;border-radius:4px;text-decoration:none;font-weight:700;font-size:16px">${d.ctaText}</a>
      ${d.ctaSecondaryText ? `<a href="#contact" style="background:transparent;border:2px solid #fff;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:600;font-size:16px">${d.ctaSecondaryText}</a>` : ""}
    </div>
  </div>
</section>`,
  },

  // ── HRO-10  SaaS Dashboard Preview ────────────────────────────────────────
  {
    id: "hero-10",
    name: "SaaS Dashboard Preview",
    section: "hero",
    industries: ["saas", "startup", "media", "education"],
    themeStyles: ["modern", "minimal", "bold"],
    generate: (d) => `
<section id="home" style="background:${d.bgColor};padding:100px 0 0;font-family:${d.bodyFont};overflow:hidden">
  <div style="max-width:900px;margin:0 auto;padding:0 24px;text-align:center">
    <span style="display:inline-flex;align-items:center;gap:8px;background:${d.primaryColor}14;color:${d.primaryColor};padding:6px 18px;border-radius:50px;font-size:13px;font-weight:600;margin-bottom:24px">
      <span style="width:6px;height:6px;background:${d.primaryColor};border-radius:50%;display:inline-block;animation:pulse 2s infinite"></span>
      Now live — ${d.tagline}
    </span>
    <h1 style="font-family:${d.headingFont};font-size:clamp(40px,4.5vw,68px);font-weight:900;color:${d.textColor};line-height:1.1;margin:0 0 22px;letter-spacing:-1.5px">${d.heroHeadline}</h1>
    <p style="font-size:19px;color:${d.mutedColor};line-height:1.7;margin:0 auto 40px;max-width:560px">${d.heroSubheadline}</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:64px">${btnPrimary(d)}${btnSecondary(d)}</div>
  </div>
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    ${d.images[0] ? `<div style="border-radius:20px 20px 0 0;overflow:hidden;box-shadow:0 -8px 60px rgba(0,0,0,.12);border:1px solid #e5e7eb;border-bottom:none"><img src="${d.images[0]}" style="width:100%;display:block;max-height:500px;object-fit:cover;object-position:top"></div>` : `<div style="background:linear-gradient(135deg,${d.primaryColor}12,${d.accentColor}12);border-radius:20px 20px 0 0;height:420px;border:1px solid #e5e7eb;border-bottom:none;display:flex;align-items:center;justify-content:center"><span style="font-size:100px">💻</span></div>`}
  </div>
</section>`,
  },
];
