import { useEffect, useRef } from "react";
import { ArrowRight, User, Users, X } from "lucide-react";

/**
 * "Who are you creating a card for?" — asked before entering the card creator.
 * Business accounts aren't built yet. Planned: team invitations, each member creating their own
 * card, administrator roles and permissions, and optional approval before cards are published.
 */
export default function CreateChooser({ onIndividual, onClose }: { onIndividual: () => void; onClose: () => void }) {
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/50 sm:p-6 chooser-fade" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chooser-title"
        onClick={(e) => e.stopPropagation()}
        className="chooser-up w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="chooser-title" className="text-xl font-semibold tracking-tight text-slate-900">
              Who are you creating a card for?
            </h2>
            <p className="mt-1 text-sm text-slate-500">Start with one card. You can create more anytime.</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 flex-none grid place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <button
            ref={first}
            type="button"
            onClick={onIndividual}
            className="group w-full flex items-center gap-4 rounded-2xl border border-slate-900 bg-slate-900 p-4 text-left text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <span className="w-11 h-11 flex-none grid place-items-center rounded-xl bg-white/10">
              <User className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold">For myself</span>
              <span className="block text-sm text-white/70">Create your personal digital business card in minutes.</span>
            </span>
            <ArrowRight className="w-5 h-5 flex-none transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            disabled
            aria-describedby="team-soon"
            className="w-full flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left cursor-not-allowed"
          >
            <span className="w-11 h-11 flex-none grid place-items-center rounded-xl bg-white border border-slate-200 text-slate-400">
              <Users className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-slate-500">For my business</span>
              <span className="block text-sm text-slate-400">Create your business account and invite your team to build their own official digital identities.</span>
            </span>
            <span id="team-soon" className="flex-none rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              Coming soon
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
