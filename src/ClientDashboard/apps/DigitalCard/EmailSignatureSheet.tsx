import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Code2, Copy, ExternalLink, X } from "lucide-react";
import type { BusinessCard } from "../../../services/businessCardAPI";
import {
  buildSignatureHtml,
  buildSignatureText,
  defaultSignatureColor,
  layoutHasImages,
  SIGNATURE_COLORS,
  SIGNATURE_LAYOUTS, type SignatureLayout, type SignatureOptions } from "./emailSignature";

type Client = "gmail" | "outlook" | "apple" | "iphone";

/** `open`: links straight to the app's signature settings (web apps only; Apple Mail has none). */
const CLIENTS: { id: Client; label: string; steps: string[]; open?: { label: string; href: string }[] }[] = [
  {
    id: "gmail",
    label: "Gmail",
    open: [{ label: "Open Gmail signature settings", href: "https://mail.google.com/mail/u/0/#settings/general" }],
    steps: [
      "Copy your signature with the button above.",
      "In Gmail, open Settings (the gear) → See all settings → General.",
      "Under Signature, choose Create new, name it, and paste into the box.",
      "Pick it under Signature defaults, then Save changes at the bottom of the page.",
    ],
  },
  {
    id: "outlook",
    label: "Outlook",
    open: [
      { label: "Open Outlook signature settings", href: "https://outlook.office.com/mail/options/mail/messageContent" },
      { label: "Outlook.com (personal)", href: "https://outlook.live.com/mail/0/options/mail/messageContent" },
    ],
    steps: [
      "Copy your signature with the button above.",
      "Outlook on the web: Settings → Mail → Compose and reply → Email signature. Paste and Save.",
      "Outlook desktop: File → Options → Mail → Signatures → New. Paste, then choose it for new messages.",
    ],
  },
  {
    id: "apple",
    label: "Apple Mail",
    steps: [
      "Copy your signature with the button above.",
      "In Mail, open Settings → Signatures, select your account and press +.",
      "Paste into the right-hand box.",
      "Untick “Always match my default message font” so the layout stays as it is.",
    ],
  },
  {
    id: "iphone",
    label: "iPhone",
    steps: [
      "Copy your signature with the button above (on your iPhone).",
      "Open Settings → Apps → Mail → Signature and paste.",
      "If it pastes as plain text, shake the phone and choose Undo to restore the formatting.",
    ],
  },
];

/** Builds an email signature from the card: preview, copy, and how to add it in each mail app. */
export default function EmailSignatureSheet({
  card,
  tier,
  onClose,
}: {
  card: BusinessCard;
  tier?: SignatureOptions["tier"];
  onClose: () => void;
}) {
  const [photo, setPhoto] = useState(!!card.image_url);
  const [qr, setQr] = useState(false);
  const [layout, setLayout] = useState<SignatureLayout>("business");
  const [border, setBorder] = useState(true);
  // Black by default; the card's own colour (gold on Prestige…) is the next swatch.
  const startColor = "#171717";
  const [color, setColor] = useState(startColor);
  const cardColor = defaultSignatureColor(card, tier).toLowerCase();
  const swatches = [...new Set([startColor, cardColor, ...SIGNATURE_COLORS])];
  const customColor = !swatches.includes(color);
  const images = layoutHasImages(layout);
  const [copied, setCopied] = useState<"rich" | "html" | null>(null);
  const [client, setClient] = useState<Client>("gmail");
  const previewRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => buildSignatureHtml(card, { photo, qr, tier, layout, border, color }), [card, photo, qr, tier, layout, border, color]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const flash = (kind: "rich" | "html") => {
    setCopied(kind);
    setTimeout(() => setCopied((c) => (c === kind ? null : c)), 2000);
  };

  /** Rich copy (HTML + plain text) so mail apps paste the formatted signature. */
  const copyRich = async () => {
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([buildSignatureText(card)], { type: "text/plain" }),
          }),
        ]);
        return flash("rich");
      }
    } catch {
      /* fall back to copying the rendered preview */
    }
    const el = previewRef.current;
    const sel = window.getSelection();
    if (!el || !sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("copy");
    sel.removeAllRanges();
    flash("rich");
  };

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      flash("html");
    } catch {
      /* clipboard blocked */
    }
  };

  const { steps, open } = CLIENTS.find((c) => c.id === client)!;

  return createPortal(
    <div className="dc">
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet sig-sheet" role="dialog" aria-modal="true" aria-labelledby="sig-title" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-head">
            <h2 id="sig-title">Add to your email signature</h2>
            <button type="button" className="sheet-x" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <p className="sig-intro">Every email you send carries your card. Copy it once and paste it into your mail app’s signature settings.</p>

          <div className="sig-layouts" role="radiogroup" aria-label="Signature style">
            {SIGNATURE_LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={layout === l.id}
                className={`sig-layout${layout === l.id ? " is-on" : ""}`}
                onClick={() => setLayout(l.id)}
              >
                <strong>{l.label}</strong>
                <span>{l.hint}</span>
              </button>
            ))}
          </div>

          <div className="sig-options" role="group" aria-label="Signature options">
            <label className={`sig-toggle${!card.image_url || !images ? " is-off" : ""}`}>
              <input type="checkbox" checked={photo && images} disabled={!card.image_url || !images} onChange={(e) => setPhoto(e.target.checked)} /> Photo
            </label>
            <label className={`sig-toggle${!card.qr_code || !images ? " is-off" : ""}`}>
              <input type="checkbox" checked={qr && images} disabled={!card.qr_code || !images} onChange={(e) => setQr(e.target.checked)} /> QR code
            </label>
            <label className="sig-toggle">
              <input type="checkbox" checked={border} onChange={(e) => setBorder(e.target.checked)} /> Border
            </label>
          </div>

          <div className="sig-colors" role="radiogroup" aria-label="Signature colour">
            <span className="sig-colors-label">Colour</span>
            {swatches.map((c, i) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={i === 0 ? "Black" : c === cardColor ? `Your card colour ${c}` : c}
                title={i === 0 ? "Black" : c === cardColor ? "Your card colour" : c}
                className={`sig-swatch${color === c ? " is-on" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
            {/* Any other colour: the native picker behind a rainbow swatch. */}
            <label className={`sig-swatch is-custom${customColor ? " is-on" : ""}`} title="Custom colour" style={customColor ? { background: color } : undefined}>
              <input type="color" value={color} aria-label="Custom colour" onChange={(e) => setColor(e.target.value.toLowerCase())} />
            </label>
          </div>

          {/* The signature exactly as it will paste (the HTML is escaped when it's built). */}
          <div className="sig-preview">
            <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
          </div>

          <div className="sig-actions">
            <button type="button" className="btn" onClick={() => void copyRich()}>
              {copied === "rich" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied === "rich" ? "Signature copied" : "Copy signature"}
            </button>
            <button type="button" className="btn ghost" onClick={() => void copyHtml()} title="For mail apps that accept HTML">
              {copied === "html" ? <Check size={16} aria-hidden="true" /> : <Code2 size={16} aria-hidden="true" />} {copied === "html" ? "HTML copied" : "Copy HTML"}
            </button>
          </div>

          <div className="sig-howto">
            <div className="sig-tabs" role="tablist" aria-label="Mail app">
              {CLIENTS.map((c) => (
                <button key={c.id} type="button" role="tab" aria-selected={client === c.id} className={client === c.id ? "is-on" : undefined} onClick={() => setClient(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <ol>
              {steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {open && (
              <div className="sig-open">
                {open.map((o, i) => (
                  <a key={o.href} className={`btn small${i ? " ghost" : ""}`} href={o.href} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} aria-hidden="true" /> {o.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
