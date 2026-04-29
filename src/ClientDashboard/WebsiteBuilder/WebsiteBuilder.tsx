import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Sparkles, Globe, Download, RefreshCw, ChevronLeft,
  ChevronRight, Check, Monitor, Smartphone, Layers,
  ArrowRight, Copy, CheckCheck, X, Save, Trash2, Eye,
  Pencil, Wifi, Bot, Plus, Calendar, Clock,
  CheckCircle2,
} from "lucide-react";
import {
  generateStudioWebsite,
  StudioFormData,
  INDUSTRY_SECTIONS,
} from "./aiStudioService";
import {
  assembleWebsite,
  getTemplatesForSection,
} from "./sectionTemplates/templateEngine";
import type {
  WebsiteTemplateData,
  SectionType,
  Industry,
  ThemeStyle,
} from "./sectionTemplates/types";
import type { SavedWebsite } from "./websiteStorage";
import {
  loadWebsites, persistWebsites, upsertWebsite,
  removeWebsite, newId,
} from "./websiteStorage";
import { EditWebsite } from "./EditWebsite";

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Data constants
// ─────────────────────────────────────────────────────────────────────────────

const INDUSTRIES: { id: Industry; label: string; emoji: string }[] = [
  { id: "saas",          label: "SaaS / Software",     emoji: "🚀" },
  { id: "startup",       label: "Startup",             emoji: "💡" },
  { id: "agency",        label: "Creative Agency",     emoji: "🎨" },
  { id: "ecommerce",     label: "E-Commerce",          emoji: "🛒" },
  { id: "restaurant",    label: "Restaurant / Food",   emoji: "🍽️" },
  { id: "healthcare",    label: "Healthcare",          emoji: "🏥" },
  { id: "realestate",    label: "Real Estate",         emoji: "🏘️" },
  { id: "legal",         label: "Legal",               emoji: "⚖️" },
  { id: "finance",       label: "Finance",             emoji: "💰" },
  { id: "education",     label: "Education",           emoji: "🎓" },
  { id: "fitness",       label: "Fitness / Gym",       emoji: "💪" },
  { id: "consulting",    label: "Consulting",          emoji: "📋" },
  { id: "construction",  label: "Construction",        emoji: "🏗️" },
  { id: "automotive",    label: "Automotive",          emoji: "🚗" },
  { id: "beauty",        label: "Beauty / Salon",      emoji: "💄" },
  { id: "travel",        label: "Travel / Tourism",    emoji: "✈️" },
  { id: "nonprofit",     label: "Non-Profit",          emoji: "❤️" },
  { id: "manufacturing", label: "Manufacturing",       emoji: "⚙️" },
  { id: "media",         label: "Media / Blog",        emoji: "📺" },
  { id: "portfolio",     label: "Portfolio",           emoji: "🗂️" },
  { id: "general",       label: "General Business",    emoji: "🏢" },
];

const THEMES: { id: ThemeStyle; label: string; desc: string; primary: string; bg: string }[] = [
  { id: "modern",    label: "Modern",    desc: "Clean & Contemporary",      primary: "#6366f1", bg: "#ffffff" },
  { id: "minimal",   label: "Minimal",   desc: "Simple & Pure",             primary: "#0f172a", bg: "#f9fafb" },
  { id: "bold",      label: "Bold",      desc: "Strong & Impactful",        primary: "#f97316", bg: "#f8fafc" },
  { id: "elegant",   label: "Elegant",   desc: "Refined & Sophisticated",   primary: "#b45309", bg: "#faf9f7" },
  { id: "playful",   label: "Playful",   desc: "Fun & Energetic",           primary: "#8b5cf6", bg: "#fefce8" },
  { id: "corporate", label: "Corporate", desc: "Professional & Structured", primary: "#1e40af", bg: "#f8fafc" },
  { id: "dark",      label: "Dark",      desc: "Dark & Sleek",              primary: "#6366f1", bg: "#0f172a" },
  { id: "luxury",    label: "Luxury",    desc: "Premium & Exclusive",       primary: "#d97706", bg: "#1a0f0a" },
  { id: "creative",  label: "Creative",  desc: "Artistic & Unique",         primary: "#ec4899", bg: "#ffffff" },
  { id: "classic",   label: "Classic",   desc: "Timeless & Traditional",    primary: "#1e3a5f", bg: "#fdfbf7" },
];

const TONES = ["professional","friendly","luxurious","energetic","authoritative","approachable","innovative","warm"];

const ACCENT_MAP: Record<Industry, { primary: string; accent: string }> = {
  saas:          { primary: "#6366f1", accent: "#06b6d4" },
  startup:       { primary: "#8b5cf6", accent: "#f59e0b" },
  agency:        { primary: "#f59e0b", accent: "#ef4444" },
  ecommerce:     { primary: "#ec4899", accent: "#f59e0b" },
  restaurant:    { primary: "#b45309", accent: "#dc2626" },
  healthcare:    { primary: "#0ea5e9", accent: "#10b981" },
  realestate:    { primary: "#1e40af", accent: "#f59e0b" },
  legal:         { primary: "#1e3a5f", accent: "#b45309" },
  finance:       { primary: "#1e40af", accent: "#0ea5e9" },
  education:     { primary: "#7c3aed", accent: "#0ea5e9" },
  fitness:       { primary: "#ef4444", accent: "#f97316" },
  consulting:    { primary: "#1e40af", accent: "#6366f1" },
  construction:  { primary: "#ea580c", accent: "#1e293b" },
  automotive:    { primary: "#dc2626", accent: "#1e293b" },
  beauty:        { primary: "#db2777", accent: "#a855f7" },
  travel:        { primary: "#0ea5e9", accent: "#10b981" },
  nonprofit:     { primary: "#10b981", accent: "#6366f1" },
  manufacturing: { primary: "#475569", accent: "#f97316" },
  media:         { primary: "#7c3aed", accent: "#ec4899" },
  portfolio:     { primary: "#0f172a", accent: "#6366f1" },
  general:       { primary: "#2563eb", accent: "#7c3aed" },
};

const SECTION_LABELS: Record<SectionType, string> = {
  header:       "Header / Nav",
  hero:         "Hero Section",
  features:     "Features",
  cta:          "Call to Action",
  stats:        "Stats / Numbers",
  about:        "About Us",
  testimonials: "Testimonials",
  pricing:      "Pricing",
  contact:      "Contact",
  footer:       "Footer",
  portfolio:    "Portfolio / Gallery",
  team:         "Team Members",
};

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers / sub-components
// ─────────────────────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10,
  padding: "11px 14px", fontSize: 14, color: "#111827", background: "#fff",
  outline: "none", fontFamily: "inherit",
};

const StepBadge: React.FC<{ step: number; current: number; label: string }> = ({ step, current, label }) => {
  const done = step < current;
  const active = step === current;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
        background: done ? "#10b981" : active ? "#6366f1" : "#e5e7eb",
        color: done || active ? "#fff" : "#9ca3af", flexShrink: 0,
      }}>
        {done ? <Check size={14} /> : step}
      </div>
      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#0f172a" : "#6b7280" }}>
        {label}
      </span>
    </div>
  );
};

const ColorInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {label}
    </label>
    <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", background: "#fff" }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: 28, height: 28, border: "none", borderRadius: 6, cursor: "pointer", padding: 0, background: "none" }} />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "#374151", background: "none" }} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Website Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface WebsiteCardProps {
  site: SavedWebsite;
  onView: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onConnectAgent: () => void;
}

const WebsiteCard: React.FC<WebsiteCardProps> = ({ site, onView, onEdit, onPublish, onDelete, onConnectAgent }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ind = INDUSTRIES.find((i) => i.id === site.industry);

  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
      overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)",
      display: "flex", flexDirection: "column",
      transition: "box-shadow .2s, transform .2s",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,.12)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
    >
      {/* Color bar */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${site.primaryColor}, ${site.accentColor})` }} />

      {/* Preview thumbnail */}
      <div
        style={{
          height: 130, background: `linear-gradient(135deg, ${site.primaryColor}18, ${site.accentColor}12)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", cursor: "pointer", overflow: "hidden",
        }}
        onClick={onView}
      >
        {/* Mini browser chrome */}
        <div style={{ width: "80%", background: "#fff", borderRadius: 8, padding: "6px 10px", boxShadow: "0 4px 20px rgba(0,0,0,.12)" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            {["#ef4444","#f59e0b","#10b981"].map((c) => (
              <div key={c} style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{ height: 6, background: `${site.primaryColor}30`, borderRadius: 2, marginBottom: 4 }} />
          <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, marginBottom: 3 }} />
          <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, width: "70%" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, marginTop: 8 }}>
            {[0,1,2].map((i) => (
              <div key={i} style={{ height: 20, background: i === 1 ? `${site.primaryColor}25` : "#f8fafc", borderRadius: 3 }} />
            ))}
          </div>
        </div>
        {/* Status badge */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          padding: "3px 8px", borderRadius: 50, fontSize: 10, fontWeight: 700,
          background: site.status === "published" ? "#dcfce7" : "#f1f5f9",
          color: site.status === "published" ? "#16a34a" : "#6b7280",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {site.status === "published" ? <CheckCircle2 size={9} /> : <Clock size={9} />}
          {site.status === "published" ? "Published" : "Draft"}
        </div>
        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0, background: `${site.primaryColor}cc`,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity .2s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; }}
          onClick={onView}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontWeight: 700, fontSize: 14 }}>
            <Eye size={18} /> Preview
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "16px 18px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", lineHeight: 1.3 }}>
              {site.businessName}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>{ind?.emoji}</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{ind?.label}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: site.primaryColor, border: "1px solid #e5e7eb" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: site.accentColor, border: "1px solid #e5e7eb" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", background: `${site.primaryColor}12`, color: site.primaryColor, borderRadius: 50 }}>
            {site.themeStyle}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", background: "#f1f5f9", color: "#64748b", borderRadius: 50 }}>
            {site.sectionsCount} sections
          </span>
          {site.connectedAgent && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", background: "#f0fdf4", color: "#16a34a", borderRadius: 50, display: "flex", alignItems: "center", gap: 3 }}>
              <Bot size={9} /> AI Connected
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af" }}>
          <Calendar size={10} />
          <span>Saved {fmt(site.updatedAt)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={onView} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, cursor: "pointer",
          fontSize: 12, fontWeight: 600, background: "#fff", color: "#374151",
        }}>
          <Eye size={13} /> View
        </button>

        <button onClick={onEdit} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, cursor: "pointer",
          fontSize: 12, fontWeight: 600, background: "#fff", color: "#374151",
        }}>
          <Pencil size={13} /> Edit
        </button>

        <button onClick={onPublish} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          padding: "8px 10px", border: `1.5px solid ${site.status === "published" ? "#86efac" : "#e5e7eb"}`,
          borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
          background: site.status === "published" ? "#f0fdf4" : "#fff",
          color: site.status === "published" ? "#16a34a" : "#374151",
        }}>
          <Wifi size={13} /> {site.status === "published" ? "Unpublish" : "Publish"}
        </button>

        <button onClick={onConnectAgent} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          padding: "8px 10px",
          border: `1.5px solid ${site.connectedAgent ? "#bbf7d0" : "#e5e7eb"}`,
          borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
          background: site.connectedAgent ? "#f0fdf4" : "#fff",
          color: site.connectedAgent ? "#16a34a" : "#374151",
        }}>
          <Bot size={13} /> {site.connectedAgent ? "Agent" : "Connect AI"}
        </button>

        {confirmDelete ? (
          <>
            <button onClick={() => { onDelete(); setConfirmDelete(false); }} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "8px 10px", border: "1.5px solid #fecaca", borderRadius: 8, cursor: "pointer",
              fontSize: 12, fontWeight: 700, background: "#fef2f2", color: "#dc2626",
            }}>
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} style={{
              padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, cursor: "pointer",
              fontSize: 12, background: "#fff", color: "#6b7280",
            }}>
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, cursor: "pointer",
            background: "#fff", color: "#9ca3af",
          }}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Connect AI Employee Modal
// ─────────────────────────────────────────────────────────────────────────────

const ConnectAgentModal: React.FC<{
  site: SavedWebsite;
  onClose: () => void;
  onSave: (agentName: string) => void;
}> = ({ site, onClose, onSave }) => {
  const [agentName, setAgentName] = useState(site.connectedAgent ?? "");
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div
        style={{ background: "#fff", borderRadius: 20, padding: 32, width: "min(440px, 92vw)", boxShadow: "0 24px 60px rgba(0,0,0,.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Connect AI Employee</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{site.businessName}</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 20 }}>
          Connect an AI Employee to handle live chat, calls, and customer queries directly on your website.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            AI Employee Name / ID
          </label>
          <input
            type="text"
            placeholder="e.g. Aria Sales Bot, Support Agent #1"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            style={{ ...fieldStyle }}
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px 0", border: "1.5px solid #e5e7eb", borderRadius: 10,
            cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151", background: "#fff",
          }}>
            Cancel
          </button>
          <button onClick={() => { onSave(agentName.trim()); }} style={{
            flex: 2, padding: "11px 0", border: "none", borderRadius: 10,
            cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#fff",
            background: "linear-gradient(135deg, #10b981, #059669)",
          }}>
            {agentName.trim() ? "Save Connection" : "Disconnect"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

type StudioView = "dashboard" | "form" | "generating" | "preview" | "edit";

export default function WebsiteBuilder() {
  const [view, setView] = useState<StudioView>("dashboard");
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [activeSectionPanel, setActiveSectionPanel] = useState<SectionType | null>(null);
  const [connectAgentFor, setConnectAgentFor] = useState<SavedWebsite | null>(null);
  const [editingSite, setEditingSite] = useState<SavedWebsite | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Saved websites list
  const [websites, setWebsites] = useState<SavedWebsite[]>(() => loadWebsites());

  // Current editing session
  const [currentId, setCurrentId] = useState<string>("");
  const [form, setForm] = useState<StudioFormData>({
    businessName: "", tagline: "", description: "",
    industry: "general", themeStyle: "modern", tone: "professional",
    primaryColor: ACCENT_MAP.general.primary, accentColor: ACCENT_MAP.general.accent,
    email: "", phone: "", address: "",
  });
  const [templateData, setTemplateData] = useState<WebsiteTemplateData | null>(null);
  const [sectionSelections, setSectionSelections] = useState<Map<SectionType, string>>(new Map());
  const [activeSections, setActiveSections] = useState<SectionType[]>([]);
  const [assembledHtml, setAssembledHtml] = useState<string>("");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const setField = useCallback(<K extends keyof StudioFormData>(key: K, value: StudioFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleIndustryChange = (id: Industry) => {
    const colors = ACCENT_MAP[id];
    setField("industry", id);
    setField("primaryColor", colors.primary);
    setField("accentColor", colors.accent);
  };

  const reassemble = useCallback((data: WebsiteTemplateData, selections: Map<SectionType, string>, sections: SectionType[]) => {
    const result = assembleWebsite(data, {
      sections,
      selections: Array.from(selections.entries()).map(([section, templateId]) => ({ section, templateId })),
    });
    setAssembledHtml(result.html);
  }, []);

  const handleGenerate = async () => {
    if (!form.businessName.trim()) { setError("Please enter your business name."); return; }
    setError("");
    setView("generating");
    setProgress("Starting AI generation...");
    try {
      const data = await generateStudioWebsite(form, setProgress);
      const sections = INDUSTRY_SECTIONS[form.industry] ?? INDUSTRY_SECTIONS.general;
      const defaultSelections = new Map<SectionType, string>();
      const result = assembleWebsite(data, { sections });
      result.sectionsUsed.forEach(({ section, templateId }) => { defaultSelections.set(section, templateId); });
      setTemplateData(data);
      setSectionSelections(defaultSelections);
      setActiveSections(sections);
      setAssembledHtml(result.html);
      setSaved(false);
      setView("preview");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
      setView("form");
    }
  };

  const handleTemplateSwitch = (section: SectionType, templateId: string) => {
    if (!templateData) return;
    const newSelections = new Map(sectionSelections);
    newSelections.set(section, templateId);
    setSectionSelections(newSelections);
    reassemble(templateData, newSelections, activeSections);
    setSaved(false);
  };

  const handleSave = () => {
    if (!templateData) return;
    const id = currentId || newId();
    const now = new Date().toISOString();
    const existing = websites.find((w) => w.id === id);
    const site: SavedWebsite = {
      id,
      savedAt: existing?.savedAt ?? now,
      updatedAt: now,
      businessName: templateData.businessName,
      industry: form.industry,
      themeStyle: form.themeStyle,
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      sectionsCount: activeSections.length,
      html: assembledHtml,
      form,
      templateData,
      sectionSelections: Array.from(sectionSelections.entries()),
      activeSections,
      status: existing?.status ?? "draft",
      connectedAgent: existing?.connectedAgent,
    };
    const updated = upsertWebsite(site);
    setWebsites(updated);
    setCurrentId(id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExport = () => {
    const blob = new Blob([assembledHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.businessName.replace(/\s+/g, "-").toLowerCase()}-website.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(assembledHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (id: string) => {
    const updated = removeWebsite(id);
    setWebsites(updated);
  };

  const handleView = (site: SavedWebsite) => {
    setCurrentId(site.id);
    setForm(site.form);
    setTemplateData(site.templateData);
    setSectionSelections(new Map(site.sectionSelections));
    setActiveSections(site.activeSections);
    setAssembledHtml(site.html);
    setSaved(true);
    setView("preview");
  };

  const handleEdit = (site: SavedWebsite) => {
    setEditingSite(site);
    setView("edit");
  };

  const handleEditSaved = (updated: SavedWebsite) => {
    setWebsites(loadWebsites());
    // Load updated site into preview
    setCurrentId(updated.id);
    setForm(updated.form);
    setTemplateData(updated.templateData);
    setSectionSelections(new Map(updated.sectionSelections));
    setActiveSections(updated.activeSections);
    setAssembledHtml(updated.html);
    setSaved(true);
    setEditingSite(null);
    setView("preview");
  };

  const handleTogglePublish = (id: string) => {
    const updated = loadWebsites().map((w) =>
      w.id === id ? { ...w, status: (w.status === "published" ? "draft" : "published") as "draft" | "published", updatedAt: new Date().toISOString() } : w
    );
    persistWebsites(updated);
    setWebsites(updated);
  };

  const handleConnectAgent = (site: SavedWebsite, agentName: string) => {
    const updated = loadWebsites().map((w) =>
      w.id === site.id ? { ...w, connectedAgent: agentName || undefined, updatedAt: new Date().toISOString() } : w
    );
    persistWebsites(updated);
    setWebsites(updated);
    setConnectAgentFor(null);
  };

  const sectionTemplateOptions = useMemo(
    () => activeSectionPanel ? getTemplatesForSection(activeSectionPanel) : [],
    [activeSectionPanel]
  );

  const startNew = () => {
    setCurrentId("");
    setForm({
      businessName: "", tagline: "", description: "",
      industry: "general", themeStyle: "modern", tone: "professional",
      primaryColor: ACCENT_MAP.general.primary, accentColor: ACCENT_MAP.general.accent,
      email: "", phone: "", address: "",
    });
    setTemplateData(null);
    setSectionSelections(new Map());
    setActiveSections([]);
    setAssembledHtml("");
    setStep(1);
    setError("");
    setSaved(false);
    setView("form");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CONNECT AGENT MODAL
  // ─────────────────────────────────────────────────────────────────────────

  const connectAgentModal = connectAgentFor ? (
    <ConnectAgentModal
      site={connectAgentFor}
      onClose={() => setConnectAgentFor(null)}
      onSave={(name) => handleConnectAgent(connectAgentFor, name)}
    />
  ) : null;

  // ─────────────────────────────────────────────────────────────────────────
  // EDIT VIEW
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "edit" && editingSite) {
    return (
      <EditWebsite
        site={editingSite}
        onSaved={handleEditSaved}
        onBack={() => setView("dashboard")}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "dashboard") {
    return (
      <>
        {connectAgentModal}
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, -apple-system, sans-serif" }}>
          {/* Header */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: isMobile ? "12px 16px" : "0 32px", minHeight: 64, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>AI Website Studio</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Your websites</div>
              </div>
            </div>
            {websites.length === 0 ? (
              <button onClick={startNew} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
                borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
                boxShadow: "0 4px 14px rgba(99,102,241,.4)",
              }}>
                <Plus size={16} /> Create New Website
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
                <CheckCircle2 size={14} color="#16a34a" />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>1 website (max). Delete to create a new one.</span>
              </div>
            )}
          </div>

          <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px" : "36px 24px" }}>
            {websites.length === 0 ? (
              // Empty state
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 24, textAlign: "center" }}>
                <div style={{
                  width: 96, height: 96, borderRadius: 24,
                  background: "linear-gradient(135deg, #f0f4ff, #fdf2ff)",
                  border: "2px dashed #c7d2fe",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Globe size={40} color="#a5b4fc" />
                </div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>No websites yet</h2>
                  <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 28px" }}>Generate your first AI-powered website in minutes.</p>
                </div>
                <button onClick={startNew} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "13px 28px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
                  borderRadius: 12, color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 700,
                  boxShadow: "0 4px 20px rgba(99,102,241,.4)",
                }}>
                  <Sparkles size={18} /> Generate Your First Website
                </button>
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
                  {[
                    { label: "Total Websites", value: websites.length, icon: <Globe size={18} />, color: "#6366f1" },
                    { label: "Published",       value: websites.filter(w => w.status === "published").length, icon: <CheckCircle2 size={18} />, color: "#10b981" },
                    { label: "Drafts",          value: websites.filter(w => w.status === "draft").length, icon: <Clock size={18} />, color: "#f59e0b" },
                    { label: "AI Connected",    value: websites.filter(w => w.connectedAgent).length, icon: <Bot size={18} />, color: "#8b5cf6" },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{value}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                  {/* Create new card — only show when no website exists */}
                  {websites.length === 0 && (
                    <div
                      onClick={startNew}
                      style={{
                        border: "2px dashed #c7d2fe", borderRadius: 16, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: 12, minHeight: 360, background: "#fafbff",
                        transition: "border-color .2s, background .2s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#6366f1"; (e.currentTarget as HTMLDivElement).style.background = "#f0f4ff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#c7d2fe"; (e.currentTarget as HTMLDivElement).style.background = "#fafbff"; }}
                    >
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Plus size={24} color="#fff" />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>Create New Website</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>AI-powered generation</div>
                      </div>
                    </div>
                  )}

                  {websites.map((site) => (
                    <WebsiteCard
                      key={site.id}
                      site={site}
                      onView={() => handleView(site)}
                      onEdit={() => handleEdit(site)}
                      onPublish={() => handleTogglePublish(site.id)}
                      onDelete={() => handleDelete(site.id)}
                      onConnectAgent={() => setConnectAgentFor(site)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GENERATING VIEW
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "generating") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 28,
        background: "linear-gradient(135deg, #f0f4ff, #fdf2ff)", fontFamily: "Inter, sans-serif",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 40px rgba(99,102,241,.4)",
          animation: "aipulse 1.5s ease-in-out infinite",
        }}>
          <Sparkles size={36} color="#fff" />
        </div>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>
            Building Your Website
          </h2>
          <p style={{ fontSize: 15, color: "#6b7280", margin: 0, lineHeight: 1.7 }}>{progress}</p>
        </div>
        <div style={{ width: 320, height: 4, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: 4, animation: "aishimmer 2s ease-in-out infinite",
          }} />
        </div>
        <style>{`
          @keyframes aipulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
          @keyframes aishimmer { 0%{width:15%} 60%{width:85%} 100%{width:15%} }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PREVIEW VIEW
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "preview") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f1f5f9", fontFamily: "Inter, sans-serif" }}>
        {/* Top bar */}
        <div style={{
          height: isMobile ? "auto" : 56, background: "#0f172a", display: "flex", alignItems: "center",
          padding: isMobile ? "8px 12px" : "0 16px", gap: 8, flexShrink: 0, borderBottom: "1px solid #1e293b",
          flexWrap: isMobile ? "wrap" : "nowrap", overflowX: isMobile ? "visible" : "hidden",
        }}>
          <button onClick={() => setView("dashboard")} style={{
            display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
            color: "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "6px 10px", flexShrink: 0,
          }}>
            <ChevronLeft size={16} /> Websites
          </button>
          <div style={{ width: 1, height: 24, background: "#334155", flexShrink: 0 }} />
          <Globe size={16} color="#6366f1" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", flexShrink: 0, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {templateData?.businessName}
          </span>
          <span style={{ fontSize: 11, color: "#475569", background: "#1e293b", padding: "3px 8px", borderRadius: 50, flexShrink: 0 }}>
            {form.industry}
          </span>
          <div style={{ flex: 1 }} />

          {/* Desktop / Mobile toggle */}
          <div style={{ display: "flex", background: "#1e293b", borderRadius: 8, padding: 3, gap: 2, flexShrink: 0 }}>
            {(["desktop", "mobile"] as const).map((mode) => (
              <button key={mode} onClick={() => setPreviewMode(mode)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: previewMode === mode ? "#6366f1" : "none",
                color: previewMode === mode ? "#fff" : "#64748b",
              }}>
                {mode === "desktop" ? <Monitor size={13} /> : <Smartphone size={13} />}
              </button>
            ))}
          </div>

          <button onClick={() => setActiveSectionPanel(activeSectionPanel ? null : activeSections[0] ?? null)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
            background: activeSectionPanel ? "#6366f1" : "#1e293b",
            border: "none", borderRadius: 8,
            color: activeSectionPanel ? "#fff" : "#94a3b8",
            cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            <Layers size={13} /> Templates
          </button>

          {/* Save button — prominent */}
          <button onClick={handleSave} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
            background: saved ? "#059669" : "#10b981",
            border: "none", borderRadius: 8, color: "#fff",
            cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0,
            transition: "background .3s",
          }}>
            {saved ? <><CheckCheck size={14} /> Saved!</> : <><Save size={14} /> Save</>}
          </button>

          <button onClick={handleCopy} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
            background: "#1e293b", border: "none", borderRadius: 8, color: "#94a3b8",
            cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            {copied ? <CheckCheck size={13} color="#10b981" /> : <Copy size={13} />}
          </button>

          <button onClick={handleExport} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
            background: "#1e293b", border: "none", borderRadius: 8, color: "#94a3b8",
            cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            <Download size={13} />
          </button>

          <button onClick={() => { setView("form"); setStep(1); setCurrentId(""); setSaved(false); }} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
            background: "#1e293b", border: "none", borderRadius: 8, color: "#94a3b8",
            cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Preview area */}
          <div style={{
            flex: 1, display: "flex", alignItems: "flex-start",
            justifyContent: "center", overflow: "auto",
            padding: 24, background: "#e2e8f0",
          }}>
            <div style={{
              width: (isMobile || previewMode === "mobile") ? "100%" : "100%",
              maxWidth: previewMode === "desktop" ? 1440 : isMobile ? "100%" : 390,
              minHeight: 800, background: "#fff", borderRadius: isMobile ? 0 : 12,
              overflow: "hidden", boxShadow: isMobile ? "none" : "0 8px 40px rgba(0,0,0,.15)",
              border: isMobile ? "none" : "1px solid #cbd5e1",
            }}>
              <iframe
                ref={iframeRef}
                title="Website Preview"
                srcDoc={assembledHtml}
                style={{ width: "100%", height: "100%", minHeight: 800, border: "none", display: "block" }}
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>

          {/* Section template switcher panel */}
          {activeSectionPanel !== null && (
            <div style={{
              width: 290, background: "#fff", borderLeft: "1px solid #e5e7eb",
              display: "flex", flexDirection: "column", flexShrink: 0,
            }}>
              <div style={{
                padding: "14px 16px", borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Section Templates</span>
                <button onClick={() => setActiveSectionPanel(null)} style={{
                  background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4,
                }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {activeSections.map((section) => (
                  <div key={section}>
                    <button
                      onClick={() => setActiveSectionPanel(section === activeSectionPanel ? null : section)}
                      style={{
                        width: "100%", padding: "10px 16px", textAlign: "left",
                        background: activeSectionPanel === section ? "#f0f4ff" : "#fff",
                        border: "none", borderBottom: "1px solid #f1f5f9", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: activeSectionPanel === section ? "#6366f1" : "#374151" }}>
                          {SECTION_LABELS[section]}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          {sectionSelections.get(section) ?? "default"}
                        </div>
                      </div>
                      <ChevronRight size={14} color={activeSectionPanel === section ? "#6366f1" : "#9ca3af"}
                        style={{ transform: activeSectionPanel === section ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                    </button>
                    {activeSectionPanel === section && (
                      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                        {sectionTemplateOptions.map((t) => {
                          const isSelected = (sectionSelections.get(section) ?? "") === t.id;
                          return (
                            <button key={t.id} onClick={() => handleTemplateSwitch(section, t.id)} style={{
                              textAlign: "left", padding: "9px 12px",
                              border: `1.5px solid ${isSelected ? "#6366f1" : "#e5e7eb"}`,
                              borderRadius: 8, cursor: "pointer",
                              background: isSelected ? "#f0f4ff" : "#fff",
                              display: "flex", alignItems: "center", gap: 8,
                            }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: isSelected ? "#6366f1" : "#d1d5db" }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? "#6366f1" : "#374151" }}>{t.name}</div>
                                <div style={{ fontSize: 10, color: "#9ca3af" }}>{t.id}</div>
                              </div>
                              {isSelected && <Check size={12} color="#6366f1" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORM VIEW
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: isMobile ? "12px 16px" : "0 32px", height: 60, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setView("dashboard")} style={{
          display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
          color: "#9ca3af", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "6px 8px",
        }}>
          <ChevronLeft size={16} /> Websites
        </button>
        <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
            {currentId ? "Edit Website" : "New Website"}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>AI Website Studio</div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px 1fr", gap: 28, alignItems: "start" }}>
          {/* Steps sidebar */}
          <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 8, overflowX: isMobile ? "auto" : "visible" }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "14px 16px" : 24, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,.04)", display: "flex", flexDirection: isMobile ? "row" : "column", gap: 18, flexShrink: 0 }}>
              <StepBadge step={1} current={step} label="Business Info" />
              <StepBadge step={2} current={step} label="Visual Style" />
              <StepBadge step={3} current={step} label="Contact & Generate" />
            </div>
            {form.businessName && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #e5e7eb", marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{form.businessName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{INDUSTRIES.find(i => i.id === form.industry)?.emoji}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{INDUSTRIES.find(i => i.id === form.industry)?.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: form.primaryColor, border: "1px solid #e5e7eb" }} />
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: form.accentColor, border: "1px solid #e5e7eb" }} />
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{form.themeStyle}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main form card */}
          <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "20px 16px" : 36, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>

            {/* STEP 1 */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Business Details</h2>
                <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>
                  The AI uses this to write accurate, industry-specific content for your entire website.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Business Name *</label>
                    <input type="text" placeholder="e.g. Apex Analytics, Luna Spa, Peak Legal Group"
                      value={form.businessName} onChange={(e) => setField("businessName", e.target.value)} style={fieldStyle} />
                    {error && <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Industry *</label>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                      {INDUSTRIES.map((ind) => (
                        <button key={ind.id} onClick={() => handleIndustryChange(ind.id)} style={{
                          padding: "10px 8px", cursor: "pointer", textAlign: "left",
                          border: `1.5px solid ${form.industry === ind.id ? form.primaryColor : "#e5e7eb"}`,
                          borderRadius: 10, background: form.industry === ind.id ? `${form.primaryColor}12` : "#fafafa",
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <span style={{ fontSize: 18 }}>{ind.emoji}</span>
                          <span style={{ fontSize: 12, fontWeight: form.industry === ind.id ? 700 : 500, color: form.industry === ind.id ? form.primaryColor : "#374151" }}>
                            {ind.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Business Description</label>
                    <textarea placeholder="Describe what you do, who your customers are, what makes you unique..."
                      value={form.description} onChange={(e) => setField("description", e.target.value)}
                      rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>More detail = better AI content.</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Content Tone</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {TONES.map((tone) => (
                        <button key={tone} onClick={() => setField("tone", tone)} style={{
                          padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: form.tone === tone ? 700 : 500,
                          border: `1.5px solid ${form.tone === tone ? form.primaryColor : "#e5e7eb"}`,
                          borderRadius: 50, background: form.tone === tone ? `${form.primaryColor}12` : "#fafafa",
                          color: form.tone === tone ? form.primaryColor : "#374151",
                        }}>
                          {tone.charAt(0).toUpperCase() + tone.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Visual Style</h2>
                <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>Choose the look & feel.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Theme Style</label>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 10 }}>
                      {THEMES.map((theme) => (
                        <button key={theme.id} onClick={() => setField("themeStyle", theme.id)} style={{
                          padding: "12px 8px", cursor: "pointer", textAlign: "center",
                          border: `2px solid ${form.themeStyle === theme.id ? form.primaryColor : "#e5e7eb"}`,
                          borderRadius: 12, background: form.themeStyle === theme.id ? `${form.primaryColor}10` : "#fff",
                        }}>
                          <div style={{ width: "100%", height: 36, borderRadius: 6, overflow: "hidden", marginBottom: 8, border: "1px solid #f1f5f9", position: "relative" }}>
                            <div style={{ position: "absolute", inset: 0, background: theme.bg }} />
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: theme.primary }} />
                            <div style={{ position: "absolute", top: 14, left: "15%", right: "15%", height: 5, background: theme.primary, borderRadius: 2, opacity: .6 }} />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: form.themeStyle === theme.id ? form.primaryColor : "#374151" }}>{theme.label}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, lineHeight: 1.3 }}>{theme.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                    <ColorInput label="Primary Color" value={form.primaryColor} onChange={(v) => setField("primaryColor", v)} />
                    <ColorInput label="Accent Color"  value={form.accentColor}  onChange={(v) => setField("accentColor", v)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Quick Palettes</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        { label: "Indigo",  primary: "#6366f1", accent: "#06b6d4" },
                        { label: "Emerald", primary: "#059669", accent: "#0ea5e9" },
                        { label: "Rose",    primary: "#e11d48", accent: "#f97316" },
                        { label: "Amber",   primary: "#d97706", accent: "#ef4444" },
                        { label: "Violet",  primary: "#7c3aed", accent: "#ec4899" },
                        { label: "Teal",    primary: "#0d9488", accent: "#6366f1" },
                        { label: "Navy",    primary: "#1e3a5f", accent: "#f59e0b" },
                        { label: "Slate",   primary: "#334155", accent: "#6366f1" },
                      ].map((p) => (
                        <button key={p.label} onClick={() => { setField("primaryColor", p.primary); setField("accentColor", p.accent); }}
                          title={p.label} style={{ display: "flex", borderRadius: 50, overflow: "hidden", border: "2px solid #e5e7eb", cursor: "pointer", padding: 0 }}>
                          <div style={{ width: 22, height: 22, background: p.primary }} />
                          <div style={{ width: 22, height: 22, background: p.accent }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                      Sections for {INDUSTRIES.find(i => i.id === form.industry)?.label}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(INDUSTRY_SECTIONS[form.industry] ?? []).map((s) => (
                        <span key={s} style={{ padding: "4px 10px", background: `${form.primaryColor}15`, color: form.primaryColor, borderRadius: 50, fontSize: 11, fontWeight: 600 }}>
                          {SECTION_LABELS[s]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Contact & Generate</h2>
                <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px" }}>Contact info appears in your website's contact section and footer.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</label>
                    <input type="email" placeholder="hello@yourbusiness.com" value={form.email} onChange={(e) => setField("email", e.target.value)} style={fieldStyle} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone</label>
                    <input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => setField("phone", e.target.value)} style={fieldStyle} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>Address</label>
                    <input type="text" placeholder="123 Main Street, City, State 00000" value={form.address} onChange={(e) => setField("address", e.target.value)} style={fieldStyle} />
                  </div>
                  <div style={{ background: "linear-gradient(135deg, #f0f4ff, #fdf2ff)", borderRadius: 16, padding: 24, border: "1px solid #e0e7ff" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5", marginBottom: 14 }}>✨ Generation Summary</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        ["Business",  form.businessName],
                        ["Industry",  INDUSTRIES.find(i => i.id === form.industry)?.label ?? ""],
                        ["Theme",     form.themeStyle],
                        ["Tone",      form.tone],
                        ["Sections",  `${INDUSTRY_SECTIONS[form.industry]?.length ?? 0} sections`],
                        ["Colors",    `${form.primaryColor} + ${form.accentColor}`],
                      ].map(([k, v]) => v && (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: "#6b7280" }}>{k}</span>
                          <span style={{ fontWeight: 600, color: "#374151" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {error && (
                    <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>
                      {error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36, paddingTop: 24, borderTop: "1px solid #f1f5f9" }}>
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
                  border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff",
                  cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151",
                }}>
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button onClick={() => {
                  if (step === 1 && !form.businessName.trim()) { setError("Business name is required."); return; }
                  setError(""); setStep(step + 1);
                }} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 24px",
                  background: form.primaryColor, border: "none", borderRadius: 10,
                  color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
                }}>
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={handleGenerate} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "12px 28px",
                  background: `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})`,
                  border: "none", borderRadius: 10, color: "#fff", cursor: "pointer",
                  fontSize: 15, fontWeight: 800, boxShadow: `0 4px 20px ${form.primaryColor}50`,
                }}>
                  <Sparkles size={16} /> Generate Website <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
