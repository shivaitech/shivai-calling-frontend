import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Code2, Copy, X } from "lucide-react";
import type { BusinessCard } from "../../../services/businessCardAPI";
import { buildSignatureHtml, buildSignatureText, type SignatureOptions } from "./emailSignature";

type Client = "gmail" | "outlook" | "apple" | "iphone";

const CLIENTS: { id: Client; label: string; steps: string[] }[] = [
  {
    id: "gmail",
    label: "Gmail",
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
  const [copied, setCopied] = useState<"rich" | "html" | null>(null);
  const [client, setClient] = useState<Client>("gmail");
  const previewRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => buildSignatureHtml(card, { photo, qr, tier }), [card, photo, qr, tier]);

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

  const steps = CLIENTS.find((c) => c.id === client)!.steps;

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

          <div className="sig-options" role="group" aria-label="Signature options">
            <label className={`sig-toggle${!card.image_url ? " is-off" : ""}`}>
              <input type="checkbox" checked={photo} disabled={!card.image_url} onChange={(e) => setPhoto(e.target.checked)} /> Photo
            </label>
            <label className={`sig-toggle${!card.qr_code ? " is-off" : ""}`}>
              <input type="checkbox" checked={qr} disabled={!card.qr_code} onChange={(e) => setQr(e.target.checked)} /> QR code
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
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
