/**
 * Editor features backed by the newer card fields: venture types / logo sizes / descriptions /
 * PDF upload, extra phone numbers, Pay Me and the featured button. The backend now accepts
 * them, so they're on. Set VITE_CARD_EXTRAS=false to hide them again (e.g. against an older
 * backend that would reject the fields). Cards holding this data display it either way.
 */
export const CARD_EXTRAS = import.meta.env.VITE_CARD_EXTRAS !== "false";
