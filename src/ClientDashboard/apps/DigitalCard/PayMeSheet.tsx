import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Copy, Download, ShieldCheck, Wallet, X } from "lucide-react";
import type { CardPayMethod } from "../../../services/businessCardAPI";
import { payAction, payProvider, type PayAction } from "./payMe";

const REPORT_EMAIL = "support@callshivai.com";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / no permission: a temporary textarea.
    const t = document.createElement("textarea");
    t.value = text;
    t.style.position = "fixed";
    t.style.opacity = "0";
    document.body.appendChild(t);
    t.select();
    const ok = document.execCommand("copy");
    t.remove();
    return ok;
  }
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="pay-copy"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      {done ? "Copied" : label}
    </button>
  );
}

/** Visitor side of Pay Me: choose a method, then hand off to the provider (or show the QR / details). */
export default function PayMeSheet({
  name,
  slug,
  methods,
  onClose,
}: {
  name: string;
  slug?: string;
  /** Already filtered to visible methods, default first. */
  methods: CardPayMethod[];
  onClose: () => void;
}) {
  const firstName = name.trim().split(/\s+/)[0] || "me";
  const [open, setOpen] = useState<{ m: CardPayMethod; action: PayAction } | null>(null);
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const choose = (m: CardPayMethod) => {
    const action = payAction(m, name);
    if (!action) return;
    // Links open straight away (inside the tap, so it isn't blocked as a popup).
    if (action.kind === "link") window.open(action.url, "_blank", "noopener,noreferrer");
    else setOpen({ m, action });
  };

  const report = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(`Report payment details on a ShivAI card${slug ? ` (${slug})` : ""}`)}&body=${encodeURIComponent(
    `Card: ${slug ? `https://${slug}.callshivai.com` : name}\nPayment option: ${open?.m.label ?? ""}\n\nWhat looks wrong:\n`,
  )}`;

  return createPortal(
    <div className="dc">
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet pay" role="dialog" aria-modal="true" aria-labelledby="pay-sheet-title" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-head">
            {open ? (
              <button type="button" className="pay-back" onClick={() => setOpen(null)}>
                <ArrowLeft size={16} /> All options
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="sheet-x" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {!open ? (
            <>
              <div className="pay-hero">
                <span className="pay-hero-ico">
                  <Wallet size={22} />
                </span>
                <h2 id="pay-sheet-title">Pay {firstName}</h2>
                <p>Pay me securely using your preferred payment method.</p>
              </div>
              <div className="pay-list">
                {methods.map((m, i) => {
                  const p = payProvider(m.provider);
                  return (
                    <button key={i} ref={i === 0 ? firstButton : undefined} type="button" className={`pay-option${m.is_default ? " is-default" : ""}`} onClick={() => choose(m)}>
                      <span className="pay-option-ico">
                        <p.Icon size={18} />
                      </span>
                      <span className="pay-option-text">
                        <strong>{m.label}</strong>
                        <small>
                          {p.name}
                          {m.currency ? ` · ${m.currency}` : ""}
                        </small>
                      </span>
                      {payAction(m, name)?.kind === "link" ? <ArrowUpRight size={17} /> : <ChevronRight size={17} />}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="pay-detail">
              <h2 id="pay-sheet-title">{open.m.label}</h2>
              {open.action.kind === "upi" && (
                <>
                  <div className="pay-qr">
                    <QRCode value={open.action.uri} size={184} />
                  </div>
                  <p className="pay-hint">Scan with any UPI app: GPay, PhonePe, Paytm, BHIM…</p>
                  <a className="pay-cta" href={open.action.uri}>
                    Open UPI app
                  </a>
                  <div className="pay-row">
                    <span>
                      <small>UPI ID</small>
                      <strong>{open.action.id}</strong>
                    </span>
                    <CopyButton text={open.action.id} />
                  </div>
                </>
              )}
              {open.action.kind === "qr" && (
                <>
                  <div className="pay-qr is-image">
                    <img src={open.action.image} alt={`Payment QR for ${name}`} />
                  </div>
                  <p className="pay-hint">Scan with your payment app, or save the image and open it from your app.</p>
                  <a className="pay-cta light" href={open.action.image} download={`pay-${firstName.toLowerCase()}-qr`} target="_blank" rel="noopener noreferrer">
                    <Download size={15} /> Save QR image
                  </a>
                </>
              )}
              {open.action.kind === "bank" && (
                <>
                  <pre className="pay-bank">{open.action.text}</pre>
                  <CopyButton text={open.action.text} label="Copy bank details" />
                  <p className="pay-hint">Double-check the details with {firstName} before sending a large amount.</p>
                </>
              )}
            </div>
          )}

          <div className="pay-foot">
            <p>
              <ShieldCheck size={14} aria-hidden="true" />
              Payments are completed with the provider. ShivAI never asks for your card number, PIN or password.
            </p>
            <a href={report}>Report a problem with these payment details</a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
