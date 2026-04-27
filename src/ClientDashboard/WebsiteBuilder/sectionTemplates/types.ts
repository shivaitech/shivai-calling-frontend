// ─────────────────────────────────────────────────────────────────────────────
// Section Template System — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export type Industry =
  | "saas"
  | "ecommerce"
  | "restaurant"
  | "healthcare"
  | "realestate"
  | "legal"
  | "finance"
  | "education"
  | "fitness"
  | "agency"
  | "construction"
  | "automotive"
  | "beauty"
  | "travel"
  | "nonprofit"
  | "manufacturing"
  | "consulting"
  | "media"
  | "portfolio"
  | "startup"
  | "general";

export type ThemeStyle =
  | "modern"
  | "minimal"
  | "bold"
  | "elegant"
  | "playful"
  | "corporate"
  | "dark"
  | "luxury"
  | "creative"
  | "classic";

export type SectionType =
  | "header"
  | "hero"
  | "features"
  | "cta"
  | "stats"
  | "about"
  | "testimonials"
  | "pricing"
  | "contact"
  | "footer"
  | "portfolio"
  | "team";

// ─── Data model passed to every template generator ───────────────────────────

export interface NavItem {
  label: string;
  href: string;
}

export interface Feature {
  title: string;
  description: string;
  icon?: string; // emoji or SVG string
}

export interface Stat {
  value: string;
  label: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company?: string;
  text: string;
  avatar?: string;
  rating?: number; // 1–5
}

export interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  highlighted?: boolean;
  ctaText?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  photo?: string;
  social?: { linkedin?: string; twitter?: string };
}

export interface PortfolioItem {
  title: string;
  category?: string;
  image?: string;
  link?: string;
  description?: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface WebsiteTemplateData {
  // Brand
  businessName: string;
  tagline: string;
  description: string;
  logo?: string;

  // Industry & Style
  industry: Industry;
  themeStyle: ThemeStyle;
  tone: string; // "professional" | "friendly" | "luxurious" | etc.

  // Colors
  primaryColor: string;   // e.g. "#2563EB"
  accentColor: string;    // e.g. "#F59E0B"
  bgColor: string;        // e.g. "#FFFFFF"
  textColor: string;      // e.g. "#111827"
  mutedColor: string;     // e.g. "#6B7280"

  // Typography
  headingFont: string;    // e.g. "'Inter', sans-serif"
  bodyFont: string;       // e.g. "'Inter', sans-serif"

  // Navigation
  navItems: NavItem[];
  ctaText: string;
  ctaLink: string;
  ctaSecondaryText?: string;

  // Hero
  heroHeadline: string;
  heroSubheadline: string;
  heroImage?: string;     // URL

  // Sections
  features: Feature[];
  stats: Stat[];
  testimonials: Testimonial[];
  pricingPlans: PricingPlan[];
  teamMembers: TeamMember[];
  portfolioItems: PortfolioItem[];

  // About
  aboutTitle: string;
  aboutDescription: string;
  aboutImage?: string;

  // Contact
  email: string;
  phone: string;
  address: string;
  mapEmbed?: string;

  // Social
  socialLinks: SocialLinks;

  // AI Images
  images: string[]; // pollinations.ai generated URLs

  // Footer
  footerTagline?: string;
  footerLinks?: Array<{ group: string; links: NavItem[] }>;
}

// ─── Template definition ──────────────────────────────────────────────────────

export interface SectionTemplate {
  id: string;               // e.g. "header-01"
  name: string;             // e.g. "Minimal Centered"
  section: SectionType;
  industries: Industry[];   // which industries this suits best (empty = all)
  themeStyles: ThemeStyle[]; // which theme styles match (empty = all)
  previewImage?: string;    // path to preview screenshot (user will provide)
  generate: (data: WebsiteTemplateData) => string; // returns HTML string
}

// ─── Template registry entry ──────────────────────────────────────────────────

export interface TemplateSelection {
  section: SectionType;
  templateId: string;
}

export interface AssembledWebsite {
  html: string;
  sectionsUsed: TemplateSelection[];
}
