import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANG_TO_LABEL: Record<string, string> = {
  en: "English", "en-us": "English (US)", "en-gb": "English (UK)",
  "en-au": "English (Australia)", "en-ca": "English (Canada)", "en-in": "English (India)",
  hi: "Hindi", es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean", zh: "Chinese",
  ar: "Arabic", nl: "Dutch", sv: "Swedish", no: "Norwegian", nb: "Norwegian",
  da: "Danish", fi: "Finnish", pl: "Polish", tr: "Turkish", he: "Hebrew",
  th: "Thai", vi: "Vietnamese", id: "Indonesian", ms: "Malay", cs: "Czech",
  ro: "Romanian", hu: "Hungarian", uk: "Ukrainian", bg: "Bulgarian", hr: "Croatian",
  sk: "Slovak", sl: "Slovenian", lt: "Lithuanian", lv: "Latvian", et: "Estonian",
  el: "Greek", sr: "Serbian", bn: "Bengali", ta: "Tamil", te: "Telugu",
  ml: "Malayalam", kn: "Kannada", mr: "Marathi", gu: "Gujarati", pa: "Punjabi",
  or: "Odia", as: "Assamese", multilingual: "Multilingual",
};

export function formatAgentLanguages(lang: string | string[] | undefined | null): string {
  if (!lang) return "—";
  const arr: string[] = Array.isArray(lang) ? lang : [lang];
  return arr
    .map((c) => LANG_TO_LABEL[String(c).toLowerCase()] || c)
    .join(", ");
}

// Check if the current user is a developer
export function isDeveloperUser(userEmail?: string): boolean {
  return (
    userEmail === "atharkatheri@gmail.com" ||
    userEmail === "rs@shivaitech.com" ||
    userEmail === "demo@callshivai.com" || 
    userEmail === "demo@callshivai1.com" || 
    userEmail === "kunalprakashjha@gmail.com" 
    // || 
    // userEmail === "web@asianadventures.in"
  );
}

// Check if user is a special client (PMJC/Kunal Prakash)
export function isKunalPrakashClient(userEmail?: string): boolean {
  return userEmail === "kunalprakashjha@gmail.com";
}
