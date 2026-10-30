import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Download, ImagePlus, Monitor, Save, Smartphone, Tablet, Wallet } from "lucide-react";
import { editImage } from "./ImageEditor";

/**
 * QR wallpaper designer for the marketing page: pick a format (phone / tablet /
 * desktop / wallet card), a background (gradient or the visitor's own photo), then
 * size, drag and fade the QR tile — and download it as a real-size PNG. Uploaded
 * photos stay in the browser (object URLs); nothing is sent anywhere.
 */

export type FormatId = "mobile" | "tablet" | "desktop" | "wallet";

const FORMATS: { id: FormatId; label: string; Icon: typeof Smartphone; w: number; h: number }[] = [
  { id: "mobile", label: "Mobile", Icon: Smartphone, w: 1170, h: 2532 },
  { id: "tablet", label: "Tablet", Icon: Tablet, w: 1668, h: 2388 },
  { id: "desktop", label: "Desktop", Icon: Monitor, w: 2560, h: 1440 },
  { id: "wallet", label: "Wallet card", Icon: Wallet, w: 2024, h: 1276 },
];

/** Device chrome around the screen, in px — must match .qr-device--* padding in digitalCard.css. */
const FRAME: Record<FormatId, { pad: number; below: number }> = {
  mobile: { pad: 8, below: 0 },
  tablet: { pad: 12, below: 0 },
  desktop: { pad: 8, below: 40 }, // + the monitor stand
  wallet: { pad: 0, below: 0 },
};

const QR_COLORS = [
  { name: "Ink", value: "#0f172a" },
  { name: "Indigo", value: "#4338ca" },
  { name: "Teal", value: "#0f766e" },
  { name: "Rose", value: "#be123c" },
  { name: "Amber", value: "#b45309" },
];

// Same stops drive the animated CSS preview and the static gradient in the download.
const BACKGROUNDS = [
  { name: "Aurora", stops: ["#6366f1", "#ec4899", "#14b8a6"] },
  { name: "Sunset", stops: ["#f97316", "#ec4899", "#8b5cf6"] },
  { name: "Ocean", stops: ["#0ea5e9", "#22d3ee", "#6366f1"] },
  { name: "Forest", stops: ["#10b981", "#84cc16", "#0d9488"] },
  { name: "Midnight", stops: ["#0f172a", "#312e81", "#1e293b"] },
  { name: "Mono", stops: ["#cbd5e1", "#f1f5f9", "#94a3b8"] },
];
const cssGradient = (stops: string[]) => `linear-gradient(120deg,${stops.join(",")},${stops[0]})`;

const POSITIONS: { label: string; x: number; y: number }[] = [
  { label: "Top left", x: 0.22, y: 0.2 },
  { label: "Top", x: 0.5, y: 0.2 },
  { label: "Top right", x: 0.78, y: 0.2 },
  { label: "Left", x: 0.22, y: 0.5 },
  { label: "Centre", x: 0.5, y: 0.5 },
  { label: "Right", x: 0.78, y: 0.5 },
  { label: "Bottom left", x: 0.22, y: 0.8 },
  { label: "Bottom", x: 0.5, y: 0.8 },
  { label: "Bottom right", x: 0.78, y: 0.8 },
];

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Tile geometry, all relative to the canvas's shorter side — shared by preview and download,
 * so everything (label included) scales together with the QR. The label is sized to fit the
 * QR's width: ~0.58em per character is the average advance of Poppins semibold.
 */
function tileLayout(minSide: number, size: number, label: string) {
  const qr = minSide * size;
  const pad = qr * 0.1;
  const font = label ? Math.min(qr * 0.1, qr / (Math.max(label.length, 8) * 0.58)) : 0;
  const labelBlock = label ? font * 1.9 : 0;
  return { qr, pad, font, labelBlock, width: qr + pad * 2, height: qr + pad * 2 + labelBlock, radius: qr * 0.12 };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">{label}</span>
      <div className="flex flex-wrap items-center gap-2 p-1 -m-1 sm:justify-end">{children}</div>
    </div>
  );
}

/** Everything a saved QR design needs to be redrawn. `photo` is a downscaled JPEG data URL. */
export interface QrDesign {
  format: FormatId;
  fg: string;
  /** Index into the gradient presets, or -1 for the photo. */
  bg: number;
  photo: string | null;
  size: number;
  tileOpacity: number;
  pos: { x: number; y: number };
  label: string;
}

export const DEFAULT_QR_DESIGN: QrDesign = {
  format: "mobile",
  fg: QR_COLORS[0].value,
  bg: 0,
  photo: null,
  size: 0.42,
  tileOpacity: 0.95,
  pos: { x: 0.5, y: 0.62 },
  label: "Scan to connect",
};

const PHOTO_MAX_SIDE = 1600;
/** The label shrinks to fit the tile's width, so longer text would get hard to read. */
const LABEL_MAX = 30;

/** Background photos are kept as a downscaled JPEG data URL, so a design can be saved and redrawn later. */
async function photoToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function QrPlayground({
  link,
  initial,
  onSave,
}: {
  link: string;
  initial?: Partial<QrDesign>;
  /** When given, a "Save design" button appears. Resolves when saved; reject to show an error. */
  onSave?: (design: QrDesign) => Promise<void> | void;
}) {
  const start = { ...DEFAULT_QR_DESIGN, ...initial };
  const [formatId, setFormatId] = useState<FormatId>(start.format);
  const [fg, setFg] = useState(start.fg);
  const [bg, setBg] = useState(start.photo || start.bg !== -1 ? start.bg : 0); // index into BACKGROUNDS, or -1 = photo
  const [photo, setPhoto] = useState<string | null>(start.photo);
  const [size, setSize] = useState(start.size); // QR width as a share of the shorter side
  const [tileOpacity, setTileOpacity] = useState(start.tileOpacity);
  const [pos, setPos] = useState(start.pos); // tile centre, as fractions of the canvas
  const [label, setLabel] = useState(start.label);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const format = FORMATS.find((f) => f.id === formatId)!;
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const [stageW, setStageW] = useState(0);

  // Any change after a save means there's something new to save.
  useEffect(() => {
    setSaveState((s) => (s === "saved" ? "idle" : s));
  }, [formatId, fg, bg, photo, size, tileOpacity, pos, label]);

  // Fit the device screen inside the stage for the chosen format.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const frame = FRAME[format.id];
  const maxH = (stageW < 420 ? 380 : 460) - frame.pad * 2 - frame.below;
  const aspect = format.w / format.h;
  let screenW = Math.max(stageW - frame.pad * 2, 0);
  let screenH = screenW / aspect;
  if (screenH > maxH) {
    screenH = maxH;
    screenW = screenH * aspect;
  }
  const preview = tileLayout(Math.min(screenW, screenH), size, label.trim());

  // Keep the whole tile on screen (size/format changes can push it past an edge).
  const bounds = useCallback(
    (x: number, y: number) => {
      if (!screenW || !screenH) return { x, y };
      const hx = preview.width / 2 / screenW;
      const hy = preview.height / 2 / screenH;
      return { x: clamp(x, Math.min(hx, 0.5), Math.max(1 - hx, 0.5)), y: clamp(y, Math.min(hy, 0.5), Math.max(1 - hy, 0.5)) };
    },
    [screenW, screenH, preview.width, preview.height],
  );
  const shown = bounds(pos.x, pos.y);

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - (rect.left + shown.x * rect.width), dy: e.clientY - (rect.top + shown.y * rect.height) };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    setPos(bounds((e.clientX - drag.current.dx - rect.left) / rect.width, (e.clientY - drag.current.dy - rect.top) / rect.height));
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.08 : 0.02;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    setPos(bounds(shown.x + d[0], shown.y + d[1]));
  };

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > MAX_IMAGE_BYTES) return setError("Image must be under 8 MB.");
    setError("");
    try {
      // Crop it to the chosen format's shape (and adjust it) before using it.
      const edited = await editImage(file, {
        title: "Edit background",
        aspects: [{ label: format.label, value: format.w / format.h }],
        maxSide: 1600,
      });
      if (!edited) return;
      setPhoto(await photoToDataUrl(edited));
      setBg(-1);
    } catch {
      setError("Couldn't read that photo. Try a JPEG or PNG.");
    }
  };

  const save = async () => {
    if (!onSave) return;
    setSaveState("saving");
    setError("");
    try {
      await onSave({ format: formatId, fg, bg: bg === -1 && photo ? -1 : Math.max(bg, 0), photo: bg === -1 ? photo : null, size, tileOpacity, pos: shown, label });
      setSaveState("saved");
    } catch (err) {
      setSaveState("idle");
      setError((err as Error)?.message || "Couldn't save the design.");
    }
  };

  const background = bg === -1 && photo ? `center / cover no-repeat url("${photo}")` : cssGradient(BACKGROUNDS[Math.max(bg, 0)].stops);

  const download = async () => {
    setBusy(true);
    setError("");
    try {
      const blob = await renderWallpaper({
        format,
        stops: BACKGROUNDS[Math.max(bg, 0)].stops,
        photo: bg === -1 ? photo : null,
        svg: qrWrapRef.current?.querySelector("svg") ?? null,
        size,
        pos: shown,
        tileOpacity,
        label: label.trim(),
        fg,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shivai-qr-wallpaper-${format.id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Couldn't create the image. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const swatch = (selected: boolean) =>
    `w-7 h-7 rounded-full border border-black/10 transition ${selected ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : "hover:scale-110"}`;

  return (
    <div className="qr-pg w-full">
      {/* Format */}
      <div role="tablist" aria-label="Wallpaper format" className="qr-pg-formats rounded-2xl bg-slate-100 p-1">
        {FORMATS.map(({ id, label: name, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={formatId === id}
            onClick={() => setFormatId(id)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-2 py-2 text-[11px] sm:text-xs font-semibold transition ${
              formatId === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className="w-4 h-4" />
            {name}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div ref={stageRef} className="qr-pg-stage mt-4 rounded-[28px] bg-slate-50 border border-slate-200 flex flex-col items-center justify-center py-6 px-3">
        {screenW > 0 && (
          <div className={`qr-device qr-device--${format.id}`}>
            <div
              ref={canvasRef}
              className={`qr-screen${bg === -1 && photo ? "" : " is-animated"}`}
              style={{ width: screenW, height: screenH, background }}
            >
              {format.id === "mobile" && <span className="qr-notch" aria-hidden="true" />}
              <div
                role="slider"
                tabIndex={0}
                aria-label="QR position — drag, or use the arrow keys"
                aria-valuetext={`${Math.round(shown.x * 100)}% across, ${Math.round(shown.y * 100)}% down`}
                className="qr-tile"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={onKeyDown}
                style={{
                  left: `${shown.x * 100}%`,
                  top: `${shown.y * 100}%`,
                  width: preview.width,
                  padding: preview.pad,
                  borderRadius: preview.radius,
                  background: `rgba(255,255,255,${tileOpacity})`,
                  boxShadow: tileOpacity > 0.15 ? `0 ${preview.qr * 0.08}px ${preview.qr * 0.2}px rgba(15,23,42,${0.22 * tileOpacity})` : "none",
                }}
              >
                <div ref={qrWrapRef} style={{ lineHeight: 0 }}>
                  <QRCode value={link} size={Math.max(Math.round(preview.qr), 24)} fgColor={fg} bgColor="transparent" level="M" />
                </div>
                {label.trim() && (
                  <p className="qr-tile-label" style={{ color: fg, fontSize: preview.font, height: preview.labelBlock }}>
                    {label}
                  </p>
                )}
              </div>
            </div>
            {format.id === "desktop" && (
              <span className="qr-stand" aria-hidden="true">
                <span />
              </span>
            )}
          </div>
        )}
        <p className="mt-4 text-[11px] text-slate-400">Drag the QR to place it · {format.w} × {format.h} px</p>
      </div>

      {/* Controls */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
        <Row label="QR size">
          <input
            type="range"
            min={0.2}
            max={0.75}
            step={0.01}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            aria-label="QR size"
            className="qr-range w-full sm:w-52"
          />
        </Row>
        <Row label="Tile">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={tileOpacity}
            onChange={(e) => setTileOpacity(Number(e.target.value))}
            aria-label="Tile transparency"
            className="qr-range w-full sm:w-40"
          />
          <span className="text-xs tabular-nums text-slate-500 w-10 text-right">{Math.round(tileOpacity * 100)}%</span>
        </Row>
        <Row label="Set QR position">
          <div className="qr-pg-positions">
            {POSITIONS.map((p) => {
              const active = Math.abs(shown.x - bounds(p.x, p.y).x) < 0.02 && Math.abs(shown.y - bounds(p.x, p.y).y) < 0.02;
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-label={p.label}
                  aria-pressed={active}
                  onClick={() => setPos(bounds(p.x, p.y))}
                  className={`w-7 h-7 rounded-md border flex items-center justify-center transition ${active ? "border-slate-900 bg-slate-900" : "border-slate-200 hover:border-slate-400"}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white" : "bg-slate-400"}`} />
                </button>
              );
            })}
          </div>
        </Row>
        <Row label="QR colour">
          {QR_COLORS.map((c) => (
            <button key={c.value} type="button" aria-label={c.name} aria-pressed={fg === c.value} className={swatch(fg === c.value)} style={{ background: c.value }} onClick={() => setFg(c.value)} />
          ))}
        </Row>
        <Row label="Colour background">
          {BACKGROUNDS.map((b, i) => (
            <button key={b.name} type="button" aria-label={b.name} aria-pressed={bg === i} className={swatch(bg === i)} style={{ backgroundImage: cssGradient(b.stops) }} onClick={() => setBg(i)} />
          ))}
        </Row>
        <Row label="Image background">
          {photo && (
            <button
              type="button"
              aria-label="Use your photo as the background"
              aria-pressed={bg === -1}
              className={`w-9 h-9 rounded-lg border border-black/10 bg-cover bg-center transition ${bg === -1 ? "ring-2 ring-offset-2 ring-slate-900" : "hover:scale-105"}`}
              style={{ backgroundImage: `url("${photo}")` }}
              onClick={() => setBg(-1)}
            />
          )}
          <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition focus-within:ring-2 focus-within:ring-slate-900/15">
            <ImagePlus className="w-3.5 h-3.5" />
            {photo ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/*" className="sr-only" aria-label="Upload your own background photo" onChange={pickPhoto} />
          </label>
          {photo && (
            <button
              type="button"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-1"
              onClick={() => {
                setPhoto(null);
                if (bg === -1) setBg(0);
              }}
            >
              Remove
            </button>
          )}
        </Row>
        <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Label</span>
          <span className="relative w-full sm:max-w-[240px]">
            <input
              value={label}
              maxLength={LABEL_MAX}
              onChange={(e) => setLabel(e.target.value.slice(0, LABEL_MAX))}
              placeholder="No label"
              aria-describedby="qr-label-count"
              className={`w-full rounded-lg border px-3 py-1.5 pr-14 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                label.length >= LABEL_MAX
                  ? "border-rose-300 focus:ring-rose-500/15 focus:border-rose-400"
                  : "border-slate-200 focus:ring-slate-900/15 focus:border-slate-400"
              }`}
            />
            <span
              id="qr-label-count"
              aria-live="polite"
              className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums ${
                label.length >= LABEL_MAX ? "text-rose-600" : label.length >= LABEL_MAX - 5 ? "text-amber-600" : "text-slate-400"
              }`}
            >
              <span className="sr-only">Characters used: </span>
              {label.length}/{LABEL_MAX}
            </span>
          </span>
        </label>
        {label.length >= LABEL_MAX && (
          <p className="-mt-1 text-xs text-rose-600">That’s the {LABEL_MAX}-character limit. Shorter labels are easier to read on the QR.</p>
        )}
        {tileOpacity < 0.5 && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            Tip: on busy photos, keep some tile behind the QR so phones can still scan it.
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-rose-600">
            {error}
          </p>
        )}
        <div className={onSave ? "qr-pg-actions has-save" : "qr-pg-actions"}>
          {onSave && (
            <button
              type="button"
              onClick={save}
              disabled={saveState === "saving"}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60 transition"
            >
              {saveState === "saved" ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Design saved" : "Save design"}
            </button>
          )}
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition"
          >
            <Download className="w-4 h-4" />
            {busy ? "Preparing…" : onSave ? `Download ${format.label.toLowerCase()}` : `Download ${format.label.toLowerCase()} wallpaper`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Download: redraw the design at the format's real size ────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function renderWallpaper(o: {
  format: { w: number; h: number };
  stops: string[];
  photo: string | null;
  svg: SVGSVGElement | null;
  size: number;
  pos: { x: number; y: number };
  tileOpacity: number;
  label: string;
  fg: string;
}): Promise<Blob> {
  const { w, h } = o.format;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  if (o.photo) {
    const img = await loadImage(o.photo);
    const s = Math.max(w / img.width, h / img.height); // cover
    ctx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
  } else {
    // 120deg CSS gradient → canvas line through the centre.
    const a = (120 * Math.PI) / 180;
    const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
    const dx = (Math.sin(a) * len) / 2;
    const dy = (-Math.cos(a) * len) / 2;
    const g = ctx.createLinearGradient(w / 2 - dx, h / 2 - dy, w / 2 + dx, h / 2 + dy);
    o.stops.forEach((c, i) => g.addColorStop(i / (o.stops.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  const t = tileLayout(Math.min(w, h), o.size, o.label);
  const left = o.pos.x * w - t.width / 2;
  const top = o.pos.y * h - t.height / 2;

  if (o.tileOpacity > 0) {
    ctx.save();
    if (o.tileOpacity > 0.15) {
      ctx.shadowColor = `rgba(15,23,42,${0.22 * o.tileOpacity})`;
      ctx.shadowBlur = t.qr * 0.2;
      ctx.shadowOffsetY = t.qr * 0.08;
    }
    ctx.fillStyle = `rgba(255,255,255,${o.tileOpacity})`;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(left, top, t.width, t.height, t.radius);
    else ctx.rect(left, top, t.width, t.height); // pre-2023 browsers
    ctx.fill();
    ctx.restore();
  }

  if (o.svg) {
    const clone = o.svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(Math.round(t.qr)));
    clone.setAttribute("height", String(Math.round(t.qr)));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
    try {
      ctx.drawImage(await loadImage(url), left + t.pad, top + t.pad, t.qr, t.qr);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (o.label) {
    await document.fonts?.ready;
    ctx.fillStyle = o.fg;
    ctx.font = `600 ${t.font}px Poppins, Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.label, left + t.width / 2, top + t.pad + t.qr + t.labelBlock / 2, t.qr);
  }

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}
