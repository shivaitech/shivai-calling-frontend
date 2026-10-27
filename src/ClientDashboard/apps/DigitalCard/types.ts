import type { BusinessCardInput, SocialType } from "../../../services/businessCardAPI";

export type { BusinessCardInput as CardData, SocialType };

export const SOCIAL_TYPES: { value: SocialType; label: string; base: string }[] = [
  { value: "linkedin", label: "LinkedIn", base: "https://www.linkedin.com/in/" },
  { value: "instagram", label: "Instagram", base: "https://www.instagram.com/" },
  { value: "twitter", label: "X / Twitter", base: "https://x.com/" },
  { value: "facebook", label: "Facebook", base: "https://www.facebook.com/" },
  { value: "youtube", label: "YouTube", base: "https://www.youtube.com/@" },
  { value: "website", label: "Website", base: "" },
];

/** Pre-filled on new cards; doubles as a pitch for what the card does. */
export const SUGGESTED_TAGLINE =
  "Let's connect. Tap to call, message me on WhatsApp or save my contact in one tap — everything you need to reach me, all in one place.";

/** For forms: an empty tagline starts out as the suggested one. */
export const withSuggestedTagline = (c: BusinessCardInput): BusinessCardInput =>
  c.tagline?.trim() ? c : { ...c, tagline: SUGGESTED_TAGLINE };

export const emptyCard = (): BusinessCardInput => ({
  full_name: "",
  job_title: "",
  company_name: "",
  tagline: SUGGESTED_TAGLINE,
  image_url: "",
  color_code: "#161616",
  country_code: "+91",
  phone_number: "",
  is_whatsapp_number: true,
  email: "",
  website: "",
  social_media: [],
  ventures: [],
  agent_id: "",
});

export const sampleCard = (): BusinessCardInput => ({
  ...emptyCard(),
  full_name: "Alex Morgan",
  job_title: "Founder & Consultant",
  company_name: "Morgan Consulting",
  tagline: "Helping businesses grow through strategy, technology and people.",
  country_code: "+1",
  phone_number: "415 555 0134",
  is_whatsapp_number: true,
  email: "alex@alexmorgan.co",
  website: "https://alexmorgan.co",
  social_media: [
    { type: "linkedin", url: "https://www.linkedin.com/in/alexmorgan", username: "alexmorgan" },
    { type: "instagram", url: "https://www.instagram.com/alexmorgan", username: "alexmorgan" },
    { type: "youtube", url: "https://www.youtube.com/@alexmorgan", username: "alexmorgan" },
  ],
  ventures: [{ name: "Morgan Consulting", logo_url: "", url: "https://alexmorgan.co" }],
  agent_id: "demo", // shows the “✦ Ask My AI” button in the marketing sample
});
