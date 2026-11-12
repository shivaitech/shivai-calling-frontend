import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  Contact,
  CreditCard,
  Crown,
  Headset,
  History,
  Loader2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { DBC_HOME, useDbcAccess } from "../permissions/dbcAccess";
import { SUPPORT_EMAIL, usePlatformAccessRequest } from "./DbcLockedPage";

/**
 * "Main Dashboard" for a Digital Business Card account (userBase "DBC"): a tour of everything
 * ShivAI does, each module marked open / upgrade / locked. Opening a locked module shows its
 * lock screen (DbcGate), so people can look around before asking for platform access.
 */

const INCLUDED = [
  { path: DBC_HOME, icon: Contact, name: "Digital Business Card", text: "Create, share and track your cards." },
  { path: "/marketplace", icon: Sparkles, name: "Skills and Features", text: "Browse every app ShivAI offers." },
  { path: "/billing?view=apps&app=digital-card", icon: CreditCard, name: "Plan & Billing", text: "Your card plan, invoices and upgrades." },
];

const MODULES = [
  { path: "/agents", icon: Bot, name: "AI Employees", text: "AI agents that answer calls and chats for your business." },
  { path: "/training", icon: Brain, name: "Training", text: "Teach your agents from documents, websites and FAQs." },
  { path: "/call-setup", icon: Phone, name: "Call Setup", text: "Inbound numbers and outbound calling campaigns." },
  { path: "/command-center", icon: Headset, name: "Command Center", text: "One workspace for calls, leads and follow-ups." },
  { path: "/staff", icon: UsersRound, name: "Departments & Staff", text: "Bring your team in with the right access." },
  { path: "/workflows", icon: Workflow, name: "Workflows", text: "Automate what happens before and after a call." },
  { path: "/analytics", icon: History, name: "Analytics & Call History", text: "Every call, transcript and outcome in one place." },
  { path: "/monitoring", icon: BarChart3, name: "Monitoring & Reports", text: "Live performance and scheduled reports." },
  { path: "/sub-tenants", icon: Building2, name: "Sub Tenants", text: "Run separate workspaces for branches or clients." },
];

export default function DbcPlatformHome() {
  const { user } = useAuth();
  const { lockFor, ready } = useDbcAccess();
  const access = usePlatformAccessRequest("ShivAI Platform");
  const firstName = (user?.fullName ?? "").trim().split(/\s+/)[0];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-7 sm:px-9 sm:py-9 text-white">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">ShivAI Platform</p>
            <h1 className="mt-2 text-2xl sm:text-[32px] font-semibold tracking-tight leading-tight text-balance">
              {firstName ? `Welcome, ${firstName}. ` : ""}Here's everything ShivAI can do.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-white/70">
              Your account is set up for the Digital Business Card. Look around: locked modules open once ShivAI Platform access is on your
              account, and your cards stay exactly as they are.
            </p>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[300px]">
            {access.status === "pending" ? (
              <div className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3.5 ring-1 ring-white/15">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-400" />
                <p className="text-sm text-white/80">
                  <span className="block font-semibold text-white">Request sent</span>
                  We'll email {access.email || "you"} once access is on.
                </p>
              </div>
            ) : access.mailed ? (
              <div className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3.5 ring-1 ring-white/15">
                <Mail className="mt-0.5 h-5 w-5 flex-none text-white/70" />
                <p className="text-sm text-white/80">We opened an email to {SUPPORT_EMAIL}. Send it and we'll get back to you.</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void access.request()}
                  disabled={access.sending}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-[15px] font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.99] disabled:opacity-60"
                >
                  {access.sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Request ShivAI Platform access
                  {!access.sending && <ArrowRight className="h-4 w-4" />}
                </button>
                {access.status === "rejected" && <p className="mt-2 text-center text-xs text-amber-300">Your last request wasn't approved. You can ask again.</p>}
                {access.error && <p className="mt-2 text-center text-xs text-rose-300">{access.error}</p>}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Included */}
      <section>
        <SectionTitle title="Included with your account" />
        <div className="grid gap-3 sm:grid-cols-3">
          {INCLUDED.map(({ path, icon: Icon, name, text }) => (
            <Link
              key={name}
              to={path}
              className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-800/80 p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/30"
            >
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{name}</span>
                <span className="block truncate text-[13px] text-slate-500 dark:text-slate-400">{text}</span>
              </span>
              <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            </Link>
          ))}
        </div>
      </section>

      {/* Explore */}
      <section>
        <SectionTitle title="Explore ShivAI" hint="Open any module to see what it does." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map(({ path, icon: Icon, name, text }) => {
            const lock = lockFor(path);
            return (
              <Link
                key={path}
                to={path}
                className="group flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-800/80 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  {!ready && lock !== "platform" ? null : <LockBadge lock={lock} />}
                </div>
                <p className="mt-4 text-[15px] font-semibold text-slate-900 dark:text-white">{name}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                  {lock === "upgrade" ? "See plans" : lock ? "Learn more" : "Open"} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const SectionTitle = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
    {hint && <p className="text-[13px] text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);

function LockBadge({ lock }: { lock: "platform" | "upgrade" | null }) {
  if (lock === "upgrade") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#e2cd94] bg-[#fffaf0] dark:bg-[#2a2416] dark:border-[#a8822f]/50 px-2 py-0.5 text-[11px] font-semibold text-[#a8822f]">
        <Crown className="h-3 w-3" /> Signature
      </span>
    );
  }
  if (lock === "platform") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
        <Lock className="h-3 w-3" /> Locked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" /> Included
    </span>
  );
}
