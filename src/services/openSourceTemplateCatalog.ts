export interface OpenSourceTemplateReference {
  name: string;
  slug: string;
  category: string;
  tags: string[];
  previewUrl: string;
  sourceRepo: string;
}

const SOURCE_REPO = "https://github.com/dawidolko/Website-Templates";

export const OPEN_SOURCE_TEMPLATE_CATALOG: OpenSourceTemplateReference[] = [
  {
    name: "creative-free-responsive-html5-business-template",
    slug: "creative-free-responsive-html5-business-template",
    category: "agency",
    tags: ["agency", "creative", "marketing", "business"],
    previewUrl: "https://templateswebsite.dawidolko.pl/creative-free-responsive-html5-business-template/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "businessr-corporate-bootstrap-responsive-web-template",
    slug: "businessr-corporate-bootstrap-responsive-web-template",
    category: "corporate",
    tags: ["corporate", "business", "finance", "consulting"],
    previewUrl: "https://templateswebsite.dawidolko.pl/businessr-corporate-bootstrap-responsive-web-template/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "techking-free-html5-template-for-corporate-business",
    slug: "techking-free-html5-template-for-corporate-business",
    category: "saas",
    tags: ["tech", "software", "ai", "startup", "saas"],
    previewUrl: "https://templateswebsite.dawidolko.pl/techking-free-html5-template-for-corporate-business/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "line-free-app-landing-page-responsive-web-template",
    slug: "line-free-app-landing-page-responsive-web-template",
    category: "saas",
    tags: ["app", "landing", "mobile", "startup", "software"],
    previewUrl: "https://templateswebsite.dawidolko.pl/line-free-app-landing-page-responsive-web-template/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "mobile-app-free-one-page-responsive-html5-landing-page",
    slug: "mobile-app-free-one-page-responsive-html5-landing-page",
    category: "saas",
    tags: ["mobile", "app", "landing", "product"],
    previewUrl: "https://templateswebsite.dawidolko.pl/mobile-app-free-one-page-responsive-html5-landing-page/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "bestro-restaurant-bootstrap-html5-template",
    slug: "bestro-restaurant-bootstrap-html5-template",
    category: "restaurant",
    tags: ["restaurant", "food", "cafe", "menu", "dining"],
    previewUrl: "https://templateswebsite.dawidolko.pl/bestro-restaurant-bootstrap-html5-template/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "eat-restaurant-bootstrap-html5-template",
    slug: "eat-restaurant-bootstrap-html5-template",
    category: "restaurant",
    tags: ["restaurant", "food", "hospitality", "dining"],
    previewUrl: "https://templateswebsite.dawidolko.pl/eat-restaurant-bootstrap-html5-template/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "touch-hospital-medical-bootstrap-html5-template",
    slug: "touch-hospital-medical-bootstrap-html5-template",
    category: "health",
    tags: ["medical", "hospital", "clinic", "healthcare", "wellness"],
    previewUrl: "https://templateswebsite.dawidolko.pl/touch-hospital-medical-bootstrap-html5-template/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "medplus-medical",
    slug: "medplus-medical",
    category: "health",
    tags: ["medical", "health", "doctor", "clinic"],
    previewUrl: "https://templateswebsite.dawidolko.pl/medplus-medical/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "getdoctor-free-bootstrap-responsive-website-template",
    slug: "getdoctor-free-bootstrap-responsive-website-template",
    category: "health",
    tags: ["doctor", "clinic", "health", "appointments"],
    previewUrl: "https://templateswebsite.dawidolko.pl/getdoctor-free-bootstrap-responsive-website-template/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "styleinn-bootstrap-interior-design-website-template",
    slug: "styleinn-bootstrap-interior-design-website-template",
    category: "agency",
    tags: ["interior", "design", "studio", "luxury"],
    previewUrl: "https://templateswebsite.dawidolko.pl/styleinn-bootstrap-interior-design-website-template/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "interio",
    slug: "interio",
    category: "agency",
    tags: ["interior", "design", "portfolio", "showcase"],
    previewUrl: "https://templateswebsite.dawidolko.pl/interio/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "vone-free-business-html5-responsive-website",
    slug: "vone-free-business-html5-responsive-website",
    category: "corporate",
    tags: ["business", "company", "corporate", "services"],
    previewUrl: "https://templateswebsite.dawidolko.pl/vone-free-business-html5-responsive-website/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "vibrant-corporate-bootstrap-responsive-website-template",
    slug: "vibrant-corporate-bootstrap-responsive-website-template",
    category: "corporate",
    tags: ["corporate", "enterprise", "finance", "professional"],
    previewUrl: "https://templateswebsite.dawidolko.pl/vibrant-corporate-bootstrap-responsive-website-template/",
    sourceRepo: SOURCE_REPO,
  },
  {
    name: "rocket-business-bootstrap-free-responsive-web-theme",
    slug: "rocket-business-bootstrap-free-responsive-web-theme",
    category: "saas",
    tags: ["startup", "business", "saas", "tech"],
    previewUrl: "https://templateswebsite.dawidolko.pl/rocket-business-bootstrap-free-responsive-web-theme/",
    sourceRepo: SOURCE_REPO,
  },
];

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

export function matchOpenSourceTemplateRefs(params: {
  industry: string;
  description: string;
  themeStyle: string;
  websiteTone: string;
  limit?: number;
}): OpenSourceTemplateReference[] {
  const limit = params.limit ?? 3;
  const queryTokens = new Set([
    ...tokenize(params.industry),
    ...tokenize(params.description),
    ...tokenize(params.themeStyle),
    ...tokenize(params.websiteTone),
  ]);

  return OPEN_SOURCE_TEMPLATE_CATALOG
    .map((template) => {
      let score = 0;
      for (const tag of template.tags) {
        if (queryTokens.has(tag)) score += 4;
      }
      for (const token of queryTokens) {
        if (template.slug.includes(token) || template.name.includes(token)) score += 2;
      }
      if (queryTokens.has(template.category)) score += 5;
      return { template, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.template);
}