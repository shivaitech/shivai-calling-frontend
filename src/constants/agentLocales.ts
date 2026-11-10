// Countries + languages for AI agents — shared by the quick create wizard and
// Edit. Picking countries narrows which languages the agent can speak: a
// language is offered when one of its `countryCodes` is selected.
//
// Every country here offers at least one language. Countries whose own
// language isn't supported by the voice stack fall back to English (US + UK),
// so nobody gets stuck with an empty language list.
//
// Language `value`s are what the backend's STT/TTS understands — only add a
// language once the voice stack supports it. Countries are free to add.

export interface AgentCountry {
  code: string;
  name: string;
  flag: string;
  /** "sarvam" = Deepgram (major) + Sarvam (regional) for India; "deepgram" elsewhere. */
  stt: "sarvam" | "deepgram";
}

export interface AgentLanguage {
  value: string;
  label: string;
  flag: string;
  countryCodes: string[];
}

/** 🇮🇳 from "IN" — regional-indicator letters, so no hand-typed emoji to get wrong. */
const flagOf = (code: string): string =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

// Shown first, in this order; everything else follows A–Z.
const PINNED = ["IN", "US", "GB", "AE", "SA", "AU", "CA", "SG"];

// ISO 3166-1 alpha-2: every UN member + observers and the territories people commonly call from.
const WORLD: [code: string, name: string][] = [
  ["AF", "Afghanistan"], ["AL", "Albania"], ["DZ", "Algeria"], ["AD", "Andorra"], ["AO", "Angola"],
  ["AG", "Antigua and Barbuda"], ["AR", "Argentina"], ["AM", "Armenia"], ["AW", "Aruba"], ["AU", "Australia"],
  ["AT", "Austria"], ["AZ", "Azerbaijan"], ["BS", "Bahamas"], ["BH", "Bahrain"], ["BD", "Bangladesh"],
  ["BB", "Barbados"], ["BY", "Belarus"], ["BE", "Belgium"], ["BZ", "Belize"], ["BJ", "Benin"],
  ["BM", "Bermuda"], ["BT", "Bhutan"], ["BO", "Bolivia"], ["BA", "Bosnia and Herzegovina"], ["BW", "Botswana"],
  ["BR", "Brazil"], ["BN", "Brunei"], ["BG", "Bulgaria"], ["BF", "Burkina Faso"], ["BI", "Burundi"],
  ["CV", "Cape Verde"], ["KH", "Cambodia"], ["CM", "Cameroon"], ["CA", "Canada"], ["KY", "Cayman Islands"],
  ["CF", "Central African Republic"], ["TD", "Chad"], ["CL", "Chile"], ["CN", "China"], ["CO", "Colombia"],
  ["KM", "Comoros"], ["CG", "Congo"], ["CD", "Congo (DRC)"], ["CR", "Costa Rica"], ["CI", "Côte d'Ivoire"],
  ["HR", "Croatia"], ["CU", "Cuba"], ["CW", "Curaçao"], ["CY", "Cyprus"], ["CZ", "Czech Republic"],
  ["DK", "Denmark"], ["DJ", "Djibouti"], ["DM", "Dominica"], ["DO", "Dominican Republic"], ["EC", "Ecuador"],
  ["EG", "Egypt"], ["SV", "El Salvador"], ["GQ", "Equatorial Guinea"], ["ER", "Eritrea"], ["EE", "Estonia"],
  ["SZ", "Eswatini"], ["ET", "Ethiopia"], ["FJ", "Fiji"], ["FI", "Finland"], ["FR", "France"],
  ["GA", "Gabon"], ["GM", "Gambia"], ["GE", "Georgia"], ["DE", "Germany"], ["GH", "Ghana"],
  ["GI", "Gibraltar"], ["GR", "Greece"], ["GL", "Greenland"], ["GD", "Grenada"], ["GU", "Guam"],
  ["GT", "Guatemala"], ["GN", "Guinea"], ["GW", "Guinea-Bissau"], ["GY", "Guyana"], ["HT", "Haiti"],
  ["HN", "Honduras"], ["HK", "Hong Kong"], ["HU", "Hungary"], ["IS", "Iceland"], ["IN", "India"],
  ["ID", "Indonesia"], ["IR", "Iran"], ["IQ", "Iraq"], ["IE", "Ireland"], ["IL", "Israel"],
  ["IT", "Italy"], ["JM", "Jamaica"], ["JP", "Japan"], ["JO", "Jordan"], ["KZ", "Kazakhstan"],
  ["KE", "Kenya"], ["KI", "Kiribati"], ["KW", "Kuwait"], ["KG", "Kyrgyzstan"], ["LA", "Laos"],
  ["LV", "Latvia"], ["LB", "Lebanon"], ["LS", "Lesotho"], ["LR", "Liberia"], ["LY", "Libya"],
  ["LI", "Liechtenstein"], ["LT", "Lithuania"], ["LU", "Luxembourg"], ["MO", "Macao"], ["MG", "Madagascar"],
  ["MW", "Malawi"], ["MY", "Malaysia"], ["MV", "Maldives"], ["ML", "Mali"], ["MT", "Malta"],
  ["MH", "Marshall Islands"], ["MR", "Mauritania"], ["MU", "Mauritius"], ["MX", "Mexico"], ["FM", "Micronesia"],
  ["MD", "Moldova"], ["MC", "Monaco"], ["MN", "Mongolia"], ["ME", "Montenegro"], ["MA", "Morocco"],
  ["MZ", "Mozambique"], ["MM", "Myanmar"], ["NA", "Namibia"], ["NR", "Nauru"], ["NP", "Nepal"],
  ["NL", "Netherlands"], ["NZ", "New Zealand"], ["NI", "Nicaragua"], ["NE", "Niger"], ["NG", "Nigeria"],
  ["KP", "North Korea"], ["MK", "North Macedonia"], ["NO", "Norway"], ["OM", "Oman"], ["PK", "Pakistan"],
  ["PW", "Palau"], ["PS", "Palestine"], ["PA", "Panama"], ["PG", "Papua New Guinea"], ["PY", "Paraguay"],
  ["PE", "Peru"], ["PH", "Philippines"], ["PL", "Poland"], ["PT", "Portugal"], ["PR", "Puerto Rico"],
  ["QA", "Qatar"], ["RO", "Romania"], ["RU", "Russia"], ["RW", "Rwanda"], ["KN", "Saint Kitts and Nevis"],
  ["LC", "Saint Lucia"], ["VC", "Saint Vincent and the Grenadines"], ["WS", "Samoa"], ["SM", "San Marino"],
  ["ST", "São Tomé and Príncipe"], ["SA", "Saudi Arabia"], ["SN", "Senegal"], ["RS", "Serbia"], ["SC", "Seychelles"],
  ["SL", "Sierra Leone"], ["SG", "Singapore"], ["SK", "Slovakia"], ["SI", "Slovenia"], ["SB", "Solomon Islands"],
  ["SO", "Somalia"], ["ZA", "South Africa"], ["KR", "South Korea"], ["SS", "South Sudan"], ["ES", "Spain"],
  ["LK", "Sri Lanka"], ["SD", "Sudan"], ["SR", "Suriname"], ["SE", "Sweden"], ["CH", "Switzerland"],
  ["SY", "Syria"], ["TW", "Taiwan"], ["TJ", "Tajikistan"], ["TZ", "Tanzania"], ["TH", "Thailand"],
  ["TL", "Timor-Leste"], ["TG", "Togo"], ["TO", "Tonga"], ["TT", "Trinidad and Tobago"], ["TN", "Tunisia"],
  ["TR", "Turkey"], ["TM", "Turkmenistan"], ["TV", "Tuvalu"], ["UG", "Uganda"], ["UA", "Ukraine"],
  ["AE", "United Arab Emirates"], ["GB", "United Kingdom"], ["US", "United States"], ["UY", "Uruguay"], ["UZ", "Uzbekistan"],
  ["VU", "Vanuatu"], ["VA", "Vatican City"], ["VE", "Venezuela"], ["VN", "Vietnam"], ["VI", "U.S. Virgin Islands"],
  ["YE", "Yemen"], ["ZM", "Zambia"], ["ZW", "Zimbabwe"],
];

const byName = new Map(WORLD);

export const AGENT_COUNTRIES: AgentCountry[] = [
  ...PINNED.map((code) => [code, byName.get(code)!] as [string, string]),
  ...WORLD.filter(([code]) => !PINNED.includes(code)).sort((a, b) => a[1].localeCompare(b[1])),
].map(([code, name]) => ({ code, name, flag: flagOf(code), stt: code === "IN" ? "sarvam" : "deepgram" }));

// Where each supported language is actually spoken.
const LANGUAGES: AgentLanguage[] = [
  // English
  { value: "en-US", label: "English (US)", flag: "🇺🇸", countryCodes: ["US", "PH", "PR", "LR", "GU", "VI", "MH", "FM", "PW"] },
  {
    value: "en-GB", label: "English (UK)", flag: "🇬🇧",
    countryCodes: [
      "GB", "IE", "MT", "GI", "BM", "KY", "NG", "GH", "KE", "UG", "TZ", "ZA", "ZM", "ZW", "MW", "BW", "NA", "LS", "SZ",
      "SL", "GM", "SS", "RW", "CM", "MU", "SC", "SG", "MY", "BN", "HK", "JM", "TT", "BB", "BS", "BZ", "GY", "LC",
      "VC", "GD", "AG", "DM", "KN", "CY", "AE", "QA", "KW", "BH", "OM",
    ],
  },
  { value: "en-AU", label: "English (Australia)", flag: "🇦🇺", countryCodes: ["AU", "NZ", "FJ", "PG", "SB", "VU", "WS", "TO", "KI", "NR", "TV"] },
  { value: "en-CA", label: "English (Canada)", flag: "🇨🇦", countryCodes: ["CA"] },
  // Spanish (one code covers all Spanish-speaking countries)
  {
    value: "es", label: "Spanish", flag: "🇪🇸",
    countryCodes: ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "GQ", "US"],
  },
  {
    value: "fr", label: "French", flag: "🇫🇷",
    countryCodes: [
      "FR", "CA", "BE", "CH", "LU", "MC", "SN", "CI", "CM", "ML", "BF", "NE", "TD", "GN", "BJ", "TG", "CF", "CG", "CD",
      "GA", "DJ", "KM", "MG", "HT", "RW", "BI", "SC", "VU", "MA", "DZ", "TN", "MU", "MR",
    ],
  },
  { value: "de", label: "German", flag: "🇩🇪", countryCodes: ["DE", "AT", "CH", "LI", "LU"] },
  { value: "it", label: "Italian", flag: "🇮🇹", countryCodes: ["IT", "SM", "VA", "CH"] },
  { value: "pt", label: "Portuguese", flag: "🇵🇹", countryCodes: ["PT", "BR", "AO", "MZ", "CV", "GW", "ST", "TL", "MO"] },
  { value: "nl", label: "Dutch", flag: "🇳🇱", countryCodes: ["NL", "BE", "SR", "AW", "CW"] },
  { value: "pl", label: "Polish", flag: "🇵🇱", countryCodes: ["PL"] },
  { value: "ru", label: "Russian", flag: "🇷🇺", countryCodes: ["RU", "BY", "KZ", "KG", "TJ", "UZ", "TM", "MD", "AM", "AZ", "GE"] },
  { value: "uk", label: "Ukrainian", flag: "🇺🇦", countryCodes: ["UA"] },
  { value: "ja", label: "Japanese", flag: "🇯🇵", countryCodes: ["JP"] },
  { value: "ko", label: "Korean", flag: "🇰🇷", countryCodes: ["KR", "KP"] },
  { value: "zh", label: "Chinese", flag: "🇨🇳", countryCodes: ["CN", "TW", "HK", "MO", "SG", "MY"] },
  {
    value: "ar", label: "Arabic", flag: "🇸🇦",
    countryCodes: ["SA", "AE", "EG", "QA", "KW", "BH", "OM", "JO", "LB", "SY", "IQ", "YE", "PS", "LY", "SD", "MA", "DZ", "TN", "MR", "KM", "DJ", "SO", "TD"],
  },
  { value: "tr", label: "Turkish", flag: "🇹🇷", countryCodes: ["TR", "CY"] },
  { value: "he", label: "Hebrew", flag: "🇮🇱", countryCodes: ["IL"] },
  // Scandinavian
  { value: "sv", label: "Swedish", flag: "🇸🇪", countryCodes: ["SE", "FI"] },
  { value: "nb", label: "Norwegian", flag: "🇳🇴", countryCodes: ["NO"] },
  { value: "da", label: "Danish", flag: "🇩🇰", countryCodes: ["DK", "GL"] },
  { value: "fi", label: "Finnish", flag: "🇫🇮", countryCodes: ["FI"] },
  // Eastern European
  { value: "el", label: "Greek", flag: "🇬🇷", countryCodes: ["GR", "CY"] },
  { value: "cs", label: "Czech", flag: "🇨🇿", countryCodes: ["CZ"] },
  { value: "hu", label: "Hungarian", flag: "🇭🇺", countryCodes: ["HU"] },
  { value: "ro", label: "Romanian", flag: "🇷🇴", countryCodes: ["RO", "MD"] },
  { value: "bg", label: "Bulgarian", flag: "🇧🇬", countryCodes: ["BG"] },
  { value: "hr", label: "Croatian", flag: "🇭🇷", countryCodes: ["HR", "BA"] },
  { value: "sr", label: "Serbian", flag: "🇷🇸", countryCodes: ["RS", "BA", "ME"] },
  { value: "sk", label: "Slovak", flag: "🇸🇰", countryCodes: ["SK"] },
  { value: "sl", label: "Slovenian", flag: "🇸🇮", countryCodes: ["SI"] },
  { value: "et", label: "Estonian", flag: "🇪🇪", countryCodes: ["EE"] },
  { value: "lv", label: "Latvian", flag: "🇱🇻", countryCodes: ["LV"] },
  { value: "lt", label: "Lithuanian", flag: "🇱🇹", countryCodes: ["LT"] },
  // South-East Asian
  { value: "th", label: "Thai", flag: "🇹🇭", countryCodes: ["TH"] },
  { value: "vi", label: "Vietnamese", flag: "🇻🇳", countryCodes: ["VN"] },
  { value: "id", label: "Indonesian", flag: "🇮🇩", countryCodes: ["ID"] },
  // Indian languages (Sarvam STT + Google TTS)
  { value: "en-IN", label: "English (India)", flag: "🇮🇳", countryCodes: ["IN", "NP", "LK", "BT", "MV", "PK", "BD"] },
  { value: "hi", label: "Hinglish", flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "hi-formal", label: "Hindi", flag: "🇮🇳", countryCodes: ["IN", "NP", "FJ"] },
  { value: "ta", label: "Tamil", flag: "🇮🇳", countryCodes: ["IN", "LK", "SG", "MY"] },
  { value: "te", label: "Telugu", flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "mr", label: "Marathi", flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "bn", label: "Bengali", flag: "🇮🇳", countryCodes: ["IN", "BD"] },
  { value: "gu", label: "Gujarati", flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "kn", label: "Kannada", flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "ml", label: "Malayalam", flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "pa", label: "Punjabi", flag: "🇮🇳", countryCodes: ["IN", "PK"] },
];

// English fallback: any country no language claims gets English (US + UK).
const claimed = new Set(LANGUAGES.flatMap((l) => l.countryCodes));
const unclaimed = AGENT_COUNTRIES.map((c) => c.code).filter((code) => !claimed.has(code));

export const AGENT_LANGUAGES: AgentLanguage[] = LANGUAGES.map((l) =>
  l.value === "en-US" || l.value === "en-GB" ? { ...l, countryCodes: [...l.countryCodes, ...unclaimed] } : l,
);
