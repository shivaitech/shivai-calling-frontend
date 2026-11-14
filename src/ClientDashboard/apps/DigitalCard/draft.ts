import { CardData, emptyCard, withSuggestedTagline } from "./types";

/**
 * The card being created lives in localStorage until it is saved to the API, so a visitor can
 * fill everything in before signing up (and it survives a Google sign-in round trip).
 *
 * Two separate drafts: the public creator on the marketing site, and the dashboard's "new card"
 * editor. Keeping them apart means details typed on the marketing page never show up in the
 * dashboard. Creating a card (from either place) clears both.
 */
export type DraftScope = "public" | "dashboard";

const KEYS: Record<DraftScope, string> = {
  // The original key — existing marketing-page drafts carry on as public drafts.
  public: "shivai-digital-card-new-draft",
  dashboard: "shivai-digital-card-dashboard-draft",
};

export function loadDraft(scope: DraftScope): CardData {
  try {
    const s = localStorage.getItem(KEYS[scope]);
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

export function saveDraft(scope: DraftScope, form: CardData): void {
  try {
    const json = JSON.stringify(form);
    // Just opening the creator shouldn't leave anything behind in storage.
    if (PRISTINE.has(json)) localStorage.removeItem(KEYS[scope]);
    else localStorage.setItem(KEYS[scope], json);
  } catch {
    /* quota exceeded or storage blocked — the draft just isn't persisted */
  }
}

/** After a card is created: forget every draft, wherever it was typed. */
export function clearDraft(): void {
  for (const key of Object.values(KEYS)) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

/** A card someone started (it has a name) but never saved, or null. */
export function startedDraft(scope: DraftScope): CardData | null {
  try {
    if (!localStorage.getItem(KEYS[scope])) return null;
  } catch {
    return null;
  }
  const d = loadDraft(scope);
  return d.full_name.trim() ? d : null;
}

/** Carry a card started on the public page into the dashboard's "new card" editor. */
export function adoptPublicDraft(): void {
  try {
    const s = localStorage.getItem(KEYS.public);
    if (!s) return;
    localStorage.setItem(KEYS.dashboard, s);
    localStorage.removeItem(KEYS.public);
  } catch {
    /* storage blocked */
  }
}

/** Forget only the public page's draft (the person chose to discard it). */
export function discardPublicDraft(): void {
  try {
    localStorage.removeItem(KEYS.public);
  } catch {
    /* ignore */
  }
}
