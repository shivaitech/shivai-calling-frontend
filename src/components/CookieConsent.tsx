import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Cookie, Lock, X } from "lucide-react";
import { CONSENT_EVENT, OPEN_COOKIE_SETTINGS, getConsent, needsCookieChoice, setConsent, syncConsent } from "../legal/consent";
import { startConsentedAnalytics } from "../legal/analytics";
import { LEGAL_PATHS } from "../legal/company";
import { useAuth } from "../contexts/AuthContext";
import { getCardSubdomain } from "../utils/cardSubdomain";

let started = false;

/**
 * Cookie choice (DPDP s.6): nothing optional runs until the visitor chooses. "Essential only" is
 * as easy and as visible as "Accept", the choice can be changed any time (footer → Cookie settings,
 * Privacy Center), and every change goes into the consent ledger.
 */
export default function CookieConsent() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  // Business cards are someone else's page: no ShivAI banner there (and no analytics without a choice).
  const onCard = !!getCardSubdomain() || pathname.startsWith("/card/");

  useEffect(() => {
    if (!started) {
      started = true;
      startConsentedAnalytics();
    }
    if (!onCard && needsCookieChoice()) setOpen(true);
    const reopen = () => {
      setAnalytics(getConsent("analytics"));
      setPanel(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, [onCard]);

  // Consent given before sign-up (or offline) is sent once there's a session.
  useEffect(() => {
    if (isAuthenticated) void syncConsent();
  }, [isAuthenticated]);

  useEffect(() => {
    const sync = () => setAnalytics(getConsent("analytics"));
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!open) return null;

  const decide = (allowAnalytics: boolean) => {
    setConsent({ analytics: allowAnalytics }, panel ? "cookie-settings" : "cookie-banner", { decided: true });
    setOpen(false);
    setPanel(false);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cc-title"
      className="fixed z-[2147483000] bottom-3 left-3 right-3 sm:right-auto sm:bottom-5 sm:left-5 sm:w-[400px] rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.35)] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
      style={{ fontFamily: "Poppins, system-ui, sans-serif" }}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
            <Cookie className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="cc-title" className="text-[15px] font-semibold text-slate-900 dark:text-white">
              {panel ? "Cookie settings" : "Your privacy, your choice"}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              We use essential cookies to keep ShivAI working. With your OK, we'd also use analytics cookies to see which pages help
              people most. No ads, no selling data.{" "}
              <Link to={LEGAL_PATHS.cookies} className="font-medium text-sky-700 underline underline-offset-2 dark:text-sky-300">
                Cookie Policy
              </Link>
            </p>
          </div>
          {panel && (
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mr-1 -mt-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {panel && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/60">
              <div>
                <div className="text-[13px] font-medium text-slate-900 dark:text-white">Essential</div>
                <div className="text-[12px] text-slate-500">Sign-in, security, your settings</div>
              </div>
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500">
                <Lock className="h-3 w-3" /> Always on
              </span>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 hover:border-slate-300 dark:border-slate-700">
              <div>
                <div className="text-[13px] font-medium text-slate-900 dark:text-white">Analytics</div>
                <div className="text-[12px] text-slate-500">Google Analytics, IP anonymised</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analytics}
                onClick={() => setAnalytics((v) => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${analytics ? "bg-sky-600" : "bg-slate-300 dark:bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${analytics ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
            </label>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {panel ? (
            <>
              <button type="button" onClick={() => decide(false)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Essential only
              </button>
              <button type="button" onClick={() => decide(analytics)} className="rounded-xl bg-slate-900 px-3 py-2.5 text-[13px] font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                Save choice
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => decide(false)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Essential only
              </button>
              <button type="button" onClick={() => decide(true)} className="rounded-xl bg-slate-900 px-3 py-2.5 text-[13px] font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                Accept analytics
              </button>
            </>
          )}
        </div>
        {!panel && (
          <button
            type="button"
            onClick={() => {
              setAnalytics(getConsent("analytics"));
              setPanel(true);
            }}
            className="mt-2 w-full text-center text-[12px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Choose what to allow
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
