import { useEffect, useState } from "react";

// White (or very light) logos on a transparent background vanish on a white tile. This looks at
// the image once and says whether it needs a dark backdrop. It reads pixels through a separate,
// CORS-enabled copy of the image, so the shown <img> is never affected: if the host doesn't allow
// that read, the answer is simply "no" and the image shows as before.

const cache = new Map<string, boolean>();
const pending = new Map<string, Promise<boolean>>();

function measure(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const n = 48;
        const canvas = document.createElement("canvas");
        canvas.width = n;
        canvas.height = n;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(false);
        ctx.drawImage(img, 0, 0, n, n);
        const { data } = ctx.getImageData(0, 0, n, n);
        let clear = 0;
        let seen = 0;
        let lum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] / 255;
          if (a < 0.1) {
            clear++;
            continue;
          }
          seen += a;
          lum += a * ((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255);
        }
        const total = n * n;
        // Mostly see-through, and what's drawn is near-white.
        resolve(clear / total > 0.15 && seen > 0 && lum / seen > 0.82);
      } catch {
        resolve(false); // the host doesn't allow reading pixels
      }
    };
    img.onerror = () => resolve(false);
    // A distinct URL, so a cached non-CORS copy of the same image isn't reused.
    img.src = url.startsWith("data:") || url.startsWith("blob:") ? url : `${url}${url.includes("?") ? "&" : "?"}cors=1`;
  });
}

export function isLightImage(url: string): Promise<boolean> {
  if (cache.has(url)) return Promise.resolve(cache.get(url)!);
  let p = pending.get(url);
  if (!p) {
    p = measure(url).then((v) => {
      cache.set(url, v);
      pending.delete(url);
      return v;
    });
    pending.set(url, p);
  }
  return p;
}

/** true once the image is known to be a light logo on transparency (needs a dark backdrop). */
export function useLightImage(url?: string | null): boolean {
  const [light, setLight] = useState(() => (url ? cache.get(url) ?? false : false));
  useEffect(() => {
    if (!url) return setLight(false);
    let live = true;
    isLightImage(url).then((v) => live && setLight(v));
    return () => {
      live = false;
    };
  }, [url]);
  return light;
}
