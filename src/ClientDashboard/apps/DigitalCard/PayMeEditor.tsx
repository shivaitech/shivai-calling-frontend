import { useState } from "react";
import { ArrowLeft, Loader2, Pencil, Plus, QrCode, ShieldCheck, Star, Trash2, Upload, Wallet, X } from "lucide-react";
import type { CardPayMethod, PayProvider } from "../../../services/businessCardAPI";
import { CURRENCIES, MAX_PAY_METHODS, PAY_PROVIDERS, payMethodProblem, payProvider } from "./payMe";

type Draft = { method: CardPayMethod; index: number | null };

/**
 * Pay Me setup: add the ways visitors can pay the card owner. A short wizard — choose a
 * provider, enter the link / ID / QR, name it — then each method can be switched on or off,
 * made the default, edited or removed. The live card preview shows the result.
 */
export default function PayMeEditor({
  value,
  update,
  onQrFile,
}: {
  value: CardPayMethod[];
  update: (fn: (methods: CardPayMethod[]) => CardPayMethod[]) => void;
  /** Turns a picked QR image into a URL (uploaded, or a data URL before sign-up). */
  onQrFile: (file: File) => Promise<string | null>;
}) {
  const [step, setStep] = useState<"closed" | "provider" | "details">("closed");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [qrBusy, setQrBusy] = useState(false);

  const startAdd = () => {
    setDraft(null);
    setError("");
    setStep("provider");
  };
  const pickProvider = (id: PayProvider) => {
    const p = payProvider(id);
    setDraft({
      method: { provider: id, label: p.defaultLabel, value: "", qr_url: "", currency: p.defaultCurrency ?? "", is_default: value.length === 0, enabled: true },
      index: null,
    });
    setError("");
    setStep("details");
  };
  const edit = (i: number) => {
    setDraft({ method: { ...value[i] }, index: i });
    setError("");
    setStep("details");
  };
  const close = () => {
    setStep("closed");
    setDraft(null);
    setError("");
  };
  const patch = (p: Partial<CardPayMethod>) => setDraft((d) => (d ? { ...d, method: { ...d.method, ...p } } : d));

  const save = () => {
    if (!draft) return;
    const info = payProvider(draft.method.provider);
    const method = { ...draft.method, value: info.field ? info.normalize(draft.method.value) : "", label: draft.method.label.trim() };
    const problem = payMethodProblem(method);
    if (problem) return setError(problem);
    update((list) => {
      let next = draft.index === null ? [...list, method] : list.map((m, j) => (j === draft.index ? method : m));
      // Exactly one default when any are marked.
      const di = draft.index === null ? next.length - 1 : draft.index;
      if (method.is_default) next = next.map((m, j) => ({ ...m, is_default: j === di }));
      else if (!next.some((m) => m.is_default)) next = next.map((m, j) => ({ ...m, is_default: j === 0 }));
      return next;
    });
    close();
  };

  const pickQr = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image of your QR code.");
    setQrBusy(true);
    setError("");
    try {
      const url = await onQrFile(file);
      if (url) patch({ qr_url: url });
    } finally {
      setQrBusy(false);
    }
  };

  const makeDefault = (i: number) => update((list) => list.map((m, j) => ({ ...m, is_default: j === i })));
  const remove = (i: number) =>
    update((list) => {
      const next = list.filter((_, j) => j !== i);
      return next.length && !next.some((m) => m.is_default) ? next.map((m, j) => ({ ...m, is_default: j === 0 })) : next;
    });
  const toggle = (i: number) => update((list) => list.map((m, j) => (j === i ? { ...m, enabled: m.enabled === false } : m)));

  const info = draft ? payProvider(draft.method.provider) : null;

  return (
    <div className="pm">
      {value.length === 0 && step === "closed" && (
        <div className="pm-empty">
          <span className="pm-empty-ico">
            <Wallet size={20} />
          </span>
          <div>
            <strong>Let people pay you from your card</strong>
            <p>UPI, PayPal, card payment links, Wise, bank transfer or your payment QR. Visitors tap Pay Me, choose a method and pay with your provider.</p>
          </div>
        </div>
      )}

      {value.length > 0 && (
        <ul className="pm-list">
          {value.map((m, i) => {
            const p = payProvider(m.provider);
            const on = m.enabled !== false;
            return (
              <li key={i} className={on ? "" : "is-off"}>
                <span className="pm-ico">
                  <p.Icon size={17} />
                </span>
                <div className="pm-main">
                  <strong>
                    {m.label}
                    {m.is_default && <span className="pm-badge">Default</span>}
                  </strong>
                  <small>
                    {p.name}
                    {m.provider === "upi" ? ` · ${m.value}` : ""}
                    {m.currency ? ` · ${m.currency}` : ""}
                    {!on ? " · Hidden" : ""}
                  </small>
                </div>
                <label className="pm-switch" title={on ? "Shown on your card" : "Hidden from your card"}>
                  <input type="checkbox" checked={on} onChange={() => toggle(i)} aria-label={`Show ${m.label} on card`} />
                  <span />
                </label>
                <div className="pm-actions">
                  {!m.is_default && (
                    <button type="button" onClick={() => makeDefault(i)} aria-label={`Make ${m.label} the default`} title="Make default">
                      <Star size={15} />
                    </button>
                  )}
                  <button type="button" onClick={() => edit(i)} aria-label={`Edit ${m.label}`} title="Edit">
                    <Pencil size={15} />
                  </button>
                  <button type="button" className="danger" onClick={() => remove(i)} aria-label={`Remove ${m.label}`} title="Remove">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Step 1 — provider */}
      {step === "provider" && (
        <div className="pm-wizard">
          <div className="pm-wizard-head">
            <strong>Choose how you get paid</strong>
            <button type="button" className="pm-close" aria-label="Cancel" onClick={close}>
              <X size={16} />
            </button>
          </div>
          <div className="pm-providers">
            {PAY_PROVIDERS.map((p) => (
              <button key={p.id} type="button" onClick={() => pickProvider(p.id)}>
                <span className="pm-ico">
                  <p.Icon size={17} />
                </span>
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.use}</small>
                </span>
              </button>
            ))}
          </div>
          <p className="pm-note">Availability, currencies and limits depend on the provider and your account with them.</p>
        </div>
      )}

      {/* Step 2 — details */}
      {step === "details" && draft && info && (
        <div className="pm-wizard">
          <div className="pm-wizard-head">
            {draft.index === null ? (
              <button type="button" className="pm-back" onClick={() => setStep("provider")}>
                <ArrowLeft size={15} /> {info.name}
              </button>
            ) : (
              <strong>Edit {info.name}</strong>
            )}
            <button type="button" className="pm-close" aria-label="Cancel" onClick={close}>
              <X size={16} />
            </button>
          </div>

          {info.field && (
            <label className="field">
              <span>{info.field.label}</span>
              {info.field.multiline ? (
                <textarea rows={4} value={draft.method.value} placeholder={info.field.placeholder} onChange={(e) => patch({ value: e.target.value })} />
              ) : (
                <input
                  value={draft.method.value}
                  placeholder={info.field.placeholder}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(e) => patch({ value: e.target.value })}
                />
              )}
              {info.field.hint && <small>{info.field.hint}</small>}
            </label>
          )}

          {info.qr !== "none" && (
            <div className="pm-qr">
              {draft.method.qr_url ? (
                <div className="pm-qr-preview">
                  <img src={draft.method.qr_url} alt="Your payment QR" />
                  <button type="button" className="link-btn danger" onClick={() => patch({ qr_url: "" })}>
                    Remove QR
                  </button>
                </div>
              ) : (
                <label className={`pm-qr-drop${qrBusy ? " is-busy" : ""}`}>
                  {qrBusy ? <Loader2 size={18} className="ven-spin" /> : <QrCode size={20} />}
                  <span>
                    <strong>{qrBusy ? "Uploading…" : info.qr === "required" ? "Upload your payment QR" : "Add a payment QR (optional)"}</strong>
                    <small>Use the QR from your payment app. It's shown exactly as uploaded.</small>
                  </span>
                  <Upload size={16} className="pm-qr-up" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={qrBusy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      void pickQr(file);
                    }}
                  />
                </label>
              )}
            </div>
          )}

          <div className="row">
            <label className="field">
              <span>Button name</span>
              <input value={draft.method.label} maxLength={40} placeholder={info.defaultLabel} onChange={(e) => patch({ label: e.target.value })} />
            </label>
            <label className="field pm-currency">
              <span>Currency</span>
              <select value={draft.method.currency ?? ""} onChange={(e) => patch({ currency: e.target.value })}>
                <option value="">Any</option>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="chk">
            <input type="checkbox" checked={!!draft.method.is_default} onChange={(e) => patch({ is_default: e.target.checked })} />
            Show this first (default)
          </label>

          {error && <small className="err">{error}</small>}

          <div className="pm-wizard-foot">
            <button type="button" className="btn small ghost" onClick={close}>
              Cancel
            </button>
            <button type="button" className="btn small" disabled={qrBusy} onClick={save}>
              {draft.index === null ? "Add to card" : "Save"}
            </button>
          </div>
        </div>
      )}

      {step === "closed" && value.length < MAX_PAY_METHODS && (
        <button type="button" className="xphone-add" onClick={startAdd}>
          <Plus size={14} aria-hidden="true" /> {value.length ? "Add another payment method" : "Add payment method"}
        </button>
      )}

      <p className="pm-safe">
        <ShieldCheck size={14} aria-hidden="true" />
        ShivAI never asks for or stores card numbers, PINs or passwords. Visitors pay on your provider's own secure page.
      </p>
    </div>
  );
}
