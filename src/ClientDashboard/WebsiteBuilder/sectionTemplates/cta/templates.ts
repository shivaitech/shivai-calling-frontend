import type { SectionTemplate, WebsiteTemplateData } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// CTA SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

export const ctaTemplates: SectionTemplate[] = [

  // ── CTA-01  Centered Gradient Band ────────────────────────────────────────
  {
    id: "cta-01",
    name: "Gradient Band",
    section: "cta",
    industries: ["saas", "startup", "agency", "general"],
    themeStyles: ["bold", "modern", "playful"],
    generate: (d) => `
<section style="background:linear-gradient(135deg,${d.primaryColor} 0%,${d.accentColor} 100%);padding:96px 24px;text-align:center;font-family:${d.bodyFont}">
  <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,48px);font-weight:900;color:#fff;margin:0 0 16px;max-width:700px;margin-left:auto;margin-right:auto">${d.heroHeadline}</h2>
  <p style="font-size:18px;color:rgba(255,255,255,.88);margin:0 0 40px;max-width:500px;margin-left:auto;margin-right:auto">${d.tagline}</p>
  <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
    <a href="${d.ctaLink}" style="background:#fff;color:${d.primaryColor};padding:15px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">${d.ctaText}</a>
    ${d.ctaSecondaryText ? `<a href="#contact" style="background:transparent;border:2px solid rgba(255,255,255,.8);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">${d.ctaSecondaryText}</a>` : ""}
  </div>
</section>`,
  },

  // ── CTA-02  Dark Split CTA ─────────────────────────────────────────────────
  {
    id: "cta-02",
    name: "Dark Split",
    section: "cta",
    industries: ["agency", "media", "saas"],
    themeStyles: ["dark", "bold", "creative"],
    generate: (d) => `
<section style="background:#0f172a;padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:center;gap:40px;flex-wrap:wrap">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,2.5vw,38px);font-weight:800;color:#fff;margin:0 0 10px">${d.heroHeadline}</h2>
      <p style="font-size:16px;color:#94a3b8;margin:0">${d.tagline}</p>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap">
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">${d.ctaText}</a>
      ${d.ctaSecondaryText ? `<a href="#contact" style="border:1.5px solid #475569;color:#cbd5e1;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaSecondaryText}</a>` : ""}
    </div>
  </div>
</section>`,
  },

  // ── CTA-03  Soft bg with icon ──────────────────────────────────────────────
  {
    id: "cta-03",
    name: "Soft Light CTA",
    section: "cta",
    industries: ["healthcare", "education", "nonprofit"],
    themeStyles: ["minimal", "corporate", "classic"],
    generate: (d) => `
<section style="background:${d.primaryColor}08;padding:96px 24px;text-align:center;font-family:${d.bodyFont};border-top:1px solid ${d.primaryColor}20;border-bottom:1px solid ${d.primaryColor}20">
  <div style="max-width:640px;margin:0 auto">
    <div style="width:72px;height:72px;background:${d.primaryColor}18;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px">🤝</div>
    <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:700;color:${d.textColor};margin:0 0 16px">${d.heroHeadline}</h2>
    <p style="font-size:17px;color:${d.mutedColor};line-height:1.7;margin:0 0 36px">${d.tagline}</p>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">${d.ctaText}</a>
      ${d.phone ? `<a href="tel:${d.phone}" style="background:#fff;color:${d.textColor};border:1.5px solid #e5e7eb;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">📞 Call Us</a>` : ""}
    </div>
  </div>
</section>`,
  },

  // ── CTA-04  Testimonial + CTA Combo ───────────────────────────────────────
  {
    id: "cta-04",
    name: "Social Proof CTA",
    section: "cta",
    industries: ["ecommerce", "fitness", "beauty", "saas"],
    themeStyles: ["modern", "bold"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:900px;margin:0 auto;padding:0 24px;text-align:center">
    ${d.testimonials[0] ? `
    <div style="margin-bottom:40px">
      <p style="font-size:22px;color:${d.textColor};font-style:italic;line-height:1.6;margin:0 0 16px">"${d.testimonials[0].text}"</p>
      <p style="font-size:14px;color:${d.mutedColor};font-weight:600">— ${d.testimonials[0].name}, ${d.testimonials[0].role}</p>
    </div>` : ""}
    <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:0 0 16px">${d.heroHeadline}</h2>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:15px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">${d.ctaText}</a>
      ${d.ctaSecondaryText ? `<a href="#features" style="background:#f1f5f9;color:${d.textColor};padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">${d.ctaSecondaryText}</a>` : ""}
    </div>
  </div>
</section>`,
  },

  // ── CTA-05  Restaurant Reservation ────────────────────────────────────────
  {
    id: "cta-05",
    name: "Reservation CTA",
    section: "cta",
    industries: ["restaurant", "travel", "beauty"],
    themeStyles: ["elegant", "luxury"],
    generate: (d) => `
<section style="background:${d.primaryColor};padding:80px 24px;text-align:center;font-family:${d.bodyFont}">
  <p style="color:rgba(255,255,255,.75);font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">Make a Reservation</p>
  <h2 style="font-family:Georgia,serif;font-size:clamp(28px,3vw,46px);font-weight:400;color:#fff;margin:0 0 20px">${d.heroHeadline}</h2>
  <p style="font-size:16px;color:rgba(255,255,255,.85);margin:0 0 40px;max-width:460px;margin-left:auto;margin-right:auto">${d.tagline}</p>
  <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
    <a href="${d.ctaLink}" style="background:#fff;color:${d.primaryColor};padding:15px 40px;border-radius:4px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.5px">Reserve a Table</a>
    ${d.phone ? `<a href="tel:${d.phone}" style="background:transparent;border:2px solid rgba(255,255,255,.7);color:#fff;padding:14px 36px;border-radius:4px;text-decoration:none;font-weight:600;font-size:16px">📞 ${d.phone}</a>` : ""}
  </div>
</section>`,
  },

  // ── CTA-06  Real Estate Lead Form ─────────────────────────────────────────
  {
    id: "cta-06",
    name: "Lead Capture Form",
    section: "cta",
    industries: ["realestate", "construction", "legal"],
    themeStyles: ["corporate", "modern"],
    generate: (d) => `
<section style="background:#1e293b;padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1000px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,2.5vw,38px);font-weight:800;color:#fff;margin:0 0 16px">${d.heroHeadline}</h2>
      <p style="font-size:16px;color:#94a3b8;line-height:1.7;margin:0">${d.tagline}</p>
    </div>
    <form style="display:flex;flex-direction:column;gap:12px">
      <input type="text" placeholder="Your Name" style="background:#334155;border:1px solid #475569;color:#fff;padding:13px 16px;border-radius:8px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#475569'">
      <input type="email" placeholder="Email Address" style="background:#334155;border:1px solid #475569;color:#fff;padding:13px 16px;border-radius:8px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#475569'">
      <input type="tel" placeholder="Phone Number" style="background:#334155;border:1px solid #475569;color:#fff;padding:13px 16px;border-radius:8px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#475569'">
      <button type="submit" style="background:${d.primaryColor};color:#fff;padding:14px;border-radius:8px;border:none;font-weight:700;font-size:15px;cursor:pointer">${d.ctaText}</button>
    </form>
  </div>
</section>`,
  },

  // ── CTA-07  Countdown / Urgency ───────────────────────────────────────────
  {
    id: "cta-07",
    name: "Urgency Countdown",
    section: "cta",
    industries: ["ecommerce", "fitness", "startup", "media"],
    themeStyles: ["bold", "playful"],
    generate: (d) => `
<section style="background:${d.accentColor};padding:80px 24px;text-align:center;font-family:${d.bodyFont}">
  <span style="display:inline-block;background:rgba(0,0,0,.15);color:#fff;padding:4px 14px;border-radius:50px;font-size:12px;font-weight:700;margin-bottom:20px;text-transform:uppercase;letter-spacing:1px">🔥 Limited Time Offer</span>
  <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3.5vw,52px);font-weight:900;color:#fff;margin:0 0 16px">${d.heroHeadline}</h2>
  <p style="font-size:17px;color:rgba(255,255,255,.9);margin:0 0 40px">${d.tagline}</p>
  <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
    <a href="${d.ctaLink}" style="background:#fff;color:${d.accentColor};padding:15px 40px;border-radius:50px;text-decoration:none;font-weight:800;font-size:16px">${d.ctaText}</a>
  </div>
</section>`,
  },

  // ── CTA-08  Newsletter Signup ──────────────────────────────────────────────
  {
    id: "cta-08",
    name: "Newsletter Signup",
    section: "cta",
    industries: ["media", "education", "nonprofit", "consulting"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<section style="background:#f8fafc;padding:80px 24px;text-align:center;font-family:${d.bodyFont};border-top:1px solid #e5e7eb">
  <div style="max-width:520px;margin:0 auto">
    <h2 style="font-family:${d.headingFont};font-size:clamp(24px,2.5vw,36px);font-weight:800;color:${d.textColor};margin:0 0 12px">Stay in the Loop</h2>
    <p style="font-size:16px;color:${d.mutedColor};margin:0 0 32px">Get the latest updates from ${d.businessName} delivered to your inbox.</p>
    <form style="display:flex;gap:0;max-width:440px;margin:0 auto">
      <input type="email" placeholder="Enter your email" style="flex:1;border:1.5px solid #e5e7eb;border-right:none;padding:13px 16px;border-radius:8px 0 0 8px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
      <button type="submit" style="background:${d.primaryColor};color:#fff;padding:13px 24px;border:none;border-radius:0 8px 8px 0;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap">Subscribe</button>
    </form>
    <p style="font-size:12px;color:${d.mutedColor};margin:12px 0 0">No spam, unsubscribe any time.</p>
  </div>
</section>`,
  },

  // ── CTA-09  App Download Banner ────────────────────────────────────────────
  {
    id: "cta-09",
    name: "App Download",
    section: "cta",
    industries: ["saas", "fitness", "ecommerce", "startup"],
    themeStyles: ["modern", "bold", "dark"],
    generate: (d) => `
<section style="background:linear-gradient(135deg,#0f172a 0%,${d.primaryColor}99 100%);padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1000px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:40px;flex-wrap:wrap">
    <div style="flex:1;min-width:280px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:#fff;margin:0 0 12px">${d.heroHeadline}</h2>
      <p style="font-size:16px;color:#94a3b8;margin:0 0 32px">${d.tagline}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <a href="${d.ctaLink}" style="display:flex;align-items:center;gap:10px;background:#fff;color:#111;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">📱 App Store</a>
        <a href="${d.ctaLink}" style="display:flex;align-items:center;gap:10px;background:#fff;color:#111;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">🤖 Google Play</a>
      </div>
    </div>
    <div style="font-size:120px;opacity:.8">📱</div>
  </div>
</section>`,
  },

  // ── CTA-10  Contact Us CTA ────────────────────────────────────────────────
  {
    id: "cta-10",
    name: "Contact Prompt",
    section: "cta",
    industries: ["consulting", "legal", "finance", "healthcare", "general"],
    themeStyles: ["corporate", "minimal", "classic"],
    generate: (d) => `
<section style="background:${d.primaryColor};padding:80px 24px;font-family:${d.bodyFont}">
  <div style="max-width:900px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:40px;flex-wrap:wrap">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(24px,2.5vw,38px);font-weight:800;color:#fff;margin:0 0 10px">${d.heroHeadline}</h2>
      <p style="font-size:16px;color:rgba(255,255,255,.85);margin:0">Ready to get started? We'd love to hear from you.</p>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap">
      <a href="#contact" style="background:#fff;color:${d.primaryColor};padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Contact Us</a>
      ${d.phone ? `<a href="tel:${d.phone}" style="background:rgba(255,255,255,.2);color:#fff;border:1.5px solid rgba(255,255,255,.6);padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">📞 ${d.phone}</a>` : ""}
    </div>
  </div>
</section>`,
  },
];
