import type { SectionTemplate } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// PRICING SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

export const pricingTemplates: SectionTemplate[] = [

  // ── PRC-01  3-Col Cards ────────────────────────────────────────────────────
  {
    id: "pricing-01",
    name: "3-Col Standard",
    section: "pricing",
    industries: ["saas", "startup", "consulting", "general"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:0 0 14px">Simple, Transparent Pricing</h2>
      <p style="font-size:16px;color:${d.mutedColor}">Choose the plan that fits your needs. No hidden fees.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${d.pricingPlans.slice(0,3).map(p=>`
      <div style="background:${p.highlighted?d.primaryColor:'#fff'};border-radius:16px;padding:40px 32px;border:${p.highlighted?'none':'1px solid #e5e7eb'};box-shadow:${p.highlighted?'0 20px 60px '+d.primaryColor+'40':'0 4px 20px rgba(0,0,0,.05)'};position:relative;${p.highlighted?'transform:scale(1.04)':''}">
        ${p.highlighted?`<span style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#fff;color:${d.primaryColor};padding:4px 16px;border-radius:50px;font-size:12px;font-weight:700;white-space:nowrap">MOST POPULAR</span>`:""}
        <h3 style="font-family:${d.headingFont};font-size:18px;font-weight:700;color:${p.highlighted?'rgba(255,255,255,0.9)':d.mutedColor};margin:0 0 16px;text-transform:uppercase;letter-spacing:1px">${p.name}</h3>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:8px">
          <span style="font-family:${d.headingFont};font-size:44px;font-weight:900;color:${p.highlighted?'#fff':d.textColor}">${p.price}</span>
          <span style="font-size:14px;color:${p.highlighted?'rgba(255,255,255,0.7)':d.mutedColor}">${p.period||"/month"}</span>
        </div>
        ${p.description?`<p style="font-size:13px;color:${p.highlighted?'rgba(255,255,255,0.75)':d.mutedColor};margin:0 0 28px">${p.description}</p>`:'<div style="margin-bottom:28px"></div>'}
        <ul style="list-style:none;padding:0;margin:0 0 32px;display:flex;flex-direction:column;gap:12px">
          ${p.features.map(f=>`<li style="display:flex;align-items:center;gap:10px;font-size:14px;color:${p.highlighted?'rgba(255,255,255,0.9)':d.textColor}"><span style="color:${p.highlighted?'#fff':d.primaryColor}">✓</span>${f}</li>`).join("")}
        </ul>
        <a href="${d.ctaLink}" style="display:block;text-align:center;background:${p.highlighted?'#fff':d.primaryColor};color:${p.highlighted?d.primaryColor:'#fff'};padding:13px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">${p.ctaText||d.ctaText}</a>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── PRC-02  Dark Pricing ───────────────────────────────────────────────────
  {
    id: "pricing-02",
    name: "Dark Pricing",
    section: "pricing",
    industries: ["agency", "media", "saas"],
    themeStyles: ["dark", "bold"],
    generate: (d) => `
<section style="background:#0f172a;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:#fff;margin:0 0 14px">Choose Your Plan</h2>
      <p style="font-size:16px;color:#94a3b8">Scale as you grow</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${d.pricingPlans.slice(0,3).map(p=>`
      <div style="background:${p.highlighted?`linear-gradient(135deg,${d.primaryColor},${d.accentColor})`:'#1e293b'};border-radius:16px;padding:36px 28px;border:${p.highlighted?'none':'1px solid #334155'}">
        <h3 style="font-size:14px;font-weight:600;color:${p.highlighted?'rgba(255,255,255,0.85)':'#94a3b8'};margin:0 0 12px;text-transform:uppercase;letter-spacing:1px">${p.name}</h3>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:24px">
          <span style="font-family:${d.headingFont};font-size:42px;font-weight:900;color:#fff">${p.price}</span>
          <span style="font-size:13px;color:${p.highlighted?'rgba(255,255,255,0.7)':'#64748b'}">${p.period||"/mo"}</span>
        </div>
        <ul style="list-style:none;padding:0;margin:0 0 28px;display:flex;flex-direction:column;gap:10px">
          ${p.features.map(f=>`<li style="display:flex;align-items:center;gap:10px;font-size:13px;color:${p.highlighted?'rgba(255,255,255,0.9)':'#cbd5e1'}"><span style="color:${p.highlighted?'#fff':d.primaryColor}">✓</span>${f}</li>`).join("")}
        </ul>
        <a href="${d.ctaLink}" style="display:block;text-align:center;background:${p.highlighted?'rgba(255,255,255,0.2)':d.primaryColor};color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;border:${p.highlighted?'1.5px solid rgba(255,255,255,0.5)':'none'}">${p.ctaText||d.ctaText}</a>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── PRC-03  Horizontal Table ───────────────────────────────────────────────
  {
    id: "pricing-03",
    name: "Comparison Table",
    section: "pricing",
    industries: ["saas", "consulting", "finance"],
    themeStyles: ["minimal", "corporate"],
    generate: (d) => `
<section style="background:#f8fafc;padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1000px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0">Compare Plans</h2>
    </div>
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);border:1px solid #e5e7eb">
      <div style="display:grid;grid-template-columns:2fr ${d.pricingPlans.slice(0,3).map(()=>'1fr').join(' ')};background:${d.primaryColor};padding:20px 24px">
        <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,.7)">Features</div>
        ${d.pricingPlans.slice(0,3).map(p=>`<div style="text-align:center"><div style="font-weight:700;color:#fff;font-size:15px">${p.name}</div><div style="font-family:${d.headingFont};font-size:22px;font-weight:900;color:#fff">${p.price}</div></div>`).join("")}
      </div>
      ${d.pricingPlans[0]?.features.map((f,i)=>`
      <div style="display:grid;grid-template-columns:2fr ${d.pricingPlans.slice(0,3).map(()=>'1fr').join(' ')};padding:16px 24px;background:${i%2===0?'#fff':'#f8fafc'};align-items:center">
        <div style="font-size:14px;color:${d.textColor};font-weight:500">${f}</div>
        ${d.pricingPlans.slice(0,3).map(p=>`<div style="text-align:center;font-size:16px">${p.features[i]?'✓':'—'}</div>`).join("")}
      </div>`).join("")||""}
      <div style="display:grid;grid-template-columns:2fr ${d.pricingPlans.slice(0,3).map(()=>'1fr').join(' ')};padding:24px;background:#f8fafc;border-top:1px solid #e5e7eb">
        <div></div>
        ${d.pricingPlans.slice(0,3).map(p=>`<div style="text-align:center"><a href="${d.ctaLink}" style="display:inline-block;background:${p.highlighted?d.primaryColor:'transparent'};color:${p.highlighted?'#fff':d.primaryColor};border:1.5px solid ${d.primaryColor};padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">${p.ctaText||d.ctaText}</a></div>`).join("")}
      </div>
    </div>
  </div>
</section>`,
  },

  // ── PRC-04  Single Plan Focus ─────────────────────────────────────────────
  {
    id: "pricing-04",
    name: "Single Plan Hero",
    section: "pricing",
    industries: ["restaurant", "beauty", "fitness"],
    themeStyles: ["elegant", "modern", "bold"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:80px 24px;text-align:center;font-family:${d.bodyFont}">
  <div style="max-width:560px;margin:0 auto">
    <span style="color:${d.primaryColor};font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Pricing</span>
    <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:12px 0 48px">One Plan, Everything Included</h2>
    <div style="background:linear-gradient(135deg,${d.primaryColor} 0%,${d.accentColor} 100%);border-radius:24px;padding:52px 44px">
      <div style="font-family:${d.headingFont};font-size:60px;font-weight:900;color:#fff">${d.pricingPlans[0]?.price||"$99"}</div>
      <div style="font-size:16px;color:rgba(255,255,255,.75);margin-bottom:36px">${d.pricingPlans[0]?.period||"per month"}</div>
      <ul style="list-style:none;padding:0;margin:0 0 36px;text-align:left;display:flex;flex-direction:column;gap:14px">
        ${(d.pricingPlans[0]?.features||[]).map(f=>`<li style="display:flex;align-items:center;gap:12px;font-size:15px;color:rgba(255,255,255,.92)"><span style="font-size:18px">✓</span>${f}</li>`).join("")}
      </ul>
      <a href="${d.ctaLink}" style="display:block;background:#fff;color:${d.primaryColor};padding:15px;border-radius:10px;text-decoration:none;font-weight:800;font-size:16px">${d.ctaText}</a>
    </div>
  </div>
</section>`,
  },

  // ── PRC-05  Toggle Monthly/Yearly ─────────────────────────────────────────
  {
    id: "pricing-05",
    name: "Billing Toggle",
    section: "pricing",
    industries: ["saas", "startup", "media"],
    themeStyles: ["modern", "minimal"],
    generate: (d) => `
<section style="background:#f8fafc;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:0 0 28px">Flexible Pricing</h2>
      <div style="display:inline-flex;align-items:center;gap:0;background:#e5e7eb;border-radius:50px;padding:4px">
        <button style="background:#fff;border:none;border-radius:50px;padding:8px 24px;font-size:14px;font-weight:600;cursor:pointer;color:${d.textColor}">Monthly</button>
        <button style="background:transparent;border:none;padding:8px 24px;font-size:14px;cursor:pointer;color:${d.mutedColor}">Yearly <span style="background:${d.accentColor};color:#fff;font-size:10px;padding:2px 6px;border-radius:50px">-20%</span></button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${d.pricingPlans.slice(0,3).map(p=>`
      <div style="background:#fff;border-radius:16px;padding:36px 28px;border:${p.highlighted?`2px solid ${d.primaryColor}`:'1px solid #e5e7eb'};box-shadow:${p.highlighted?'0 16px 48px '+d.primaryColor+'30':'none'}">
        <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:0 0 20px">${p.name}</h3>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:28px">
          <span style="font-family:${d.headingFont};font-size:40px;font-weight:900;color:${d.primaryColor}">${p.price}</span>
          <span style="font-size:13px;color:${d.mutedColor}">${p.period||"/mo"}</span>
        </div>
        <ul style="list-style:none;padding:0;margin:0 0 28px;display:flex;flex-direction:column;gap:11px">
          ${p.features.map(f=>`<li style="display:flex;align-items:center;gap:10px;font-size:14px;color:${d.textColor}"><span style="color:${d.primaryColor};font-size:16px">✓</span>${f}</li>`).join("")}
        </ul>
        <a href="${d.ctaLink}" style="display:block;text-align:center;background:${p.highlighted?d.primaryColor:'transparent'};color:${p.highlighted?'#fff':d.primaryColor};border:1.5px solid ${d.primaryColor};padding:12px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">${p.ctaText||d.ctaText}</a>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── PRC-06  Free + Premium ─────────────────────────────────────────────────
  {
    id: "pricing-06",
    name: "Free + Premium",
    section: "pricing",
    industries: ["saas", "education", "media"],
    themeStyles: ["modern", "bold"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:860px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:24px">
    <div style="background:#f8fafc;border-radius:20px;padding:40px;border:1px solid #e5e7eb">
      <span style="display:inline-block;background:#e5e7eb;color:#6b7280;padding:4px 12px;border-radius:50px;font-size:12px;font-weight:600;margin-bottom:16px">FREE</span>
      <h3 style="font-family:${d.headingFont};font-size:20px;font-weight:700;color:${d.textColor};margin:0 0 8px">${d.pricingPlans[0]?.name||"Starter"}</h3>
      <div style="font-family:${d.headingFont};font-size:36px;font-weight:900;color:${d.textColor};margin-bottom:24px">${d.pricingPlans[0]?.price||"$0"}<span style="font-size:14px;color:${d.mutedColor};font-weight:400">${d.pricingPlans[0]?.period||"/mo"}</span></div>
      <ul style="list-style:none;padding:0;margin:0 0 28px;display:flex;flex-direction:column;gap:10px">
        ${(d.pricingPlans[0]?.features||[]).map(f=>`<li style="display:flex;align-items:center;gap:10px;font-size:14px;color:${d.textColor}"><span style="color:${d.mutedColor}">✓</span>${f}</li>`).join("")}
      </ul>
      <a href="${d.ctaLink}" style="display:block;text-align:center;background:transparent;border:1.5px solid #d1d5db;color:${d.textColor};padding:12px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Get Started Free</a>
    </div>
    <div style="background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});border-radius:20px;padding:40px">
      <span style="display:inline-block;background:rgba(255,255,255,.2);color:#fff;padding:4px 12px;border-radius:50px;font-size:12px;font-weight:600;margin-bottom:16px">PRO</span>
      <h3 style="font-family:${d.headingFont};font-size:20px;font-weight:700;color:#fff;margin:0 0 8px">${d.pricingPlans[1]?.name||"Pro"}</h3>
      <div style="font-family:${d.headingFont};font-size:36px;font-weight:900;color:#fff;margin-bottom:24px">${d.pricingPlans[1]?.price||"$29"}<span style="font-size:14px;color:rgba(255,255,255,.7);font-weight:400">${d.pricingPlans[1]?.period||"/mo"}</span></div>
      <ul style="list-style:none;padding:0;margin:0 0 28px;display:flex;flex-direction:column;gap:10px">
        ${(d.pricingPlans[1]?.features||[]).map(f=>`<li style="display:flex;align-items:center;gap:10px;font-size:14px;color:rgba(255,255,255,.9)"><span>✓</span>${f}</li>`).join("")}
      </ul>
      <a href="${d.ctaLink}" style="display:block;text-align:center;background:#fff;color:${d.primaryColor};padding:12px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">${d.ctaText}</a>
    </div>
  </div>
</section>`,
  },

  // ── PRC-07  Custom Quotes ─────────────────────────────────────────────────
  {
    id: "pricing-07",
    name: "Custom Quote",
    section: "pricing",
    industries: ["construction", "legal", "manufacturing", "consulting"],
    themeStyles: ["corporate", "classic"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1000px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0 0 16px">Custom Pricing for Your Needs</h2>
      <p style="font-size:16px;color:${d.mutedColor};line-height:1.8;margin:0 0 32px">Every project is unique. We provide tailored quotes based on your specific requirements and goals.</p>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:14px">
        ${["Free consultation","Detailed proposal","Flexible payment terms","No hidden costs"].map(i=>`<li style="display:flex;align-items:center;gap:12px;font-size:15px;color:${d.textColor}"><span style="width:24px;height:24px;background:${d.primaryColor};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0">✓</span>${i}</li>`).join("")}
      </ul>
    </div>
    <div style="background:${d.primaryColor}06;border-radius:16px;padding:40px;border:1px solid ${d.primaryColor}20">
      <h3 style="font-family:${d.headingFont};font-size:22px;font-weight:700;color:${d.textColor};margin:0 0 24px">Get a Free Quote</h3>
      <form style="display:flex;flex-direction:column;gap:14px">
        <input type="text" placeholder="Your Name" style="border:1.5px solid #e5e7eb;border-radius:8px;padding:13px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
        <input type="email" placeholder="Email Address" style="border:1.5px solid #e5e7eb;border-radius:8px;padding:13px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
        <select style="border:1.5px solid #e5e7eb;border-radius:8px;padding:13px 16px;font-size:14px;outline:none;font-family:${d.bodyFont};background:#fff"><option>Select Project Type</option><option>Small</option><option>Medium</option><option>Large</option></select>
        <button type="submit" style="background:${d.primaryColor};color:#fff;padding:14px;border:none;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer">${d.ctaText}</button>
      </form>
    </div>
  </div>
</section>`,
  },

  // ── PRC-08  Restaurant Menu Style ─────────────────────────────────────────
  {
    id: "pricing-08",
    name: "Menu Style",
    section: "pricing",
    industries: ["restaurant", "beauty", "travel"],
    themeStyles: ["elegant", "luxury"],
    generate: (d) => `
<section style="background:#faf7f4;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:900px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <p style="color:${d.primaryColor};font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-weight:600">Our Packages</p>
      <h2 style="font-family:Georgia,serif;font-size:clamp(28px,3vw,44px);font-weight:400;color:#3d2b1f;margin:0">Choose Your Experience</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid #e8ddd5">
      ${d.pricingPlans.slice(0,3).map((p,i)=>`
      <div style="padding:44px 32px;${i<2?'border-right:1px solid #e8ddd5':''}${p.highlighted?';background:'+d.primaryColor:''}">
        <h3 style="font-family:Georgia,serif;font-size:18px;font-weight:400;color:${p.highlighted?'rgba(255,255,255,.85)':'#8c7b6e'};margin:0 0 12px;letter-spacing:2px;text-transform:uppercase">${p.name}</h3>
        <div style="font-family:${d.headingFont};font-size:36px;font-weight:700;color:${p.highlighted?'#fff':'#3d2b1f'};margin-bottom:8px">${p.price}</div>
        <div style="font-size:13px;color:${p.highlighted?'rgba(255,255,255,.7)':'#8c7b6e'};margin-bottom:28px">${p.period||"per person"}</div>
        <ul style="list-style:none;padding:0;margin:0 0 32px;display:flex;flex-direction:column;gap:10px">
          ${p.features.map(f=>`<li style="font-size:14px;color:${p.highlighted?'rgba(255,255,255,.9)':'#5c4d3c'};display:flex;align-items:center;gap:8px"><span>—</span>${f}</li>`).join("")}
        </ul>
        <a href="${d.ctaLink}" style="display:block;text-align:center;background:${p.highlighted?'#fff':d.primaryColor};color:${p.highlighted?d.primaryColor:'#fff'};padding:12px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.5px">${p.ctaText||"Book Now"}</a>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── PRC-09  Pay-Per-Service ────────────────────────────────────────────────
  {
    id: "pricing-09",
    name: "Services List",
    section: "pricing",
    industries: ["healthcare", "legal", "automotive", "construction"],
    themeStyles: ["minimal", "corporate"],
    generate: (d) => `
<section style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:900px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0">Service Pricing</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:0">
      ${d.pricingPlans.slice(0,5).map((p,i)=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 28px;background:${i%2===0?'#f8fafc':'#fff'};border:1px solid #e5e7eb;border-bottom:none${i===0?';border-radius:12px 12px 0 0':i===Math.min(d.pricingPlans.length,5)-1?';border-radius:0 0 12px 12px;border-bottom:1px solid #e5e7eb':''}">
        <div>
          <div style="font-weight:700;font-size:16px;color:${d.textColor};margin-bottom:4px">${p.name}</div>
          <div style="font-size:13px;color:${d.mutedColor}">${p.features.slice(0,3).join(" · ")}</div>
        </div>
        <div style="display:flex;align-items:center;gap:16px">
          <span style="font-family:${d.headingFont};font-size:22px;font-weight:900;color:${d.primaryColor}">${p.price}</span>
          <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;white-space:nowrap">${p.ctaText||"Book"}</a>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── PRC-10  Nonprofit / Donation ──────────────────────────────────────────
  {
    id: "pricing-10",
    name: "Donation Tiers",
    section: "pricing",
    industries: ["nonprofit", "education", "healthcare"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<section style="background:${d.primaryColor}08;padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1000px;margin:0 auto;padding:0 24px;text-align:center">
    <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0 0 12px">Support Our Mission</h2>
    <p style="font-size:16px;color:${d.mutedColor};max-width:560px;margin:0 auto 48px">Every contribution makes a difference. Choose a giving level that works for you.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${d.pricingPlans.slice(0,3).map(p=>`
      <div style="background:#fff;border-radius:16px;padding:36px 28px;border:${p.highlighted?`2px solid ${d.primaryColor}`:'1px solid #e5e7eb'};box-shadow:${p.highlighted?'0 12px 40px '+d.primaryColor+'30':'none'}">
        <div style="font-size:48px;margin-bottom:16px">${p.highlighted?"❤️":"🤝"}</div>
        <h3 style="font-family:${d.headingFont};font-size:20px;font-weight:700;color:${d.textColor};margin:0 0 8px">${p.name}</h3>
        <div style="font-family:${d.headingFont};font-size:36px;font-weight:900;color:${d.primaryColor};margin-bottom:8px">${p.price}</div>
        <div style="font-size:13px;color:${d.mutedColor};margin-bottom:24px">${p.period||"per month"}</div>
        <ul style="list-style:none;padding:0;margin:0 0 28px;display:flex;flex-direction:column;gap:10px;text-align:left">
          ${p.features.map(f=>`<li style="display:flex;align-items:center;gap:10px;font-size:13px;color:${d.textColor}"><span style="color:${d.primaryColor}">✓</span>${f}</li>`).join("")}
        </ul>
        <a href="${d.ctaLink}" style="display:block;text-align:center;background:${p.highlighted?d.primaryColor:'transparent'};color:${p.highlighted?'#fff':d.primaryColor};border:1.5px solid ${d.primaryColor};padding:12px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Donate ${p.price}</a>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },
];
