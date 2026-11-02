/**
 * Founding Member offer: Essential cards created up to the end of 31 December 2026 (IST)
 * stay free for life. While it runs, Essential has no checkout anywhere on the site.
 */
export const FOUNDING_OFFER_ENDS = new Date("2026-12-31T23:59:59+05:30");
export const FOUNDING_OFFER_LABEL = "31 December 2026";
export const foundingOfferActive = () => Date.now() <= FOUNDING_OFFER_ENDS.getTime();
/** Essential is free (no checkout) while the offer runs. */
export const isFoundingFree = (plan: string | null | undefined) => plan === "essential" && foundingOfferActive();
