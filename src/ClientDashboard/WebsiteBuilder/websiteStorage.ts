import type { StudioFormData } from "./aiStudioService";
import type { WebsiteTemplateData, SectionType, Industry, ThemeStyle } from "./sectionTemplates/types";

// ─────────────────────────────────────────────────────────────────────────────
// Shared SavedWebsite type & localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface SavedWebsite {
  id: string;
  savedAt: string;
  updatedAt: string;
  businessName: string;
  industry: Industry;
  themeStyle: ThemeStyle;
  primaryColor: string;
  accentColor: string;
  sectionsCount: number;
  html: string;
  form: StudioFormData;
  templateData: WebsiteTemplateData;
  sectionSelections: [SectionType, string][];
  activeSections: SectionType[];
  status: "draft" | "published";
  connectedAgent?: string;
}

export const LS_KEY = "ai_studio_websites";

export function loadWebsites(): SavedWebsite[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as SavedWebsite[];
  } catch {
    return [];
  }
}

export function persistWebsites(list: SavedWebsite[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function upsertWebsite(site: SavedWebsite): SavedWebsite[] {
  const list = loadWebsites();
  const idx = list.findIndex((w) => w.id === site.id);
  if (idx >= 0) list[idx] = site;
  else list.unshift(site);
  persistWebsites(list);
  return list;
}

export function removeWebsite(id: string): SavedWebsite[] {
  const list = loadWebsites().filter((w) => w.id !== id);
  persistWebsites(list);
  return list;
}

export function newId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
