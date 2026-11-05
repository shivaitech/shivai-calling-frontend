import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";

export interface WhatsAppNumber {
  /** "+971 56 618 0707" */
  display: string;
  /** What the number is for ("Mobile", "Work"…), when known. */
  label?: string;
  /** Lower-case country code for the flag, when known. */
  iso?: string | null;
  /** https://wa.me/<digits> */
  href: string;
}

/** The card has several WhatsApp numbers: the visitor picks which one to message. */
export default function WhatsAppPickerSheet({
  name,
  numbers,
  onPick,
  onClose,
}: {
  name: string;
  numbers: WhatsAppNumber[];
  /** Called as a chat opens (for the owner's Monitoring). */
  onPick?: () => void;
  onClose: () => void;
}) {
  const first = useRef<HTMLAnchorElement>(null);
  const firstName = name.trim().split(/\s+/)[0] || "them";

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Portal to <body> so a transformed/clipped ancestor can't trap the fixed overlay;
  // the .dc wrapper re-applies digitalCard.css scoping out there.
  return createPortal(
    <div className="dc">
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet wa-pick" role="dialog" aria-modal="true" aria-labelledby="wa-sheet-title" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-head">
            <h2 id="wa-sheet-title">Message {firstName} on WhatsApp</h2>
            <button type="button" className="sheet-x" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <p className="wa-pick-note">Choose a number</p>
          <div className="wa-pick-list">
            {numbers.map((n, i) => (
              <a
                key={n.href}
                ref={i === 0 ? first : undefined}
                className="sheet-option wa-pick-option"
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onPick?.();
                  onClose();
                }}
              >
                {n.iso ? (
                  <img className="wa-pick-flag" src={`https://flagcdn.com/${n.iso}.svg`} alt="" width={24} height={24} loading="lazy" />
                ) : (
                  <span className="wa-pick-flag wa-pick-flag-none" aria-hidden="true" />
                )}
                <span className="sheet-text">
                  <strong>{n.display}</strong>
                  {n.label && <small>{n.label}</small>}
                </span>
                <span className="wa-pick-go" aria-hidden="true">
                  <WhatsAppIcon mono size={18} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
