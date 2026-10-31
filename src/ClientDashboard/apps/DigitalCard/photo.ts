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

/** "photo" = the profile picture (JPEG, sized for link previews); "logo" = a venture logo (keeps transparency). */
export type ImageKind = "photo" | "logo";

const LOGO_MAX_SIDE = 512;

/** Logos are often transparent PNGs — shrink them but keep PNG/WebP (and their alpha) instead of flattening to JPEG. */
export async function optimizeLogo(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, LOGO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= MAX_BYTES) {
      bitmap.close?.();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const keepAlpha = file.type === "image/png" || file.type === "image/webp";
    const type = keepAlpha ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + (keepAlpha ? ".png" : ".jpg"), { type });
  } catch {
    return file;
  }
}

const optimize = (file: File, kind: ImageKind) => (kind === "logo" ? optimizeLogo(file) : optimizePhoto(file));

/** Uploads an image (after optimizing it) and returns its public URL. Needs a logged-in session. */
export async function uploadPhoto(file: File, kind: ImageKind = "photo"): Promise<string> {
  const res = await agentAPI.uploadLogo(await optimize(file, kind));
  const url = res?.logo_url || res?.url || res?.data?.logo_url || res?.data?.url || res?.data?.data?.logo_url;
  if (!url) throw new Error("Upload succeeded but no URL was returned.");
  return url;
}

/** Optimized image as a data URL — lets a visitor pick images before they have an account. */
export async function fileToDataUrl(file: File, kind: ImageKind = "photo"): Promise<string> {
  const small = await optimize(file, kind);
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn’t read the image"));
    r.readAsDataURL(small);
  });
}

async function uploadDataUrl(dataUrl: string, kind: ImageKind): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/png" ? "png" : "jpg";
  return uploadPhoto(new File([blob], `${kind}.${ext}`, { type: blob.type || "image/jpeg" }), kind);
}

/** Uploads any images still held locally as data URLs (photo, venture logos, payment QRs) and swaps in their real URLs. */
export async function resolveCardImages(card: CardData): Promise<CardData> {
  const image_url = card.image_url.startsWith("data:") ? await uploadDataUrl(card.image_url, "photo") : card.image_url;
  const ventures = await Promise.all(
    card.ventures.map(async (v) => (v.logo_url.startsWith("data:") ? { ...v, logo_url: await uploadDataUrl(v.logo_url, "logo") } : v)),
  );
  const payment_methods = card.payment_methods
    ? await Promise.all(
        card.payment_methods.map(async (m) => (m.qr_url?.startsWith("data:") ? { ...m, qr_url: await uploadDataUrl(m.qr_url, "logo") } : m)),
      )
    : card.payment_methods;
  return { ...card, image_url, ventures, payment_methods };
}
