import { agentAPI } from "../../../services/agentAPI";
import type { CardData } from "./types";

/**
 * Downsizes a profile photo before upload so link previews work well:
 * WhatsApp shows the large preview only for images that are big enough
 * (≥ ~600px wide) yet small in file size (it ignores images over ~300 KB).
 * Falls back to the original file if anything goes wrong.
 */
const MAX_SIDE = 1200;
const MAX_BYTES = 280 * 1024;

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

export async function optimizePhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // JPEG has no transparency
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    let blob: Blob | null = null;
    for (const q of [0.9, 0.82, 0.74, 0.66, 0.58]) {
      blob = await toBlob(canvas, q);
      if (blob && blob.size <= MAX_BYTES) break;
    }
    // Keep the original if it was already small and we didn't actually shrink it.
    if (!blob || (blob.size >= file.size && file.size <= MAX_BYTES)) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Uploads a photo (after optimizing it) and returns its public URL. Needs a logged-in session. */
export async function uploadPhoto(file: File): Promise<string> {
  const res = await agentAPI.uploadLogo(await optimizePhoto(file));
  const url = res?.logo_url || res?.url || res?.data?.logo_url || res?.data?.url || res?.data?.data?.logo_url;
  if (!url) throw new Error("Upload succeeded but no URL was returned.");
  return url;
}

/** Optimized photo as a data URL — lets a visitor pick a photo before they have an account. */
export async function fileToDataUrl(file: File): Promise<string> {
  const small = await optimizePhoto(file);
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn’t read the photo"));
    r.readAsDataURL(small);
  });
}

/** If the card's photo is a local data URL, upload it and swap in the real URL. */
export async function resolveCardPhoto(card: CardData): Promise<CardData> {
  if (!card.image_url.startsWith("data:")) return card;
  const blob = await (await fetch(card.image_url)).blob();
  const url = await uploadPhoto(new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" }));
  return { ...card, image_url: url };
}
