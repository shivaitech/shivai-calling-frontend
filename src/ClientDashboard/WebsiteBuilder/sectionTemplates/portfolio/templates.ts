import type { SectionTemplate, WebsiteTemplateData } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ITEMS = (d: WebsiteTemplateData) =>
  d.portfolioItems.length
    ? d.portfolioItems
    : [
        { title: "Project One", category: "Design", description: "A stunning project", image: d.images[0] || "" },
        { title: "Project Two", category: "Development", description: "A powerful build", image: d.images[1] || "" },
        { title: "Project Three", category: "Strategy", description: "A smart solution", image: d.images[2] || "" },
        { title: "Project Four", category: "Branding", description: "A fresh identity", image: d.images[3] || "" },
        { title: "Project Five", category: "Marketing", description: "A growth campaign", image: d.images[4] || "" },
        { title: "Project Six", category: "Research", description: "Deep insights", image: d.images[5] || "" },
      ];

export const portfolioTemplates: SectionTemplate[] = [

  // ── PRT-01  Masonry Grid ───────────────────────────────────────────────────
  {
    id: "portfolio-01",
    name: "Masonry Grid",
    section: "portfolio",
    industries: ["agency", "portfolio", "media", "creative"],
    themeStyles: ["minimal", "modern", "creative"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      return `
<section id="portfolio" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <span style="color:${d.primaryColor};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Portfolio</span>
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:12px 0 0">Our Work</h2>
    </div>
    <div style="columns:3;column-gap:20px">
      ${items.map((item, i) => `
      <div style="break-inside:avoid;margin-bottom:20px;border-radius:12px;overflow:hidden;position:relative;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.08)">
        <div style="background:linear-gradient(135deg,${d.primaryColor}30,${d.accentColor}30);min-height:${[220, 300, 180, 260, 200, 320][i % 6]}px;display:flex;align-items:center;justify-content:center;font-size:40px">${["🎨","💡","🚀","🔧","✨","📊"][i % 6]}</div>
        <div style="padding:20px;background:#fff">
          <div style="font-size:11px;color:${d.primaryColor};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${item.category||"Project"}</div>
          <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:0 0 6px">${item.title}</h3>
          <p style="font-size:13px;color:${d.mutedColor};margin:0">${item.description||""}</p>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── PRT-02  Dark Grid with Hover Overlay ──────────────────────────────────
  {
    id: "portfolio-02",
    name: "Dark Hover Grid",
    section: "portfolio",
    industries: ["agency", "media", "portfolio"],
    themeStyles: ["dark", "bold"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      return `
<section id="portfolio" style="background:#0f172a;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1280px;margin:0 auto;padding:0 24px">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:56px">
      <div>
        <span style="color:${d.primaryColor};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Selected Work</span>
        <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,48px);font-weight:900;color:#fff;margin:12px 0 0">Our Portfolio</h2>
      </div>
      <a href="#" style="color:#94a3b8;font-size:14px;text-decoration:none;font-weight:600">View All →</a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
      ${items.slice(0,6).map((item, i) => `
      <div style="border-radius:12px;overflow:hidden;cursor:pointer;position:relative;group"
           onmouseover="this.querySelector('.overlay').style.opacity='1'"
           onmouseout="this.querySelector('.overlay').style.opacity='0'">
        <div style="background:linear-gradient(135deg,${d.primaryColor}40,${d.accentColor}30);height:260px;display:flex;align-items:center;justify-content:center;font-size:48px">${["🎨","💡","🚀","🔧","✨","📊"][i]}</div>
        <div class="overlay" style="position:absolute;inset:0;background:${d.primaryColor}e0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity .3s;padding:24px;text-align:center">
          <span style="font-size:11px;color:rgba(255,255,255,.7);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">${item.category||"Project"}</span>
          <h3 style="font-family:${d.headingFont};font-size:20px;font-weight:800;color:#fff;margin:0 0 10px">${item.title}</h3>
          <a href="#" style="color:#fff;font-size:13px;text-decoration:none;border:1.5px solid rgba(255,255,255,.5);padding:8px 20px;border-radius:50px">View Case →</a>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── PRT-03  Filter + Grid ──────────────────────────────────────────────────
  {
    id: "portfolio-03",
    name: "Filter Gallery",
    section: "portfolio",
    industries: ["agency", "portfolio", "ecommerce"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      const cats = [...new Set(items.map(it => it.category || "All"))];
      return `
<section id="portfolio" style="background:#f8fafc;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 16px">Our Projects</h2>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">
        <button onclick="filterPortfolio('all',this)" style="background:${d.primaryColor};color:#fff;border:none;padding:8px 20px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer">All</button>
        ${cats.slice(0,5).map(c=>`<button onclick="filterPortfolio('${c}',this)" style="background:#fff;color:${d.textColor};border:1.5px solid #e5e7eb;padding:8px 20px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer">${c}</button>`).join("")}
      </div>
    </div>
    <div id="portfolio-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${items.map((item, i) => `
      <div data-cat="${item.category||""}" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);border:1px solid #f1f5f9">
        <div style="background:linear-gradient(135deg,${d.primaryColor}20,${d.accentColor}20);height:220px;display:flex;align-items:center;justify-content:center;font-size:48px">${["🎨","💡","🚀","🔧","✨","📊"][i % 6]}</div>
        <div style="padding:20px">
          <span style="font-size:11px;color:${d.primaryColor};font-weight:700;text-transform:uppercase;letter-spacing:1px">${item.category||"Project"}</span>
          <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:6px 0 8px">${item.title}</h3>
          <p style="font-size:13px;color:${d.mutedColor};margin:0">${item.description||""}</p>
        </div>
      </div>`).join("")}
    </div>
  </div>
  <script>
  function filterPortfolio(cat, btn) {
    document.querySelectorAll('#portfolio-grid > div').forEach(el => {
      el.style.display = (cat === 'all' || el.dataset.cat === cat) ? '' : 'none';
    });
    document.querySelectorAll('#portfolio button').forEach(b => {
      b.style.background = '#fff'; b.style.color = '${d.textColor}';
    });
    btn.style.background = '${d.primaryColor}'; btn.style.color = '#fff';
  }
  </script>
</section>`;
    },
  },

  // ── PRT-04  2-Col Featured ─────────────────────────────────────────────────
  {
    id: "portfolio-04",
    name: "Featured Work",
    section: "portfolio",
    industries: ["agency", "startup", "consulting"],
    themeStyles: ["modern", "minimal"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      return `
<section id="portfolio" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:64px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:0">Featured Projects</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:48px">
      ${items.slice(0,3).map((item, i) => `
      <div style="display:grid;grid-template-columns:${i%2===0?"1fr 1fr":"1fr 1fr"};gap:56px;align-items:center${i%2===1?";direction:rtl":""};background:${i%2===0?"#fff":"#f8fafc"};border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.06)">
        <div style="background:linear-gradient(135deg,${d.primaryColor}25,${d.accentColor}20);min-height:320px;display:flex;align-items:center;justify-content:center;font-size:72px">${["🎨","🚀","💡"][i]}</div>
        <div style="padding:48px;direction:ltr">
          <span style="font-size:11px;color:${d.primaryColor};font-weight:700;text-transform:uppercase;letter-spacing:1.5px;display:block;margin-bottom:12px">${item.category||"Project"}</span>
          <h3 style="font-family:${d.headingFont};font-size:26px;font-weight:800;color:${d.textColor};margin:0 0 16px">${item.title}</h3>
          <p style="font-size:15px;color:${d.mutedColor};line-height:1.8;margin:0 0 28px">${item.description||""}</p>
          <a href="#" style="background:${d.primaryColor};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View Project →</a>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── PRT-05  Real Estate Listings ───────────────────────────────────────────
  {
    id: "portfolio-05",
    name: "Property Listings",
    section: "portfolio",
    industries: ["realestate", "construction"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      return `
<section id="portfolio" style="background:#f8fafc;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1280px;margin:0 auto;padding:0 24px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:48px">
      <div>
        <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0">Featured Listings</h2>
      </div>
      <div style="display:flex;gap:8px">
        ${["For Sale","For Rent","Sold"].map(f=>`<button style="background:#fff;border:1.5px solid #e5e7eb;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;color:${d.textColor}">${f}</button>`).join("")}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${items.slice(0,6).map((item, i) => `
      <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.06);border:1px solid #e5e7eb">
        <div style="position:relative">
          <div style="background:linear-gradient(135deg,${d.primaryColor}20,${d.accentColor}20);height:220px;display:flex;align-items:center;justify-content:center;font-size:56px">🏠</div>
          <div style="position:absolute;top:14px;left:14px;background:${d.primaryColor};color:#fff;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700">For Sale</div>
        </div>
        <div style="padding:20px">
          <div style="font-size:22px;font-weight:800;color:${d.primaryColor};margin-bottom:6px">$${(420 + i * 85).toFixed(0)}K</div>
          <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:0 0 8px">${item.title}</h3>
          <p style="font-size:13px;color:${d.mutedColor};margin:0 0 16px">📍 ${d.address||"123 Main Street, City"}</p>
          <div style="display:flex;gap:16px;border-top:1px solid #f1f5f9;padding-top:14px">
            ${["3 Beds","2 Baths","1,200 sqft"].map(spec=>`<span style="font-size:12px;color:${d.mutedColor};font-weight:600">${spec}</span>`).join("")}
          </div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── PRT-06  Restaurant / Food Gallery ─────────────────────────────────────
  {
    id: "portfolio-06",
    name: "Food Gallery",
    section: "portfolio",
    industries: ["restaurant", "travel", "beauty"],
    themeStyles: ["elegant", "luxury"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      return `
<section id="portfolio" style="background:#faf7f4;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <p style="color:${d.primaryColor};font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-weight:600">Gallery</p>
      <h2 style="font-family:Georgia,serif;font-size:clamp(26px,3vw,42px);font-weight:400;color:#3d2b1f;margin:0">Our Creations</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
      ${items.slice(0,8).map((item, i) => `
      <div style="border-radius:8px;overflow:hidden;aspect-ratio:1;cursor:pointer;position:relative"
           onmouseover="this.querySelector('div').style.opacity='1'"
           onmouseout="this.querySelector('div').style.opacity='0'">
        <div style="background:linear-gradient(135deg,${d.primaryColor}30,#8b4513 40%,#d2691e 100%);height:100%;display:flex;align-items:center;justify-content:center;font-size:48px">${["🍝","🥗","🍰","🍷","🥩","🦞","🍣","☕"][i % 8]}</div>
        <div style="position:absolute;inset:0;background:rgba(61,43,31,.8);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s">
          <div style="text-align:center"><h4 style="color:#fff;margin:0 0 6px;font-family:Georgia,serif;font-size:16px">${item.title}</h4><span style="color:rgba(255,255,255,.7);font-size:12px">${item.category||""}</span></div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── PRT-07  Horizontal Scroll Showcase ────────────────────────────────────
  {
    id: "portfolio-07",
    name: "Scroll Showcase",
    section: "portfolio",
    industries: ["startup", "saas", "ecommerce"],
    themeStyles: ["modern", "creative"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      return `
<section id="portfolio" style="background:${d.bgColor};padding:96px 0;overflow:hidden;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;margin-bottom:48px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0">Our Work</h2>
      <a href="#" style="color:${d.primaryColor};font-weight:600;font-size:14px;text-decoration:none">See All →</a>
    </div>
  </div>
  <div style="overflow-x:auto;padding:0 24px;display:flex;gap:20px;scrollbar-width:none">
    ${items.map((item, i) => `
    <div style="flex:0 0 360px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #f1f5f9">
      <div style="background:linear-gradient(135deg,${d.primaryColor}20,${d.accentColor}25);height:240px;display:flex;align-items:center;justify-content:center;font-size:64px">${["🎨","💡","🚀","🔧","✨","📊"][i % 6]}</div>
      <div style="padding:24px">
        <span style="font-size:11px;color:${d.primaryColor};font-weight:700;text-transform:uppercase;letter-spacing:1px">${item.category||"Project"}</span>
        <h3 style="font-family:${d.headingFont};font-size:18px;font-weight:700;color:${d.textColor};margin:6px 0 8px">${item.title}</h3>
        <p style="font-size:13px;color:${d.mutedColor};margin:0">${item.description||""}</p>
      </div>
    </div>`).join("")}
  </div>
</section>`;
    },
  },

  // ── PRT-08  Case Studies ───────────────────────────────────────────────────
  {
    id: "portfolio-08",
    name: "Case Studies",
    section: "portfolio",
    industries: ["consulting", "agency", "saas"],
    themeStyles: ["corporate", "minimal"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      return `
<section id="portfolio" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:64px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 16px">Case Studies</h2>
      <p style="font-size:16px;color:${d.mutedColor};max-width:560px;margin:0 auto">Real results for real businesses. Here's how we helped clients achieve their goals.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:32px">
      ${items.slice(0,4).map((item, i) => `
      <div style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:32px;display:flex;gap:40px;align-items:center;box-shadow:0 2px 16px rgba(0,0,0,.04)">
        <div style="flex:0 0 80px;height:80px;background:${d.primaryColor}15;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:36px">${["🎯","📈","🛒","⚙️"][i]}</div>
        <div style="flex:1">
          <span style="font-size:11px;color:${d.primaryColor};font-weight:700;text-transform:uppercase;letter-spacing:1px">${item.category||"Case Study"}</span>
          <h3 style="font-family:${d.headingFont};font-size:20px;font-weight:700;color:${d.textColor};margin:4px 0 8px">${item.title}</h3>
          <p style="font-size:14px;color:${d.mutedColor};margin:0">${item.description||""}</p>
        </div>
        <div style="flex:0 0 auto;text-align:center">
          <div style="font-size:36px;font-weight:900;color:${d.primaryColor}">${["+240%","$1.2M","3.5x","98%"][i]}</div>
          <div style="font-size:12px;color:${d.mutedColor};margin-top:4px">${["Growth","Revenue","ROI","Satisfaction"][i]}</div>
        </div>
        <a href="#" style="flex:0 0 auto;background:${d.primaryColor}10;color:${d.primaryColor};padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;white-space:nowrap">Read More →</a>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── PRT-09  Before & After / Transformation ───────────────────────────────
  {
    id: "portfolio-09",
    name: "Transformation Grid",
    section: "portfolio",
    industries: ["beauty", "construction", "fitness"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      return `
<section id="portfolio" style="background:#f8fafc;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 16px">Transformations</h2>
      <p style="font-size:16px;color:${d.mutedColor}">Real results from real clients</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${items.slice(0,6).map((item, i) => `
      <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.07)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
          <div style="background:#e5e7eb;height:180px;display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:28px">
            <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-top:8px">Before</div>
          </div>
          <div style="background:linear-gradient(135deg,${d.primaryColor}40,${d.accentColor}30);height:180px;display:flex;align-items:center;justify-content:center;font-size:28px">
            <div style="font-size:9px;font-weight:700;color:${d.primaryColor};text-transform:uppercase;margin-top:8px">After</div>
          </div>
        </div>
        <div style="padding:20px">
          <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:0 0 6px">${item.title}</h3>
          <p style="font-size:13px;color:${d.mutedColor};margin:0">${item.description||""}</p>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── PRT-10  Product Showcase ───────────────────────────────────────────────
  {
    id: "portfolio-10",
    name: "Product Showcase",
    section: "portfolio",
    industries: ["ecommerce", "manufacturing", "automotive"],
    themeStyles: ["modern", "minimal", "luxury"],
    generate: (d) => {
      const items = DEFAULT_ITEMS(d);
      return `
<section id="portfolio" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1280px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:0">Our Products</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      ${items.slice(0,8).map((item, i) => `
      <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;cursor:pointer;transition:transform .2s"
           onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,.12)'"
           onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="background:linear-gradient(135deg,${d.primaryColor}15,${d.accentColor}10);height:200px;display:flex;align-items:center;justify-content:center;font-size:56px">${["📦","⚙️","🔩","🚗","💎","🏆","🛒","🎁"][i % 8]}</div>
        <div style="padding:16px">
          <span style="font-size:10px;color:${d.primaryColor};font-weight:700;text-transform:uppercase;letter-spacing:1px">${item.category||"Product"}</span>
          <h3 style="font-family:${d.headingFont};font-size:15px;font-weight:700;color:${d.textColor};margin:4px 0 8px">${item.title}</h3>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:18px;font-weight:800;color:${d.primaryColor}">$${(29 + i * 20).toFixed(0)}</span>
            <button style="background:${d.primaryColor};color:#fff;border:none;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">Add to Cart</button>
          </div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },
];
