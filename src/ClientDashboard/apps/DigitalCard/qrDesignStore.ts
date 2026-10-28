import type { QrDesign } from "./QrPlayground";

/**
 * Saved QR designs, per card. Browser storage for now — cards have no backend field
 * for a QR design yet, so a design doesn't follow the user to another device.
 * Swap these two functions for API calls once the card model gains one.
 */
const key = (cardId: string) => `shivai_qr_design_${cardId}`;

export function loadQrDesign(cardId: string): Partial<QrDesign> | undefined {
  try {
    const raw = localStorage.getItem(key(cardId));
    return raw ? (JSON.parse(raw) as Partial<QrDesign>) : undefined;
  } catch {
    return undefined;
  }
}

export function saveQrDesign(cardId: string, design: QrDesign): void {
  try {
    localStorage.setItem(key(cardId), JSON.stringify(design));
  } catch {
    // Almost always the storage quota, because of a large background photo.
    if (design.photo) {
      throw new Error("That background photo is too large to save here. Try a smaller photo, or use a gradient.");
    }
    throw new Error("Couldn't save the design in this browser.");
  }
}
