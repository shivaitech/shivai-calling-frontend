import type { SectionTemplate, WebsiteTemplateData } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// TEAM SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MEMBERS = (d: WebsiteTemplateData) =>
  d.teamMembers.length
    ? d.teamMembers
    : [
        { name: "Alex Morgan", role: "CEO & Founder", bio: "Visionary leader with 10+ years of experience.", avatar: "", socialLinks: {} },
        { name: "Jordan Lee", role: "CTO", bio: "Tech enthusiast and full-stack architect.", avatar: "", socialLinks: {} },
        { name: "Taylor Kim", role: "Head of Design", bio: "Award-winning designer and creative director.", avatar: "", socialLinks: {} },
        { name: "Sam Rivera", role: "Head of Marketing", bio: "Growth hacker driving user acquisition.", avatar: "", socialLinks: {} },
        { name: "Casey Chen", role: "Lead Engineer", bio: "Backend expert and infrastructure guru.", avatar: "", socialLinks: {} },
        { name: "Morgan Davis", role: "Product Manager", bio: "Customer-obsessed product strategist.", avatar: "", socialLinks: {} },
      ];

const INITIALS = (name: string) =>
  name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

export const teamTemplates: SectionTemplate[] = [

  // ── TM-01  3-Col Grid Cards ───────────────────────────────────────────────
  {
    id: "team-01",
    name: "3-Col Grid",
    section: "team",
    industries: ["agency", "startup", "consulting", "general"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d);
      return `
<section id="team" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:64px">
      <span style="color:${d.primaryColor};font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Our Team</span>
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:12px 0 16px">The People Behind ${d.businessName}</h2>
      <p style="font-size:16px;color:${d.mutedColor};max-width:560px;margin:0 auto">A passionate team of experts dedicated to delivering exceptional results.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px">
      ${members.slice(0,6).map(m => `
      <div style="background:#fff;border-radius:20px;padding:36px 28px;text-align:center;border:1px solid #f1f5f9;box-shadow:0 4px 24px rgba(0,0,0,.05);transition:transform .2s"
           onmouseover="this.style.transform='translateY(-6px)';this.style.boxShadow='0 16px 48px rgba(0,0,0,.1)'"
           onmouseout="this.style.transform='';this.style.boxShadow='0 4px 24px rgba(0,0,0,.05)'">
        <div style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;margin:0 auto 20px;font-family:${d.headingFont}">${INITIALS(m.name)}</div>
        <h3 style="font-family:${d.headingFont};font-size:18px;font-weight:700;color:${d.textColor};margin:0 0 4px">${m.name}</h3>
        <p style="font-size:13px;color:${d.primaryColor};font-weight:600;margin:0 0 16px">${m.role}</p>
        <p style="font-size:13px;color:${d.mutedColor};line-height:1.7;margin:0">${m.bio}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── TM-02  Dark Cards ─────────────────────────────────────────────────────
  {
    id: "team-02",
    name: "Dark Team Cards",
    section: "team",
    industries: ["agency", "media", "saas"],
    themeStyles: ["dark", "bold"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d);
      return `
<section id="team" style="background:#0f172a;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:64px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,48px);font-weight:900;color:#fff;margin:0 0 16px">Meet the Team</h2>
      <p style="font-size:16px;color:#64748b;max-width:500px;margin:0 auto">Talented individuals building something remarkable.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
      ${members.slice(0,6).map(m => `
      <div style="background:#1e293b;border-radius:16px;padding:32px 24px;border:1px solid #334155;text-align:center">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;margin:0 auto 16px;font-family:${d.headingFont}">${INITIALS(m.name)}</div>
        <h3 style="font-family:${d.headingFont};font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px">${m.name}</h3>
        <p style="font-size:12px;color:${d.primaryColor};font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px">${m.role}</p>
        <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0">${m.bio}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── TM-03  Horizontal Row Cards ───────────────────────────────────────────
  {
    id: "team-03",
    name: "Horizontal Scroll",
    section: "team",
    industries: ["startup", "fitness", "education"],
    themeStyles: ["modern", "playful"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d);
      return `
<section id="team" style="background:#f8fafc;padding:96px 0;overflow:hidden;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px 40px">
    <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 48px">Our Team</h2>
  </div>
  <div style="overflow-x:auto;padding:0 24px;display:flex;gap:20px;scrollbar-width:none">
    ${members.map(m => `
    <div style="flex:0 0 240px;background:#fff;border-radius:20px;padding:28px;text-align:center;border:1px solid #e5e7eb;box-shadow:0 4px 20px rgba(0,0,0,.06)">
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;margin:0 auto 16px;font-family:${d.headingFont}">${INITIALS(m.name)}</div>
      <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:0 0 4px">${m.name}</h3>
      <p style="font-size:12px;color:${d.primaryColor};font-weight:600;margin:0 0 12px">${m.role}</p>
      <p style="font-size:12px;color:${d.mutedColor};line-height:1.6;margin:0">${m.bio}</p>
    </div>`).join("")}
  </div>
</section>`;
    },
  },

  // ── TM-04  Big Photo Cards ────────────────────────────────────────────────
  {
    id: "team-04",
    name: "Photo Cards",
    section: "team",
    industries: ["healthcare", "legal", "finance"],
    themeStyles: ["corporate", "minimal"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d);
      return `
<section id="team" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:64px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 16px">Our Professionals</h2>
      <p style="font-size:16px;color:${d.mutedColor};max-width:500px;margin:0 auto">Experienced specialists committed to your success.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
      ${members.slice(0,4).map(m => `
      <div style="border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07)">
        <div style="background:linear-gradient(180deg,${d.primaryColor}30,${d.accentColor}20);height:240px;display:flex;align-items:center;justify-content:center">
          <div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#fff;font-family:${d.headingFont}">${INITIALS(m.name)}</div>
        </div>
        <div style="background:#fff;padding:20px;text-align:center">
          <h3 style="font-family:${d.headingFont};font-size:17px;font-weight:700;color:${d.textColor};margin:0 0 4px">${m.name}</h3>
          <p style="font-size:12px;color:${d.primaryColor};font-weight:600;margin:0 0 10px">${m.role}</p>
          <p style="font-size:12px;color:${d.mutedColor};line-height:1.6;margin:0">${m.bio}</p>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── TM-05  List with Bios ─────────────────────────────────────────────────
  {
    id: "team-05",
    name: "Founder Bio List",
    section: "team",
    industries: ["startup", "consulting", "portfolio"],
    themeStyles: ["minimal", "elegant"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d).slice(0, 3);
      return `
<section id="team" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:960px;margin:0 auto;padding:0 24px">
    <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 64px">Founders</h2>
    <div style="display:flex;flex-direction:column;gap:56px">
      ${members.map((m, i) => `
      <div style="display:grid;grid-template-columns:200px 1fr;gap:48px;align-items:start${i%2===1?";direction:rtl":""}">
        <div style="direction:ltr;text-align:center">
          <div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:#fff;margin:0 auto 16px;font-family:${d.headingFont}">${INITIALS(m.name)}</div>
          <h3 style="font-family:${d.headingFont};font-size:18px;font-weight:700;color:${d.textColor};margin:0 0 4px">${m.name}</h3>
          <p style="font-size:13px;color:${d.primaryColor};font-weight:600;margin:0">${m.role}</p>
        </div>
        <div style="direction:ltr">
          <p style="font-size:16px;color:${d.mutedColor};line-height:1.9;margin:0">${m.bio}</p>
        </div>
      </div>
      ${i < members.length-1 ? `<hr style="border:none;border-top:1px solid #f1f5f9;margin:0">` : ""}`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── TM-06  Stats + Team Combo ─────────────────────────────────────────────
  {
    id: "team-06",
    name: "Team + Stats",
    section: "team",
    industries: ["saas", "agency", "startup"],
    themeStyles: ["modern", "bold"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d);
      return `
<section id="team" style="background:${d.primaryColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;margin-bottom:72px">
      <div>
        <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,48px);font-weight:900;color:#fff;margin:0 0 20px">People-First Culture</h2>
        <p style="font-size:16px;color:rgba(255,255,255,.8);line-height:1.8;margin:0 0 40px">We're a remote-first team of ${d.teamMembers.length || 50}+ from across the globe, united by our mission.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          ${[{n:`${d.teamMembers.length||50}+`,l:"Team Members"},{n:"15+",l:"Countries"},{n:"4.9★",l:"Culture Score"},{n:"98%",l:"Retention Rate"}].map(s=>`
          <div style="background:rgba(255,255,255,.12);border-radius:12px;padding:20px">
            <div style="font-size:28px;font-weight:900;color:#fff;margin-bottom:4px">${s.n}</div>
            <div style="font-size:13px;color:rgba(255,255,255,.7)">${s.l}</div>
          </div>`).join("")}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${members.slice(0,4).map(m => `
        <div style="background:rgba(255,255,255,.12);border-radius:16px;padding:24px;text-align:center">
          <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;margin:0 auto 12px;font-family:${d.headingFont}">${INITIALS(m.name)}</div>
          <h3 style="font-size:14px;font-weight:700;color:#fff;margin:0 0 4px">${m.name}</h3>
          <p style="font-size:11px;color:rgba(255,255,255,.7);margin:0">${m.role}</p>
        </div>`).join("")}
      </div>
    </div>
  </div>
</section>`;
    },
  },

  // ── TM-07  Healthcare / Trust Team ────────────────────────────────────────
  {
    id: "team-07",
    name: "Medical Team",
    section: "team",
    industries: ["healthcare", "nonprofit", "education"],
    themeStyles: ["minimal", "corporate"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d);
      return `
<section id="team" style="background:#f0f7ff;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:64px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 16px">Our Specialists</h2>
      <p style="font-size:16px;color:${d.mutedColor};max-width:500px;margin:0 auto">Trusted professionals dedicated to your care and wellbeing.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      ${members.slice(0,4).map(m => `
      <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #dbeafe;box-shadow:0 4px 20px rgba(59,130,246,.06)">
        <div style="background:linear-gradient(180deg,${d.primaryColor}15,#fff);padding:32px 20px;text-align:center">
          <div style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#fff;margin:0 auto 16px;font-family:${d.headingFont}">${INITIALS(m.name)}</div>
          <h3 style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor};margin:0 0 4px">${m.name}</h3>
          <p style="font-size:12px;color:${d.primaryColor};font-weight:700;margin:0 0 8px">${m.role}</p>
        </div>
        <div style="padding:0 20px 24px">
          <p style="font-size:12px;color:${d.mutedColor};line-height:1.6;margin:0 0 16px">${m.bio}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${["Board Certified","10+ Years Exp."].map(t=>`<span style="background:${d.primaryColor}12;color:${d.primaryColor};padding:3px 10px;border-radius:50px;font-size:10px;font-weight:600">${t}</span>`).join("")}
          </div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── TM-08  Minimal List ───────────────────────────────────────────────────
  {
    id: "team-08",
    name: "Minimal Name List",
    section: "team",
    industries: ["legal", "finance", "consulting"],
    themeStyles: ["minimal", "elegant"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d);
      return `
<section id="team" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 2fr;gap:80px">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0 0 20px">Our People</h2>
      <p style="font-size:15px;color:${d.mutedColor};line-height:1.8;margin:0 0 32px">${d.description}</p>
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Join Our Team</a>
    </div>
    <div>
      ${members.map((m, i) => `
      <div style="display:flex;align-items:center;gap:20px;padding:20px 0;border-bottom:${i < members.length-1 ? `1px solid #f1f5f9` : "none"}">
        <div style="width:52px;height:52px;border-radius:50%;background:${d.primaryColor}15;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:${d.primaryColor};font-family:${d.headingFont};flex:0 0 auto">${INITIALS(m.name)}</div>
        <div style="flex:1">
          <div style="font-family:${d.headingFont};font-size:16px;font-weight:700;color:${d.textColor}">${m.name}</div>
          <div style="font-size:13px;color:${d.primaryColor};font-weight:600">${m.role}</div>
        </div>
        <div style="font-size:13px;color:${d.mutedColor};max-width:260px;text-align:right">${m.bio}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── TM-09  Colorful Creative ──────────────────────────────────────────────
  {
    id: "team-09",
    name: "Creative Colorful",
    section: "team",
    industries: ["agency", "startup", "media", "education"],
    themeStyles: ["creative", "playful", "bold"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d);
      const colors = [d.primaryColor, d.accentColor, "#10b981", "#f59e0b", "#6366f1", "#ef4444"];
      return `
<section id="team" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:64px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,48px);font-weight:900;color:${d.textColor};margin:0">Meet Our Crew 👋</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${members.slice(0,6).map((m, i) => `
      <div style="border-radius:20px;overflow:hidden;border:2px solid ${colors[i % 6]}30">
        <div style="background:${colors[i % 6]}20;height:160px;display:flex;align-items:center;justify-content:center">
          <div style="width:100px;height:100px;border-radius:50%;background:${colors[i % 6]};display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#fff;font-family:${d.headingFont}">${INITIALS(m.name)}</div>
        </div>
        <div style="background:#fff;padding:24px">
          <h3 style="font-family:${d.headingFont};font-size:17px;font-weight:800;color:${d.textColor};margin:0 0 4px">${m.name}</h3>
          <p style="font-size:12px;color:${colors[i % 6]};font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px">${m.role}</p>
          <p style="font-size:13px;color:${d.mutedColor};line-height:1.6;margin:0">${m.bio}</p>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },

  // ── TM-10  Leadership + Culture ───────────────────────────────────────────
  {
    id: "team-10",
    name: "Leadership Spotlight",
    section: "team",
    industries: ["startup", "saas", "general"],
    themeStyles: ["modern", "minimal"],
    generate: (d) => {
      const members = DEFAULT_MEMBERS(d);
      const [ceo, ...rest] = members;
      return `
<section id="team" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:72px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:800;color:${d.textColor};margin:0">Leadership Team</h2>
    </div>
    <!-- CEO Spotlight -->
    <div style="background:linear-gradient(135deg,${d.primaryColor}08,${d.accentColor}06);border-radius:24px;padding:56px;display:grid;grid-template-columns:1fr 2fr;gap:56px;align-items:center;margin-bottom:48px;border:1px solid ${d.primaryColor}20">
      <div style="text-align:center">
        <div style="width:140px;height:140px;border-radius:50%;background:linear-gradient(135deg,${d.primaryColor},${d.accentColor});display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:900;color:#fff;margin:0 auto 20px;font-family:${d.headingFont}">${INITIALS(ceo.name)}</div>
        <h3 style="font-family:${d.headingFont};font-size:22px;font-weight:800;color:${d.textColor};margin:0 0 4px">${ceo.name}</h3>
        <p style="color:${d.primaryColor};font-weight:600;margin:0">${ceo.role}</p>
      </div>
      <div>
        <p style="font-size:17px;color:${d.mutedColor};line-height:1.9;font-style:italic;margin:0">"${ceo.bio}"</p>
      </div>
    </div>
    <!-- Rest of team -->
    <div style="display:grid;grid-template-columns:repeat(${Math.min(rest.slice(0,5).length, 5)},1fr);gap:20px">
      ${rest.slice(0,5).map(m => `
      <div style="text-align:center;padding:28px 16px;background:#fff;border-radius:16px;border:1px solid #f1f5f9;box-shadow:0 2px 16px rgba(0,0,0,.04)">
        <div style="width:72px;height:72px;border-radius:50%;background:${d.primaryColor}15;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:${d.primaryColor};margin:0 auto 14px;font-family:${d.headingFont}">${INITIALS(m.name)}</div>
        <h3 style="font-family:${d.headingFont};font-size:15px;font-weight:700;color:${d.textColor};margin:0 0 4px">${m.name}</h3>
        <p style="font-size:12px;color:${d.primaryColor};font-weight:600;margin:0">${m.role}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`;
    },
  },
];
