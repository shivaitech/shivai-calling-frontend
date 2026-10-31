import { useState } from "react";
import { FileText, ImagePlus, Loader2, Plus, Upload, X } from "lucide-react";
import type { CardVenture, LogoSize, VentureType } from "../../../services/businessCardAPI";
import { DESCRIPTION_MAX, DOCUMENT_MAX_BYTES, LOGO_SIZES, VENTURE_KINDS, ventureKind } from "./ventureKinds";

const patchAt = <T,>(arr: T[], i: number, patch: Partial<T>) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x));

/**
 * Ventures and things to browse — shop catalogs, documents (PDF), menus, portfolios.
 * Each entry: a type, a logo/cover (shown Small / Medium / Large on the card), a name,
 * and a link — or, for browsable types, an uploaded PDF.
 */
export default function VenturesEditor({
  value,
  update,
  busyKey,
  onPickLogo,
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
  /** Uploads a PDF; undefined = no account yet (link only). */
  onDocumentFile?: (file: File) => Promise<{ url: string; file_name: string }>;
  onDocumentError: (message: string) => void;
  errorFor: (index: number) => string | undefined;
}) {
  const [uploadingAt, setUploadingAt] = useState<number | null>(null);
  const set = (i: number, patch: Partial<CardVenture>) => update((list) => patchAt(list, i, patch));
  const add = (type: VentureType) =>
    update((list) => [...list, { name: "", logo_url: "", url: "", type, logo_size: type === "venture" ? "s" : "m", file_name: "", description: "" }]);

  const uploadPdf = async (i: number, file: File | undefined) => {
    if (!file || !onDocumentFile) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return onDocumentError("Please choose a PDF file.");
    if (file.size > DOCUMENT_MAX_BYTES) return onDocumentError("That PDF is over 10 MB. Try a smaller file or paste a link instead.");
    setUploadingAt(i);
    try {
      const { url, file_name } = await onDocumentFile(file);
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
                <span className="ven-kind-plain">Venture {i + 1}</span>
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
                <label className={`logo-picker-tile${busy ? " is-busy" : ""}`} title={v.logo_url ? `Change ${imageWord}` : `Add ${imageWord}`}>
                  {v.logo_url ? <img src={v.logo_url} alt="" /> : <ImagePlus size={18} />}
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
              <textarea
                rows={2}
                maxLength={DESCRIPTION_MAX}
                value={v.description ?? ""}
                placeholder={kind.descriptionPlaceholder}
                onChange={(e) => set(i, { description: e.target.value })}
              />
              {(v.description?.length ?? 0) > DESCRIPTION_MAX - 40 && (
                <span className="ven-count">
                  {v.description?.length ?? 0}/{DESCRIPTION_MAX}
                </span>
              )}
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
                      onClick={() => set(i, { logo_size: s.id as LogoSize })}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
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

            {errorFor(i) && <small className="err">{errorFor(i)}</small>}
          </div>
        );
      })}

      <div className="ven-add">
        <span>Add</span>
        {(basic ? VENTURE_KINDS.filter((k) => k.id === "venture") : VENTURE_KINDS).map((k) => (
          <button key={k.id} type="button" onClick={() => add(k.id)}>
            <Plus size={13} aria-hidden="true" />
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}
