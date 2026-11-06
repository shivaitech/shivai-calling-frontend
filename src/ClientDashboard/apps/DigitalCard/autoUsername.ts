import { businessCardAPI, BusinessCardError, type BusinessCard, type CardPlan, type BusinessCardInput } from "../../../services/businessCardAPI";
import { USERNAME_MAX, suggestUsername } from "./username";

/**
 * Choosing the card's link (username) is a Prestige option. Every other card still needs one (the
 * API requires it), so it's made from the person's name: "athar-ahmad", then name + company, then
 * the name with a few digits. Each candidate is checked with the availability endpoint; when that
 * can't tell, the server confirms on save (and createWithUsername retries once if it's taken).
 */

const digits = () => String(Math.floor(1000 + Math.random() * 9000));

function candidates(card: Pick<BusinessCardInput, "full_name" | "company_name">, suffixOnly: boolean): string[] {
  const name = suggestUsername(card.full_name);
  const withCompany = suggestUsername(`${card.full_name} ${card.company_name}`);
  const base = name || withCompany || "card";
  const suffixed = Array.from({ length: 3 }, () => `${base.slice(0, USERNAME_MAX - 5).replace(/-+$/, "")}-${digits()}`);
  return [...new Set([...(suffixOnly ? [] : [name, withCompany]), ...suffixed])].filter(Boolean);
}

/** A free username for this card, made from its name. */
export async function pickUsername(card: Pick<BusinessCardInput, "full_name" | "company_name">, suffixOnly = false): Promise<string> {
  const list = candidates(card, suffixOnly);
  for (const u of list) {
    try {
      const r = await businessCardAPI.usernameAvailability(u);
      if (r.available !== false) return u; // free, or can't tell (the server checks on save)
    } catch {
      return u;
    }
  }
  return list[list.length - 1];
}

const usernameTaken = (e: unknown) => {
  const be = e as BusinessCardError;
  return be?.status === 409 || !!be?.fieldErrors?.username;
};

/**
 * Creates a card. `chooseUsername` = the owner picked their own link (Prestige); otherwise one is
 * made from the name, and if the server says it was just taken, a fresh one is tried once.
 */
export async function createWithUsername(card: BusinessCardInput, chooseUsername: boolean, opts: { plan?: CardPlan } = {}): Promise<BusinessCard> {
  if (chooseUsername) return businessCardAPI.create(card, opts);
  try {
    return await businessCardAPI.create({ ...card, username: await pickUsername(card) }, opts);
  } catch (e) {
    if (!usernameTaken(e)) throw e;
    return businessCardAPI.create({ ...card, username: await pickUsername(card, true) }, opts);
  }
}
