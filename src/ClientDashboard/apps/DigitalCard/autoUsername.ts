import { businessCardAPI, BusinessCardError, hasSession, type BusinessCard, type CardPlan, type BusinessCardInput } from "../../../services/businessCardAPI";
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

/**
 * Is this link free? Signed in: the availability endpoint. Signed out (it needs a token): a public
 * card already at that link means taken, "not found" means free. null = couldn't tell.
 */
async function isFree(username: string): Promise<boolean | null> {
  if (hasSession()) {
    try {
      return (await businessCardAPI.usernameAvailability(username)).available;
    } catch {
      return null;
    }
  }
  try {
    await businessCardAPI.getPublic(username);
    return false;
  } catch (e) {
    return (e as BusinessCardError)?.status === 404 ? true : null;
  }
}

/** A free username for this card, made from its name. */
export async function pickUsername(card: Pick<BusinessCardInput, "full_name" | "company_name">, suffixOnly = false): Promise<string> {
  const list = candidates(card, suffixOnly);
  for (const u of list) {
    if ((await isFree(u)) !== false) return u; // free, or can't tell (the server checks on save)
  }
  return list[list.length - 1];
}

/** The first candidate, i.e. the link people hope for (shown when it turns out to be taken). */
export const preferredUsername = (card: Pick<BusinessCardInput, "full_name" | "company_name">) => candidates(card, false)[0] ?? "";

const usernameTaken = (e: unknown) => {
  const be = e as BusinessCardError;
  return be?.status === 409 || !!be?.fieldErrors?.username;
};

/**
 * Creates a card. `chooseUsername` = the owner picked their own link (Prestige); otherwise one is
 * made from the name (the form shows it live and passes it in `card.username`), and if the server
 * says it was just taken, a fresh one is tried once.
 */
export async function createWithUsername(card: BusinessCardInput, chooseUsername: boolean, opts: { plan?: CardPlan } = {}): Promise<BusinessCard> {
  if (chooseUsername) return businessCardAPI.create(card, opts);
  try {
    // The link the form already showed (checked live while typing), else pick one now.
    return await businessCardAPI.create({ ...card, username: card.username || (await pickUsername(card)) }, opts);
  } catch (e) {
    if (!usernameTaken(e)) throw e;
    return businessCardAPI.create({ ...card, username: await pickUsername(card, true) }, opts);
  }
}
