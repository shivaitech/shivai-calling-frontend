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

  const readyWallet = WALLETS.find((w) => w.available);
  const walletReady = !!readyWallet && !!slug;

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

          {/* One "Add to Wallet" entry. It turns on with the first wallet the backend can issue (Google today). */}
          <button
            type="button"
            className="sheet-option sheet-wallet"
            disabled={!walletReady || busy !== null}
            onClick={() => readyWallet && addToWallet(readyWallet)}
          >
            <span className="sheet-ico wallet" aria-hidden="true">
              <Wallet size={18} />
            </span>
            <span className="sheet-text">
              <strong>{readyWallet ? `Add to ${readyWallet.name}` : "Add to Wallet"}</strong>
              <small>{readyWallet && !slug ? "Available once the card is saved and shared" : "Apple, Google, Samsung & more"}</small>
            </span>
            {busy ? <span className="sheet-soon">Preparing…</span> : !walletReady && !readyWallet && <span className="sheet-soon">Coming soon</span>}
          </button>
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
