import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Check, FlipHorizontal2, RotateCcw, RotateCw, SlidersHorizontal, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Crop & edit an image before it's used: drag/zoom/pinch to crop, rotate 90°, flip,
 * brightness/contrast/saturation. `await editImage(file, options)` → the edited File, or
 * null if the user cancelled. Mounts its own modal, so any uploader can call it.
 *
 * Adjustments are applied pixel-by-pixel on export (not canvas `filter`, which Safari
 * ignores), so the saved image matches the preview everywhere.
 */

export interface EditImageOptions {
  title?: string;
  /** Crop shapes to offer; value = width / height, null = the image's own shape. First is the default. */
  aspects?: { label: string; value: number | null }[];
  /** Rounded guide (e.g. a profile photo) — purely visual, the crop is still a rectangle. */
  rounded?: boolean;
  /** Longest side of the result, in px. */
  maxSide?: number;
  /** Keep PNG/WebP transparency (logos). Otherwise the result is a JPEG. */
  keepTransparency?: boolean;
}

type Done = (file: File | null) => void;

export function editImage(file: File, options: EditImageOptions = {}): Promise<File | null> {
  // Vector logos are already crisp and resizable — editing would only rasterise them.
  if (file.type === "image/svg+xml") return Promise.resolve(file);
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const done: Done = (result) => {
      root.unmount();
      host.remove();
      resolve(result);
    };
    root.render(<ImageEditor file={file} options={options} onDone={done} />);
  });
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
type Adjust = { brightness: number; contrast: number; saturation: number }; // -100..100
const NO_ADJUST: Adjust = { brightness: 0, contrast: 0, saturation: 0 };

function ImageEditor({ file, options, onDone }: { file: File; options: EditImageOptions; onDone: Done }) {
  const aspects = options.aspects?.length ? options.aspects : [{ label: "Original", value: null }];
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [aspectIdx, setAspectIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0); // 0 | 90 | 180 | 270
  const [flip, setFlip] = useState(false);
  const [off, setOff] = useState({ x: 0, y: 0 }); // image centre offset from frame centre, UI px
  const [adj, setAdj] = useState<Adjust>(NO_ADJUST);
  const [panel, setPanel] = useState<"crop" | "adjust">("crop");
  const [busy, setBusy] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  // Load the picked file.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => setImg(i);
    i.onerror = () => setLoadError(true);
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Esc cancels; lock page scroll while open.
  useEffect(() => {
    doneRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDone(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onDone]);

  // ── geometry ────────────────────────────────────────────────────────────────
  const nat = img ? { w: img.naturalWidth, h: img.naturalHeight } : { w: 1, h: 1 };
  const turned = rot % 180 !== 0;
  const rw = turned ? nat.h : nat.w; // image size after rotation
  const rh = turned ? nat.w : nat.h;
  const aspect = aspects[aspectIdx].value ?? rw / rh;
  const pad = 24;
  const availW = Math.max(stage.w - pad * 2, 40);
  const availH = Math.max(stage.h - pad * 2, 40);
  const frame = availW / availH > aspect ? { w: availH * aspect, h: availH } : { w: availW, h: availW / aspect };
  const baseScale = Math.max(frame.w / rw, frame.h / rh); // smallest scale that still covers the frame
  const scale = baseScale * zoom;
  const limit = useCallback(
    (o: { x: number; y: number }, z = zoom) => {
      const s = baseScale * z;
      const mx = Math.max(0, (rw * s - frame.w) / 2);
      const my = Math.max(0, (rh * s - frame.h) / 2);
      return { x: clamp(o.x, -mx, mx), y: clamp(o.y, -my, my) };
    },
    [baseScale, zoom, rw, rh, frame.w, frame.h],
  );
  const shown = limit(off);

  const setZoomKeep = (z: number) => {
    const nz = clamp(z, 1, 5);
    setZoom(nz);
    setOff((o) => limit(o, nz));
  };

  // ── gestures: drag to pan, wheel / pinch to zoom ─────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      setZoomKeep((pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.dist);
    } else if (pointers.current.size === 1) {
      setOff((o) => limit({ x: o.x + e.clientX - prev.x, y: o.y + e.clientY - prev.y }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const onWheel = (e: React.WheelEvent) => setZoomKeep(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      setOff((o) => limit({ x: o.x + moves[e.key][0], y: o.y + moves[e.key][1] }));
    } else if (e.key === "+" || e.key === "=") setZoomKeep(zoom * 1.1);
    else if (e.key === "-") setZoomKeep(zoom / 1.1);
  };

  const rotate = (d: number) => {
    setRot((r) => (r + d + 360) % 360);
    setOff({ x: 0, y: 0 });
  };
  const reset = () => {
    setZoom(1);
    setRot(0);
    setFlip(false);
    setOff({ x: 0, y: 0 });
    setAdj(NO_ADJUST);
  };

  const cssFilter = `brightness(${1 + adj.brightness / 100}) contrast(${1 + adj.contrast / 100}) saturate(${1 + adj.saturation / 100})`;

  // ── export ──────────────────────────────────────────────────────────────────
  const finish = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const maxSide = options.maxSide ?? 1600;
      const cropNatW = frame.w / scale; // crop size in original pixels
      const cropNatH = frame.h / scale;
      const k0 = Math.min(1, maxSide / Math.max(cropNatW, cropNatH));
      const outW = Math.max(1, Math.round(cropNatW * k0));
      const outH = Math.max(1, Math.round(cropNatH * k0));
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d")!;
      const keepAlpha = !!options.keepTransparency && (file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif");
      if (!keepAlpha) {
        ctx.fillStyle = "#ffffff"; // JPEG has no transparency
        ctx.fillRect(0, 0, outW, outH);
      }
      // Same transform as the preview, scaled from UI px to output px.
      const k = outW / frame.w;
      ctx.translate(outW / 2, outH / 2);
      ctx.scale(k, k);
      ctx.translate(shown.x, shown.y);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(flip ? -1 : 1, 1);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (-nat.w * scale) / 2, (-nat.h * scale) / 2, nat.w * scale, nat.h * scale);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (adj.brightness || adj.contrast || adj.saturation) applyAdjustments(ctx, outW, outH, adj);

      const type = keepAlpha ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.92));
      if (!blob) throw new Error("export failed");
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      onDone(new File([blob], `${base}.${keepAlpha ? "png" : "jpg"}`, { type }));
    } catch {
      setBusy(false);
    }
  };

  const ratioBtn = (selected: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition ${selected ? "bg-white text-slate-900" : "text-white/70 hover:text-white"}`;

  return (
    <div className="ie-backdrop" role="dialog" aria-modal="true" aria-label={options.title ?? "Edit image"}>
      <div className="ie-panel">
        <header className="ie-head">
          <button type="button" className="ie-text-btn" onClick={() => onDone(null)}>
            Cancel
          </button>
          <strong>{options.title ?? "Edit image"}</strong>
          <button ref={doneRef} type="button" className="ie-done" onClick={finish} disabled={!img || busy}>
            <Check size={16} /> {busy ? "Saving…" : "Done"}
          </button>
        </header>

        <div
          ref={stageRef}
          className="ie-stage"
          tabIndex={0}
          aria-label="Crop area — drag to move, scroll or pinch to zoom, arrow keys to nudge"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        >
          {loadError && <p className="ie-error">This image can’t be opened here. Try a JPEG or PNG.</p>}
          {img && stage.w > 0 && (
            <>
              <img
                src={img.src}
                alt=""
                draggable={false}
                className="ie-img"
                style={{
                  width: nat.w * scale,
                  height: nat.h * scale,
                  transform: `translate(-50%, -50%) translate(${shown.x}px, ${shown.y}px) rotate(${rot}deg) scaleX(${flip ? -1 : 1})`,
                  filter: cssFilter,
                }}
              />
              <div className={`ie-frame${options.rounded ? " is-rounded" : ""}`} style={{ width: frame.w, height: frame.h }} aria-hidden="true">
                <span className="ie-grid" />
              </div>
            </>
          )}
        </div>

        <div className="ie-tools">
          {aspects.length > 1 && panel === "crop" && (
            <div className="ie-ratios" role="radiogroup" aria-label="Crop shape">
              {aspects.map((a, i) => (
                <button
                  key={a.label}
                  type="button"
                  role="radio"
                  aria-checked={i === aspectIdx}
                  className={ratioBtn(i === aspectIdx)}
                  onClick={() => {
                    setAspectIdx(i);
                    setZoom(1);
                    setOff({ x: 0, y: 0 });
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {panel === "crop" ? (
            <div className="ie-row">
              <button type="button" className="ie-icon" aria-label="Zoom out" onClick={() => setZoomKeep(zoom / 1.15)}>
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min={1}
                max={5}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoomKeep(Number(e.target.value))}
                aria-label="Zoom"
                className="ie-range"
              />
              <button type="button" className="ie-icon" aria-label="Zoom in" onClick={() => setZoomKeep(zoom * 1.15)}>
                <ZoomIn size={16} />
              </button>
              <span className="ie-sep" />
              <button type="button" className="ie-icon" aria-label="Rotate left" onClick={() => rotate(-90)}>
                <RotateCcw size={16} />
              </button>
              <button type="button" className="ie-icon" aria-label="Rotate right" onClick={() => rotate(90)}>
                <RotateCw size={16} />
              </button>
              <button type="button" className={`ie-icon${flip ? " is-on" : ""}`} aria-label="Flip" aria-pressed={flip} onClick={() => setFlip((f) => !f)}>
                <FlipHorizontal2 size={16} />
              </button>
            </div>
          ) : (
            <div className="ie-adjust">
              {(
                [
                  ["brightness", "Brightness"],
                  ["contrast", "Contrast"],
                  ["saturation", "Saturation"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="ie-adjust-row">
                  <span>{label}</span>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={adj[key]}
                    onChange={(e) => setAdj((a) => ({ ...a, [key]: Number(e.target.value) }))}
                    className="ie-range"
                  />
                  <b>{adj[key] > 0 ? `+${adj[key]}` : adj[key]}</b>
                </label>
              ))}
            </div>
          )}

          <div className="ie-tabs">
            <button type="button" className={panel === "crop" ? "is-on" : ""} onClick={() => setPanel("crop")}>
              Crop
            </button>
            <button type="button" className={panel === "adjust" ? "is-on" : ""} onClick={() => setPanel("adjust")}>
              <SlidersHorizontal size={14} /> Adjust
            </button>
            <button type="button" onClick={reset}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Brightness → contrast → saturation, in that order — the same as the CSS filter preview. */
function applyAdjustments(ctx: CanvasRenderingContext2D, w: number, h: number, a: Adjust) {
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const b = 1 + a.brightness / 100;
  const c = 1 + a.contrast / 100;
  const s = 1 + a.saturation / 100;
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i] * b;
    let g = px[i + 1] * b;
    let bl = px[i + 2] * b;
    r = (r - 128) * c + 128;
    g = (g - 128) * c + 128;
    bl = (bl - 128) * c + 128;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    px[i] = clamp(l + (r - l) * s, 0, 255);
    px[i + 1] = clamp(l + (g - l) * s, 0, 255);
    px[i + 2] = clamp(l + (bl - l) * s, 0, 255);
  }
  ctx.putImageData(data, 0, 0);
}
