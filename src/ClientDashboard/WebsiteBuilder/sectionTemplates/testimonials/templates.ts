import type { SectionTemplate, WebsiteTemplateData } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

const stars = (n = 5) => "★".repeat(n) + "☆".repeat(5 - n);

export const testimonialsTemplates: SectionTemplate[] = [

  // ── TST-01  3-Col Card Grid ────────────────────────────────────────────────
  {
    id: "testimonials-01",
    name: "Card Grid",
    section: "testimonials",
    industries: ["saas", "ecommerce", "startup", "general"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<section style="background:#f8fafc;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 14px">What Our Clients Say</h2>
      <p style="font-size:16px;color:${d.mutedColor}">Don't take our word for it — hear from our happy customers.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px">
      ${d.testimonials.slice(0,3).map(t=>`
      <div style="background:#fff;border-radius:16px;padding:36px 28px;box-shadow:0 4px 24px rgba(0,0,0,.06);border:1px solid #f1f5f9">
        <div style="color:${d.accentColor};font-size:18px;margin-bottom:16px">${stars(t.rating||5)}</div>
        <p style="font-size:15px;color:${d.textColor};line-height:1.8;margin:0 0 24px;font-style:italic">"${t.text}"</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;background:${d.primaryColor}20;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:${d.primaryColor}">${t.name[0]}</div>
          <div>
            <div style="font-weight:700;font-size:14px;color:${d.textColor}">${t.name}</div>
            <div style="font-size:12px;color:${d.mutedColor}">${t.role}${t.company?`, ${t.company}`:""}</div>
          </div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── TST-02  Dark Featured Quote ────────────────────────────────────────────
  {
    id: "testimonials-02",
    name: "Dark Featured Quote",
    section: "testimonials",
    industries: ["agency", "media", "consulting"],
    themeStyles: ["dark", "bold", "creative"],
    generate: (d) => `
<section style="background:#0f172a;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1000px;margin:0 auto;padding:0 24px;text-align:center">
    <div style="font-size:80px;color:${d.primaryColor};line-height:1;margin-bottom:24px;font-family:Georgia,serif">"</div>
    <p style="font-size:clamp(18px,2vw,26px);color:#f1f5f9;line-height:1.7;margin:0 0 40px;font-style:italic">${d.testimonials[0]?.text||"Working with them transformed our business completely."}</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:16px">
      <div style="width:56px;height:56px;background:${d.primaryColor}28;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;color:${d.primaryColor};font-weight:700">${(d.testimonials[0]?.name||"C")[0]}</div>
      <div style="text-align:left">
        <div style="font-weight:700;font-size:16px;color:#fff">${d.testimonials[0]?.name||"Client Name"}</div>
        <div style="font-size:13px;color:#94a3b8">${d.testimonials[0]?.role||"CEO"}</div>
      </div>
    </div>
    <div style="display:flex;gap:16px;justify-content:center;margin-top:56px">
      ${d.testimonials.slice(1,4).map(t=>`
      <div style="background:#1e293b;border-radius:12px;padding:24px;text-align:left;flex:1;max-width:260px;border:1px solid #334155">
        <p style="font-size:13px;color:#94a3b8;line-height:1.7;margin:0 0 16px;font-style:italic">"${t.text}"</p>
        <div style="font-size:13px;font-weight:600;color:#e2e8f0">${t.name}</div>
        <div style="font-size:11px;color:#64748b">${t.role}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── TST-03  Horizontal Scroll ─────────────────────────────────────────────
  {
    id: "testimonials-03",
    name: "Horizontal Scroll",
    section: "testimonials",
    industries: ["fitness", "beauty", "ecommerce"],
    themeStyles: ["modern", "bold", "playful"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont};overflow:hidden">
  <div style="text-align:center;margin-bottom:48px;padding:0 24px">
    <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0">Loved by Thousands</h2>
  </div>
  <div style="display:flex;gap:24px;padding:8px 24px 24px;overflow-x:auto;scrollbar-width:none">
    ${d.testimonials.slice(0,5).map(t=>`
    <div style="min-width:320px;max-width:320px;background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 24px rgba(0,0,0,.07);flex-shrink:0;border:1px solid #f1f5f9">
      <div style="color:${d.accentColor};font-size:16px;margin-bottom:12px">${stars(t.rating||5)}</div>
      <p style="font-size:14px;color:${d.textColor};line-height:1.7;margin:0 0 20px;font-style:italic">"${t.text}"</p>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:40px;height:40px;background:${d.primaryColor}20;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:${d.primaryColor}">${t.name[0]}</div>
        <div>
          <div style="font-weight:700;font-size:13px;color:${d.textColor}">${t.name}</div>
          <div style="font-size:11px;color:${d.mutedColor}">${t.role}</div>
        </div>
      </div>
    </div>`).join("")}
  </div>
</section>`,
  },

  // ── TST-04  Gradient Background ────────────────────────────────────────────
  {
    id: "testimonials-04",
    name: "Gradient Testimonials",
    section: "testimonials",
    industries: ["saas", "startup", "education"],
    themeStyles: ["bold", "modern"],
    generate: (d) => `
<section style="background:linear-gradient(135deg,${d.primaryColor} 0%,${d.accentColor} 100%);padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:800;color:#fff;margin:0">Trusted by Industry Leaders</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${d.testimonials.slice(0,3).map(t=>`
      <div style="background:rgba(255,255,255,.15);backdrop-filter:blur(10px);border-radius:16px;padding:36px 28px;border:1px solid rgba(255,255,255,.25)">
        <p style="font-size:15px;color:#fff;line-height:1.8;margin:0 0 24px;font-style:italic">"${t.text}"</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;background:rgba(255,255,255,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff">${t.name[0]}</div>
          <div>
            <div style="font-weight:700;font-size:14px;color:#fff">${t.name}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.75)">${t.role}</div>
          </div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── TST-05  Review with Logo Bar ──────────────────────────────────────────
  {
    id: "testimonials-05",
    name: "Logos + Review",
    section: "testimonials",
    industries: ["saas", "consulting", "agency"],
    themeStyles: ["minimal", "corporate"],
    generate: (d) => `
<section style="background:#fff;padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;text-align:center">
    <div style="display:flex;gap:40px;justify-content:center;align-items:center;margin-bottom:64px;flex-wrap:wrap">
      ${["Google","Microsoft","Slack","Stripe","Notion"].map(c=>`<span style="font-size:14px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase">${c}</span>`).join("")}
    </div>
    <div style="max-width:720px;margin:0 auto">
      <div style="color:${d.accentColor};font-size:24px;margin-bottom:20px">${stars(5)}</div>
      <p style="font-size:22px;color:${d.textColor};line-height:1.7;margin:0 0 32px;font-style:italic">"${d.testimonials[0]?.text||"This product is exceptional. It completely changed how we work."}"</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:14px">
        <div style="width:52px;height:52px;background:${d.primaryColor}20;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:${d.primaryColor}">${(d.testimonials[0]?.name||"C")[0]}</div>
        <div style="text-align:left">
          <div style="font-weight:700;font-size:16px;color:${d.textColor}">${d.testimonials[0]?.name||"Client"}</div>
          <div style="font-size:13px;color:${d.mutedColor}">${d.testimonials[0]?.role||"CEO"}</div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  // ── TST-06  Video Testimonial Layout ──────────────────────────────────────
  {
    id: "testimonials-06",
    name: "Video Style",
    section: "testimonials",
    industries: ["fitness", "education", "ecommerce"],
    themeStyles: ["modern", "bold"],
    generate: (d) => `
<section style="background:#f8fafc;padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0">Real Results</h2>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:24px">
      <div style="background:${d.primaryColor};border-radius:20px;padding:44px;position:relative;overflow:hidden">
        <div style="font-size:50px;color:rgba(255,255,255,.3);position:absolute;top:20px;right:28px;font-family:Georgia,serif">"</div>
        <p style="font-size:18px;color:#fff;line-height:1.8;margin:0 0 32px">"${d.testimonials[0]?.text||"An incredible experience from start to finish."}"</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:48px;height:48px;background:rgba(255,255,255,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff">${(d.testimonials[0]?.name||"C")[0]}</div>
          <div>
            <div style="font-weight:700;font-size:14px;color:#fff">${d.testimonials[0]?.name||"Customer"}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.75)">${d.testimonials[0]?.role||"Client"}</div>
          </div>
        </div>
      </div>
      ${d.testimonials.slice(1,3).map(t=>`
      <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #e5e7eb">
        <div style="color:${d.accentColor};font-size:14px;margin-bottom:14px">${stars(t.rating||5)}</div>
        <p style="font-size:14px;color:${d.textColor};line-height:1.7;margin:0 0 20px;font-style:italic">"${t.text}"</p>
        <div style="font-weight:700;font-size:13px;color:${d.textColor}">${t.name}</div>
        <div style="font-size:11px;color:${d.mutedColor}">${t.role}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── TST-07  Restaurant / Hospitality ──────────────────────────────────────
  {
    id: "testimonials-07",
    name: "Dining Reviews",
    section: "testimonials",
    industries: ["restaurant", "travel", "beauty"],
    themeStyles: ["elegant", "luxury"],
    generate: (d) => `
<section style="background:#faf7f4;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;text-align:center">
    <p style="color:${d.primaryColor};font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-weight:600">Guest Reviews</p>
    <h2 style="font-family:Georgia,serif;font-size:clamp(28px,3vw,44px);font-weight:400;color:#3d2b1f;margin:0 0 48px">What Our Guests Say</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
      ${d.testimonials.slice(0,3).map(t=>`
      <div style="padding:36px;border:1px solid #e8ddd5;border-radius:4px;text-align:left">
        <div style="color:#c9a96e;font-size:18px;margin-bottom:20px">${stars(t.rating||5)}</div>
        <p style="font-size:15px;color:#5c4d3c;line-height:1.85;margin:0 0 24px;font-style:italic">"${t.text}"</p>
        <div style="border-top:1px solid #e8ddd5;padding-top:20px">
          <div style="font-weight:600;font-size:14px;color:#3d2b1f">${t.name}</div>
          <div style="font-size:12px;color:#8c7b6e">${t.role}</div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── TST-08  Single Large Quote ─────────────────────────────────────────────
  {
    id: "testimonials-08",
    name: "Single Large Quote",
    section: "testimonials",
    industries: ["consulting", "legal", "finance"],
    themeStyles: ["minimal", "classic", "corporate"],
    generate: (d) => `
<section style="background:${d.primaryColor}06;padding:100px 24px;font-family:${d.bodyFont};text-align:center">
  <div style="max-width:800px;margin:0 auto">
    <div style="font-size:72px;color:${d.primaryColor};line-height:0.8;margin-bottom:32px;font-family:Georgia,serif">&ldquo;</div>
    <p style="font-size:clamp(20px,2vw,28px);color:${d.textColor};line-height:1.6;margin:0 0 40px;font-weight:400">${d.testimonials[0]?.text||"Their expertise and dedication exceeded our expectations."}</p>
    <div style="width:60px;height:2px;background:${d.primaryColor};margin:0 auto 32px;border-radius:1px"></div>
    <div style="font-weight:700;font-size:16px;color:${d.textColor};margin-bottom:4px">${d.testimonials[0]?.name||"Client Name"}</div>
    <div style="font-size:13px;color:${d.mutedColor}">${d.testimonials[0]?.role||"CEO"}</div>
  </div>
</section>`,
  },

  // ── TST-09  Photo Testimonials ─────────────────────────────────────────────
  {
    id: "testimonials-09",
    name: "Photo Card Testimonials",
    section: "testimonials",
    industries: ["healthcare", "fitness", "education"],
    themeStyles: ["modern", "minimal"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0">Success Stories</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      ${d.testimonials.slice(0,4).map(t=>`
      <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.07);border:1px solid #f1f5f9">
        <div style="background:${d.primaryColor}12;height:120px;display:flex;align-items:center;justify-content:center">
          <div style="width:72px;height:72px;background:${d.primaryColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff">${t.name[0]}</div>
        </div>
        <div style="padding:20px">
          <div style="color:${d.accentColor};font-size:12px;margin-bottom:10px">${stars(t.rating||5)}</div>
          <p style="font-size:13px;color:${d.textColor};line-height:1.7;margin:0 0 14px;font-style:italic">"${t.text.slice(0,120)}${t.text.length>120?'...':''}"</p>
          <div style="font-weight:700;font-size:13px;color:${d.textColor}">${t.name}</div>
          <div style="font-size:11px;color:${d.mutedColor}">${t.role}</div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── TST-10  Case Study Style ───────────────────────────────────────────────
  {
    id: "testimonials-10",
    name: "Case Study Style",
    section: "testimonials",
    industries: ["agency", "saas", "manufacturing"],
    themeStyles: ["corporate", "modern"],
    generate: (d) => `
<section style="background:#f8fafc;padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0">Client Success Stories</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:28px">
      ${d.testimonials.slice(0,4).map(t=>`
      <div style="background:#fff;border-radius:12px;padding:36px;border:1px solid #e5e7eb;display:flex;gap:24px">
        <div style="flex-shrink:0">
          <div style="width:56px;height:56px;background:${d.primaryColor}16;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:${d.primaryColor}">${t.name[0]}</div>
        </div>
        <div>
          <div style="color:${d.accentColor};font-size:14px;margin-bottom:10px">${stars(t.rating||5)}</div>
          <p style="font-size:14px;color:${d.textColor};line-height:1.75;margin:0 0 16px;font-style:italic">"${t.text}"</p>
          <div style="font-weight:700;font-size:14px;color:${d.textColor}">${t.name}</div>
          <div style="font-size:12px;color:${d.mutedColor}">${t.role}${t.company?` · ${t.company}`:""}</div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },
];
