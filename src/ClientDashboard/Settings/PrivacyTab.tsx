import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  Cookie,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MessageSquareWarning,
  PenLine,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import ModalOverlay from "../../components/ModalOverlay";
import appToast from "../../components/AppToast";
import { useAuth } from "../../contexts/AuthContext";
import {
  CONSENT_EVENT,
  OPTIONAL_PURPOSES,
  consentLog,
  consentState,
  openCookieSettings,
  setConsent,
  type OptionalPurpose,
} from "../../legal/consent";
import { DATA_PROTECTION_BOARD, GRIEVANCE_OFFICER, LEGAL_PATHS, POLICY_VERSION } from "../../legal/company";
import { REQUEST_LABEL, SentByEmail, privacyAPI, type Nominee, type PrivacyRequest, type RequestType } from "../../services/privacyAPI";

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const STATUS: Record<PrivacyRequest["status"], { label: string; cls: string }> = {
  received: { label: "Received", cls: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
  in_progress: { label: "In progress", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  rejected: { label: "Declined", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
  sent_by_email: { label: "Sent by email", cls: "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300" },
};

type Dialog = null | { type: Exclude<RequestType, "nomination" | "opt_out"> } | { type: "nomination" };

/**
 * Settings → Privacy & data: the Data Principal's rights under the DPDP Act, in one place.
 * Consents switch off as easily as they switched on (s.6(4)); access, correction, erasure,
 * nomination and complaints (s.11–14) each take one click; every request is tracked with its due date.
 */
export default function PrivacyTab({ onEditProfile }: { onEditProfile: () => void }) {
  const { user } = useAuth();
  const account = { name: user?.fullName, email: user?.email };
  const [state, setState] = useState(consentState());
  const [log, setLog] = useState(consentLog());
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [nominee, setNominee] = useState<Nominee | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    const sync = () => {
      setState(consentState());
      setLog(consentLog());
    };
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  const loadRequests = useCallback(async () => {
    setLoadingReqs(true);
    try {
      setRequests(await privacyAPI.list());
    } catch (e) {
      appToast.error((e as Error).message);
    } finally {
      setLoadingReqs(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
    privacyAPI.getNominee().then(setNominee).catch(() => undefined);
  }, [loadRequests]);

  const toggle = (p: OptionalPurpose) => {
    const next = !state[p];
    setConsent({ [p]: next }, "privacy-center", p === "analytics" ? { decided: true } : {});
    appToast.success(next ? "Consent given. You can withdraw it here any time." : "Consent withdrawn.");
  };

  const lastChange = (p: string) => [...log].reverse().find((e) => e.purpose === p);
  const accepted = lastChange("privacy") ?? lastChange("terms");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Privacy &amp; data</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Your rights under India's Digital Personal Data Protection Act, 2023. See what you've agreed to, change it, and ask for a copy,
            a correction or erasure of your data.
          </p>
        </div>
        <Link
          to={LEGAL_PATHS.privacy}
          target="_blank"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <FileText className="h-4 w-4" /> Privacy Notice <ExternalLink className="h-3.5 w-3.5 opacity-60" />
        </Link>
      </div>

      {/* Consents */}
      <section>
        <SectionTitle title="Your choices" hint="Switch any of these off as easily as you switched them on." />
        <div className="space-y-3">
          {OPTIONAL_PURPOSES.map((p) => {
            const on = state[p.id] === true;
            const last = lastChange(p.id);
            return (
              <div key={p.id} className="flex items-start justify-between gap-4 rounded-xl p-4 common-bg-icons">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-white">{p.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{p.body}</p>
                  {last && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      {last.granted ? "Given" : "Withdrawn"} on {fmt(last.at)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={p.title}
                  onClick={() => toggle(p.id)}
                  className={`relative mt-1 h-6 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
            );
          })}
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 p-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-white">Terms and Privacy Notice</span> ·{" "}
              {accepted ? `accepted on ${fmt(accepted.at)} (version ${accepted.version})` : `current version ${POLICY_VERSION}`}. Needed to run your
              account; to withdraw, close your account below.
            </div>
            <button type="button" onClick={openCookieSettings} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
              <Cookie className="h-4 w-4" /> Cookie settings
            </button>
          </div>
        </div>
      </section>

      {/* Rights */}
      <section>
        <SectionTitle title="Your rights" hint={`We reply within ${GRIEVANCE_OFFICER.resolveDays} days, and may ask you to confirm it's you.`} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <RightCard icon={<Download className="h-5 w-5" />} title="Get a copy of my data" body="A summary of what we hold about you, how we use it, and who we've shared it with." action="Request a copy" onClick={() => setDialog({ type: "access" })} />
          <RightCard icon={<PenLine className="h-5 w-5" />} title="Correct my data" body="Fix your name or email in Profile now, or ask us to correct anything else." action="Ask for a correction" onClick={() => setDialog({ type: "correction" })} secondary={{ label: "Edit profile", onClick: onEditProfile }} />
          <RightCard
            icon={<UserPlus className="h-5 w-5" />}
            title="Nominate someone"
            body={nominee ? `${nominee.name} (${nominee.relationship}) can act for you if you die or can't act yourself.` : "Choose someone to use your data rights if you die or can't act yourself."}
            action={nominee ? "Change nominee" : "Add a nominee"}
            onClick={() => setDialog({ type: "nomination" })}
          />
          <RightCard icon={<MessageSquareWarning className="h-5 w-5" />} title="Raise a complaint" body={`Goes to our Grievance Officer. Still unhappy after? You can go to the ${DATA_PROTECTION_BOARD.name}.`} action="Raise a complaint" onClick={() => setDialog({ type: "grievance" })} />
          <RightCard danger icon={<Trash2 className="h-5 w-5" />} title="Erase my data and close my account" body="We delete your account and personal data, except what the law makes us keep (such as invoices)." action="Request erasure" onClick={() => setDialog({ type: "erasure" })} />
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Grievance Officer</p>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-white">{GRIEVANCE_OFFICER.name}</p>
              <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400">
                <Mail className="h-3.5 w-3.5" /> {GRIEVANCE_OFFICER.email}
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Acknowledged in {GRIEVANCE_OFFICER.ackHours}h · resolved within {GRIEVANCE_OFFICER.resolveDays} days
            </p>
          </div>
        </div>
      </section>

      {/* Requests */}
      <section>
        <SectionTitle title="Your requests" hint="Every request you've made, with the date we'll answer by." />
        {loadingReqs ? (
          <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : requests.length === 0 ? (
          <p className="rounded-xl p-4 text-sm text-slate-500 common-bg-icons">No requests yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {requests.map((r) => (
              <div key={r.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">
                    {REQUEST_LABEL[r.type]} <span className="ml-1 font-mono text-xs text-slate-500">{r.reference}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">{r.resolution || r.details}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                  <span>
                    {fmt(r.created_at)} · answer by {fmt(r.due_at)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS[r.status]?.cls ?? STATUS.received.cls}`}>{STATUS[r.status]?.label ?? r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Consent history */}
      <section>
        <button type="button" onClick={() => setShowLog((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <ChevronDown className={`h-4 w-4 transition-transform ${showLog ? "rotate-180" : ""}`} /> Consent history on this device ({log.length})
        </button>
        {showLog && (
          <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-slate-200 text-xs dark:border-slate-700">
            {log.length === 0 ? (
              <p className="p-3 text-slate-500">Nothing recorded yet.</p>
            ) : (
              [...log].reverse().map((e, i) => (
                <div key={`${e.at}-${e.purpose}-${i}`} className="flex justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-0 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300">
                    {e.granted ? "Gave" : "Withdrew"} <b>{e.purpose}</b> · {e.source}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {new Date(e.at).toLocaleString()} · v{e.version}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {dialog?.type === "nomination" ? (
        <NomineeDialog
          initial={nominee}
          account={account}
          onClose={() => setDialog(null)}
          onSaved={(n) => {
            setNominee(n);
            setDialog(null);
            void loadRequests();
          }}
        />
      ) : dialog ? (
        <RequestDialog
          type={dialog.type}
          account={account}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            void loadRequests();
          }}
        />
      ) : null}
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h4>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function RightCard({
  icon,
  title,
  body,
  action,
  onClick,
  danger,
  secondary,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action: string;
  onClick: () => void;
  danger?: boolean;
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className={`flex flex-col rounded-2xl border p-4 ${danger ? "border-rose-200 dark:border-rose-500/30" : "border-slate-200 dark:border-slate-700"}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${danger ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{icon}</span>
      <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-white">{title}</p>
      <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onClick}
          className={`rounded-xl px-3 py-2 text-sm font-medium ${danger ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"}`}
        >
          {action}
        </button>
        {secondary && (
          <button type="button" onClick={secondary.onClick} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            {secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}

const COPY: Record<"access" | "correction" | "erasure" | "grievance", { title: string; intro: string; placeholder: string; button: string }> = {
  access: {
    title: "Get a copy of your data",
    intro: "We'll send a summary of the personal data we hold about you, what we use it for, and who we've shared it with, to your account email.",
    placeholder: "Anything specific you want included? (optional)",
    button: "Send request",
  },
  correction: {
    title: "Ask for a correction",
    intro: "Tell us what's wrong or missing and what it should say. Your name and email can also be changed directly in Profile.",
    placeholder: "e.g. My company name on invoices should be …",
    button: "Send request",
  },
  erasure: {
    title: "Erase my data and close my account",
    intro:
      "We'll close your account and delete your personal data, cards, agents, contacts and recordings within 30 days. Invoices and records the law makes us keep are kept for the period it requires. This can't be undone.",
    placeholder: "Reason (optional). Helps us improve.",
    button: "Request erasure",
  },
  grievance: {
    title: "Raise a complaint",
    intro: `Our Grievance Officer will acknowledge it within ${GRIEVANCE_OFFICER.ackHours} hours and resolve it within ${GRIEVANCE_OFFICER.resolveDays} days.`,
    placeholder: "Tell us what happened",
    button: "Send complaint",
  },
};

function RequestDialog({
  type,
  account,
  onClose,
  onDone,
}: {
  type: "access" | "correction" | "erasure" | "grievance";
  account: { name?: string; email?: string };
  onClose: () => void;
  onDone: () => void;
}) {
  const c = COPY[type];
  const [details, setDetails] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const needsText = type === "correction" || type === "grievance";
  const erase = type === "erasure";
  const ready = (!needsText || details.trim().length > 2) && (!erase || confirm.trim().toUpperCase() === "DELETE");

  const send = async () => {
    setBusy(true);
    try {
      const r = await privacyAPI.create(type, details.trim() || REQUEST_LABEL[type], account);
      appToast.success(`Request ${r.reference} received. We'll reply by ${fmt(r.due_at)}.`);
      onDone();
    } catch (e) {
      if (e instanceof SentByEmail) {
        window.location.href = e.mailto;
        appToast.info(`We opened your email app with request ${e.request.reference} filled in. Press send to submit it.`, { duration: 8000 });
        onDone();
      } else appToast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalOverlay open onClose={onClose} closeOnBackdrop={!busy} panelClassName="max-w-lg">
      <div className="rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{c.title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        {erase && (
          <div className="mt-3 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Cancel any paid plan in Billing first so you aren't charged again.
          </div>
        )}
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{c.intro}</p>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          placeholder={c.placeholder}
          className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        {erase && (
          <label className="mt-3 block text-sm text-slate-700 dark:text-slate-300">
            Type <b>DELETE</b> to confirm
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            type="button"
            onClick={send}
            disabled={!ready || busy}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${erase ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900"}`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {c.button}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function NomineeDialog({
  initial,
  account,
  onClose,
  onSaved,
}: {
  initial: Nominee | null;
  account: { name?: string; email?: string };
  onClose: () => void;
  onSaved: (n: Nominee) => void;
}) {
  const [n, setN] = useState<Nominee>(initial ?? { name: "", relationship: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const valid = n.name.trim().length > 1 && n.relationship.trim().length > 1 && /^\S+@\S+\.\S+$/.test(n.email.trim());
  const set = (k: keyof Nominee) => (e: React.ChangeEvent<HTMLInputElement>) => setN((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    const clean = { name: n.name.trim(), relationship: n.relationship.trim(), email: n.email.trim(), phone: n.phone?.trim() || undefined };
    try {
      onSaved(await privacyAPI.saveNominee(clean, account));
      appToast.success("Nominee saved.");
    } catch (e) {
      if (e instanceof SentByEmail) {
        window.location.href = e.mailto;
        appToast.info("We opened your email app with your nomination filled in. Press send to register it.", { duration: 8000 });
        onSaved(clean);
      } else appToast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

  return (
    <ModalOverlay open onClose={onClose} closeOnBackdrop={!busy} panelClassName="max-w-lg">
      <div className="rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nominate someone</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Under the DPDP Act (s.14), this person can ask for your data, correct or erase it if you die or can't act yourself. Tell them you've named them.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Full name
            <input value={n.name} onChange={set("name")} className={field} />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Relationship
            <input value={n.relationship} onChange={set("relationship")} placeholder="e.g. Spouse, Business partner" className={field} />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Email
            <input type="email" value={n.email} onChange={set("email")} className={field} />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Phone (optional)
            <input type="tel" value={n.phone ?? ""} onChange={set("phone")} className={field} />
          </label>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!valid || busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save nominee
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
