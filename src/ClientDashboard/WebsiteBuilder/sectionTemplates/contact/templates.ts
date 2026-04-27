import type { SectionTemplate, WebsiteTemplateData } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT SECTION TEMPLATES  (10 variants)
// ─────────────────────────────────────────────────────────────────────────────

export const contactTemplates: SectionTemplate[] = [

  // ── CNT-01  Side-by-Side Form + Info ──────────────────────────────────────
  {
    id: "contact-01",
    name: "Form + Info",
    section: "contact",
    industries: ["general", "consulting", "agency", "saas"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<section id="contact" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:72px">
    <div>
      <span style="color:${d.primaryColor};font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Contact</span>
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,42px);font-weight:800;color:${d.textColor};margin:12px 0 20px">Get In Touch</h2>
      <p style="font-size:16px;color:${d.mutedColor};line-height:1.8;margin:0 0 40px">${d.description}</p>
      <div style="display:flex;flex-direction:column;gap:24px">
        ${d.phone?`<div style="display:flex;align-items:center;gap:16px"><div style="width:48px;height:48px;background:${d.primaryColor}12;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px">📞</div><div><div style="font-size:12px;color:${d.mutedColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Phone</div><div style="font-size:16px;font-weight:600;color:${d.textColor}">${d.phone}</div></div></div>`:""}
        ${d.email?`<div style="display:flex;align-items:center;gap:16px"><div style="width:48px;height:48px;background:${d.primaryColor}12;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px">✉️</div><div><div style="font-size:12px;color:${d.mutedColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Email</div><div style="font-size:16px;font-weight:600;color:${d.textColor}">${d.email}</div></div></div>`:""}
        ${d.address?`<div style="display:flex;align-items:center;gap:16px"><div style="width:48px;height:48px;background:${d.primaryColor}12;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px">📍</div><div><div style="font-size:12px;color:${d.mutedColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Address</div><div style="font-size:16px;font-weight:600;color:${d.textColor}">${d.address}</div></div></div>`:""}
      </div>
    </div>
    <form style="display:flex;flex-direction:column;gap:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <input type="text" placeholder="First Name" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
        <input type="text" placeholder="Last Name" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
      </div>
      <input type="email" placeholder="Email Address" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
      <input type="text" placeholder="Subject" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
      <textarea placeholder="Your Message" rows="5" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;resize:vertical;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
      <button type="submit" style="background:${d.primaryColor};color:#fff;padding:15px;border-radius:10px;border:none;font-weight:700;font-size:16px;cursor:pointer">Send Message</button>
    </form>
  </div>
</section>`,
  },

  // ── CNT-02  Dark Contact ───────────────────────────────────────────────────
  {
    id: "contact-02",
    name: "Dark Contact",
    section: "contact",
    industries: ["agency", "media", "saas"],
    themeStyles: ["dark", "bold", "creative"],
    generate: (d) => `
<section id="contact" style="background:#0f172a;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:72px">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3vw,44px);font-weight:900;color:#fff;margin:0 0 20px">Let's Work Together</h2>
      <p style="font-size:16px;color:#94a3b8;line-height:1.8;margin:0 0 40px">${d.description}</p>
      <div style="display:flex;flex-direction:column;gap:20px">
        ${d.phone?`<a href="tel:${d.phone}" style="display:flex;align-items:center;gap:14px;text-decoration:none"><span style="font-size:20px">📞</span><span style="color:#e2e8f0;font-size:16px">${d.phone}</span></a>`:""}
        ${d.email?`<a href="mailto:${d.email}" style="display:flex;align-items:center;gap:14px;text-decoration:none"><span style="font-size:20px">✉️</span><span style="color:#e2e8f0;font-size:16px">${d.email}</span></a>`:""}
      </div>
    </div>
    <form style="display:flex;flex-direction:column;gap:14px">
      <input type="text" placeholder="Your Name" style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#334155'">
      <input type="email" placeholder="Email Address" style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#334155'">
      <textarea placeholder="Your Message" rows="5" style="background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;resize:vertical;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#334155'"></textarea>
      <button type="submit" style="background:${d.primaryColor};color:#fff;padding:14px;border-radius:10px;border:none;font-weight:700;font-size:15px;cursor:pointer">${d.ctaText}</button>
    </form>
  </div>
</section>`,
  },

  // ── CNT-03  Centered Minimal ───────────────────────────────────────────────
  {
    id: "contact-03",
    name: "Centered Form",
    section: "contact",
    industries: ["portfolio", "beauty", "fitness"],
    themeStyles: ["minimal", "elegant"],
    generate: (d) => `
<section id="contact" style="background:#f8fafc;padding:96px 24px;text-align:center;font-family:${d.bodyFont}">
  <div style="max-width:600px;margin:0 auto">
    <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 12px">Say Hello</h2>
    <p style="font-size:16px;color:${d.mutedColor};margin:0 0 40px;line-height:1.7">${d.description}</p>
    <form style="display:flex;flex-direction:column;gap:14px;text-align:left">
      <input type="text" placeholder="Name" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
      <input type="email" placeholder="Email" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
      <textarea placeholder="Message" rows="5" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;resize:vertical;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
      <button type="submit" style="background:${d.primaryColor};color:#fff;padding:14px;border-radius:10px;border:none;font-weight:700;font-size:15px;cursor:pointer">Send Message</button>
    </form>
  </div>
</section>`,
  },

  // ── CNT-04  Map + Contact ──────────────────────────────────────────────────
  {
    id: "contact-04",
    name: "Map + Details",
    section: "contact",
    industries: ["restaurant", "realestate", "construction", "healthcare"],
    themeStyles: ["corporate", "classic"],
    generate: (d) => `
<section id="contact" style="background:${d.bgColor};padding:0;font-family:${d.bodyFont}">
  <div style="background:${d.primaryColor}08;padding:80px 0">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px">
      <div>
        <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,40px);font-weight:800;color:${d.textColor};margin:0 0 32px">Find Us</h2>
        <div style="display:flex;flex-direction:column;gap:28px">
          ${d.address?`<div><div style="font-size:12px;font-weight:700;color:${d.primaryColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Address</div><div style="font-size:15px;color:${d.textColor}">${d.address}</div></div>`:""}
          ${d.phone?`<div><div style="font-size:12px;font-weight:700;color:${d.primaryColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Phone</div><a href="tel:${d.phone}" style="font-size:15px;color:${d.textColor};text-decoration:none">${d.phone}</a></div>`:""}
          ${d.email?`<div><div style="font-size:12px;font-weight:700;color:${d.primaryColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Email</div><a href="mailto:${d.email}" style="font-size:15px;color:${d.textColor};text-decoration:none">${d.email}</a></div>`:""}
          <div>
            <div style="font-size:12px;font-weight:700;color:${d.primaryColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Hours</div>
            <div style="font-size:15px;color:${d.textColor}">Mon–Fri: 9am – 6pm<br>Sat: 10am – 4pm<br>Sun: Closed</div>
          </div>
        </div>
      </div>
      <form style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.06);display:flex;flex-direction:column;gap:14px">
        <h3 style="font-family:${d.headingFont};font-size:20px;font-weight:700;color:${d.textColor};margin:0 0 8px">Send a Message</h3>
        <input type="text" placeholder="Your Name" style="border:1.5px solid #e5e7eb;border-radius:8px;padding:13px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
        <input type="email" placeholder="Email" style="border:1.5px solid #e5e7eb;border-radius:8px;padding:13px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
        <textarea placeholder="Message" rows="4" style="border:1.5px solid #e5e7eb;border-radius:8px;padding:13px 16px;font-size:14px;outline:none;resize:vertical;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
        <button type="submit" style="background:${d.primaryColor};color:#fff;padding:13px;border-radius:8px;border:none;font-weight:700;font-size:15px;cursor:pointer">Submit</button>
      </form>
    </div>
  </div>
</section>`,
  },

  // ── CNT-05  Booking / Appointment ─────────────────────────────────────────
  {
    id: "contact-05",
    name: "Appointment Booking",
    section: "contact",
    industries: ["healthcare", "beauty", "fitness", "legal"],
    themeStyles: ["modern", "minimal"],
    generate: (d) => `
<section id="contact" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:760px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0 0 12px">Book an Appointment</h2>
      <p style="font-size:16px;color:${d.mutedColor}">Choose a convenient time and we'll confirm within 24 hours.</p>
    </div>
    <div style="background:#fff;border-radius:20px;padding:48px;box-shadow:0 8px 48px rgba(0,0,0,.08);border:1px solid #f1f5f9">
      <form style="display:flex;flex-direction:column;gap:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <input type="text" placeholder="First Name" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
          <input type="text" placeholder="Last Name" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
        </div>
        <input type="email" placeholder="Email" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
        <input type="tel" placeholder="Phone" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <input type="date" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont};color:${d.textColor}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
          <select style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont};background:#fff;color:${d.textColor}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
            <option value="">Select Time</option>
            <option>9:00 AM</option><option>10:00 AM</option><option>11:00 AM</option>
            <option>1:00 PM</option><option>2:00 PM</option><option>3:00 PM</option>
          </select>
        </div>
        <textarea placeholder="Additional notes" rows="3" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;resize:vertical;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
        <button type="submit" style="background:${d.primaryColor};color:#fff;padding:15px;border-radius:10px;border:none;font-weight:700;font-size:16px;cursor:pointer">Confirm Appointment</button>
      </form>
    </div>
  </div>
</section>`,
  },

  // ── CNT-06  Big CTA Banner Contact ────────────────────────────────────────
  {
    id: "contact-06",
    name: "CTA Banner Contact",
    section: "contact",
    industries: ["nonprofit", "education", "consulting"],
    themeStyles: ["bold", "corporate"],
    generate: (d) => `
<section id="contact" style="background:${d.primaryColor};padding:80px 24px;text-align:center;font-family:${d.bodyFont}">
  <div style="max-width:700px;margin:0 auto">
    <h2 style="font-family:${d.headingFont};font-size:clamp(28px,3.5vw,52px);font-weight:900;color:#fff;margin:0 0 16px">Ready to Get Started?</h2>
    <p style="font-size:17px;color:rgba(255,255,255,.85);margin:0 0 40px;line-height:1.7">${d.description}</p>
    <div style="background:rgba(255,255,255,.1);border-radius:16px;padding:32px">
      <form style="display:flex;gap:0;max-width:500px;margin:0 auto">
        <input type="email" placeholder="Enter your email" style="flex:1;background:rgba(255,255,255,.9);border:none;padding:15px 20px;border-radius:10px 0 0 10px;font-size:15px;outline:none;font-family:${d.bodyFont};color:#111">
        <button type="submit" style="background:#fff;color:${d.primaryColor};border:none;padding:15px 28px;border-radius:0 10px 10px 0;font-weight:800;font-size:15px;cursor:pointer;white-space:nowrap">Get Started</button>
      </form>
    </div>
  </div>
</section>`,
  },

  // ── CNT-07  3-Card Contact Options ────────────────────────────────────────
  {
    id: "contact-07",
    name: "Contact Options",
    section: "contact",
    industries: ["healthcare", "realestate", "manufacturing"],
    themeStyles: ["minimal", "modern"],
    generate: (d) => `
<section id="contact" style="background:${d.bgColor};padding:80px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px">
    <div style="text-align:center;margin-bottom:56px">
      <h2 style="font-family:${d.headingFont};font-size:clamp(26px,3vw,42px);font-weight:800;color:${d.textColor};margin:0">How Can We Help?</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px">
      ${[{icon:"📞",label:"Call Us",val:d.phone||"(555) 000-0000",href:`tel:${d.phone}`,btn:"Call Now"},{icon:"✉️",label:"Email Us",val:d.email||"hello@example.com",href:`mailto:${d.email}`,btn:"Send Email"},{icon:"📍",label:"Visit Us",val:d.address||"123 Main Street",href:"#",btn:"Get Directions"}].map(c=>`
      <div style="background:#fff;border-radius:16px;padding:40px 28px;text-align:center;border:1px solid #e5e7eb;box-shadow:0 4px 20px rgba(0,0,0,.05)">
        <div style="font-size:48px;margin-bottom:20px">${c.icon}</div>
        <h3 style="font-family:${d.headingFont};font-size:18px;font-weight:700;color:${d.textColor};margin:0 0 8px">${c.label}</h3>
        <p style="font-size:14px;color:${d.mutedColor};margin:0 0 24px">${c.val}</p>
        <a href="${c.href}" style="background:${d.primaryColor}12;color:${d.primaryColor};padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${c.btn}</a>
      </div>`).join("")}
    </div>
  </div>
</section>`,
  },

  // ── CNT-08  Restaurant Reservation ────────────────────────────────────────
  {
    id: "contact-08",
    name: "Restaurant Reservation",
    section: "contact",
    industries: ["restaurant", "travel", "beauty"],
    themeStyles: ["elegant", "luxury"],
    generate: (d) => `
<section id="contact" style="background:#faf7f4;padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center">
    <div>
      <p style="color:${d.primaryColor};font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-weight:600">Reservations</p>
      <h2 style="font-family:Georgia,serif;font-size:clamp(28px,3vw,44px);font-weight:400;color:#3d2b1f;margin:0 0 24px">Book Your Table</h2>
      <p style="font-size:16px;color:#8c7b6e;line-height:1.9;margin:0 0 36px">${d.description}</p>
      <div style="display:flex;flex-direction:column;gap:16px">
        ${d.phone?`<div><span style="font-size:13px;color:#8c7b6e;font-weight:600;display:block;margin-bottom:4px">Reservations Line</span><a href="tel:${d.phone}" style="font-size:18px;font-weight:600;color:#3d2b1f;text-decoration:none">${d.phone}</a></div>`:""}
        ${d.email?`<div><span style="font-size:13px;color:#8c7b6e;font-weight:600;display:block;margin-bottom:4px">Email</span><a href="mailto:${d.email}" style="font-size:16px;color:#3d2b1f;text-decoration:none">${d.email}</a></div>`:""}
      </div>
    </div>
    <form style="background:#fff;border-radius:4px;padding:44px;box-shadow:0 4px 24px rgba(0,0,0,.05);border:1px solid #e8ddd5;display:flex;flex-direction:column;gap:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <input type="text" placeholder="Full Name" style="border:1px solid #e8ddd5;padding:13px 16px;font-size:14px;outline:none;font-family:${d.bodyFont};color:#3d2b1f" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e8ddd5'">
        <input type="tel" placeholder="Phone" style="border:1px solid #e8ddd5;padding:13px 16px;font-size:14px;outline:none;font-family:${d.bodyFont};color:#3d2b1f" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e8ddd5'">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <input type="date" style="border:1px solid #e8ddd5;padding:13px 16px;font-size:14px;outline:none;font-family:${d.bodyFont};color:#3d2b1f" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e8ddd5'">
        <select style="border:1px solid #e8ddd5;padding:13px 16px;font-size:14px;outline:none;background:#fff;font-family:${d.bodyFont};color:#3d2b1f" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e8ddd5'">
          <option>Guests: 1</option><option>Guests: 2</option><option>Guests: 3-4</option><option>Guests: 5-6</option><option>7+</option>
        </select>
      </div>
      <textarea placeholder="Special requests" rows="3" style="border:1px solid #e8ddd5;padding:13px 16px;font-size:14px;outline:none;resize:vertical;font-family:${d.bodyFont};color:#3d2b1f" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e8ddd5'"></textarea>
      <button type="submit" style="background:${d.primaryColor};color:#fff;padding:14px;border:none;font-weight:600;font-size:15px;cursor:pointer;letter-spacing:0.5px">Confirm Reservation</button>
    </form>
  </div>
</section>`,
  },

  // ── CNT-09  Quick Contact Bar ─────────────────────────────────────────────
  {
    id: "contact-09",
    name: "Quick Contact Bar",
    section: "contact",
    industries: ["automotive", "construction", "general"],
    themeStyles: ["bold", "modern"],
    generate: (d) => `
<section id="contact" style="background:#1a1a2e;padding:0;font-family:${d.bodyFont}">
  <div style="max-width:1200px;margin:0 auto;padding:40px 24px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;align-items:center">
    <div style="padding:0 24px;border-right:1px solid #2d2d4e">
      <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">CALL US</div>
      <a href="tel:${d.phone}" style="font-size:18px;font-weight:700;color:#fff;text-decoration:none">${d.phone||"(555) 000-0000"}</a>
    </div>
    <div style="padding:0 24px;border-right:1px solid #2d2d4e">
      <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">EMAIL</div>
      <a href="mailto:${d.email}" style="font-size:15px;font-weight:600;color:#fff;text-decoration:none">${d.email||"hello@example.com"}</a>
    </div>
    <div style="padding:0 24px;border-right:1px solid #2d2d4e">
      <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">ADDRESS</div>
      <div style="font-size:14px;color:#e2e8f0">${d.address||"123 Main Street"}</div>
    </div>
    <div style="padding:0 24px;text-align:right">
      <a href="${d.ctaLink}" style="background:${d.primaryColor};color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">${d.ctaText}</a>
    </div>
  </div>
</section>`,
  },

  // ── CNT-10  Social + Form ─────────────────────────────────────────────────
  {
    id: "contact-10",
    name: "Social + Form",
    section: "contact",
    industries: ["startup", "portfolio", "media", "agency"],
    themeStyles: ["creative", "modern", "minimal"],
    generate: (d) => `
<section id="contact" style="background:${d.bgColor};padding:96px 0;font-family:${d.bodyFont}">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 2fr;gap:72px">
    <div>
      <h2 style="font-family:${d.headingFont};font-size:clamp(24px,2.5vw,36px);font-weight:900;color:${d.textColor};margin:0 0 20px">Connect With Us</h2>
      <p style="font-size:15px;color:${d.mutedColor};line-height:1.8;margin:0 0 36px">${d.description}</p>
      <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:36px">
        ${d.email?`<a href="mailto:${d.email}" style="color:${d.primaryColor};font-size:15px;font-weight:600;text-decoration:none">✉ ${d.email}</a>`:""}
        ${d.phone?`<a href="tel:${d.phone}" style="color:${d.primaryColor};font-size:15px;font-weight:600;text-decoration:none">📞 ${d.phone}</a>`:""}
      </div>
      <div style="display:flex;gap:12px">
        ${d.socialLinks.linkedin?`<a href="${d.socialLinks.linkedin}" style="width:40px;height:40px;background:${d.primaryColor}16;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;text-decoration:none">in</a>`:""}
        ${d.socialLinks.twitter?`<a href="${d.socialLinks.twitter}" style="width:40px;height:40px;background:${d.primaryColor}16;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;text-decoration:none">🐦</a>`:""}
        ${d.socialLinks.instagram?`<a href="${d.socialLinks.instagram}" style="width:40px;height:40px;background:${d.primaryColor}16;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;text-decoration:none">📸</a>`:""}
      </div>
    </div>
    <form style="display:flex;flex-direction:column;gap:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <input type="text" placeholder="Name" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
        <input type="email" placeholder="Email" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
      </div>
      <input type="text" placeholder="Subject" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'">
      <textarea placeholder="Message" rows="6" style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;font-size:14px;outline:none;resize:vertical;font-family:${d.bodyFont}" onfocus="this.style.borderColor='${d.primaryColor}'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
      <button type="submit" style="background:${d.primaryColor};color:#fff;padding:15px;border-radius:10px;border:none;font-weight:700;font-size:16px;cursor:pointer">Send Message →</button>
    </form>
  </div>
</section>`,
  },
];
