import React, { useState, useEffect } from "react";
import {
  ChevronLeft, Save, CheckCheck, Plus, Trash2,
  Palette, Sparkles, Zap, MessageSquare, DollarSign,
  Mail, Phone, MapPin, Users, Globe, Star,
  BarChart2, LayoutGrid, AlignLeft, Menu, Image as ImageIcon,
} from "lucide-react";
import { assembleWebsite } from "./sectionTemplates/templateEngine";
import type {
  WebsiteTemplateData, SectionType,
} from "./sectionTemplates/types";
import type { SavedWebsite } from "./websiteStorage";
import { upsertWebsite } from "./websiteStorage";

// ─────────────────────────────────────────────────────────────────────────────
// Shared field styles
// ─────────────────────────────────────────────────────────────────────────────

const fs: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  color: "#111827",
  background: "#fff",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

// ─────────────────────────────────────────────────────────────────────────────
// Small shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

const ELabel: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4,
  }}>
    {text}
  </div>
);

const EF: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <ELabel text={label} />
    {children}
  </div>
);

const TextField: React.FC<{
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <EF label={label}>
    <input
      type="text" value={value} placeholder={placeholder ?? ""}
      onChange={(e) => onChange(e.target.value)} style={fs}
    />
  </EF>
);

const TextareaField: React.FC<{
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}> = ({ label, value, onChange, rows = 3, placeholder }) => (
  <EF label={label}>
    <textarea
      value={value} placeholder={placeholder ?? ""}
      onChange={(e) => onChange(e.target.value)}
      rows={rows} style={{ ...fs, resize: "vertical" }}
    />
  </EF>
);

const ColorField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <EF label={label}>
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", background: "#fff",
    }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: 26, height: 26, border: "none", borderRadius: 5, cursor: "pointer", padding: 0, background: "none" }} />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "#374151", background: "none" }} />
    </div>
  </EF>
);

const ImageField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <EF label={label}>
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      {value && (
        <img
          src={value} alt=""
          style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb", flexShrink: 0 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      )}
      {!value && (
        <div style={{
          width: 64, height: 48, borderRadius: 6, border: "1.5px dashed #d1d5db",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          background: "#f9fafb", color: "#9ca3af",
        }}>
          <ImageIcon size={18} />
        </div>
      )}
      <input
        type="url" value={value} placeholder="https://..."
        onChange={(e) => onChange(e.target.value)} style={{ ...fs, flex: 1 }}
      />
    </div>
  </EF>
);

const ItemCard: React.FC<{ idx: number; onDelete: () => void; children: React.ReactNode }> = ({ idx, onDelete, children }) => (
  <div style={{
    background: "#f8fafc", border: "1.5px solid #e5e7eb",
    borderRadius: 10, padding: 14, position: "relative",
  }}>
    <div style={{
      position: "absolute", top: 10, right: 10,
      display: "flex", gap: 5, alignItems: "center",
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#d1d5db" }}>#{idx + 1}</span>
      <button onClick={onDelete} style={{
        background: "#fff", border: "1px solid #fecaca", borderRadius: 6,
        cursor: "pointer", padding: "3px 6px", color: "#ef4444",
        display: "flex", alignItems: "center",
      }}>
        <Trash2 size={11} />
      </button>
    </div>
    <div style={{ paddingRight: 72, display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  </div>
);

const AddButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "8px 14px", border: "1.5px dashed #c7d2fe", borderRadius: 8,
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#6366f1",
    background: "#fafbff", width: "100%",
  }}>
    <Plus size={13} /> {label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section nav definition
// ─────────────────────────────────────────────────────────────────────────────

type SectionKey =
  | "brand" | "hero" | "navigation" | "features" | "stats"
  | "about" | "testimonials" | "pricing" | "team"
  | "portfolio" | "contact" | "footer";

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: React.ReactNode;
  sectionType?: SectionType;
  always?: boolean;
}

const SECTION_DEFS: SectionDef[] = [
  { key: "brand",        label: "Brand & Colors",  icon: <Palette size={15} />,      always: true },
  { key: "hero",         label: "Hero",             icon: <Sparkles size={15} />,     always: true },
  { key: "navigation",   label: "Navigation",       icon: <Menu size={15} />,         always: true },
  { key: "features",     label: "Features",         icon: <Zap size={15} />,          sectionType: "features" },
  { key: "stats",        label: "Stats",            icon: <BarChart2 size={15} />,    sectionType: "stats" },
  { key: "about",        label: "About",            icon: <AlignLeft size={15} />,    sectionType: "about" },
  { key: "testimonials", label: "Testimonials",     icon: <MessageSquare size={15} />,sectionType: "testimonials" },
  { key: "pricing",      label: "Pricing",          icon: <DollarSign size={15} />,   sectionType: "pricing" },
  { key: "team",         label: "Team",             icon: <Users size={15} />,        sectionType: "team" },
  { key: "portfolio",    label: "Portfolio",        icon: <LayoutGrid size={15} />,   sectionType: "portfolio" },
  { key: "contact",      label: "Contact",          icon: <Mail size={15} />,         sectionType: "contact" },
  { key: "footer",       label: "Footer",           icon: <Globe size={15} />,        sectionType: "footer" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  site: SavedWebsite;
  onSaved: (updated: SavedWebsite) => void;
  onBack: () => void;
}

export const EditWebsite: React.FC<Props> = ({ site, onSaved, onBack }) => {
  // Deep-copy templateData into editable local state
  const [d, setD] = useState<WebsiteTemplateData>(() => ({
    ...site.templateData,
    features:       site.templateData.features.map((x) => ({ ...x })),
    stats:          site.templateData.stats.map((x) => ({ ...x })),
    testimonials:   site.templateData.testimonials.map((x) => ({ ...x })),
    pricingPlans:   site.templateData.pricingPlans.map((x) => ({ ...x, features: [...x.features] })),
    teamMembers:    site.templateData.teamMembers.map((x) => ({ ...x })),
    portfolioItems: site.templateData.portfolioItems.map((x) => ({ ...x })),
    navItems:       site.templateData.navItems.map((x) => ({ ...x })),
    images:         [...site.templateData.images],
    socialLinks:    { ...site.templateData.socialLinks },
  }));

  const [activeSection, setActiveSection] = useState<SectionKey>("brand");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  type ArrKey = "features" | "stats" | "testimonials" | "pricingPlans" | "teamMembers" | "portfolioItems" | "navItems";

  const setTopField = <K extends keyof WebsiteTemplateData>(k: K, v: WebsiteTemplateData[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));

  const updArr = (key: ArrKey, idx: number, patch: object) => {
    setD((prev) => {
      const arr = [...(prev[key] as object[])];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...prev, [key]: arr };
    });
  };

  const delArrItem = (key: ArrKey, idx: number) => {
    setD((prev) => ({ ...prev, [key]: (prev[key] as unknown[]).filter((_, i) => i !== idx) }));
  };

  const addArrItem = (key: ArrKey, item: object) => {
    setD((prev) => ({ ...prev, [key]: [...(prev[key] as object[]), item] }));
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = () => {
    setSaving(true);
    const result = assembleWebsite(d, {
      sections: site.activeSections,
      selections: site.sectionSelections.map(([section, templateId]) => ({ section, templateId })),
    });
    const now = new Date().toISOString();
    const updated: SavedWebsite = {
      ...site,
      templateData: d,
      html: result.html,
      businessName: d.businessName,
      primaryColor: d.primaryColor,
      accentColor: d.accentColor,
      updatedAt: now,
    };
    upsertWebsite(updated);
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
    onSaved(updated);
  };

  // ── Visible sections in nav ────────────────────────────────────────────────

  const visibleSections = SECTION_DEFS.filter((s) =>
    s.always || (s.sectionType && site.activeSections.includes(s.sectionType as SectionType))
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Section panel renderers
  // ─────────────────────────────────────────────────────────────────────────

  const renderBrand = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <TextField label="Business Name" value={d.businessName} onChange={(v) => setTopField("businessName", v)} />
      <TextField label="Tagline" value={d.tagline} onChange={(v) => setTopField("tagline", v)} placeholder="Your catchy tagline..." />
      <TextareaField label="Description" value={d.description} onChange={(v) => setTopField("description", v)} rows={4} placeholder="What your business does..." />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <ColorField label="Primary Color" value={d.primaryColor} onChange={(v) => setTopField("primaryColor", v)} />
        <ColorField label="Accent Color" value={d.accentColor} onChange={(v) => setTopField("accentColor", v)} />
      </div>
      <TextField label="CTA Button Text" value={d.ctaText} onChange={(v) => setTopField("ctaText", v)} placeholder="Get Started" />
      <TextField
        label="CTA Secondary Text (optional)"
        value={d.ctaSecondaryText ?? ""}
        onChange={(v) => setTopField("ctaSecondaryText", v || undefined)}
        placeholder="Learn More"
      />
    </div>
  );

  const renderHero = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <TextField label="Headline" value={d.heroHeadline} onChange={(v) => setTopField("heroHeadline", v)} placeholder="Your main headline..." />
      <TextareaField label="Subheadline" value={d.heroSubheadline} onChange={(v) => setTopField("heroSubheadline", v)} rows={3} placeholder="Supporting copy under the headline..." />
      <ImageField label="Hero Background Image" value={d.heroImage ?? ""} onChange={(v) => setTopField("heroImage", v || undefined)} />
    </div>
  );

  const renderNavigation = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>
        Edit the navigation links that appear in your website header.
      </p>
      {d.navItems.map((item, i) => (
        <ItemCard key={i} idx={i} onDelete={() => delArrItem("navItems", i)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <TextField label="Label" value={item.label} onChange={(v) => updArr("navItems", i, { label: v })} />
            <TextField label="Link (href)" value={item.href} onChange={(v) => updArr("navItems", i, { href: v })} placeholder="#section" />
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addArrItem("navItems", { label: "New Link", href: "#" })} label="Add Nav Item" />
    </div>
  );

  const renderFeatures = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {d.features.map((f, i) => (
        <ItemCard key={i} idx={i} onDelete={() => delArrItem("features", i)}>
          <TextField
            label="Icon (Lucide name or emoji)"
            value={f.icon ?? ""}
            onChange={(v) => updArr("features", i, { icon: v })}
            placeholder="star, shield-check, zap, ✅ ..."
          />
          <TextField label="Title" value={f.title} onChange={(v) => updArr("features", i, { title: v })} />
          <TextareaField label="Description" value={f.description} onChange={(v) => updArr("features", i, { description: v })} rows={2} />
        </ItemCard>
      ))}
      <AddButton
        onClick={() => addArrItem("features", { icon: "star", title: "New Feature", description: "Feature description" })}
        label="Add Feature"
      />
    </div>
  );

  const renderStats = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {d.stats.map((s, i) => (
        <ItemCard key={i} idx={i} onDelete={() => delArrItem("stats", i)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <TextField label="Value" value={s.value} onChange={(v) => updArr("stats", i, { value: v })} placeholder="10,000+" />
            <TextField label="Label" value={s.label} onChange={(v) => updArr("stats", i, { label: v })} placeholder="Happy Customers" />
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addArrItem("stats", { value: "100+", label: "New Metric" })} label="Add Stat" />
    </div>
  );

  const renderAbout = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <TextField label="Section Title" value={d.aboutTitle} onChange={(v) => setTopField("aboutTitle", v)} />
      <TextareaField label="Description" value={d.aboutDescription} onChange={(v) => setTopField("aboutDescription", v)} rows={5} />
      <ImageField label="About Section Image" value={d.aboutImage ?? ""} onChange={(v) => setTopField("aboutImage", v || undefined)} />
    </div>
  );

  const renderTestimonials = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {d.testimonials.map((t, i) => (
        <ItemCard key={i} idx={i} onDelete={() => delArrItem("testimonials", i)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <TextField label="Name" value={t.name} onChange={(v) => updArr("testimonials", i, { name: v })} />
            <TextField label="Role / Title" value={t.role} onChange={(v) => updArr("testimonials", i, { role: v })} />
          </div>
          <TextField label="Company (optional)" value={t.company ?? ""} onChange={(v) => updArr("testimonials", i, { company: v })} />
          <TextareaField label="Testimonial" value={t.text} onChange={(v) => updArr("testimonials", i, { text: v })} rows={3} />
          <EF label="Rating">
            <div style={{ display: "flex", gap: 5 }}>
              {[1, 2, 3, 4, 5].map((r) => {
                const active = (t.rating ?? 5) >= r;
                return (
                  <button
                    key={r}
                    onClick={() => updArr("testimonials", i, { rating: r })}
                    style={{
                      width: 30, height: 30, border: `1.5px solid ${active ? "#f59e0b" : "#e5e7eb"}`,
                      borderRadius: 6, cursor: "pointer",
                      background: active ? "#fef3c7" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Star size={13} color={active ? "#f59e0b" : "#d1d5db"} style={{ fill: active ? "#f59e0b" : "none" }} />
                  </button>
                );
              })}
            </div>
          </EF>
        </ItemCard>
      ))}
      <AddButton
        onClick={() => addArrItem("testimonials", { name: "Jane Doe", role: "Customer", text: "Amazing experience!", rating: 5 })}
        label="Add Testimonial"
      />
    </div>
  );

  const renderPricing = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {d.pricingPlans.map((p, i) => (
        <ItemCard key={i} idx={i} onDelete={() => delArrItem("pricingPlans", i)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <TextField label="Plan Name" value={p.name} onChange={(v) => updArr("pricingPlans", i, { name: v })} />
            <TextField label="Price" value={p.price} onChange={(v) => updArr("pricingPlans", i, { price: v })} placeholder="$49" />
            <TextField label="Period" value={p.period ?? ""} onChange={(v) => updArr("pricingPlans", i, { period: v })} placeholder="/month" />
          </div>
          <TextareaField
            label="Description"
            value={p.description ?? ""}
            onChange={(v) => updArr("pricingPlans", i, { description: v })}
            rows={2}
          />
          <EF label="Features (one per line)">
            <textarea
              value={(p.features ?? []).join("\n")}
              onChange={(e) => updArr("pricingPlans", i, { features: e.target.value.split("\n") })}
              rows={4}
              placeholder={"Feature one\nFeature two\nFeature three"}
              style={{ ...fs, resize: "vertical" }}
            />
          </EF>
          <EF label="Highlighted (recommended tier)">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={!!p.highlighted}
                onChange={(e) => updArr("pricingPlans", i, { highlighted: e.target.checked })}
              />
              Mark as highlighted / recommended
            </label>
          </EF>
        </ItemCard>
      ))}
      <AddButton
        onClick={() => addArrItem("pricingPlans", { name: "Pro", price: "$99", period: "/month", description: "", features: ["Feature 1", "Feature 2"], highlighted: false })}
        label="Add Plan"
      />
    </div>
  );

  const renderTeam = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {d.teamMembers.map((m, i) => (
        <ItemCard key={i} idx={i} onDelete={() => delArrItem("teamMembers", i)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <TextField label="Name" value={m.name} onChange={(v) => updArr("teamMembers", i, { name: v })} />
            <TextField label="Role / Title" value={m.role} onChange={(v) => updArr("teamMembers", i, { role: v })} />
          </div>
          <TextareaField label="Bio (optional)" value={m.bio ?? ""} onChange={(v) => updArr("teamMembers", i, { bio: v })} rows={2} />
          <ImageField label="Photo URL (optional)" value={m.photo ?? ""} onChange={(v) => updArr("teamMembers", i, { photo: v })} />
        </ItemCard>
      ))}
      <AddButton
        onClick={() => addArrItem("teamMembers", { name: "Team Member", role: "Position", bio: "", photo: "" })}
        label="Add Team Member"
      />
    </div>
  );

  const renderPortfolio = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {d.portfolioItems.map((p, i) => (
        <ItemCard key={i} idx={i} onDelete={() => delArrItem("portfolioItems", i)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <TextField label="Title" value={p.title} onChange={(v) => updArr("portfolioItems", i, { title: v })} />
            <TextField label="Category (optional)" value={p.category ?? ""} onChange={(v) => updArr("portfolioItems", i, { category: v })} />
          </div>
          <TextareaField label="Description (optional)" value={p.description ?? ""} onChange={(v) => updArr("portfolioItems", i, { description: v })} rows={2} />
          <ImageField label="Image URL" value={p.image ?? ""} onChange={(v) => updArr("portfolioItems", i, { image: v })} />
        </ItemCard>
      ))}
      <AddButton
        onClick={() => addArrItem("portfolioItems", { title: "New Project", category: "", description: "", image: "" })}
        label="Add Portfolio Item"
      />
    </div>
  );

  const renderContact = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <EF label="Email">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
          <input type="email" value={d.email} placeholder="hello@business.com"
            onChange={(e) => setTopField("email", e.target.value)} style={{ ...fs }} />
        </div>
      </EF>
      <EF label="Phone">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Phone size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
          <input type="tel" value={d.phone} placeholder="+1 (555) 000-0000"
            onChange={(e) => setTopField("phone", e.target.value)} style={{ ...fs }} />
        </div>
      </EF>
      <EF label="Address">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color="#9ca3af" style={{ flexShrink: 0 }} />
          <input type="text" value={d.address} placeholder="123 Main St, City, State"
            onChange={(e) => setTopField("address", e.target.value)} style={{ ...fs }} />
        </div>
      </EF>
    </div>
  );

  const renderFooter = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <TextareaField
        label="Footer Tagline / Copyright"
        value={d.footerTagline ?? ""}
        onChange={(v) => setTopField("footerTagline", v || undefined)}
        rows={2}
        placeholder="© 2025 Business Name. All rights reserved."
      />
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "brand":        return renderBrand();
      case "hero":         return renderHero();
      case "navigation":   return renderNavigation();
      case "features":     return renderFeatures();
      case "stats":        return renderStats();
      case "about":        return renderAbout();
      case "testimonials": return renderTestimonials();
      case "pricing":      return renderPricing();
      case "team":         return renderTeam();
      case "portfolio":    return renderPortfolio();
      case "contact":      return renderContact();
      case "footer":       return renderFooter();
    }
  };

  const activeDef = SECTION_DEFS.find((s) => s.key === activeSection);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#f8fafc", fontFamily: "Inter, -apple-system, sans-serif",
    }}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{
        minHeight: 56, background: "#0f172a", display: "flex", alignItems: "center",
        padding: isMobile ? "10px 12px" : "0 20px", gap: 8, flexShrink: 0, borderBottom: "1px solid #1e293b",
        flexWrap: isMobile ? "wrap" : "nowrap",
      }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
          color: "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "6px 8px", flexShrink: 0,
        }}>
          <ChevronLeft size={16} /> {!isMobile && "Websites"}
        </button>
        <div style={{ width: 1, height: 24, background: "#334155", flexShrink: 0 }} />
        {/* On mobile: show section selector dropdown instead of sidebar */}
        {isMobile ? (
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as SectionKey)}
            style={{
              flex: 1, background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155",
              borderRadius: 8, padding: "7px 10px", fontSize: 13, fontWeight: 600, outline: "none",
              cursor: "pointer",
            }}
          >
            {visibleSections.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        ) : (
          <span style={{
            fontSize: 13, fontWeight: 700, color: "#f1f5f9",
            maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            Editing: {d.businessName}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={handleSave} disabled={saving} style={{
          display: "flex", alignItems: "center", gap: 7, padding: isMobile ? "8px 14px" : "8px 18px",
          background: savedOk ? "#059669" : "#10b981", border: "none", borderRadius: 8,
          color: "#fff", cursor: saving ? "wait" : "pointer", fontSize: 13, fontWeight: 700,
          transition: "background .3s", opacity: saving ? 0.8 : 1, flexShrink: 0,
        }}>
          {savedOk
            ? <><CheckCheck size={14} /> {!isMobile && "Saved!"}</>
            : saving
              ? <>Saving...</>
              : <><Save size={14} /> {isMobile ? "Save" : "Save & Preview"}</>
          }
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left section nav — hidden on mobile (using dropdown in top bar instead) */}
        {!isMobile && (
          <div style={{
            width: 220, background: "#fff", borderRight: "1px solid #e5e7eb",
            overflowY: "auto", flexShrink: 0, padding: "12px 10px",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "0.6px", padding: "4px 8px 10px",
            }}>
              Content Sections
            </div>
            {visibleSections.map((s) => {
              const isActive = s.key === activeSection;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", border: "none", borderRadius: 8, cursor: "pointer",
                    background: isActive ? "#f0f4ff" : "none",
                    color: isActive ? "#4f46e5" : "#374151",
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    textAlign: "left", marginBottom: 2,
                    borderLeft: `3px solid ${isActive ? "#6366f1" : "transparent"}`,
                  }}
                >
                  <span style={{ color: isActive ? "#6366f1" : "#9ca3af", flexShrink: 0 }}>
                    {s.icon}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Main content area */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 16px" : "28px 36px", maxWidth: isMobile ? "100%" : 860 }}>

          {/* Section header */}
          <div style={{ marginBottom: 24, paddingBottom: 18, borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "linear-gradient(135deg, #f0f4ff, #e0e7ff)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1",
                flexShrink: 0,
              }}>
                {activeDef?.icon}
              </div>
              <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {activeDef?.label}
              </h2>
            </div>
            {!isMobile && (
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0 46px" }}>
                Changes apply when you click <strong>Save &amp; Preview</strong>.
              </p>
            )}
          </div>

          {/* Fields */}
          {renderContent()}

          {/* Bottom save button */}
          <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid #f1f5f9" }}>
            <button onClick={handleSave} disabled={saving} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "11px 28px",
              background: savedOk ? "#059669" : "#10b981", border: "none", borderRadius: 10,
              color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, width: isMobile ? "100%" : "auto",
              justifyContent: isMobile ? "center" : "flex-start",
            }}>
              {savedOk
                ? <><CheckCheck size={15} /> Saved & Previewed!</>
                : <><Save size={15} /> Save & Preview</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditWebsite;
