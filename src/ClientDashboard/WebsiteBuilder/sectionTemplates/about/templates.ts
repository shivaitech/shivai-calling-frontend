import type { SectionTemplate } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

export const aboutTemplates: SectionTemplate[] = [

  // ── ABT-01  Image Left, Text Right ────────────────────────────────────────
  {
    id: "about-01",
    name: "Image + Story",
    section: "about",
    industries: ["general", "consulting", "startup"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<section id="about-us" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center">
    <div>
      ${d.aboutImage||d.images[1] ? `<img src="${d.aboutImage||d.images[1]}" style="width:100%;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.1);object-fit:cover;aspect-ratio:4/3">` : `<div style="background:${d.primaryColor}12;border-radius:16px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center"><span style="font-size:80px">🏢</span></div>`}
    </div>
    <div>
      <span style="color:${d.primaryColor};font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase">About Us</span>
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:800;color:${d.textColor};margin:12px 0 20px">${d.aboutTitle}</h2>
      <p style="font-size:16px;color:${d.mutedColor};line-height:1.85;margin:0 0 32px">${d.aboutDescription}</p>
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaText}</a>
    </div>
  </div>
</section>`,
  },

  // ── ABT-02  Full-Width Dark About ─────────────────────────────────────────
  {
    id: "about-02",
    name: "Dark Mission",
    section: "about",
    industries: ["agency", "media", "portfolio"],
    themeStyles: ["dark", "bold", "creative"],
    generate: (d) => `
<section id="about-us" style="background:#0f172a;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:64px;align-items:start">
      <div>
        <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:900;color:#fff;margin:0 0 20px;letter-spacing:-0.5px">${d.aboutTitle}</h2>
        <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${d.ctaText}</a>
      </div>
      <div>
        <p style="font-size:18px;color:#94a3b8;line-height:1.9;margin:0 0 36px">${d.aboutDescription}</p>
        ${d.aboutImage||d.images[1] ? `<img src="${d.aboutImage||d.images[1]}" style="width:100%;border-radius:12px;object-fit:cover;max-height:400px">` : ""}
      </div>
    </div>
  </div>
</section>`,
  },

  // ── ABT-03  Centered Minimal ───────────────────────────────────────────────
  {
    id: "about-03",
    name: "Centered Minimal",
    section: "about",
    industries: ["portfolio", "beauty", "nonprofit"],
    themeStyles: ["minimal", "elegant"],
    generate: (d) => `
<section id="about-us" style="background:${d.bgColor};padding:100px 24px;text-align:center;font-family:${d.bodyFont}">
  <div style="max-width:760px;margin:0 auto">
    <span style="color:${d.primaryColor};font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Our Story</span>
    <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:700;color:${d.textColor};margin:12px 0 24px">${d.aboutTitle}</h2>
    <div style="width:60px;height:3px;background:${d.primaryColor};margin:0 auto 32px;border-radius:2px"></div>
    <p style="font-size:17px;color:${d.mutedColor};line-height:1.9;margin:0 0 40px">${d.aboutDescription}</p>
    ${d.aboutImage||d.images[1] ? `<img src="${d.aboutImage||d.images[1]}" style="width:100%;max-height:480px;object-fit:cover;border-radius:16px;margin-bottom:40px">` : ""}
    <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaText}</a>
  </div>
</section>`,
  },

  // ── ABT-04  Values Grid ────────────────────────────────────────────────────
  {
    id: "about-04",
    name: "Values Grid",
    section: "about",
    industries: ["consulting", "finance", "legal", "nonprofit"],
    themeStyles: ["corporate", "classic"],
    generate: (d) => `
<section id="about-us" style="background:#f8fafc;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:700;color:${d.textColor};margin:0 0 16px">${d.aboutTitle}</h2>
      <p style="font-size:16px;color:${d.mutedColor};max-width:580px;margin:0 auto;line-height:1.8">${d.aboutDescription}</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px">
      ${["Integrity","Innovation","Excellence","Client Focus","Accountability","Community"].map((v,i)=>`
      <div style="background:#fff;border-radius:12px;padding:36px 28px;border:1px solid #e5e7eb;text-align:center">
        <div style="font-size:40px;margin-bottom:16px">${["🤝","💡","⭐","👥","📋","🌱"][i]}</div>
        <h3 style="font-family:${d.headingFont};font-size:18px;font-weight:700;color:${d.textColor};margin:0 0 10px">${v}</h3>
        <p style="font-size:13px;color:${d.mutedColor};line-height:1.7;margin:0">We uphold ${v.toLowerCase()} in every aspect of our work.</p>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── ABT-05  Restaurant Story ───────────────────────────────────────────────
  {
    id: "about-05",
    name: "Culinary Story",
    section: "about",
    industries: ["restaurant", "travel", "beauty"],
    themeStyles: ["elegant", "luxury", "classic"],
    generate: (d) => `
<section id="about-us" style="background:#faf7f4;padding:100px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center">
    <div style="order:2">
      <p style="color:${d.primaryColor};font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-weight:600">Our Story</p>
      <h2 style="font-family:Georgia,serif;font-size:clamp(28px,3vw,44px);font-weight:400;color:#3d2b1f;margin:0 0 24px">${d.aboutTitle}</h2>
      <div style="width:50px;height:2px;background:${d.primaryColor};margin-bottom:28px"></div>
      <p style="font-size:16px;color:#8c7b6e;line-height:2;margin:0 0 36px">${d.aboutDescription}</p>
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 32px;border-radius:4px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaText}</a>
    </div>
    <div style="order:1;display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${[d.aboutImage,d.images[0],d.images[1],d.images[2]].map((img,i)=>
        img ? `<img src="${img}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;${i===0?'grid-column:span 2':''}" alt="gallery">` :
        `<div style="background:${d.primaryColor}16;aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:36px;${i===0?'grid-column:span 2':''}">${["🍽️","👨‍🍳","🥂","🌿"][i]}</div>`
      ).join("")}
    </div>
  </div>
</section>`,
  },

  // ── ABT-06  Timeline / History ─────────────────────────────────────────────
  {
    id: "about-06",
    name: "Company Timeline",
    section: "about",
    industries: ["manufacturing", "construction", "finance", "education"],
    themeStyles: ["corporate", "classic", "modern"],
    generate: (d) => `
<section id="about-us" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1000px;margin:0 auto;padding:0 24px;text-align:center">
    <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 12px">${d.aboutTitle}</h2>
    <p style="font-size:16px;color:${d.mutedColor};max-width:580px;margin:0 auto 56px;line-height:1.8">${d.aboutDescription}</p>
    <div style="position:relative">
      <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:${d.primaryColor}28;transform:translateX(-50%)"></div>
      ${[{y:"2018",t:"Founded",d:"Started with a clear vision and strong values."},{y:"2020",t:"Growth",d:"Expanded to serve 500+ clients across industries."},{y:"2022",t:"Innovation",d:"Launched our flagship product line."},{y:"2024",t:"Today",d:"Industry leader trusted by thousands worldwide."}].map((item,i)=>`
      <div style="display:flex;justify-content:${i%2===0?'flex-end':'flex-start'};padding:0 calc(50% + 32px) 40px ${i%2===0?'0':'calc(50% + 32px)'};position:relative">
        <div style="position:absolute;left:50%;top:8px;width:14px;height:14px;background:${d.primaryColor};border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px ${d.primaryColor}30;transform:translateX(-50%)"></div>
        <div style="text-align:${i%2===0?'right':'left'};max-width:300px">
          <span style="color:${d.primaryColor};font-size:12px;font-weight:700;letter-spacing:1px">${item.y}</span>
          <h3 style="font-family:${d.headingFont};font-size:18px;font-weight:700;color:${d.textColor};margin:4px 0 8px">${item.t}</h3>
          <p style="font-size:14px;color:${d.mutedColor};line-height:1.6;margin:0">${item.d}</p>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── ABT-07  Team Founder Spotlight ────────────────────────────────────────
  {
    id: "about-07",
    name: "Founder Spotlight",
    section: "about",
    industries: ["startup", "portfolio", "consulting"],
    themeStyles: ["modern", "minimal", "creative"],
    generate: (d) => `
<section id="about-us" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 2fr;gap:72px;align-items:center">
    <div style="text-align:center">
      ${d.aboutImage||d.images[0] ? `<img src="${d.aboutImage||d.images[0]}" style="width:100%;border-radius:50%;aspect-ratio:1;object-fit:cover;box-shadow:0 20px 60px rgba(0,0,0,.12)">` : `<div style="width:200px;height:200px;background:${d.primaryColor}16;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:80px;margin:0 auto">👤</div>`}
      <h3 style="font-family:${d.headingFont};font-size:20px;font-weight:700;color:${d.textColor};margin:20px 0 4px">Founder & CEO</h3>
      <p style="font-size:14px;color:${d.mutedColor}">${d.businessName}</p>
    </div>
    <div>
      <span style="color:${d.primaryColor};font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase">About Us</span>
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:12px 0 20px">${d.aboutTitle}</h2>
      <p style="font-size:17px;color:${d.mutedColor};line-height:1.9;margin:0 0 32px">${d.aboutDescription}</p>
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaText}</a>
    </div>
  </div>
</section>`,
  },

  // ── ABT-08  Healthcare About ───────────────────────────────────────────────
  {
    id: "about-08",
    name: "Care Mission",
    section: "about",
    industries: ["healthcare", "nonprofit"],
    themeStyles: ["corporate", "minimal"],
    generate: (d) => `
<section id="about-us" style="background:#f0f9ff;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
    <div>
      <span style="display:inline-block;background:${d.primaryColor}18;color:${d.primaryColor};padding:6px 16px;border-radius:50px;font-size:13px;font-weight:600;margin-bottom:20px">Our Mission</span>
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:700;color:${d.textColor};margin:0 0 20px">${d.aboutTitle}</h2>
      <p style="font-size:16px;color:${d.mutedColor};line-height:1.9;margin:0 0 32px">${d.aboutDescription}</p>
      <div style="display:flex;gap:32px;margin-bottom:32px">
        <div><div style="font-family:${d.headingFont};font-size:30px;font-weight:900;color:${d.primaryColor}">${d.stats[0]?.value||"10K+"}</div><div style="font-size:13px;color:${d.mutedColor}">${d.stats[0]?.label||"Patients"}</div></div>
        <div><div style="font-family:${d.headingFont};font-size:30px;font-weight:900;color:${d.primaryColor}">${d.stats[1]?.value||"98%"}</div><div style="font-size:13px;color:${d.mutedColor}">${d.stats[1]?.label||"Satisfaction"}</div></div>
      </div>
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaText}</a>
    </div>
    <div>
      ${d.aboutImage||d.images[1] ? `<img src="${d.aboutImage||d.images[1]}" style="width:100%;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.08);object-fit:cover;aspect-ratio:4/3">` : `<div style="background:${d.primaryColor}12;border-radius:16px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center"><span style="font-size:80px">❤️‍🩹</span></div>`}
    </div>
  </div>
</section>`,
  },

  // ── ABT-09  Real Estate About ─────────────────────────────────────────────
  {
    id: "about-09",
    name: "Property Expertise",
    section: "about",
    industries: ["realestate", "construction"],
    themeStyles: ["corporate", "elegant"],
    generate: (d) => `
<section id="about-us" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:0 0 20px">${d.aboutTitle}</h2>
      <div style="width:60px;height:4px;background:${d.primaryColor};margin-bottom:28px;border-radius:2px"></div>
      <p style="font-size:16px;color:${d.mutedColor};line-height:1.9;margin:0 0 32px">${d.aboutDescription}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:36px">
        ${d.stats.slice(0,4).map(s=>`
        <div style="background:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e5e7eb">
          <div style="font-family:${d.headingFont};font-size:24px;font-weight:900;color:${d.primaryColor};margin-bottom:4px">${s.value}</div>
          <div style="font-size:12px;color:${d.mutedColor}">${s.label}</div>
        </div>`).join("")}
      </div>
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaText}</a>
    </div>
    <div>
      ${d.aboutImage||d.images[1] ? `<img src="${d.aboutImage||d.images[1]}" style="width:100%;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.1);object-fit:cover;aspect-ratio:4/3">` : `<div style="background:${d.primaryColor}12;border-radius:16px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center"><span style="font-size:80px">🏠</span></div>`}
    </div>
  </div>
</section>`,
  },

  // ── ABT-10  Video About Section ────────────────────────────────────────────
  {
    id: "about-10",
    name: "Video Brand Story",
    section: "about",
    industries: ["agency", "startup", "media", "ecommerce"],
    themeStyles: ["modern", "bold", "creative"],
    generate: (d) => `
<section id="about-us" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
      <div>
        <span style="color:${d.primaryColor};font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Our Story</span>
        <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:900;color:${d.textColor};margin:12px 0 20px;letter-spacing:-0.5px">${d.aboutTitle}</h2>
        <p style="font-size:16px;color:${d.mutedColor};line-height:1.85;margin:0 0 32px">${d.aboutDescription}</p>
        <div style="display:flex;gap:14px">
          <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${d.ctaText}</a>
          <a href="#team" style="border:1.5px solid ${d.primaryColor};color:${d.primaryColor};padding:11px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Meet the Team</a>
        </div>
      </div>
      <div style="position:relative;border-radius:16px;overflow:hidden;aspect-ratio:16/9">
        ${d.aboutImage||d.images[0] ? `<img src="${d.aboutImage||d.images[0]}" style="width:100%;height:100%;object-fit:cover">` : `<div style="background:${d.primaryColor}12;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-size:80px">▶️</span></div>`}
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <div style="width:72px;height:72px;background:rgba(255,255,255,.9);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 32px rgba(0,0,0,.2)">
            <span style="font-size:28px;margin-left:4px">▶</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
];
