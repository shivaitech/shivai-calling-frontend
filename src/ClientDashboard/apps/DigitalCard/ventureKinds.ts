import { Briefcase, FileText, LucideIcon, Palette, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { LogoSize, VentureType } from "../../../services/businessCardAPI";

/** Everything the "Ventures" panel can hold. A venture entry's `type` picks one of these. */
export interface VentureKind {
  id: VentureType;
  /** Short label for the add buttons and the type picker. */
  label: string;
  Icon: LucideIcon;
  namePlaceholder: string;
  urlPlaceholder: string;
  descriptionPlaceholder: string;
  /** The link's call to action on the card. */
  cta: (name: string) => string;
  /** Can hold an uploaded PDF instead of a link. */
  acceptsFile: boolean;
}

export const VENTURE_KINDS: VentureKind[] = [
  {
    id: "venture",
    descriptionPlaceholder: "What it does, e.g. AI employees for real business workflows (optional)",
    label: "Venture",
    Icon: Briefcase,
    namePlaceholder: "Company or project name *",
    urlPlaceholder: "Link (e.g. yourcompany.com)",
    cta: (name) => `Explore ${name}`,
    acceptsFile: false,
  },
  {
    id: "catalog",
    descriptionPlaceholder: "What is in it, e.g. New arrivals, prices and sizes (optional)",
    label: "Shop catalog",
    Icon: ShoppingBag,
    namePlaceholder: "Catalog name, e.g. Summer collection *",
    urlPlaceholder: "Shop or catalog link (Shopify, WhatsApp catalog…)",
    cta: () => "Browse catalog",
    acceptsFile: true,
  },
  {
    id: "document",
    descriptionPlaceholder: "What is inside, e.g. Our services, team and case studies (optional)",
    label: "Document",
    Icon: FileText,
    namePlaceholder: "Document title, e.g. Company profile *",
    urlPlaceholder: "Paste a link (Google Drive, Dropbox…) or upload a PDF",
    cta: () => "View document",
    acceptsFile: true,
  },
  {
    id: "menu",
    descriptionPlaceholder: "A short note, e.g. Lunch and dinner menu, updated weekly (optional)",
    label: "Menu / price list",
    Icon: UtensilsCrossed,
    namePlaceholder: "Menu or price list name *",
    urlPlaceholder: "Paste a link or upload a PDF",
    cta: () => "View menu",
    acceptsFile: true,
  },
  {
    id: "portfolio",
    descriptionPlaceholder: "A short note, e.g. Brand and web projects from 2024 to 2026 (optional)",
    label: "Portfolio",
    Icon: Palette,
    namePlaceholder: "Portfolio name, e.g. Recent work *",
    urlPlaceholder: "Portfolio link (Behance, Dribbble, your site…)",
    cta: () => "View portfolio",
    acceptsFile: true,
  },
];

export const ventureKind = (type?: VentureType): VentureKind => VENTURE_KINDS.find((k) => k.id === type) ?? VENTURE_KINDS[0];

export const LOGO_SIZES: { id: LogoSize; label: string }[] = [
  { id: "s", label: "Small" },
  { id: "m", label: "Medium" },
  { id: "l", label: "Large" },
];

/** Description length limit on the card. */
export const DESCRIPTION_MAX = 300;

/** PDFs only, up to 10 MB. */
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
