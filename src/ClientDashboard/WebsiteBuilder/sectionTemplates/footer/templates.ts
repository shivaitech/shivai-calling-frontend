import type { SectionTemplate, WebsiteTemplateData } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

const socialRow = (d: WebsiteTemplateData, color = "rgba(255,255,255,0.5)") =>
  Object.entries(d.socialLinks)
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<a href="${v}" style="color:${color};font-size:12px;font-weight:600;text-transform:uppercase;text-decoration:none;letter-spacing:1px">${k}</a>`
    )
    .join(" · ");

export const footerTemplates: SectionTemplate[] = [

  // ── FTR-01  4-Col Dark Footer ──────────────────────────────────────────────
  {
    id: "footer-01",
    name: "4-Col Dark",
    section: "footer",
    industries: ["saas", "agency", "startup", "general"],
    themeStyles: ["dark", "bold", "modern"],
    generate: (d) => `
<footer style="background:#0f172a;padding:72px 0 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;padding-bottom:56px;border-bottom:1px solid #1e293b">
      <div>
        <div style="font-family:${d.headingFont};font-size:22px;font-weight:800;color:#fff;margin-bottom:16px">${d.businessName}</div>
        <p style="font-size:14px;color:#64748b;line-height:1.8;max-width:280px;margin:0 0 28px">${d.footerTagline||d.tagline}</p>
        <div style="display:flex;gap:12px">${socialRow(d, "#94a3b8")}</div>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:700;color:#f1f5f9;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 20px">Product</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${d.navItems.slice(0,4).map(n=>`<a href="${n.href}" style="font-size:14px;color:#64748b;text-decoration:none">${n.label}</a>`).join("")}</div>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:700;color:#f1f5f9;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 20px">Company</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${["About","Blog","Careers","Press"].map(l=>`<a href="#" style="font-size:14px;color:#64748b;text-decoration:none">${l}</a>`).join("")}</div>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:700;color:#f1f5f9;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 20px">Contact</h4>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${d.email?`<a href="mailto:${d.email}" style="font-size:14px;color:#64748b;text-decoration:none">${d.email}</a>`:""}
          ${d.phone?`<a href="tel:${d.phone}" style="font-size:14px;color:#64748b;text-decoration:none">${d.phone}</a>`:""}
          ${d.address?`<span style="font-size:14px;color:#64748b">${d.address}</span>`:""}
        </div>
      </div>
    </div>
    <div style="padding:24px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <span style="font-size:13px;color:#475569">© ${new Date().getFullYear()} ${d.businessName}. All rights reserved.</span>
      <div style="display:flex;gap:24px">${["Privacy","Terms","Cookies"].map(l=>`<a href="#" style="font-size:13px;color:#475569;text-decoration:none">${l}</a>`).join("")}</div>
    </div>
  </div>
</footer>`,
  },

  // ── FTR-02  Clean Light Footer ─────────────────────────────────────────────
  {
    id: "footer-02",
    name: "Clean Light",
    section: "footer",
    industries: ["healthcare", "education", "nonprofit"],
    themeStyles: ["minimal", "corporate", "classic"],
    generate: (d) => `
<footer style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:64px 0 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;padding-bottom:48px;border-bottom:1px solid #e5e7eb">
      <div>
        <div style="font-family:${d.headingFont};font-size:22px;font-weight:800;color:${d.primaryColor};margin-bottom:16px">${d.businessName}</div>
        <p style="font-size:14px;color:${d.mutedColor};line-height:1.8;max-width:280px;margin:0 0 24px">${d.footerTagline||d.tagline}</p>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:700;color:${d.textColor};text-transform:uppercase;letter-spacing:1.5px;margin:0 0 18px">Pages</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${d.navItems.slice(0,5).map(n=>`<a href="${n.href}" style="font-size:14px;color:${d.mutedColor};text-decoration:none">${n.label}</a>`).join("")}</div>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:700;color:${d.textColor};text-transform:uppercase;letter-spacing:1.5px;margin:0 0 18px">Services</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${d.features.slice(0,4).map(f=>`<a href="#features" style="font-size:14px;color:${d.mutedColor};text-decoration:none">${f.title}</a>`).join("")}</div>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:700;color:${d.textColor};text-transform:uppercase;letter-spacing:1.5px;margin:0 0 18px">Contact</h4>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${d.phone?`<span style="font-size:14px;color:${d.mutedColor}">📞 ${d.phone}</span>`:""}
          ${d.email?`<span style="font-size:14px;color:${d.mutedColor}">✉ ${d.email}</span>`:""}
        </div>
      </div>
    </div>
    <div style="padding:20px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <span style="font-size:13px;color:${d.mutedColor}">© ${new Date().getFullYear()} ${d.businessName}</span>
      <div style="display:flex;gap:20px">${["Privacy Policy","Terms of Service"].map(l=>`<a href="#" style="font-size:13px;color:${d.mutedColor};text-decoration:none">${l}</a>`).join("")}</div>
    </div>
  </div>
</footer>`,
  },

  // ── FTR-03  Gradient Footer ────────────────────────────────────────────────
  {
    id: "footer-03",
    name: "Gradient Footer",
    section: "footer",
    industries: ["saas", "startup", "fitness"],
    themeStyles: ["bold", "modern", "playful"],
    generate: (d) => `
<footer style="background:linear-gradient(135deg,${d.primaryColor} 0%,${d.accentColor} 100%);padding:64px 0 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:48px;padding-bottom:48px">
      <div>
        <div style="font-family:${d.headingFont};font-size:24px;font-weight:900;color:#fff;margin-bottom:16px">${d.businessName}</div>
        <p style="font-size:14px;color:rgba(255,255,255,.75);line-height:1.8;max-width:300px;margin:0 0 28px">${d.footerTagline||d.tagline}</p>
        <a href="${d.ctaLink}" style="background:rgba(255,255,255,.2);color:#fff;border:1.5px solid rgba(255,255,255,.6);padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${d.ctaText}</a>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:700;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 18px">Quick Links</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${d.navItems.map(n=>`<a href="${n.href}" style="font-size:14px;color:rgba(255,255,255,.8);text-decoration:none">${n.label}</a>`).join("")}</div>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:700;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 18px">Connect</h4>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${d.email?`<a href="mailto:${d.email}" style="font-size:14px;color:rgba(255,255,255,.8);text-decoration:none">${d.email}</a>`:""}
          ${d.phone?`<a href="tel:${d.phone}" style="font-size:14px;color:rgba(255,255,255,.8);text-decoration:none">${d.phone}</a>`:""}
        </div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,.2);padding:20px 0;text-align:center">
      <span style="font-size:13px;color:rgba(255,255,255,.6)">© ${new Date().getFullYear()} ${d.businessName}. All rights reserved.</span>
    </div>
  </div>
</footer>`,
  },

  // ── FTR-04  Restaurant Footer ─────────────────────────────────────────────
  {
    id: "footer-04",
    name: "Restaurant Elegant",
    section: "footer",
    industries: ["restaurant", "travel", "beauty"],
    themeStyles: ["elegant", "luxury", "classic"],
    generate: (d) => `
<footer style="background:#3d2b1f;padding:64px 0 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <div style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#fff;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px">${d.businessName}</div>
      <div style="width:60px;height:1px;background:${d.primaryColor};margin:0 auto 20px"></div>
      <p style="font-size:14px;color:rgba(255,255,255,.55);max-width:400px;margin:0 auto">${d.footerTagline||d.tagline}</p>
    </div>
    <div style="display:flex;justify-content:center;gap:48px;margin-bottom:48px;flex-wrap:wrap">
      ${d.navItems.map(n=>`<a href="${n.href}" style="font-size:13px;color:rgba(255,255,255,.6);text-decoration:none;letter-spacing:1.5px;text-transform:uppercase">${n.label}</a>`).join("")}
    </div>
    <div style="display:flex;justify-content:center;gap:16px;margin-bottom:48px">
      ${socialRow(d, "rgba(255,255,255,0.5)") || ""}
    </div>
    <div style="border-top:1px solid rgba(255,255,255,.1);padding:24px 0;text-align:center">
      <span style="font-size:12px;color:rgba(255,255,255,.4)">© ${new Date().getFullYear()} ${d.businessName}. All rights reserved.</span>
    </div>
  </div>
</footer>`,
  },

  // ── FTR-05  Minimal 2-Col ──────────────────────────────────────────────────
  {
    id: "footer-05",
    name: "Minimal 2-Col",
    section: "footer",
    industries: ["portfolio", "consulting", "startup"],
    themeStyles: ["minimal", "elegant"],
    generate: (d) => `
<footer style="background:${d.bgColor};border-top:1px solid #e5e7eb;padding:48px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:24px">
    <div>
      <div style="font-family:${d.headingFont};font-size:20px;font-weight:800;color:${d.primaryColor};margin-bottom:6px">${d.businessName}</div>
      <div style="font-size:13px;color:${d.mutedColor}">${d.tagline}</div>
    </div>
    <nav style="display:flex;gap:28px;flex-wrap:wrap">
      ${d.navItems.map(n=>`<a href="${n.href}" style="font-size:14px;color:${d.mutedColor};text-decoration:none">${n.label}</a>`).join("")}
    </nav>
    <div style="font-size:13px;color:${d.mutedColor}">© ${new Date().getFullYear()} ${d.businessName}</div>
  </div>
</footer>`,
  },

  // ── FTR-06  Corporate with Newsletter ─────────────────────────────────────
  {
    id: "footer-06",
    name: "Newsletter Footer",
    section: "footer",
    industries: ["consulting", "finance", "media", "saas"],
    themeStyles: ["corporate", "modern"],
    generate: (d) => `
<footer style="background:#1e293b;padding:72px 0 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="background:${d.primaryColor};border-radius:16px;padding:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin-bottom:56px">
      <div>
        <h3 style="font-family:${d.headingFont};font-size:22px;font-weight:800;color:#fff;margin:0 0 8px">Stay Updated</h3>
        <p style="font-size:14px;color:rgba(255,255,255,.8);margin:0">Get the latest news and updates from ${d.businessName}.</p>
      </div>
      <form style="display:flex;gap:0">
        <input type="email" placeholder="Email address" style="flex:1;background:rgba(255,255,255,.9);border:none;padding:13px 16px;border-radius:8px 0 0 8px;font-size:14px;outline:none;font-family:${d.bodyFont}">
        <button style="background:#fff;color:${d.primaryColor};border:none;padding:13px 22px;border-radius:0 8px 8px 0;font-weight:700;font-size:14px;cursor:pointer">Subscribe</button>
      </form>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;padding-bottom:48px;border-bottom:1px solid #334155">
      <div>
        <div style="font-family:${d.headingFont};font-size:20px;font-weight:800;color:#fff;margin-bottom:14px">${d.businessName}</div>
        <p style="font-size:13px;color:#64748b;line-height:1.8;margin:0">${d.footerTagline||d.tagline}</p>
      </div>
      <div>
        <h4 style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px">Pages</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${d.navItems.map(n=>`<a href="${n.href}" style="font-size:13px;color:#64748b;text-decoration:none">${n.label}</a>`).join("")}</div>
      </div>
      <div>
        <h4 style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px">Services</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${d.features.slice(0,4).map(f=>`<span style="font-size:13px;color:#64748b">${f.title}</span>`).join("")}</div>
      </div>
      <div>
        <h4 style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px">Contact</h4>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${d.email?`<span style="font-size:13px;color:#64748b">${d.email}</span>`:""}
          ${d.phone?`<span style="font-size:13px;color:#64748b">${d.phone}</span>`:""}
        </div>
      </div>
    </div>
    <div style="padding:20px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <span style="font-size:13px;color:#475569">© ${new Date().getFullYear()} ${d.businessName}. All rights reserved.</span>
      <div style="display:flex;gap:20px">${["Privacy","Terms"].map(l=>`<a href="#" style="font-size:13px;color:#475569;text-decoration:none">${l}</a>`).join("")}</div>
    </div>
  </div>
</footer>`,
  },

  // ── FTR-07  Healthcare Footer ─────────────────────────────────────────────
  {
    id: "footer-07",
    name: "Trust Footer",
    section: "footer",
    industries: ["healthcare", "legal", "finance"],
    themeStyles: ["corporate", "minimal"],
    generate: (d) => `
<footer style="background:${d.primaryColor};padding:56px 0 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;padding-bottom:48px">
      <div>
        <div style="font-family:${d.headingFont};font-size:22px;font-weight:800;color:#fff;margin-bottom:16px">${d.businessName}</div>
        <p style="font-size:14px;color:rgba(255,255,255,.7);line-height:1.8;max-width:280px;margin:0 0 24px">${d.footerTagline||d.tagline}</p>
        <div style="display:flex;gap:8px">
          ${["🏆 Certified","✓ Licensed","🔒 Trusted"].map(b=>`<span style="background:rgba(255,255,255,.15);color:rgba(255,255,255,.9);padding:4px 10px;border-radius:50px;font-size:11px;font-weight:600">${b}</span>`).join("")}
        </div>
      </div>
      ${[{h:"Pages",items:d.navItems.map(n=>n.label)},{h:"Services",items:d.features.slice(0,4).map(f=>f.title)},{h:"Contact",items:[d.phone||"",d.email||"",d.address||""]}].map(col=>`
      <div>
        <h4 style="font-size:12px;font-weight:700;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px">${col.h}</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${col.items.filter(Boolean).map(i=>`<span style="font-size:14px;color:rgba(255,255,255,.75)">${i}</span>`).join("")}</div>
      </div>`).join("")}
    </div>
    <div style="border-top:1px solid rgba(255,255,255,.15);padding:20px 0;text-align:center">
      <span style="font-size:13px;color:rgba(255,255,255,.5)">© ${new Date().getFullYear()} ${d.businessName}. All rights reserved. | Licensed & Regulated</span>
    </div>
  </div>
</footer>`,
  },

  // ── FTR-08  E-Commerce Footer ─────────────────────────────────────────────
  {
    id: "footer-08",
    name: "E-Commerce Footer",
    section: "footer",
    industries: ["ecommerce", "beauty", "automotive"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<footer style="background:#111827;padding:64px 0 0;font-family:${d.bodyFont}">
  <div style="max-width:1280px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:3fr 1fr 1fr 1fr 1fr;gap:40px;padding-bottom:48px;border-bottom:1px solid #1f2937">
      <div>
        <div style="font-family:${d.headingFont};font-size:24px;font-weight:900;color:#fff;margin-bottom:16px;letter-spacing:-1px">${d.businessName}</div>
        <p style="font-size:13px;color:#6b7280;line-height:1.7;max-width:260px;margin:0 0 24px">${d.footerTagline||d.tagline}</p>
        <div style="display:flex;gap:8px">
          ${["Visa","MasterCard","PayPal","Apple Pay"].map(p=>`<span style="background:#1f2937;color:#9ca3af;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600">${p}</span>`).join("")}
        </div>
      </div>
      ${[{h:"Shop",items:["New Arrivals","Best Sellers","Sale","Brands"]},{h:"Help",items:["FAQ","Shipping","Returns","Size Guide"]},{h:"Company",items:["About","Blog","Press","Careers"]},{h:"Legal",items:["Privacy","Terms","Cookies","Accessibility"]}].map(col=>`
      <div>
        <h4 style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px">${col.h}</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${col.items.map(i=>`<a href="#" style="font-size:13px;color:#6b7280;text-decoration:none">${i}</a>`).join("")}</div>
      </div>`).join("")}
    </div>
    <div style="padding:20px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <span style="font-size:12px;color:#4b5563">© ${new Date().getFullYear()} ${d.businessName}. All rights reserved.</span>
      <span style="font-size:12px;color:#4b5563">🌍 United States | English | USD</span>
    </div>
  </div>
</footer>`,
  },

  // ── FTR-09  Large Centered Brand ──────────────────────────────────────────
  {
    id: "footer-09",
    name: "Brand Centered",
    section: "footer",
    industries: ["media", "nonprofit", "portfolio"],
    themeStyles: ["creative", "bold"],
    generate: (d) => `
<footer style="background:#0f172a;padding:80px 0 0;font-family:${d.bodyFont};text-align:center">
  <div style="max-width:900px;margin:0 auto;padding:0 24px">
    <div style="font-family:${d.headingFont};font-size:clamp(36px,4vw,64px);font-weight:900;color:#fff;margin-bottom:20px;letter-spacing:-2px">${d.businessName}</div>
    <p style="font-size:16px;color:#64748b;margin:0 0 36px;max-width:500px;margin-left:auto;margin-right:auto">${d.footerTagline||d.tagline}</p>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:48px">
      ${d.navItems.map(n=>`<a href="${n.href}" style="font-size:14px;color:#94a3b8;text-decoration:none;padding:0 16px">${n.label}</a>`).join("")}
    </div>
    <div style="display:flex;gap:20px;justify-content:center;margin-bottom:56px">
      ${socialRow(d) || ""}
    </div>
  </div>
  <div style="border-top:1px solid #1e293b;padding:24px">
    <span style="font-size:13px;color:#475569">© ${new Date().getFullYear()} ${d.businessName}</span>
  </div>
</footer>`,
  },

  // ── FTR-10  Startup Minimal Inline ────────────────────────────────────────
  {
    id: "footer-10",
    name: "Startup Inline",
    section: "footer",
    industries: ["startup", "saas", "consulting"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<footer style="background:${d.bgColor};border-top:2px solid ${d.primaryColor};padding:36px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
    <div style="font-family:${d.headingFont};font-size:18px;font-weight:800;color:${d.primaryColor}">${d.businessName}</div>
    <nav style="display:flex;gap:24px">
      ${d.navItems.map(n=>`<a href="${n.href}" style="font-size:13px;color:${d.mutedColor};text-decoration:none">${n.label}</a>`).join("")}
    </nav>
    <div style="display:flex;align-items:center;gap:16px">
      ${d.email?`<a href="mailto:${d.email}" style="font-size:13px;color:${d.mutedColor};text-decoration:none">${d.email}</a>`:""}
      <span style="font-size:13px;color:${d.mutedColor}">© ${new Date().getFullYear()}</span>
    </div>
  </div>
</footer>`,
  },
];
