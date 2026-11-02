import type { QrDesign } from "./QrPlayground";
import { businessCardAPI, toPayload, type BusinessCard, type CardQrDesign } from "../../../services/businessCardAPI";
import { uploadDataUrl } from "./photo";

/**
 * Saved QR designs live on the card (`qr_design`), so they follow the owner to any device.
 * Designs saved in this browser before that existed are still read as a fallback.
 */
const key = (cardId: string) => `shivai_qr_design_${cardId}`;

function loadLocal(cardId: string): Partial<QrDesign> | undefined {
  try {
    const raw = localStorage.getItem(key(cardId));
    return raw ? (JSON.parse(raw) as Partial<QrDesign>) : undefined;
  } catch {
    return undefined;
  }
}

/** The card's saved design: from the card itself, else an older one saved in this browser. */
export function loadQrDesign(card: Pick<BusinessCard, "_id" | "qr_design">): Partial<QrDesign> | undefined {
  return (card.qr_design as Partial<QrDesign> | null | undefined) ?? loadLocal(card._id);
}

/**
 * Saves the design onto the card. A background photo picked in the studio is still a data URL,
 * so it's uploaded first and the card stores its link. Returns the updated card.
 */
export async function saveQrDesign(card: BusinessCard, design: QrDesign): Promise<BusinessCard> {
  const photo = design.photo?.startsWith("data:") ? await uploadDataUrl(design.photo, "photo") : design.photo;
  const qr_design: CardQrDesign = { ...design, photo };
  // Send the card's current fields with the design (the username is fixed after creation).
  const { username: _username, ...fields } = toPayload(card);
  const updated = await businessCardAPI.update(card._id, { ...fields, qr_design } as Parameters<typeof businessCardAPI.update>[1]);
  try {
    localStorage.removeItem(key(card._id)); // the card has it now
  } catch {
    /* ignore */
  }
  return updated;
}
