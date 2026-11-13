import { useEffect, useState } from "react";
import { Crop, FileText, ImageOff, ImagePlus, Loader2, Plus, Upload, X } from "lucide-react";
import type { CardVenture, LogoSize, VentureType } from "../../../services/businessCardAPI";
import { DESCRIPTION_MAX, DOCUMENT_MAX_BYTES, LOGO_SIZES, VENTURE_KINDS, isBannerShaped, ventureKind } from "./ventureKinds";
import { isLightImage } from "./lightImage";

const patchAt = <T,>(arr: T[], i: number, patch: Partial<T>) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x));

/**
 * My Projects: companies and projects, plus things to browse (catalogs, PDFs, menus, portfolios).
 * Each entry: a type, a logo/cover (shown Small / Medium / Large on the card), a name,
 * and a link — or, for browsable types, an uploaded PDF.
 */
export default function VenturesEditor({
  value,
  update,
  busyKey,
  onPickLogo,
  onCropImage,
  onDocumentFile,
  onDocumentError,
  errorFor,
  basic = false,
}: {
  /** Companies only, no types / sizes / descriptions / PDFs (while the API lacks those fields). */
  basic?: boolean;
  value: CardVenture[];
  /** Functional update, so an upload finishing later doesn't drop other edits. */
  update: (fn: (ventures: CardVenture[]) => CardVenture[]) => void;
  /** "logo-<i>" while that logo is processing. */
  busyKey: string | null;
  onPickLogo: (index: number, file: File | undefined) => void;
  /** Re-open the crop editor on the image already chosen (preset for the given size). */
  onCropImage?: (index: number, size: LogoSize) => void;
  /** Uploads a PDF; undefined = no account yet (link only). */
  onDocumentFile?: (file: File) => Promise<{ url: string; file_name: string }>;
  onDocumentError: (message: string) => void;
  errorFor: (index: number) => string | undefined;
}) {
  const [uploadingAt, setUploadingAt] = useState<number | null>(null);
  // Each image's shape (width / height), to tell whether it already fits the Large banner.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  // Image links that failed to load: shown as a clear "couldn't load" tile, never a blank square.
  const [broken, setBroken] = useState<Record<string, true>>({});
  // White logos on transparency: shown on a dark tile so they can be seen.
  const [light, setLight] = useState<Record<string, boolean>>({});
  const urls = value.map((v) => v.logo_url).filter(Boolean).join(" ");
  useEffect(() => {
    let live = true;
    for (const url of urls.split(" ").filter(Boolean)) {
      void isLightImage(url).then((isLight) => live && setLight((m) => (m[url] === isLight ? m : { ...m, [url]: isLight })));
    }
    return () => {
      live = false;
    };
  }, [urls]);
  const pickSize = (i: number, v: CardVenture, size: LogoSize) => {
    set(i, { logo_size: size });
    const r = ratios[v.logo_url];
    // Large is a 16:9 banner: an image of another shape opens straight in the crop editor.
    if (size === "l" && onCropImage && r != null && !isBannerShaped(r)) onCropImage(i, "l");
  };
  const set = (i: number, patch: Partial<CardVenture>) => update((list) => patchAt(list, i, patch));
  const add = (type: VentureType) =>
    update((list) => [...list, { name: "", logo_url: "", url: "", type, logo_size: type === "venture" ? "s" : "m", file_name: "", description: "" }]);

  /** `attach`: a Project's extra PDF (kept beside its link) rather than the entry's own document. */
  const uploadPdf = async (i: number, file: File | undefined, attach = false) => {
    if (!file || !onDocumentFile) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return onDocumentError("Please choose a PDF file.");
    if (file.size > DOCUMENT_MAX_BYTES) return onDocumentError("That PDF is over 10 MB. Try a smaller file or paste a link instead.");
    setUploadingAt(i);
    try {
      const { url, file_name } = await onDocumentFile(file);
      if (attach) {
        update((list) => patchAt(list, i, { document_url: url, document_name: file_name }));
        return;
      }
      update((list) => patchAt(list, i, { url, file_name, ...(list[i]?.name.trim() ? {} : { name: file_name.replace(/\.pdf$/i, "") }) }));
    } catch (e: any) {
      onDocumentError(e?.message || "Couldn't upload the PDF.");
    } finally {
      setUploadingAt(null);
    }
  };

  return (
    <div className="ven">
      {value.map((v, i) => {
        const kind = ventureKind(v.type);
        const busy = busyKey === `logo-${i}`;
        const imageWord = kind.id === "venture" ? "logo" : "cover image";
        const hasFile = !!v.file_name && !!v.url;
        return (
          <div className="ven-item" key={i}>
            <div className="ven-head">
              {basic ? (
                <span className="ven-kind-plain">Project {i + 1}</span>
              ) : (
              <label className="ven-kind">
                <kind.Icon size={14} aria-hidden="true" />
                <select aria-label="Type" value={kind.id} onChange={(e) => set(i, { type: e.target.value as VentureType })}>
                  {VENTURE_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
              )}
              <button type="button" className="ven-remove" aria-label={`Remove ${kind.label.toLowerCase()}`} onClick={() => update((list) => list.filter((_, j) => j !== i))}>
                <X size={15} />
              </button>
            </div>

            <div className="ven-main">
              <div className="logo-picker">
                <label
                  className={`logo-picker-tile${busy ? " is-busy" : ""}${v.logo_url && broken[v.logo_url] ? " is-broken" : ""}${v.logo_url && light[v.logo_url] ? " is-light" : ""}`}
                  title={v.logo_url && broken[v.logo_url] ? `This ${imageWord} couldn't be loaded. Upload it again.` : v.logo_url ? `Change ${imageWord}` : `Add ${imageWord}`}
                >
                  {v.logo_url && broken[v.logo_url] ? (
                    <ImageOff size={18} aria-hidden="true" />
                  ) : v.logo_url ? (
                    <img
                      src={v.logo_url}
                      alt=""
                      onError={() => setBroken((m) => ({ ...m, [v.logo_url]: true }))}
                      onLoad={(e) => {
                        const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                        if (h) setRatios((m) => (m[v.logo_url] === w / h ? m : { ...m, [v.logo_url]: w / h }));
                      }}
                    />
                  ) : (
                    <ImagePlus size={18} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={v.logo_url ? `Change ${imageWord}` : `Add ${imageWord}`}
                    disabled={busyKey !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      onPickLogo(i, file);
                    }}
                  />
                </label>
                {v.logo_url && !busy && (
                  <button type="button" className="logo-picker-x" aria-label={`Remove ${imageWord}`} onClick={() => set(i, { logo_url: "" })}>
                    <X size={11} />
                  </button>
                )}
              </div>
              <input value={v.name} placeholder={kind.namePlaceholder} onChange={(e) => set(i, { name: e.target.value })} />
            </div>

            {!basic && (
            <div className="ven-desc">
              {(() => {
                // Always-visible count; the limit keeps the description whole on the card.
                const len = v.description?.length ?? 0;
                const over = len > DESCRIPTION_MAX;
                return (
                  <>
                    <textarea
                      rows={2}
                      // Typing stops at the limit; an older, longer description stays editable so it can be shortened.
                      maxLength={over ? undefined : DESCRIPTION_MAX}
                      value={v.description ?? ""}
                      placeholder={kind.descriptionPlaceholder}
                      aria-invalid={over || undefined}
                      aria-describedby={`ven-desc-count-${i}`}
                      className={over ? "is-over" : undefined}
                      onChange={(e) => set(i, { description: e.target.value })}
                    />
                    <div id={`ven-desc-count-${i}`} className={`ven-count${over ? " is-over" : len >= DESCRIPTION_MAX - 10 ? " is-near" : ""}`}>
                      <span>{over ? `Too long to show in full. Shorten it by ${len - DESCRIPTION_MAX}.` : "Shown in full on your card."}</span>
                      <span className="ven-count-num">
                        {len}/{DESCRIPTION_MAX}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
            )}

            {!basic && v.logo_url && (
              <div className="ven-size">
                <span>Size on card</span>
                <div role="radiogroup" aria-label={`${imageWord} size on card`} className="ven-seg">
                  {LOGO_SIZES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={(v.logo_size ?? "s") === s.id}
                      className={(v.logo_size ?? "s") === s.id ? "is-on" : ""}
                      onClick={() => pickSize(i, v, s.id as LogoSize)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {onCropImage && (
                  <button type="button" className="ven-crop" disabled={busyKey !== null} onClick={() => onCropImage(i, v.logo_size ?? "s")}>
                    <Crop size={13} aria-hidden="true" /> Crop
                  </button>
                )}
                {(v.logo_size ?? "s") === "l" && ratios[v.logo_url] != null && !isBannerShaped(ratios[v.logo_url]) && (
                  <p className="ven-hint">
                    Shown whole on a blurred banner. Crop it to 16:9 to fill the banner edge to edge.
                  </p>
                )}
              </div>
            )}

            {hasFile ? (
              <div className="ven-file">
                <FileText size={16} aria-hidden="true" />
                <a href={v.url} target="_blank" rel="noopener noreferrer">
                  {v.file_name}
                </a>
                <button type="button" aria-label="Remove PDF" onClick={() => set(i, { url: "", file_name: "" })}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <input value={v.url} placeholder={kind.urlPlaceholder} onChange={(e) => set(i, { url: e.target.value })} />
            )}

            {!basic && kind.acceptsFile && !hasFile && (
              onDocumentFile ? (
                <label className={`ven-upload${uploadingAt === i ? " is-busy" : ""}`}>
                  {uploadingAt === i ? <Loader2 size={14} className="ven-spin" /> : <Upload size={14} />}
                  {uploadingAt === i ? "Uploading PDF…" : "Upload a PDF instead"}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    disabled={uploadingAt !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      void uploadPdf(i, file);
                    }}
                  />
                </label>
              ) : (
                <small>Paste a link for now. You can upload a PDF once your card is saved.</small>
              )
            )}

            {/* Projects keep their link and can add a PDF too (company profile, deck…). */}
            {!basic && kind.id === "venture" &&
              (v.document_url ? (
                <div className="ven-file">
                  <FileText size={16} aria-hidden="true" />
                  <a href={v.document_url} target="_blank" rel="noopener noreferrer">
                    {v.document_name || "Attached PDF"}
                  </a>
                  <button type="button" aria-label="Remove PDF" onClick={() => set(i, { document_url: undefined, document_name: undefined })}>
                    <X size={13} />
                  </button>
                </div>
              ) : onDocumentFile ? (
                <label className={`ven-attach${uploadingAt === i ? " is-busy" : ""}`}>
                  {uploadingAt === i ? <Loader2 size={15} className="ven-spin" /> : <FileText size={15} />}
                  <span>
                    <strong>{uploadingAt === i ? "Uploading PDF…" : "Attach a PDF"}</strong>
                    <small>Optional. Company profile, deck or brochure, shown with a PDF icon on your card.</small>
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    disabled={uploadingAt !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      void uploadPdf(i, file, true);
                    }}
                  />
                </label>
              ) : (
                <div className="ven-attach is-off">
                  <FileText size={15} />
                  <span>
                    <strong>Attach a PDF</strong>
                    <small>Available once your card is saved. Add a company profile, deck or brochure.</small>
                  </span>
                </div>
              ))}

            {errorFor(i) && <small className="err">{errorFor(i)}</small>}
          </div>
        );
      })}

      <div className="ven-add">
        <span>Add</span>
        {(basic ? VENTURE_KINDS.filter((k) => k.id === "venture") : VENTURE_KINDS).map((k) => (
          <button key={k.id} type="button" onClick={() => add(k.id)}>
            <Plus size={13} aria-hidden="true" />
            {k.id === "catalog" ? "Add your catalog" : k.label}
          </button>
        ))}
      </div>
    </div>
  );
}
