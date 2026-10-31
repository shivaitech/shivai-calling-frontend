/**
 * Editor features that need backend fields the API doesn't accept yet (see the backend handoff):
 * venture types / logo sizes / descriptions / PDF upload, extra phone numbers, and Pay Me.
 * Off by default so saves never fail on live; set VITE_CARD_EXTRAS=true once the backend ships them.
 * Cards that already hold this data still display it either way.
 */
export const CARD_EXTRAS = import.meta.env.VITE_CARD_EXTRAS === "true";
