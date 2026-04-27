// ─────────────────────────────────────────────────────────────────────────────
// Section Templates — Barrel Export
// ─────────────────────────────────────────────────────────────────────────────

// Types
export type {
  Industry,
  ThemeStyle,
  SectionType,
  WebsiteTemplateData,
  SectionTemplate,
  TemplateSelection,
  AssembledWebsite,
  NavItem,
  Feature,
  Stat,
  Testimonial,
  PricingPlan,
  TeamMember,
  PortfolioItem,
  SocialLinks,
} from "./types";

// Icon utilities (for use in templates or externally)
export { renderIcon, renderIconBox, renderIconCircle } from "./iconUtils";

// Individual section template arrays
export { headerTemplates } from "./header/templates";
export { heroTemplates } from "./hero/templates";
export { featuresTemplates } from "./features/templates";
export { ctaTemplates } from "./cta/templates";
export { statsTemplates } from "./stats/templates";
export { aboutTemplates } from "./about/templates";
export { testimonialsTemplates } from "./testimonials/templates";
export { pricingTemplates } from "./pricing/templates";
export { contactTemplates } from "./contact/templates";
export { footerTemplates } from "./footer/templates";
export { portfolioTemplates } from "./portfolio/templates";
export { teamTemplates } from "./team/templates";

// Industry config
export { industryTemplateMap, getDefaultTemplateId } from "./industryConfig";

// Template engine
export {
  ALL_TEMPLATES,
  getTemplateById,
  getTemplatesForSection,
  assembleWebsite,
} from "./templateEngine";
export type { TemplateEngineOptions } from "./templateEngine";
