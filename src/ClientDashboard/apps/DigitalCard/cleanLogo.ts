/**
 * Prestige shows venture logos bare on its cream panel. Uploaded logos often come on a white box
 * with wide padding, so this redraws one in the browser, keeping its own colours:
 *
 *  - transparent logo           → trimmed to the artwork
 *  - logo on a white/light box  → the box is removed (edge pixels de-matted, so no white fringe), then trimmed
 *  - anything else (dark box, photo) → null: the original is shown unchanged
 *
 * Needs the image to allow cross-origin reads (our S3 bucket sends Access-Control-Allow-Origin: *).
 */

export interface CleanLogo {
  src: string;
  /** Width / height after trimming. */
  ratio: number;
}

const MAX_SIDE = 1200;

const cache = new Map<string, Promise<CleanLogo | null>>();

export function cleanLogo(url: string): Promise<CleanLogo | null> {
  let job = cache.get(url);
  if (!job) {
    job = build(url).catch(() => null);
    cache.set(url, job);
  }
  return job;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

async function build(url: string): Promise<CleanLogo | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = url;
  await img.decode();
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  if (!w || !h) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data; // throws if the image is cross-origin without CORS

  // The backdrop: transparent, or one light colour in all four corners.
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, (h * w - 1) * 4];
  const transparent = corners.some((i) => px[i + 3] < 30);
  let bg: [number, number, number] | null = null;
  if (!transparent) {
    const [r, g, b] = [px[0], px[1], px[2]];
    const same = corners.every((i) => px[i + 3] > 200 && Math.abs(px[i] - r) + Math.abs(px[i + 1] - g) + Math.abs(px[i + 2] - b) < 30);
    const light = 0.299 * r + 0.587 * g + 0.114 * b > 215;
    if (!same || !light) return null; // a dark box or a photo — leave it as uploaded
    bg = [r, g, b];
  }

  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (bg) {
        // How far the pixel is from the backdrop → its opacity; then undo the blend with the backdrop.
        const dist = Math.max(Math.abs(px[i] - bg[0]), Math.abs(px[i + 1] - bg[1]), Math.abs(px[i + 2] - bg[2])) / 255;
        const a = clamp01((dist - 0.04) / 0.25);
        if (a > 0) for (let c = 0; c < 3; c++) px[i + c] = Math.round(clamp01((px[i + c] - bg[c] * (1 - a)) / a / 255) * 255);
        px[i + 3] = Math.round(a * 255);
      }
      if (px[i + 3] > 20) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;

  ctx.putImageData(data, 0, 0);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const out = document.createElement("canvas");
  out.width = bw;
  out.height = bh;
  const octx = out.getContext("2d");
  if (!octx) return null;
  octx.drawImage(canvas, x0, y0, bw, bh, 0, 0, bw, bh);
  return { src: out.toDataURL("image/png"), ratio: bw / bh };
}
