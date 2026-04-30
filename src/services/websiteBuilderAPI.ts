import { matchOpenSourceTemplateRefs } from "./openSourceTemplateCatalog";

const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-2.5-pro";
const STUDIO_MODEL = (import.meta.env.VITE_GEMINI_STUDIO_MODEL as string) || GEMINI_MODEL;
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Response schema for native JSON output (no markdown wrapping, fewer tokens)
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    siteName:  { type: "STRING" },
    tagline:   { type: "STRING" },
    hero: {
      type: "OBJECT",
      properties: {
        headline:          { type: "STRING" },
        subheadline:       { type: "STRING" },
        ctaText:           { type: "STRING" },
        ctaSecondaryText:  { type: "STRING" },
      },
      required: ["headline", "subheadline", "ctaText", "ctaSecondaryText"],
    },
    about: {
      type: "OBJECT",
      properties: { title: { type: "STRING" }, description: { type: "STRING" } },
      required: ["title", "description"],
    },
    features: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title:       { type: "STRING" },
          description: { type: "STRING" },
          emoji:       { type: "STRING" },
        },
        required: ["title", "description", "emoji"],
      },
    },
    stats: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { value: { type: "STRING" }, label: { type: "STRING" } },
        required: ["value", "label"],
      },
    },
    contact: {
      type: "OBJECT",
      properties: {
        email:   { type: "STRING" },
        phone:   { type: "STRING" },
        address: { type: "STRING" },
      },
      required: ["email", "phone", "address"],
    },
    suggestedTemplate: {
      type: "STRING",
      enum: ["saas", "agency", "restaurant", "health", "corporate"],
    },
    customHtml: { type: "STRING" },
  },
  required: ["siteName", "tagline", "hero", "about", "features", "stats", "contact", "suggestedTemplate", "customHtml"],
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WebsiteFormData {
  businessName: string;
  industry: string;
  description: string;
  themeStyle: string;
  websiteTone: string;
  platformPreference: Array<"desktop" | "mobile">;
  inspirationLinks: string[];
  inspirationImageNames: string[];
  referenceImages: Array<{
    mimeType: string;
    data: string;
    name?: string;
  }>;
}

export type TemplateId =
  | "saas"
  | "agency"
  | "restaurant"
  | "health"
  | "corporate";

export interface WebsiteContent {
  siteName: string;
  tagline: string;
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaSecondaryText: string;
  };
  about: {
    title: string;
    description: string;
  };
  features: Array<{
    title: string;
    description: string;
    emoji: string;
  }>;
  stats: Array<{
    value: string;
    label: string;
  }>;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  suggestedTemplate: TemplateId;
  customHtml?: string;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(formData: WebsiteFormData, referenceAnalysis: string, aiImageUrls: string[], matchedTemplates: Array<{ name: string; previewUrl: string }>): string {
  const platforms = formData.platformPreference.length
    ? formData.platformPreference.join(", ")
    : "desktop, mobile";

  const info = [
    `Business name: ${formData.businessName}`,
    formData.industry && `Industry/type: ${formData.industry}`,
    formData.description && `About: ${formData.description}`,
    formData.websiteTone && `Desired tone: ${formData.websiteTone}`,
    formData.themeStyle && `Desired visual theme: ${formData.themeStyle}`,
    `Priority platforms: ${platforms}`,
    formData.inspirationLinks.length > 0 && `Reference websites: ${formData.inspirationLinks.join(", ")}`,
    formData.inspirationImageNames.length > 0 && `Reference image names: ${formData.inspirationImageNames.join(", ")}`,
    formData.referenceImages.length > 0 && `Reference image count: ${formData.referenceImages.length}`,
    referenceAnalysis && `Reference site analysis:\n${referenceAnalysis}`,
    aiImageUrls.length > 0 && `AI-generated image URLs to use: ${aiImageUrls.join(", ")}`,
    matchedTemplates.length > 0 && `Open-source template inspirations: ${matchedTemplates.map((item) => `${item.name} (${item.previewUrl})`).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a senior web designer and web copywriter. Generate website content for this business:

${info}

Rules:
- siteName: brand name (≤5 words)
- tagline: punchy tagline (≤8 words)
- hero.headline: bold headline (≤10 words)
- hero.subheadline: 1-2 sentences (≤25 words)
- hero ctaText / ctaSecondaryText: 2-4 words each
- about.description: 2-3 sentences
- features: exactly 6 items, each title ≤4 words, description 1 sentence, relevant emoji
- stats: exactly 4 realistic impressive numbers
- Make the copy and structure match the requested tone/theme and prioritize the selected platforms
- Match the visual language and section composition of analyzed references as closely as possible while using original copy and assets
- Follow the extracted structural blueprint from the references, but do not reproduce source code or near-identical wording
- Use attached reference images for visual direction (layout rhythm, spacing density, visual hierarchy) without copying exact visuals or wording
- If reference websites are provided, borrow layout direction at a high level without copying exact wording
- customHtml: include a complete responsive landing page HTML with embedded CSS that feels modern and non-generic
- customHtml must be self-contained with inline CSS, no scripts
- Use external images only from the provided AI-generated image URLs
- customHtml should clearly reflect the reference inspiration in layout style and section composition
- Avoid bland UI patterns, avoid repetitive cards-only structure, and create a distinctive visual identity
- suggestedTemplate: best fit — saas(tech/AI/software), agency(creative/marketing), restaurant(food/hospitality), health(medical/wellness), corporate(finance/legal/consulting)`;
}

function buildStudioHtmlPrompt(formData: WebsiteFormData, referenceAnalysis: string, aiImageUrls: string[], matchedTemplates: Array<{ name: string; previewUrl: string }>): string {
  const platforms = formData.platformPreference.length
    ? formData.platformPreference.join(", ")
    : "desktop, mobile";

  const info = [
    `Business name: ${formData.businessName}`,
    formData.industry && `Industry/type: ${formData.industry}`,
    formData.description && `About: ${formData.description}`,
    formData.websiteTone && `Desired tone: ${formData.websiteTone}`,
    formData.themeStyle && `Desired visual theme: ${formData.themeStyle}`,
    `Priority platforms: ${platforms}`,
    formData.inspirationLinks.length > 0 && `Reference websites: ${formData.inspirationLinks.join(", ")}`,
    formData.inspirationImageNames.length > 0 && `Reference image names: ${formData.inspirationImageNames.join(", ")}`,
    referenceAnalysis && `Reference site analysis:\n${referenceAnalysis}`,
    aiImageUrls.length > 0 && `AI-generated image URLs to use: ${aiImageUrls.join("\n")}`,
    matchedTemplates.length > 0 && `Open-source template inspirations: ${matchedTemplates.map((item) => `${item.name} (${item.previewUrl})`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `Create a beautiful, production-ready, highly dynamic one-page website in pure HTML + CSS for the business below.

${info}

Hard requirements:
- Return ONLY raw HTML (no markdown fences, no commentary)
- Inline CSS only inside a <style> tag
- No JavaScript
- Mobile-first responsive layout with at least 8 distinctive sections (long-form page)
- Strong visual hierarchy, premium spacing, modern typography choices, atmospheric and dynamic backgrounds
- Use layered backgrounds (gradients, radial glows, section contrast) and avoid flat/plain backgrounds
- Do NOT output a generic card-grid boilerplate; produce an original composition inspired by references
- Recreate a very similar visual direction to the reference websites (hero structure, spacing scale, section rhythm, navigation/footer style)
- Follow the extracted layout blueprint from the references at a high level, but do not copy source code or exact text
- Include a sticky header/nav with mandatory menu items: About Us, Features, Contact
- Menu links must point to section ids: #about-us, #features, #contact
- Include a polished footer with a logo/brand block and a Pages column (About Us, Features, Contact)
- Use at least 3 <img> tags from the provided AI-generated image URLs, relevant to the business sections
- Avoid all-black page backgrounds unless explicitly requested
`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(id);
        reject(error);
      });
  });
}

async function fetchReferenceSnapshot(url: string): Promise<string | null> {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const proxyUrl = `https://r.jina.ai/http://${normalized.replace(/^https?:\/\//i, "")}`;
    const response = await withTimeout(fetch(proxyUrl), 8000);
    if (!response.ok) return null;
    const text = (await response.text()).replace(/\s+/g, " ").trim();
    if (!text) return null;
    return text.slice(0, 4000);
  } catch {
    return null;
  }
}

async function buildReferenceAnalysis(links: string[]): Promise<string> {
  const unique = Array.from(new Set(links.map((l) => l.trim()).filter(Boolean))).slice(0, 5);
  if (unique.length === 0) return "";

  const snapshots = await Promise.all(unique.map((url) => fetchReferenceSnapshot(url)));
  const valid = snapshots
    .map((content, i) => (content ? `Reference ${i + 1} (${unique[i]}): ${content}` : null))
    .filter(Boolean) as string[];

  const detailed = valid.join("\n\n");
  if (!detailed) return "";

  // Compress into practical style signals so model applies the crawl info.
  const titleMatches = Array.from(detailed.matchAll(/title[:\s]+([^\n\.]{5,90})/gi)).slice(0, 5).map((m) => m[1]?.trim());
  const navMatches = Array.from(detailed.matchAll(/\b(home|about|services|pricing|contact|work|features|blog)\b/gi)).slice(0, 12).map((m) => m[1]?.toLowerCase());
  const hexMatches = Array.from(detailed.matchAll(/#(?:[0-9a-fA-F]{3}){1,2}/g)).slice(0, 8).map((m) => m[0]);
  const headingMatches = Array.from(detailed.matchAll(/\b(about us|about|features|services|pricing|portfolio|projects|testimonials|faq|contact|team|blog|footer)\b/gi)).map((m) => m[1].toLowerCase());
  const ctaMatches = Array.from(detailed.matchAll(/\b(get started|learn more|contact us|book now|see more|explore|view all|request demo|start now)\b/gi)).map((m) => m[1]);

  const orderedSections = Array.from(new Set(
    headingMatches.filter((item) => ["about us", "about", "features", "services", "pricing", "portfolio", "projects", "testimonials", "faq", "contact", "team", "blog", "footer"].includes(item))
  ));

  const inferredBlueprint = [
    `Primary nav items: ${Array.from(new Set(navMatches)).join(", ") || "none detected"}`,
    `Likely section order: ${orderedSections.join(" -> ") || "hero -> features -> about -> contact -> footer"}`,
    `Common CTA labels: ${Array.from(new Set(ctaMatches)).slice(0, 8).join(", ") || "Get Started, Learn More"}`,
  ].join("\n");

  const summary = [
    `Likely headline/title cues: ${titleMatches.filter(Boolean).join(" | ")}`,
    `Likely navigation vocabulary: ${Array.from(new Set(navMatches)).join(", ")}`,
    `Observed color hints: ${Array.from(new Set(hexMatches)).join(", ")}`,
    `Structural blueprint:\n${inferredBlueprint}`,
    `Raw extracted notes: ${detailed.slice(0, 3000)}`,
  ].join("\n");

  return summary;
}

function buildImageQueryCandidates(rawQuery: string): string[] {
  const normalized = rawQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return ["business website", "professional team", "technology office"];

  const stopWords = new Set([
    "the", "and", "for", "with", "that", "this", "from", "your", "you", "are", "our", "about", "into", "their", "have", "has", "was", "were", "will", "can", "all", "one", "two", "three", "new", "using", "use", "services", "service", "business",
  ]);

  const words = normalized
    .split(" ")
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const top = words.slice(0, 8);
  const candidates = [
    top.slice(0, 3).join(" "),
    top.slice(0, 2).join(" "),
    top.slice(3, 6).join(" "),
    "modern office",
    "professional team",
    "technology workspace",
  ]
    .map((q) => q.trim())
    .filter(Boolean);

  return Array.from(new Set(candidates));
}

function buildAiGeneratedImageUrls(query: string): string[] {
  const candidates = buildImageQueryCandidates(query);
  const prompts = [
    `${candidates[0] || "modern business"} cinematic website hero image, premium commercial scene, no text, no watermark`,
    `${candidates[1] || "professional team"} editorial brand photography, modern office atmosphere, no text, no watermark`,
    `${candidates[2] || "technology workspace"} product showcase visual, clean composition, marketing website image, no text, no watermark`,
    `${candidates[0] || "modern business"} abstract branded environment, dynamic gradient lighting, website section background, no text`,
  ];

  return prompts.map((prompt, index) => {
    const seed = 7000 + index * 137;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1536&height=1024&seed=${seed}&model=flux&nologo=true&enhance=true`;
  });
}

function ensureHeaderFooterInHtml(html: string, siteName: string, industry: string, aiImageUrls: string[]): string {
  const cleaned = stripCodeFence(html);
  if (!cleaned) return cleaned;

  let out = cleaned;
  const brandSlug = siteName.toLowerCase().replace(/\s+/g, "");
  const standardHeader = `\n<header class="studio-shell-header" style="position:sticky;top:0;z-index:80;border-bottom:1px solid #e2e8f0;background:rgba(255,255,255,.82);backdrop-filter:blur(10px);"><div style="max-width:1160px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:20px;"><a href="#" style="display:flex;align-items:center;gap:10px;text-decoration:none;"><span style="width:30px;height:30px;border-radius:10px;background:linear-gradient(135deg,#0ea5e9,#6366f1);display:inline-block;"></span><strong style="font-size:20px;line-height:1;color:#0f172a;letter-spacing:-.01em;">${siteName}</strong></a><nav style="display:flex;align-items:center;gap:20px;font-size:15px;"><a href="#about-us" style="color:#334155;text-decoration:none;font-weight:600;">About Us</a><a href="#features" style="color:#334155;text-decoration:none;font-weight:600;">Features</a><a href="#contact" style="color:#334155;text-decoration:none;font-weight:600;">Contact</a></nav></div></header>\n`;
  const standardFooter = `\n<footer class="studio-shell-footer" style="margin-top:56px;border-top:1px solid #e2e8f0;background:linear-gradient(180deg,#ffffff,#f8fafc);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;"><div style="max-width:1160px;margin:0 auto;padding:40px 20px 26px;display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:26px;"><div><div style="display:flex;align-items:center;gap:10px;"><span style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#0ea5e9,#6366f1);display:inline-block;"></span><strong style="font-size:20px;color:#0f172a;letter-spacing:-.01em;">${siteName}</strong></div><p style="margin:12px 0 0;color:#64748b;line-height:1.7;max-width:44ch;">Premium digital experiences for ${industry || "modern businesses"} with performance-focused design and conversion-ready UX.</p></div><div><div style="font-weight:800;color:#0f172a;margin-bottom:12px;">Pages</div><div style="display:flex;flex-direction:column;gap:9px;"><a href="#about-us" style="color:#475569;text-decoration:none;">About Us</a><a href="#features" style="color:#475569;text-decoration:none;">Features</a><a href="#contact" style="color:#475569;text-decoration:none;">Contact</a></div></div><div><div style="font-weight:800;color:#0f172a;margin-bottom:12px;">Get in Touch</div><div style="color:#475569;line-height:1.8;">hello@${brandSlug}.com<br/>+1 (555) 000-0000</div></div></div><div style="max-width:1160px;margin:0 auto;padding:0 20px 20px;display:flex;justify-content:space-between;gap:16px;color:#64748b;font-size:13px;"><span>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</span><span>Built in Studio Mode</span></div></footer>\n`;

  // Add a non-black baseline guard for readability.
  if (!/<style[\s>]/i.test(out)) {
    out = out.replace(
      /<head>/i,
      `<head><style>:root{--bg1:#f8fafc;--bg2:#ecfeff;--bg3:#eef2ff;--ink:#0f172a;--muted:#475569;--line:#e2e8f0;}*{box-sizing:border-box}body{margin:0;color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:radial-gradient(1200px 700px at 10% -10%, var(--bg2), transparent 60%),radial-gradient(900px 600px at 100% 0%, var(--bg3), transparent 55%),linear-gradient(180deg,var(--bg1),#ffffff 35%,#f8fafc 100%);}section{position:relative;overflow:hidden}</style>`
    );
  } else if (/background\s*:\s*(#000|#000000|black)/i.test(out) && !/background\s*:\s*(#f|#e|#d)/i.test(out)) {
    out = out.replace(/<\/style>/i, `\nbody{background:#f8fafc !important;color:#0f172a !important;}\n</style>`);
  }

  // Add dynamic background helper styles if missing.
  if (!/\.dynamic-section-bg|\.bg-orb/i.test(out) && /<style[\s>]/i.test(out)) {
    out = out.replace(
      /<\/style>/i,
      `.dynamic-section-bg{background:linear-gradient(135deg,#f8fafc 0%,#ecfeff 40%,#eef2ff 100%)}.bg-orb{position:absolute;border-radius:9999px;filter:blur(28px);opacity:.45;pointer-events:none}.bg-orb.one{width:280px;height:280px;background:#a5f3fc;top:-80px;left:-60px}.bg-orb.two{width:260px;height:260px;background:#c7d2fe;bottom:-100px;right:-50px}\n</style>`
    );
  }

  // Normalize top navigation to a single aligned premium header.
  out = out.replace(/<header[\s\S]*?<\/header>/i, "");
  out = out.replace(/<nav[\s\S]*?<\/nav>/i, "");
  if (/<body[^>]*>/i.test(out)) {
    out = out.replace(/<body[^>]*>/i, (match) => `${match}${standardHeader}`);
  } else {
    out = `${standardHeader}${out}`;
  }

  // Ensure mandatory anchor sections exist.
  if (!/id=["']about-us["']/i.test(out)) {
    const section = `\n<section id="about-us" class="dynamic-section-bg" style="max-width:1140px;margin:36px auto;padding:48px 20px;border-top:1px solid #e2e8f0;"><h2 style="font-size:32px;margin:0 0 12px;color:#0f172a;">About Us</h2><p style="margin:0;color:#475569;line-height:1.7;max-width:72ch;">${siteName} helps clients in ${industry || "business"} with modern, high-performance digital experiences.</p></section>\n`;
    out = /<\/main>/i.test(out) ? out.replace(/<\/main>/i, `${section}</main>`) : `${out}${section}`;
  }
  if (!/id=["']features["']/i.test(out)) {
    const section = `\n<section id="features" class="dynamic-section-bg" style="max-width:1140px;margin:0 auto;padding:48px 20px;"><h2 style="font-size:32px;margin:0 0 12px;color:#0f172a;">Features</h2><p style="margin:0;color:#475569;line-height:1.7;max-width:72ch;">Explore the core capabilities designed for speed, reliability, and growth.</p></section>\n`;
    out = /<\/main>/i.test(out) ? out.replace(/<\/main>/i, `${section}</main>`) : `${out}${section}`;
  }
  if (!/id=["']contact["']/i.test(out)) {
    const section = `\n<section id="contact" class="dynamic-section-bg" style="max-width:1140px;margin:0 auto;padding:48px 20px;"><h2 style="font-size:32px;margin:0 0 12px;color:#0f172a;">Contact</h2><p style="margin:0;color:#475569;line-height:1.7;max-width:72ch;">Talk to ${siteName} to plan your next launch and growth milestones.</p></section>\n`;
    out = /<\/main>/i.test(out) ? out.replace(/<\/main>/i, `${section}</main>`) : `${out}${section}`;
  }

  if (aiImageUrls.length > 0 && !/<img[\s>]/i.test(out)) {
    const imageBand = `\n<section style="max-width:1100px;margin:32px auto;padding:0 20px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">${aiImageUrls.slice(0, 3).map((url) => `<img src="${url}" alt="${siteName} AI-generated visual" style="width:100%;height:220px;object-fit:cover;border-radius:14px;border:1px solid #e2e8f0;"/>`).join("")}</div></section>\n`;
    if (/<\/main>/i.test(out)) {
      out = out.replace(/<\/main>/i, `${imageBand}</main>`);
    } else if (/<\/body>/i.test(out)) {
      out = out.replace(/<\/body>/i, `${imageBand}</body>`);
    } else {
      out = `${out}${imageBand}`;
    }
  }

  // Normalize footer to a single aligned premium footer.
  out = out.replace(/<footer[\s\S]*?<\/footer>/i, "");

  if (/<\/body>/i.test(out)) {
    return out.replace(/<\/body>/i, `${standardFooter}</body>`);
  }

  return `${out}${standardFooter}`;
}

function stripCodeFence(text: string): string {
  return text
    .replace(/^```(?:json|html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function tryParseStructuredResponse(text: string): WebsiteContent | null {
  const cleaned = stripCodeFence(text);

  try {
    return JSON.parse(cleaned) as WebsiteContent;
  } catch {
    // Try extracting a JSON object from noisy output.
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate) as WebsiteContent;
      } catch {
        return null;
      }
    }
  }

  return null;
}

async function generateStudioHtml(formData: WebsiteFormData, referenceAnalysis: string, aiImageUrls: string[], matchedTemplates: Array<{ name: string; previewUrl: string }>): Promise<string> {
  const prompt = buildStudioHtmlPrompt(formData, referenceAnalysis, aiImageUrls, matchedTemplates);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${STUDIO_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            ...formData.referenceImages.map((img) => ({
              inlineData: {
                mimeType: img.mimeType,
                data: img.data,
              },
            })),
          ],
        }],
        generationConfig: {
          temperature: 0.95,
          topP: 0.95,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Studio HTML generation failed (${response.status})`);
  }

  const data = await response.json();
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return ensureHeaderFooterInHtml(raw, formData.businessName || "Your Brand", formData.industry, aiImageUrls);
}

// ── Fallback content ──────────────────────────────────────────────────────────

function buildFallbackContent(businessName: string, industry = "Business Services"): WebsiteContent {
  const name = businessName || "Our Business";
  return {
    siteName: name,
    tagline: `Your trusted ${industry} partner`,
    hero: {
      headline: `Transform Your Business with ${name}`,
      subheadline: `We deliver exceptional ${industry.toLowerCase()} solutions powered by cutting-edge AI technology.`,
      ctaText: "Get Started Free",
      ctaSecondaryText: "See How It Works",
    },
    about: {
      title: `Why Choose ${name}?`,
      description: `We are a leading ${industry.toLowerCase()} company dedicated to delivering outstanding results. Our AI-powered platform combines industry expertise with innovative technology to help businesses like yours grow faster and smarter.`,
    },
    features: [
      {
        title: "AI-Powered Automation",
        description: "Automate repetitive tasks and focus on what matters most.",
        emoji: "🤖",
      },
      {
        title: "24/7 Availability",
        description: "Always here when you need us, around the clock.",
        emoji: "🌐",
      },
      {
        title: "Expert Support",
        description: "Experienced professionals ready to help you succeed.",
        emoji: "👥",
      },
      {
        title: "Lightning Fast",
        description: "Quick turnaround with high-quality outcomes every time.",
        emoji: "⚡",
      },
      {
        title: "Secure & Reliable",
        description: "Enterprise-grade security protecting your data.",
        emoji: "🔒",
      },
      {
        title: "Custom Solutions",
        description: "Tailored approaches designed for your unique needs.",
        emoji: "🎯",
      },
    ],
    stats: [
      { value: "500+", label: "Clients Served" },
      { value: "98%", label: "Satisfaction Rate" },
      { value: "24/7", label: "AI Support" },
      { value: "5★", label: "Average Rating" },
    ],
    contact: {
      email: "info@example.com",
      phone: "+1 (555) 000-0000",
      address: "Available Worldwide",
    },
    suggestedTemplate: "saas",
    customHtml: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <style>
    :root { --p:#2563eb; --s:#0ea5e9; --bg:#f8fafc; --ink:#0f172a; --muted:#475569; }
    *{box-sizing:border-box} body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink)}
    .wrap{max-width:1100px;margin:0 auto;padding:0 20px}
    header{position:sticky;top:0;background:#fffccf;border-bottom:1px solid #e2e8f0;backdrop-filter:blur(8px)}
    nav{height:68px;display:flex;align-items:center;justify-content:space-between}
    .brand{font-weight:800;font-size:1.1rem}
    .hero{padding:72px 0;background:linear-gradient(140deg,#dbeafe 0%,#ecfeff 100%)}
    .hero h1{font-size:clamp(2rem,4vw,3.5rem);line-height:1.05;margin:0 0 12px}
    .hero p{color:var(--muted);max-width:60ch}
    .btns{display:flex;gap:12px;margin-top:18px;flex-wrap:wrap}
    .btn{padding:11px 18px;border-radius:10px;font-weight:700;text-decoration:none;display:inline-block}
    .btn.primary{background:var(--p);color:#fff}.btn.ghost{border:1px solid var(--p);color:var(--p)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:36px 0}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;padding:20px 0}
    .stat{background:#fff;border-radius:12px;padding:14px;border:1px solid #dbeafe}
    footer{margin-top:36px;padding:26px 0;border-top:1px solid #e2e8f0;color:var(--muted);font-size:.9rem}
  </style>
</head>
<body>
  <header><div class="wrap"><nav><div class="brand">${name}</div><div>${industry}</div></nav></div></header>
  <section class="hero"><div class="wrap"><h1>Transform your business with ${name}</h1><p>High-performance digital experience inspired by your goals and references.</p><div class="btns"><a href="#" class="btn primary">Get Started</a><a href="#" class="btn ghost">Explore</a></div></div></section>
  <main class="wrap">
    <section class="grid">
      <article class="card"><h3>Fast Execution</h3><p>Ship outcomes quickly with focused workflows.</p></article>
      <article class="card"><h3>Design Driven</h3><p>Clear hierarchy, modern rhythm, real-world polish.</p></article>
      <article class="card"><h3>Reliable Support</h3><p>AI + human guidance whenever you need it.</p></article>
    </section>
    <section class="stats">
      <div class="stat"><strong>500+</strong><br/>Clients served</div>
      <div class="stat"><strong>98%</strong><br/>Satisfaction rate</div>
      <div class="stat"><strong>24/7</strong><br/>Availability</div>
      <div class="stat"><strong>5★</strong><br/>Average rating</div>
    </section>
  </main>
  <footer><div class="wrap">© ${new Date().getFullYear()} ${name}. All rights reserved.</div></footer>
</body>
</html>`,
  };
}

// ── Main API function ─────────────────────────────────────────────────────────

export async function generateWebsiteContent(
  formData: WebsiteFormData
): Promise<WebsiteContent> {
  if (!GEMINI_API_KEY) throw new Error("Gemini API key not configured.");

  const matchedTemplates = matchOpenSourceTemplateRefs({
    industry: formData.industry,
    description: formData.description,
    themeStyle: formData.themeStyle,
    websiteTone: formData.websiteTone,
  });
  const combinedLinks = Array.from(new Set([
    ...formData.inspirationLinks,
    ...matchedTemplates.map((template) => template.previewUrl),
  ]));
  const referenceAnalysis = await buildReferenceAnalysis(combinedLinks);
  const imageQuery = [formData.industry, formData.description, formData.businessName].filter(Boolean).join(" ");
  const aiImageUrls = buildAiGeneratedImageUrls(imageQuery);
  const prompt = buildPrompt(formData, referenceAnalysis, aiImageUrls, matchedTemplates);

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          ...formData.referenceImages.map((img) => ({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data,
            },
          })),
        ],
      }],
      generationConfig: {
        temperature: 0.85,
        topP: 0.9,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error?.message ||
        `Gemini API error (${response.status})`
    );
  }

  const data = await response.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = tryParseStructuredResponse(text);

  if (parsed) {
    if (!parsed.customHtml || parsed.customHtml.trim().length < 300) {
      try {
        parsed.customHtml = await generateStudioHtml(formData, referenceAnalysis, aiImageUrls, matchedTemplates);
      } catch {
        // Keep parsed content even if HTML fallback fails.
      }
    } else {
      parsed.customHtml = ensureHeaderFooterInHtml(
        parsed.customHtml,
        parsed.siteName || formData.businessName,
        formData.industry,
        aiImageUrls
      );
    }
    return parsed;
  }

  try {
    const html = await generateStudioHtml(formData, referenceAnalysis, aiImageUrls, matchedTemplates);
    const fallback = buildFallbackContent(formData.businessName, formData.industry);
    return { ...fallback, customHtml: html };
  } catch {
    return buildFallbackContent(formData.businessName, formData.industry);
  }
}
