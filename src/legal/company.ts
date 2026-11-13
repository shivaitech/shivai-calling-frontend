// Who ShivAI is, legally, and who people contact about their personal data.
// Every legal page, consent notice and the Privacy Center read from here, so a change here
// (new grievance officer, registered address, policy version) updates the whole product.
//
// Digital Personal Data Protection Act, 2023 (DPDP Act) + DPDP Rules, 2025:
//   - s.5 / Rule 3: a notice that stands on its own, lists the data and purposes, and how to
//     withdraw consent, use rights and complain to the Data Protection Board.
//   - s.8(10) / Rule 14: a published contact for grievances; answered within 90 days.
//   - s.6(4): withdrawing consent must be as easy as giving it.

/** Name used in notices. Replace with the registered company name, e.g. "ShivAI Technologies Pvt. Ltd.". */
export const LEGAL_ENTITY = import.meta.env.VITE_LEGAL_ENTITY || "ShivAI";
export const BRAND = "ShivAI";
/** Registered office. Left empty, notices say it's available on request. */
export const REGISTERED_ADDRESS: string = import.meta.env.VITE_LEGAL_ADDRESS || "";
export const SITE = "https://www.callshivai.com";

/** Grievance Officer / privacy contact (DPDP s.8(10), IT Rules 2021 r.3(2)). */
export const GRIEVANCE_OFFICER = {
  name: import.meta.env.VITE_GRIEVANCE_OFFICER || "Grievance Officer, ShivAI",
  email: import.meta.env.VITE_PRIVACY_EMAIL || "support@callshivai.com",
  /** We acknowledge within this many hours… */
  ackHours: 24,
  /** …and resolve within this many days (DPDP Rules: at most 90). */
  resolveDays: 30,
};

/** Where an unresolved complaint can go next (DPDP s.13(3)). */
export const DATA_PROTECTION_BOARD = {
  name: "Data Protection Board of India",
  url: "https://www.meity.gov.in/data-protection-framework",
};

/** Bump when a policy changes in a way people must re-accept. The consent ledger stores it. */
export const POLICY_VERSION = "2026-11-12";
export const POLICY_EFFECTIVE = "12 November 2026";

/** Minimum age to hold an account (DPDP s.9: under-18s need verifiable parental consent). */
export const MIN_AGE = 18;

export const LEGAL_PATHS = {
  privacy: "/legal/privacy",
  terms: "/legal/terms",
  cookies: "/legal/cookies",
  dpa: "/legal/dpa",
  aup: "/legal/acceptable-use",
  grievance: "/legal/grievance",
} as const;
export type LegalDocId = keyof typeof LEGAL_PATHS;
