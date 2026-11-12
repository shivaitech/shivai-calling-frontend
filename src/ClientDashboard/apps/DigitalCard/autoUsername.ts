import { businessCardAPI, BusinessCardError, hasSession, type BusinessCard, type CardPlan, type BusinessCardInput } from "../../../services/businessCardAPI";
import { USERNAME_MAX, suggestUsername, usernameProblem } from "./username";

/**
 * Card links (usernames). Everyone picks theirs when creating a card (UsernameField), helped by
 * a few available ideas made from their name and company. Each idea is checked with the
 * availability endpoint (signed in) or by looking the link up (signed out); when that can't
 * tell, the server confirms on save.
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
export async function isUsernameFree(username: string): Promise<boolean | null> {
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
    if ((await isUsernameFree(u)) !== false) return u; // free, or can't tell (the server checks on save)
  }
  return list[list.length - 1];
}

/**
 * Link ideas from a name and company, best first: "athar-ahmad", "atharahmad", "athar-shivai",
 * "athar-ahmad-shivai", "athar-a", "ahmad-athar"… Only well-formed ones.
 */
export function usernameIdeas(card: Pick<BusinessCardInput, "full_name" | "company_name">): string[] {
  const words = (s: string) => suggestUsername(s).split("-").filter(Boolean);
  const name = words(card.full_name);
  const company = words(card.company_name).slice(0, 2).join("-");
  const [first = "", ...rest] = name;
  const last = rest[rest.length - 1] ?? "";
  const full = name.join("-");
  const ideas = [
    full,
    name.join(""),
    first && company ? `${first}-${company}` : "",
    full && company ? `${full}-${company}` : "",
    first && last ? `${first}-${last[0]}` : "",
    first && last ? `${last}-${first}` : "",
    company,
    first && company ? `${first}-at-${company}` : "",
    full ? `hello-${full}` : "",
    full ? `${full}-${digits()}` : "",
  ];
  return [...new Set(ideas.map((u) => u.slice(0, USERNAME_MAX).replace(/-+$/, "")))].filter((u) => u && !usernameProblem(u));
}

/**
 * Up to `limit` free links for this card. A link whose availability can't be told is only
 * offered when nothing could be confirmed (the server still checks on save).
 */
export async function availableUsernames(
  card: Pick<BusinessCardInput, "full_name" | "company_name">,
  opts: { exclude?: string[]; limit?: number } = {},
): Promise<string[]> {
  const { exclude = [], limit = 4 } = opts;
  const ideas = usernameIdeas(card).filter((u) => !exclude.includes(u)).slice(0, 8);
  const answers = await Promise.all(ideas.map((u) => isUsernameFree(u)));
  const free = ideas.filter((_, i) => answers[i] === true);
  return (free.length ? free : ideas.filter((_, i) => answers[i] === null)).slice(0, limit);
}

/**
 * Creates a card with the link the owner chose (a taken one comes back as a username field
 * error). A card with no link yet gets one made from the name.
 */
export async function createWithUsername(card: BusinessCardInput, opts: { plan?: CardPlan } = {}): Promise<BusinessCard> {
  return businessCardAPI.create({ ...card, username: card.username || (await pickUsername(card)) }, opts);
}
