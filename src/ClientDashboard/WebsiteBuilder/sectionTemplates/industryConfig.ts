import type { Industry, SectionType } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRY → TEMPLATE PREFERENCE MAP
// Lists preferred template IDs per section for each industry (first = default)
// ─────────────────────────────────────────────────────────────────────────────

export const industryTemplateMap: Record<Industry, Partial<Record<SectionType, string[]>>> = {
  saas: {
    header:       ["header-01", "header-09", "header-03"],
    hero:         ["hero-10", "hero-01", "hero-03"],
    features:     ["features-01", "features-05", "features-09"],
    cta:          ["cta-01", "cta-09", "cta-02"],
    stats:        ["stats-01", "stats-05", "stats-02"],
    about:        ["about-01", "about-10", "about-07"],
    testimonials: ["testimonials-05", "testimonials-01", "testimonials-04"],
    pricing:      ["pricing-01", "pricing-05", "pricing-02"],
    contact:      ["contact-01", "contact-02", "contact-03"],
    footer:       ["footer-01", "footer-06", "footer-10"],
    portfolio:    ["portfolio-07", "portfolio-08", "portfolio-01"],
    team:         ["team-01", "team-06", "team-10"],
  },

  startup: {
    header:       ["header-09", "header-01", "header-03"],
    hero:         ["hero-01", "hero-10", "hero-03"],
    features:     ["features-09", "features-01", "features-02"],
    cta:          ["cta-07", "cta-01", "cta-09"],
    stats:        ["stats-03", "stats-01", "stats-08"],
    about:        ["about-07", "about-01", "about-10"],
    testimonials: ["testimonials-01", "testimonials-04", "testimonials-05"],
    pricing:      ["pricing-05", "pricing-01", "pricing-06"],
    contact:      ["contact-10", "contact-01", "contact-03"],
    footer:       ["footer-03", "footer-10", "footer-01"],
    portfolio:    ["portfolio-07", "portfolio-04", "portfolio-01"],
    team:         ["team-09", "team-01", "team-10"],
  },

  agency: {
    header:       ["header-02", "header-06", "header-01"],
    hero:         ["hero-02", "hero-01", "hero-10"],
    features:     ["features-02", "features-01", "features-08"],
    cta:          ["cta-02", "cta-01", "cta-10"],
    stats:        ["stats-02", "stats-06", "stats-05"],
    about:        ["about-02", "about-10", "about-01"],
    testimonials: ["testimonials-02", "testimonials-10", "testimonials-05"],
    pricing:      ["pricing-07", "pricing-02", "pricing-01"],
    contact:      ["contact-02", "contact-01", "contact-10"],
    footer:       ["footer-01", "footer-06", "footer-09"],
    portfolio:    ["portfolio-02", "portfolio-03", "portfolio-04"],
    team:         ["team-02", "team-01", "team-09"],
  },

  ecommerce: {
    header:       ["header-08", "header-01", "header-03"],
    hero:         ["hero-06", "hero-04", "hero-10"],
    features:     ["features-04", "features-09", "features-01"],
    cta:          ["cta-07", "cta-04", "cta-09"],
    stats:        ["stats-03", "stats-08", "stats-07"],
    about:        ["about-01", "about-10", "about-07"],
    testimonials: ["testimonials-03", "testimonials-01", "testimonials-06"],
    pricing:      ["pricing-08", "pricing-01", "pricing-07"],
    contact:      ["contact-07", "contact-01", "contact-03"],
    footer:       ["footer-08", "footer-01", "footer-05"],
    portfolio:    ["portfolio-10", "portfolio-03", "portfolio-07"],
    team:         ["team-01", "team-03", "team-10"],
  },

  restaurant: {
    header:       ["header-07", "header-04", "header-01"],
    hero:         ["hero-09", "hero-04", "hero-07"],
    features:     ["features-06", "features-04", "features-01"],
    cta:          ["cta-05", "cta-04", "cta-01"],
    stats:        ["stats-10", "stats-07", "stats-01"],
    about:        ["about-05", "about-01", "about-03"],
    testimonials: ["testimonials-07", "testimonials-01", "testimonials-03"],
    pricing:      ["pricing-08", "pricing-04", "pricing-01"],
    contact:      ["contact-08", "contact-04", "contact-07"],
    footer:       ["footer-04", "footer-02", "footer-05"],
    portfolio:    ["portfolio-06", "portfolio-01", "portfolio-03"],
    team:         ["team-07", "team-01", "team-05"],
  },

  healthcare: {
    header:       ["header-10", "header-05", "header-01"],
    hero:         ["hero-05", "hero-01", "hero-04"],
    features:     ["features-07", "features-03", "features-10"],
    cta:          ["cta-03", "cta-10", "cta-06"],
    stats:        ["stats-04", "stats-01", "stats-07"],
    about:        ["about-08", "about-04", "about-01"],
    testimonials: ["testimonials-09", "testimonials-01", "testimonials-08"],
    pricing:      ["pricing-09", "pricing-01", "pricing-10"],
    contact:      ["contact-05", "contact-04", "contact-07"],
    footer:       ["footer-07", "footer-02", "footer-05"],
    portfolio:    ["portfolio-08", "portfolio-01", "portfolio-04"],
    team:         ["team-07", "team-04", "team-08"],
  },

  realestate: {
    header:       ["header-05", "header-01", "header-04"],
    hero:         ["hero-07", "hero-04", "hero-05"],
    features:     ["features-08", "features-03", "features-01"],
    cta:          ["cta-06", "cta-10", "cta-01"],
    stats:        ["stats-09", "stats-04", "stats-01"],
    about:        ["about-09", "about-04", "about-01"],
    testimonials: ["testimonials-08", "testimonials-01", "testimonials-09"],
    pricing:      ["pricing-07", "pricing-01", "pricing-09"],
    contact:      ["contact-04", "contact-07", "contact-01"],
    footer:       ["footer-02", "footer-07", "footer-05"],
    portfolio:    ["portfolio-05", "portfolio-04", "portfolio-01"],
    team:         ["team-04", "team-08", "team-01"],
  },

  legal: {
    header:       ["header-05", "header-01", "header-06"],
    hero:         ["hero-05", "hero-01", "hero-08"],
    features:     ["features-10", "features-03", "features-01"],
    cta:          ["cta-10", "cta-06", "cta-03"],
    stats:        ["stats-04", "stats-01", "stats-05"],
    about:        ["about-04", "about-06", "about-01"],
    testimonials: ["testimonials-08", "testimonials-01", "testimonials-10"],
    pricing:      ["pricing-09", "pricing-07", "pricing-01"],
    contact:      ["contact-01", "contact-05", "contact-07"],
    footer:       ["footer-07", "footer-02", "footer-05"],
    portfolio:    ["portfolio-08", "portfolio-04", "portfolio-01"],
    team:         ["team-08", "team-04", "team-05"],
  },

  finance: {
    header:       ["header-05", "header-01", "header-06"],
    hero:         ["hero-05", "hero-01", "hero-03"],
    features:     ["features-10", "features-03", "features-01"],
    cta:          ["cta-10", "cta-06", "cta-01"],
    stats:        ["stats-04", "stats-05", "stats-01"],
    about:        ["about-04", "about-06", "about-01"],
    testimonials: ["testimonials-08", "testimonials-10", "testimonials-01"],
    pricing:      ["pricing-09", "pricing-01", "pricing-07"],
    contact:      ["contact-01", "contact-07", "contact-10"],
    footer:       ["footer-07", "footer-02", "footer-06"],
    portfolio:    ["portfolio-08", "portfolio-04", "portfolio-01"],
    team:         ["team-08", "team-04", "team-01"],
  },

  education: {
    header:       ["header-10", "header-03", "header-01"],
    hero:         ["hero-03", "hero-05", "hero-01"],
    features:     ["features-07", "features-01", "features-09"],
    cta:          ["cta-03", "cta-08", "cta-06"],
    stats:        ["stats-07", "stats-01", "stats-03"],
    about:        ["about-08", "about-04", "about-01"],
    testimonials: ["testimonials-09", "testimonials-04", "testimonials-01"],
    pricing:      ["pricing-10", "pricing-01", "pricing-05"],
    contact:      ["contact-06", "contact-01", "contact-03"],
    footer:       ["footer-02", "footer-06", "footer-05"],
    portfolio:    ["portfolio-08", "portfolio-03", "portfolio-01"],
    team:         ["team-07", "team-01", "team-03"],
  },

  fitness: {
    header:       ["header-08", "header-03", "header-01"],
    hero:         ["hero-04", "hero-06", "hero-03"],
    features:     ["features-04", "features-07", "features-01"],
    cta:          ["cta-07", "cta-04", "cta-09"],
    stats:        ["stats-03", "stats-01", "stats-02"],
    about:        ["about-01", "about-08", "about-07"],
    testimonials: ["testimonials-03", "testimonials-06", "testimonials-09"],
    pricing:      ["pricing-04", "pricing-01", "pricing-05"],
    contact:      ["contact-05", "contact-03", "contact-07"],
    footer:       ["footer-03", "footer-01", "footer-05"],
    portfolio:    ["portfolio-09", "portfolio-01", "portfolio-03"],
    team:         ["team-03", "team-01", "team-09"],
  },

  consulting: {
    header:       ["header-01", "header-06", "header-05"],
    hero:         ["hero-01", "hero-05", "hero-02"],
    features:     ["features-03", "features-10", "features-01"],
    cta:          ["cta-10", "cta-01", "cta-06"],
    stats:        ["stats-05", "stats-04", "stats-01"],
    about:        ["about-01", "about-06", "about-07"],
    testimonials: ["testimonials-08", "testimonials-05", "testimonials-10"],
    pricing:      ["pricing-07", "pricing-01", "pricing-09"],
    contact:      ["contact-10", "contact-01", "contact-07"],
    footer:       ["footer-05", "footer-02", "footer-01"],
    portfolio:    ["portfolio-08", "portfolio-04", "portfolio-03"],
    team:         ["team-05", "team-08", "team-01"],
  },

  construction: {
    header:       ["header-05", "header-06", "header-01"],
    hero:         ["hero-08", "hero-07", "hero-04"],
    features:     ["features-08", "features-01", "features-03"],
    cta:          ["cta-06", "cta-10", "cta-01"],
    stats:        ["stats-06", "stats-09", "stats-04"],
    about:        ["about-06", "about-09", "about-01"],
    testimonials: ["testimonials-10", "testimonials-08", "testimonials-01"],
    pricing:      ["pricing-07", "pricing-09", "pricing-01"],
    contact:      ["contact-09", "contact-04", "contact-01"],
    footer:       ["footer-08", "footer-02", "footer-01"],
    portfolio:    ["portfolio-05", "portfolio-04", "portfolio-01"],
    team:         ["team-04", "team-08", "team-01"],
  },

  automotive: {
    header:       ["header-08", "header-06", "header-01"],
    hero:         ["hero-08", "hero-04", "hero-06"],
    features:     ["features-08", "features-01", "features-04"],
    cta:          ["cta-09", "cta-07", "cta-01"],
    stats:        ["stats-06", "stats-03", "stats-01"],
    about:        ["about-06", "about-09", "about-01"],
    testimonials: ["testimonials-01", "testimonials-08", "testimonials-03"],
    pricing:      ["pricing-09", "pricing-07", "pricing-01"],
    contact:      ["contact-09", "contact-04", "contact-01"],
    footer:       ["footer-08", "footer-01", "footer-05"],
    portfolio:    ["portfolio-10", "portfolio-02", "portfolio-01"],
    team:         ["team-04", "team-08", "team-01"],
  },

  beauty: {
    header:       ["header-07", "header-04", "header-08"],
    hero:         ["hero-06", "hero-09", "hero-04"],
    features:     ["features-04", "features-06", "features-01"],
    cta:          ["cta-05", "cta-04", "cta-07"],
    stats:        ["stats-03", "stats-10", "stats-01"],
    about:        ["about-05", "about-03", "about-07"],
    testimonials: ["testimonials-03", "testimonials-07", "testimonials-01"],
    pricing:      ["pricing-04", "pricing-08", "pricing-01"],
    contact:      ["contact-05", "contact-08", "contact-03"],
    footer:       ["footer-04", "footer-05", "footer-03"],
    portfolio:    ["portfolio-09", "portfolio-06", "portfolio-01"],
    team:         ["team-03", "team-09", "team-01"],
  },

  travel: {
    header:       ["header-04", "header-07", "header-01"],
    hero:         ["hero-04", "hero-09", "hero-07"],
    features:     ["features-06", "features-01", "features-04"],
    cta:          ["cta-05", "cta-01", "cta-07"],
    stats:        ["stats-09", "stats-03", "stats-01"],
    about:        ["about-05", "about-01", "about-10"],
    testimonials: ["testimonials-07", "testimonials-01", "testimonials-03"],
    pricing:      ["pricing-04", "pricing-01", "pricing-07"],
    contact:      ["contact-08", "contact-04", "contact-07"],
    footer:       ["footer-04", "footer-03", "footer-05"],
    portfolio:    ["portfolio-06", "portfolio-05", "portfolio-01"],
    team:         ["team-03", "team-01", "team-05"],
  },

  nonprofit: {
    header:       ["header-10", "header-01", "header-03"],
    hero:         ["hero-05", "hero-04", "hero-03"],
    features:     ["features-07", "features-03", "features-01"],
    cta:          ["cta-03", "cta-08", "cta-06"],
    stats:        ["stats-07", "stats-10", "stats-01"],
    about:        ["about-08", "about-03", "about-01"],
    testimonials: ["testimonials-09", "testimonials-08", "testimonials-01"],
    pricing:      ["pricing-10", "pricing-04", "pricing-07"],
    contact:      ["contact-06", "contact-07", "contact-01"],
    footer:       ["footer-07", "footer-02", "footer-09"],
    portfolio:    ["portfolio-08", "portfolio-04", "portfolio-01"],
    team:         ["team-07", "team-01", "team-05"],
  },

  manufacturing: {
    header:       ["header-05", "header-06", "header-01"],
    hero:         ["hero-08", "hero-05", "hero-01"],
    features:     ["features-08", "features-03", "features-01"],
    cta:          ["cta-06", "cta-10", "cta-01"],
    stats:        ["stats-06", "stats-04", "stats-05"],
    about:        ["about-06", "about-09", "about-04"],
    testimonials: ["testimonials-10", "testimonials-08", "testimonials-01"],
    pricing:      ["pricing-07", "pricing-09", "pricing-01"],
    contact:      ["contact-09", "contact-04", "contact-01"],
    footer:       ["footer-08", "footer-07", "footer-02"],
    portfolio:    ["portfolio-04", "portfolio-08", "portfolio-01"],
    team:         ["team-08", "team-04", "team-01"],
  },

  media: {
    header:       ["header-02", "header-09", "header-01"],
    hero:         ["hero-02", "hero-10", "hero-04"],
    features:     ["features-02", "features-05", "features-01"],
    cta:          ["cta-08", "cta-02", "cta-09"],
    stats:        ["stats-08", "stats-02", "stats-05"],
    about:        ["about-02", "about-10", "about-01"],
    testimonials: ["testimonials-02", "testimonials-05", "testimonials-01"],
    pricing:      ["pricing-05", "pricing-06", "pricing-02"],
    contact:      ["contact-02", "contact-10", "contact-01"],
    footer:       ["footer-09", "footer-01", "footer-06"],
    portfolio:    ["portfolio-02", "portfolio-07", "portfolio-01"],
    team:         ["team-02", "team-09", "team-01"],
  },

  portfolio: {
    header:       ["header-04", "header-02", "header-01"],
    hero:         ["hero-02", "hero-01", "hero-04"],
    features:     ["features-01", "features-02", "features-03"],
    cta:          ["cta-01", "cta-02", "cta-03"],
    stats:        ["stats-10", "stats-01", "stats-02"],
    about:        ["about-03", "about-07", "about-01"],
    testimonials: ["testimonials-01", "testimonials-08", "testimonials-02"],
    pricing:      ["pricing-01", "pricing-07", "pricing-04"],
    contact:      ["contact-03", "contact-10", "contact-01"],
    footer:       ["footer-05", "footer-09", "footer-02"],
    portfolio:    ["portfolio-01", "portfolio-02", "portfolio-04"],
    team:         ["team-05", "team-01", "team-10"],
  },

  general: {
    header:       ["header-01", "header-05", "header-03"],
    hero:         ["hero-01", "hero-03", "hero-05"],
    features:     ["features-01", "features-03", "features-09"],
    cta:          ["cta-01", "cta-03", "cta-10"],
    stats:        ["stats-01", "stats-07", "stats-10"],
    about:        ["about-01", "about-04", "about-07"],
    testimonials: ["testimonials-01", "testimonials-08", "testimonials-09"],
    pricing:      ["pricing-01", "pricing-07", "pricing-09"],
    contact:      ["contact-01", "contact-07", "contact-03"],
    footer:       ["footer-02", "footer-01", "footer-05"],
    portfolio:    ["portfolio-01", "portfolio-03", "portfolio-04"],
    team:         ["team-01", "team-04", "team-10"],
  },
};

/**
 * Returns the best matching template ID for a given industry + section type.
 * Falls back to "general" if the industry has no preference for that section.
 */
export function getDefaultTemplateId(
  industry: Industry,
  section: SectionType
): string {
  const industryPrefs = industryTemplateMap[industry];
  const sectionPrefs = industryPrefs?.[section];
  if (sectionPrefs && sectionPrefs.length > 0) return sectionPrefs[0];

  // fallback to general
  const generalPrefs = industryTemplateMap.general[section];
  if (generalPrefs && generalPrefs.length > 0) return generalPrefs[0];

  // last-resort fallback: section name + "-01"
  return `${section}-01`;
}
