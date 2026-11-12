import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Bot, CheckCircle2, Crown, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/authAPI";
import { DBC_HOME, type DbcLock } from "../permissions/dbcAccess";

/**
 * What a Digital Business Card account (userBase "DBC") sees on a page it can't use:
 *   · "platform": the ShivAI platform isn't on the account — ask for access;
 *   · "upgrade": AI Employees / Training / Analytics on Essential — upgrade the card plan.
 */

export const SUPPORT_EMAIL = "support@callshivai.com";
const BILLING_PLANS = "/billing?view=apps&app=digital-card";

const PLATFORM_PERKS = ["AI calling, inbound and outbound", "Campaigns, contacts and Command Center", "Workflows, staff and integrations"];

const STEPS = [
  { title: "Send a request", text: "One click. Tell us which part of ShivAI you need." },
  { title: "We review it", text: "Our team gets back to you by email." },
  { title: "Your dashboard opens", text: "Your business cards stay exactly as they are." },
];

const UPGRADE_PLANS = [
  { key: "signature", name: "Signature", Icon: Award, lines: ["AI agent on up to 2 cards", "Up to 200 AI calls a month"] },
  { key: "prestige", name: "Prestige", Icon: Crown, lines: ["AI agents on up to 5 cards", "Up to 1,000 AI calls a month"] },
];

export default function DbcLockedPage({ lock, moduleName, standalone = false }: { lock: Exclude<DbcLock, null>; moduleName: string; standalone?: boolean }) {
  const body = lock === "upgrade" ? <UpgradeLock moduleName={moduleName} /> : <PlatformLock moduleName={moduleName} />;
  if (!standalone) return <div className="mx-auto w-full max-w-2xl py-4 sm:py-8">{body}</div>;
  return (
    <div className="min-h-dvh w-full grid place-items-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 px-4 py-10">
      <div className="w-full max-w-2xl">{body}</div>
    </div>
  );
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/80 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur p-6 sm:p-10">
    {children}
  </section>
);

/** "Request ShivAI Platform access": the endpoint, or an email to support where it isn't live yet. */
export function usePlatformAccessRequest(moduleName: string) {
  const { user, updateUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [mailed, setMailed] = useState(false);
  const [error, setError] = useState("");
  const status = user?.platformAccessStatus ?? null;

  const request = async () => {
    setSending(true);
    setError("");
    try {
      const res = await authAPI.requestPlatformAccess({ module: moduleName });
      updateUser({ platformAccessStatus: res?.status ?? "pending" });
    } catch (e: any) {
      const code = e?.response?.status;
      if (code === 404 || code === 501) {
        // Not on this server yet: hand it to support by email instead.
        const subject = "ShivAI Platform access request";
        const text = `Hi ShivAI team,\n\nPlease enable ShivAI Platform access on my account (${user?.email ?? ""}).\nI'd like to use: ${moduleName}.\n\nThanks,\n${user?.fullName ?? ""}`;
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
        setMailed(true);
      } else if (code === 409) {
        updateUser({ platformAccessStatus: "pending" });
      } else {
        setError(e?.response?.data?.message || "Couldn't send your request. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return { request, sending, mailed, error, status, email: user?.email ?? "" };
}

function PlatformLock({ moduleName }: { moduleName: string }) {
  const { request, sending, mailed, error, status, email } = usePlatformAccessRequest(moduleName);

  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-600 text-white shadow-lg shadow-slate-900/20">
          <Lock className="h-6 w-6" />
        </span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{moduleName}</p>
        <h2 className="mt-1.5 text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white text-balance">Part of the ShivAI Platform</h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          Your account is set up for the Digital Business Card. {moduleName === "This page" ? "This page" : moduleName} and the rest of ShivAI open once
          platform access is added to your account.
        </p>
      </div>

      <ul className="mt-6 grid gap-2 sm:grid-cols-3">
        {PLATFORM_PERKS.map((p) => (
          <li key={p} className="flex items-start gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-[13px] leading-snug text-slate-700 dark:text-slate-200">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-none text-slate-400" />
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {status === "pending" ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/15 px-4 py-3.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">Request sent</p>
              <p className="mt-0.5 text-emerald-800/80 dark:text-emerald-300/80">
                We'll email you at <strong className="font-semibold">{email}</strong> once platform access is on your account.
              </p>
            </div>
          </div>
        ) : mailed ? (
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3.5">
            <Mail className="mt-0.5 h-5 w-5 flex-none text-slate-500" />
            <p className="text-sm text-slate-700 dark:text-slate-200">
              We opened an email to <strong className="font-semibold">{SUPPORT_EMAIL}</strong>. Send it and our team will get back to you.
            </p>
          </div>
        ) : (
          <>
            {status === "rejected" && (
              <p className="mb-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 px-3.5 py-2.5 text-sm text-amber-800 dark:text-amber-200">
                Your last request wasn't approved. You can ask again, or write to {SUPPORT_EMAIL}.
              </p>
            )}
            <button
              type="button"
              onClick={() => void request()}
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-white dark:text-slate-900"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Request ShivAI Platform access
              {!sending && <ArrowRight className="h-4 w-4" />}
            </button>
            {error && <p className="mt-2 text-center text-sm text-rose-600">{error}</p>}
          </>
        )}
      </div>

      <ol className="mt-7 grid gap-4 border-t border-slate-200/80 dark:border-slate-700/70 pt-6 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3 sm:block">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">{i + 1}</span>
            <div className="sm:mt-2.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-7 text-center">
        <Link to={DBC_HOME} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          Go to my business cards <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}

function UpgradeLock({ moduleName }: { moduleName: string }) {
  const analytics = moduleName.startsWith("Analytics");
  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f3dfa3] to-[#c9a24d] text-[#5a4416] shadow-lg shadow-[#c9a24d]/25">
          <Bot className="h-6 w-6" />
        </span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{moduleName}</p>
        <h2 className="mt-1.5 text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white text-balance">
          {analytics ? "See every call your card's AI takes" : "Give your business card an AI agent"}
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          {analytics
            ? "Call history and analytics come with an AI agent on your card. Upgrade to Signature or Prestige to get one."
            : "Upgrade to Signature or Prestige to create an AI agent for your business card. It answers visitors, takes enquiries and helps with bookings for you."}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {UPGRADE_PLANS.map(({ key, name, Icon, lines }) => {
          const gold = key === "prestige";
          return (
            <div
              key={key}
              className={`rounded-2xl border p-4 ${
                gold
                  ? "border-[#e2cd94] bg-gradient-to-b from-[#fffaf0] to-white dark:from-[#2a2416] dark:to-slate-900/40 dark:border-[#a8822f]/50"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40"
              }`}
            >
              <p className="flex items-center gap-2 text-base font-semibold" style={gold ? { color: "#a8822f" } : undefined}>
                <Icon className={`h-4 w-4 ${gold ? "" : "text-slate-500"}`} />
                <span className={gold ? "" : "text-slate-900 dark:text-white"}>{name}</span>
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {lines.map((l) => (
                  <li key={l} className="flex items-start gap-2 text-[13px] text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="mt-px h-3.5 w-3.5 flex-none" style={{ color: gold ? "#a8822f" : "#334155" }} />
                    {l}
                  </li>
                ))}
              </ul>
              <Link
                to={`${BILLING_PLANS}&${new URLSearchParams({ plan: key, billing: "annual" })}`}
                className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.99] ${
                  gold ? "text-white hover:brightness-105" : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                }`}
                style={gold ? { background: "linear-gradient(135deg,#c9a24d,#a8822f)" } : undefined}
              >
                Upgrade to {name}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <Link to={BILLING_PLANS} className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          Compare all plans
        </Link>
        <Link to={DBC_HOME} className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          Go to my business cards <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
