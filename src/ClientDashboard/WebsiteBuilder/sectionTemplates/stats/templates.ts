import type { SectionTemplate, WebsiteTemplateData } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// STATS / GROWTH SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

export const statsTemplates: SectionTemplate[] = [

  // ── STT-01  4-Col Minimal Stats ────────────────────────────────────────────
  {
    id: "stats-01",
    name: "4-Col Minimal",
    section: "stats",
    industries: ["saas", "consulting", "startup", "general"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<section style="background:#f8fafc;padding:72px 0;font-family:${d.bodyFont};border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px">
      ${d.stats.slice(0,4).map(s=>`
      <div style="text-align:center">
        <div style="font-family:${d.headingFont};font-size:clamp(32px,3vw,48px);font-weight:900;color:${d.primaryColor};margin-bottom:8px">${s.value}</div>
        <div style="font-size:14px;color:${d.mutedColor};font-weight:500;letter-spacing:0.5px">${s.label}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── STT-02  Dark Stats Banner ──────────────────────────────────────────────
  {
    id: "stats-02",
    name: "Dark Impact Banner",
    section: "stats",
    industries: ["agency", "media", "saas"],
    themeStyles: ["dark", "bold", "creative"],
    generate: (d) => `
<section style="background:#0f172a;padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,2.5vw,36px);font-weight:800;color:#fff;margin:0">Our Impact in Numbers</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px">
      ${d.stats.slice(0,4).map(s=>`
      <div style="text-align:center;padding:32px 20px;background:#1e293b;border-radius:16px">
        <div style="font-family:${d.headingFont};font-size:clamp(34px,3vw,52px);font-weight:900;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:10px">${s.value}</div>
        <div style="font-size:14px;color:#94a3b8;font-weight:500">${s.label}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── STT-03  Gradient Stats ────────────────────────────────────────────────
  {
    id: "stats-03",
    name: "Gradient Stats",
    section: "stats",
    industries: ["fitness", "ecommerce", "startup"],
    themeStyles: ["bold", "playful", "modern"],
    generate: (d) => `
<section style="background:linear-gradient(135deg,${d.primaryColor} 0%,${d.accentColor} 100%);padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px">
      ${d.stats.slice(0,4).map(s=>`
      <div style="text-align:center">
        <div style="font-family:${d.headingFont};font-size:clamp(36px,3.5vw,56px);font-weight:900;color:#fff;margin-bottom:8px">${s.value}</div>
        <div style="font-size:14px;color:rgba(255,255,255,.85);font-weight:500">${s.label}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── STT-04  Stats with Dividers ────────────────────────────────────────────
  {
    id: "stats-04",
    name: "Stats With Dividers",
    section: "stats",
    industries: ["legal", "finance", "healthcare", "corporate"],
    themeStyles: ["corporate", "minimal", "classic"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:72px 0;font-family:${d.bodyFont}">
  <div style="max-width:1000px;margin:0 auto;padding:0 24px">
    <div style="display:flex">
      ${d.stats.slice(0,4).map((s,i)=>`
      <div style="flex:1;text-align:center;padding:0 24px;${i>0?'border-left:2px solid #e5e7eb':''}">
        <div style="font-family:${d.headingFont};font-size:clamp(28px,2.5vw,44px);font-weight:900;color:${d.primaryColor};margin-bottom:8px">${s.value}</div>
        <div style="font-size:13px;color:${d.mutedColor};font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${s.label}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── STT-05  Stats + Heading Block ─────────────────────────────────────────
  {
    id: "stats-05",
    name: "Headline + Stats",
    section: "stats",
    industries: ["saas", "consulting", "agency"],
    themeStyles: ["modern", "bold"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 2fr;gap:64px;align-items:center">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:0 0 16px">Proven Results</h2>
      <p style="font-size:16px;color:${d.mutedColor};line-height:1.8;margin:0 0 24px">${d.description}</p>
      <a href="${d.ctaLink}" style="color:${d.primaryColor};text-decoration:none;font-weight:700;font-size:15px">Learn more →</a>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
      ${d.stats.slice(0,4).map(s=>`
      <div style="padding:32px;background:${d.primaryColor}08;border-radius:16px;border:1px solid ${d.primaryColor}20">
        <div style="font-family:${d.headingFont};font-size:clamp(30px,3vw,46px);font-weight:900;color:${d.primaryColor};margin-bottom:8px">${s.value}</div>
        <div style="font-size:14px;color:${d.mutedColor};line-height:1.5">${s.label}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── STT-06  Progress/Growth Bars ──────────────────────────────────────────
  {
    id: "stats-06",
    name: "Growth Bars",
    section: "stats",
    industries: ["agency", "construction", "manufacturing"],
    themeStyles: ["corporate", "bold"],
    generate: (d) => `
<section style="background:#f8fafc;padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0 0 16px">Our Track Record</h2>
      <p style="font-size:16px;color:${d.mutedColor};line-height:1.8;margin:0">${d.description}</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:28px">
      ${d.stats.slice(0,5).map(s=>{
        const pct = parseInt(s.value)||75;
        return `
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:14px;color:${d.textColor};font-weight:600">${s.label}</span>
          <span style="font-size:14px;color:${d.primaryColor};font-weight:700">${s.value}</span>
        </div>
        <div style="background:#e5e7eb;border-radius:50px;height:8px">
          <div style="background:${d.primaryColor};height:8px;border-radius:50px;width:${Math.min(pct,100)}%"></div>
        </div>
      </div>`;}).join("")}
    </div>
  </div>
</section>`,
  },

  // ── STT-07  Animated Counter Cards ────────────────────────────────────────
  {
    id: "stats-07",
    name: "Counter Cards",
    section: "stats",
    industries: ["general", "nonprofit", "education"],
    themeStyles: ["modern", "minimal"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;text-align:center;margin-bottom:48px">
    <h2 style="font-family:${d.headingFont};font-size:clamp(26px,2.5vw,38px);font-weight:800;color:${d.textColor};margin:0">By The Numbers</h2>
  </div>
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
    ${d.stats.slice(0,4).map(s=>`
    <div style="background:#fff;border-radius:16px;padding:36px 24px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.06);border:1px solid #f1f5f9">
      <div style="font-family:${d.headingFont};font-size:clamp(32px,3vw,48px);font-weight:900;color:${d.primaryColor};margin-bottom:10px">${s.value}</div>
      <div style="width:40px;height:3px;background:${d.primaryColor};margin:0 auto 14px;border-radius:2px"></div>
      <div style="font-size:14px;color:${d.mutedColor}">${s.label}</div>
    </div>`).join("")}
  </div>
</section>`,
  },

  // ── STT-08  Horizontal Ticker ─────────────────────────────────────────────
  {
    id: "stats-08",
    name: "Stats Ticker",
    section: "stats",
    industries: ["ecommerce", "media", "startup"],
    themeStyles: ["bold", "dark"],
    generate: (d) => `
<section style="background:${d.primaryColor};padding:36px 0;font-family:${d.bodyFont};overflow:hidden">
  <div style="display:flex;gap:0">
    ${Array(3).fill(0).map(()=>
      d.stats.slice(0,4).map(s=>
        `<div style="display:inline-flex;align-items:center;gap:8px;padding:0 48px;white-space:nowrap">
          <span style="font-family:${d.headingFont};font-size:24px;font-weight:900;color:#fff">${s.value}</span>
          <span style="font-size:13px;color:rgba(255,255,255,.8);font-weight:500">${s.label}</span>
          <span style="color:rgba(255,255,255,.4);font-size:20px;margin-left:16px">•</span>
        </div>`
      ).join("")
    ).join("")}
  </div>
</section>`,
  },

  // ── STT-09  Stats with Image ───────────────────────────────────────────────
  {
    id: "stats-09",
    name: "Stats With Visual",
    section: "stats",
    industries: ["realestate", "travel", "fitness"],
    themeStyles: ["elegant", "modern"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
    <div>
      ${d.images[2]||d.images[0] ? `<img src="${d.images[2]||d.images[0]}" style="width:100%;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.1);object-fit:cover;aspect-ratio:4/3">` : `<div style="background:${d.primaryColor}12;border-radius:16px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center"><span style="font-size:80px">📊</span></div>`}
    </div>
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0 0 40px">Our Growth Story</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
        ${d.stats.slice(0,4).map(s=>`
        <div>
          <div style="font-family:${d.headingFont};font-size:clamp(26px,2.5vw,40px);font-weight:900;color:${d.primaryColor};margin-bottom:6px">${s.value}</div>
          <div style="font-size:13px;color:${d.mutedColor};line-height:1.5">${s.label}</div>
        </div>`).join("")}
      </div>
    </div>
  </div>
</section>`,
  },

  // ── STT-10  Minimal Inline Stats ──────────────────────────────────────────
  {
    id: "stats-10",
    name: "Inline Accent",
    section: "stats",
    industries: ["consulting", "general", "nonprofit"],
    themeStyles: ["minimal", "classic"],
    generate: (d) => `
<section style="background:${d.primaryColor}06;padding:56px 0;font-family:${d.bodyFont}">
  <div style="max-width:960px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-around;align-items:center;gap:32px;flex-wrap:wrap">
    ${d.stats.slice(0,4).map(s=>`
    <div style="text-align:center;padding:20px 32px">
      <div style="font-family:${d.headingFont};font-size:clamp(28px,2.5vw,42px);font-weight:900;color:${d.primaryColor}">${s.value}</div>
      <div style="font-size:13px;color:${d.mutedColor};margin-top:6px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">${s.label}</div>
    </div>`).join("")}
  </div>
</section>`,
  },
];
