import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Smartphone, Wallet, X } from "lucide-react";
import { WALLETS, WalletOption } from "./wallets";
import { googleWalletSaveUrl } from "../../../services/businessCardAPI";

/** "Save contact" choices: save to the phone's contacts now, or a wallet (as they come online). */
export default function SaveContactSheet({
  name,
  slug,
  onSaveToPhone,
  onClose,
}: {
  name: string;
  /** The saved card's slug. Wallet passes need it, so editor previews (no slug) can't add one. */
  slug?: string;
  onSaveToPhone: () => void;
  onClose: () => void;
}) {
  const firstButton = useRef<HTMLButtonElement>(null);
  const firstName = name.trim().split(/\s+/)[0] || "this";
  const [busy, setBusy] = useState<WalletOption["id"] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    firstButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const addToWallet = async (w: WalletOption) => {
    if (!slug || w.id !== "google") return;
    setBusy(w.id);
    setError("");
    try {
      // Same tab: a window.open after an await is often blocked as a popup.
      window.location.assign(await googleWalletSaveUrl(slug));
    } catch {
      setError("Couldn't add this card to Google Wallet. Please try again.");
      setBusy(null);
    }
  };

  // Portal to <body> so a transformed/clipped ancestor can't trap the fixed overlay;
  // the .dc wrapper re-applies digitalCard.css scoping out there.
  return createPortal(
    <div className="dc">
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="save-sheet-title" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-head">
            <h2 id="save-sheet-title">Save {firstName}'s contact</h2>
            <button type="button" className="sheet-x" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <button
            ref={firstButton}
            type="button"
            className="sheet-option primary"
            onClick={() => {
              onSaveToPhone();
              onClose();
            }}
          >
            <span className="sheet-ico">
              <Smartphone size={18} />
            </span>
            <span className="sheet-text">
              <strong>Save to phone</strong>
              <small>Adds {name || "this contact"} to your contacts — iPhone &amp; Android</small>
            </span>
          </button>

          <div className="sheet-label">
            <span>
              <Wallet size={13} /> Add to wallet
            </span>
          </div>
          <ul className="sheet-wallets">
            {WALLETS.map((w) => {
              const usable = w.available && !!slug;
              return (
                <li key={w.id}>
                  <button type="button" className="sheet-option" disabled={!usable || busy !== null} onClick={() => addToWallet(w)}>
                    <span className="sheet-dot" style={{ background: w.color }} aria-hidden="true" />
                    <span className="sheet-text">
                      <strong>{w.name}</strong>
                      {w.available && !slug && <small>Available once the card is saved and shared</small>}
                    </span>
                    {!w.available && <span className="sheet-soon">Coming soon</span>}
                    {busy === w.id && <span className="sheet-soon">Preparing…</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {error && (
            <p role="alert" className="sheet-error">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
