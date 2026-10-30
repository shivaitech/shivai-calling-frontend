import { CardData, emptyCard, withSuggestedTagline } from "./types";

/**
 * The card being created lives in localStorage until it is saved to the API,
 * so a visitor can fill everything in before signing up (and survives a
 * Google sign-in round trip).
 */
export const DRAFT_KEY = "shivai-digital-card-new-draft";

export function loadDraft(): CardData {
  try {
    const s = localStorage.getItem(DRAFT_KEY);
    if (s) {
      const d = { ...emptyCard(), ...JSON.parse(s) } as CardData;
      // Drafts saved by an earlier version were pre-filled with a demo profile — start blank instead.
      if (d.full_name === "Alex Morgan" && d.company_name === "Acme Studio") return emptyCard();
      return withSuggestedTagline(d);
    }
  } catch {
    /* storage unavailable / corrupt */
  }
  return emptyCard();
}

// A form nobody has typed into yet (blank, or blank + the suggested tagline).
const PRISTINE = new Set([JSON.stringify(emptyCard()), JSON.stringify(withSuggestedTagline(emptyCard()))]);

export function saveDraft(form: CardData): void {
  try {
    const json = JSON.stringify(form);
    // Just opening the creator shouldn't leave anything behind in storage.
    if (PRISTINE.has(json)) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, json);
  } catch {
    /* quota exceeded or storage blocked — the draft just isn't persisted */
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
