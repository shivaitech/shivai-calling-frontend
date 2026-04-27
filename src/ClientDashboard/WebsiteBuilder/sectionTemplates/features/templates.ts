import type { SectionTemplate, WebsiteTemplateData } from "../types";
import { renderIcon, renderIconBox, renderIconCircle } from "../iconUtils";

// ─────────────────────────────────────────────────────────────────────────────
// FEATURES SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

const featureCards = (d: WebsiteTemplateData, bg: string, textC: string, subC: string) =>
  d.features
    .slice(0, 6)
    .map(
      (f) => `
  <div style="background:${bg};border-radius:12px;padding:32px 28px">
    <div style="margin-bottom:16px">${renderIconBox(f.icon || "sparkles", 26, d.primaryColor)}</div>
    <h3 style="font-family:${d.headingFont};font-size:19px;font-weight:700;color:${textC};margin:0 0 10px">${f.title}</h3>
    <p style="font-size:14px;color:${subC};line-height:1.7;margin:0">${f.description}</p>
  </div>`
    )
    .join("");

export const featuresTemplates: SectionTemplate[] = [

  // ── FTR-01  3-Column Grid on White ────────────────────────────────────────
  {
    id: "features-01",
    name: "3-Col Light Grid",
    section: "features",
    industries: ["saas", "startup", "consulting", "general"],
    themeStyles: ["minimal", "modern", "corporate"],
    generate: (d) => `
<section id="features" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:60px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(30px,3vw,44px);font-weight:800;color:${d.textColor};margin:0 0 16px">Why Choose ${d.businessName}?</h2>
      <p style="font-size:17px;color:${d.mutedColor};max-width:560px;margin:0 auto;line-height:1.7">Everything you need to succeed — built in one powerful platform.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px">
      ${featureCards(d, "#f8fafc", d.textColor, d.mutedColor)}
    </div>
  </div>
</section>`,
  },

  // ── FTR-02  Dark Background Cards ─────────────────────────────────────────
  {
    id: "features-02",
    name: "Dark Cards",
    section: "features",
    industries: ["agency", "media", "saas"],
    themeStyles: ["dark", "bold", "creative"],
    generate: (d) => `
<section id="features" style="background:#0f172a;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:60px">
      <span style="color:${d.primaryColor};font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase">What We Offer</span>
      <h2 style="font-family:${d.headingFont};font-size:clamp(30px,3vw,44px);font-weight:800;color:#fff;margin:12px 0 0">Powerful Features</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${d.features.slice(0,6).map(f=>`
      <div style="background:#1e293b;border-radius:12px;padding:32px 28px;border:1px solid #334155">
        <div style="margin-bottom:20px">${renderIconBox(f.icon||"zap", 24, d.primaryColor, d.primaryColor+"22", 10, 48)}</div>
        <h3 style="font-family:${d.headingFont};font-size:18px;font-weight:700;color:#f1f5f9;margin:0 0 10px">${f.title}</h3>
        <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0">${f.description}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── FTR-03  Icon + Text Horizontal List ───────────────────────────────────
  {
    id: "features-03",
    name: "Horizontal List",
    section: "features",
    industries: ["healthcare", "legal", "finance", "nonprofit"],
    themeStyles: ["minimal", "corporate", "classic"],
    generate: (d) => `
<section id="features" style="background:#f8fafc;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
      <div>
        <span style="color:${d.primaryColor};font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase">Our Services</span>
        <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:800;color:${d.textColor};margin:12px 0 20px">Built for Excellence</h2>
        <p style="font-size:16px;color:${d.mutedColor};line-height:1.8;margin:0 0 32px">${d.description}</p>
        <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaText}</a>
      </div>
      <div style="display:flex;flex-direction:column;gap:24px">
        ${d.features.slice(0,5).map(f=>`
        <div style="display:flex;gap:16px;align-items:flex-start">
          <div style="flex-shrink:0">${renderIconBox(f.icon||"check-circle", 20, d.primaryColor, d.primaryColor+"16", 10, 44)}</div>
          <div>
            <h3 style="font-family:${d.headingFont};font-size:17px;font-weight:700;color:${d.textColor};margin:0 0 6px">${f.title}</h3>
            <p style="font-size:14px;color:${d.mutedColor};line-height:1.6;margin:0">${f.description}</p>
          </div>
        </div>`).join("")}
      </div>
    </div>
  </div>
</section>`,
  },

  // ── FTR-04  Gradient Accent Cards ─────────────────────────────────────────
  {
    id: "features-04",
    name: "Gradient Accent Cards",
    section: "features",
    industries: ["fitness", "beauty", "ecommerce", "startup"],
    themeStyles: ["bold", "playful", "modern"],
    generate: (d) => `
<section id="features" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:60px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(30px,3vw,44px);font-weight:900;color:${d.textColor};margin:0 0 14px">What Makes Us Different</h2>
      <p style="font-size:17px;color:${d.mutedColor};max-width:500px;margin:0 auto">${d.tagline}</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${d.features.slice(0,6).map((f,i)=>`
      <div style="background:${i%2===0 ? `linear-gradient(135deg,${d.primaryColor},${d.accentColor})` : '#fff'};border-radius:16px;padding:36px 28px;box-shadow:0 4px 20px rgba(0,0,0,.08)">
        <div style="margin-bottom:18px">${renderIcon(f.icon||"star", 36, i%2===0?'#fff':d.primaryColor)}</div>
        <h3 style="font-family:${d.headingFont};font-size:19px;font-weight:700;color:${i%2===0?'#fff':d.textColor};margin:0 0 10px">${f.title}</h3>
        <p style="font-size:14px;color:${i%2===0?'rgba(255,255,255,0.85)':d.mutedColor};line-height:1.7;margin:0">${f.description}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── FTR-05  Tabbed Feature Showcase ───────────────────────────────────────
  {
    id: "features-05",
    name: "Tab Showcase",
    section: "features",
    industries: ["saas", "education", "media", "consulting"],
    themeStyles: ["modern", "minimal"],
    generate: (d) => `
<section id="features" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(30px,3vw,44px);font-weight:800;color:${d.textColor};margin:0 0 14px">Core Features</h2>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:48px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:8px">
        ${d.features.slice(0,5).map((f,i)=>`
        <button onclick="document.querySelectorAll('.feat-panel').forEach((p,pi)=>{p.style.display=pi===${i}?'block':'none'});this.parentElement.querySelectorAll('button').forEach((b,bi)=>{b.style.background=bi===${i}?'${d.primaryColor}':'transparent';b.style.color=bi===${i}?'#fff':'${d.textColor}'})" style="background:${i===0?d.primaryColor:'transparent'};color:${i===0?'#fff':d.textColor};border:1px solid ${d.primaryColor}28;border-radius:10px;padding:14px 20px;text-align:left;cursor:pointer;font-family:${d.headingFont};font-size:15px;font-weight:600;transition:all .2s;display:flex;align-items:center;gap:10px">${renderIcon(f.icon||"zap",16,i===0?'#fff':d.primaryColor)} ${f.title}</button>`).join("")}
      </div>
      <div>
        ${d.features.slice(0,5).map((f,i)=>`
        <div class="feat-panel" style="display:${i===0?'block':'none'};background:#f8fafc;border-radius:16px;padding:40px">
          <div style="margin-bottom:24px">${renderIconBox(f.icon||"star", 32, d.primaryColor, d.primaryColor+"12", 14, 72)}</div>
          <h3 style="font-family:${d.headingFont};font-size:24px;font-weight:700;color:${d.textColor};margin:0 0 14px">${f.title}</h3>
          <p style="font-size:16px;color:${d.mutedColor};line-height:1.8;margin:0">${f.description}</p>
        </div>`).join("")}
      </div>
    </div>
  </div>
</section>`,
  },

  // ── FTR-06  Restaurant Services ───────────────────────────────────────────
  {
    id: "features-06",
    name: "Restaurant Services",
    section: "features",
    industries: ["restaurant", "travel", "beauty"],
    themeStyles: ["elegant", "luxury"],
    generate: (d) => `
<section id="features" style="background:#faf7f4;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;text-align:center">
    <p style="color:${d.primaryColor};font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-weight:600">Our Offerings</p>
    <h2 style="font-family:Georgia,serif;font-size:clamp(30px,3vw,44px);font-weight:400;color:#3d2b1f;margin:0 0 48px">Experience Excellence</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid #e8ddd5">
      ${d.features.slice(0,6).map((f,i)=>`
      <div style="padding:44px 36px;border-right:${i%3<2?'1px solid #e8ddd5':'none'};border-bottom:${i<3?'1px solid #e8ddd5':'none'}">
        <div style="margin-bottom:20px;display:flex;justify-content:center">${renderIconBox(f.icon||"utensils", 24, d.primaryColor, d.primaryColor+"12", 12, 56)}</div>
        <h3 style="font-family:Georgia,serif;font-size:20px;font-weight:400;color:#3d2b1f;margin:0 0 12px">${f.title}</h3>
        <p style="font-size:14px;color:#8c7b6e;line-height:1.8;margin:0">${f.description}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── FTR-07  Healthcare Services ───────────────────────────────────────────
  {
    id: "features-07",
    name: "Healthcare Services",
    section: "features",
    industries: ["healthcare", "nonprofit"],
    themeStyles: ["corporate", "minimal"],
    generate: (d) => `
<section id="features" style="background:#fff;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:700;color:${d.textColor};margin:0 0 14px">Our Services</h2>
      <p style="font-size:16px;color:${d.mutedColor};max-width:500px;margin:0 auto">Comprehensive care tailored to your needs</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
      ${d.features.slice(0,8).map(f=>`
      <div style="text-align:center;padding:32px 20px;border-radius:12px;border:2px solid #e5e7eb;transition:border-color .2s" onmouseover="this.style.borderColor='${d.primaryColor}'" onmouseout="this.style.borderColor='#e5e7eb'">
        <div style="display:flex;justify-content:center;margin-bottom:20px">${renderIconCircle(f.icon||"heart", 26, d.primaryColor, d.primaryColor+"12")}</div>
        <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:0 0 8px">${f.title}</h3>
        <p style="font-size:13px;color:${d.mutedColor};line-height:1.6;margin:0">${f.description}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── FTR-08  2-Col with Image ───────────────────────────────────────────────
  {
    id: "features-08",
    name: "Image + Features",
    section: "features",
    industries: ["realestate", "construction", "manufacturing"],
    themeStyles: ["modern", "corporate"],
    generate: (d) => `
<section id="features" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
    <div>
      ${d.images[1] || d.heroImage ? `<img src="${d.images[1]||d.heroImage}" alt="features" style="width:100%;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.1);object-fit:cover;aspect-ratio:4/3">` : `<div style="background:${d.primaryColor}10;border-radius:16px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center"><span style="font-size:80px">🏆</span></div>`}
    </div>
    <div>
      <span style="color:${d.primaryColor};font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase">Why Us</span>
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:800;color:${d.textColor};margin:12px 0 32px">${d.heroHeadline}</h2>
      <div style="display:flex;flex-direction:column;gap:24px">
        ${d.features.slice(0,5).map(f=>`
        <div style="display:flex;gap:14px">
          <div style="width:10px;height:10px;background:${d.primaryColor};border-radius:50%;flex-shrink:0;margin-top:7px"></div>
          <div>
            <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:0 0 4px">${f.title}</h3>
            <p style="font-size:14px;color:${d.mutedColor};line-height:1.6;margin:0">${f.description}</p>
          </div>
        </div>`).join("")}
      </div>
    </div>
  </div>
</section>`,
  },

  // ── FTR-09  Numbered Steps / Process ──────────────────────────────────────
  {
    id: "features-09",
    name: "How It Works Steps",
    section: "features",
    industries: ["ecommerce", "saas", "consulting", "agency"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<section id="features" style="background:#f8fafc;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1000px;margin:0 auto;padding:0 24px;text-align:center">
    <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 12px">How It Works</h2>
    <p style="font-size:16px;color:${d.mutedColor};margin:0 0 60px">Simple steps to get started</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px;position:relative">
      <div style="position:absolute;top:36px;left:12%;right:12%;height:2px;background:${d.primaryColor}28;z-index:0"></div>
      ${d.features.slice(0,4).map((f,i)=>`
      <div style="position:relative;z-index:1">
        <div style="width:72px;height:72px;background:${d.primaryColor};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-family:${d.headingFont};font-size:22px;font-weight:900;color:#fff">0${i+1}</div>
        <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:0 0 8px">${f.title}</h3>
        <p style="font-size:13px;color:${d.mutedColor};line-height:1.7;margin:0">${f.description}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── FTR-10  Comparison / Checklist ────────────────────────────────────────
  {
    id: "features-10",
    name: "Benefit Checklist",
    section: "features",
    industries: ["finance", "legal", "insurance", "general"],
    themeStyles: ["minimal", "corporate", "classic"],
    generate: (d) => `
<section id="features" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center">
      <div>
        <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 16px">Everything You Need</h2>
        <p style="font-size:16px;color:${d.mutedColor};line-height:1.8;margin:0 0 36px">${d.description}</p>
        <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaText}</a>
      </div>
      <div style="display:flex;flex-direction:column;gap:20px">
        ${d.features.slice(0,6).map(f=>`
        <div style="display:flex;align-items:flex-start;gap:14px;padding:20px;background:#f8fafc;border-radius:10px">
          <div style="width:28px;height:28px;background:${d.primaryColor};border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700">✓</div>
          <div>
            <div style="font-weight:700;color:${d.textColor};font-size:15px;margin-bottom:4px">${f.title}</div>
            <div style="font-size:13px;color:${d.mutedColor};line-height:1.6">${f.description}</div>
          </div>
        </div>`).join("")}
      </div>
    </div>
  </div>
</section>`,
  },
];
