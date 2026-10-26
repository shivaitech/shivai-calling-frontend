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

export const emptyCard = (): BusinessCardInput => ({
  full_name: "",
  job_title: "",
  company_name: "",
  tagline: "",
  image_url: "",
  color_code: "#161616",
  country_code: "",
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
  agent_id: "demo", // shows the “✦ My AI” button in the marketing sample
});
