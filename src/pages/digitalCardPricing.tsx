import { useState } from "react";
import { ArrowRight, BadgePercent, CheckCircle2, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import PlanCardPreview from "../ClientDashboard/apps/DigitalCard/PlanCardPreview";

/** Digital card plans for the marketing page. Prices are the business's figures; savings are computed, not rounded up. */

export type PlanId = "essential" | "signature" | "prestige";
export type Billing = "annual" | "monthly";

export interface Plan {
  id: PlanId;
  eyebrow: string;
  name: string;
  pitch: string;
  /** One line that says what this tier adds — makes the upgrade path readable at a glance. */
  adds: string;
  /** Price when billed monthly. */
  monthly: number;
  /** Regular (undiscounted) monthly price. */
  monthlyWas: number;
  /** Price billed once a year, and what that works out to per month (the business's figures). */
  yearly: number;
  yearlyPerMonth: number;
  listTitle: string;
  features: { text: string; note?: number }[];
  cta: string;
  footnote: string;
  premium?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "essential",
    eyebrow: "Your professional identity",
    name: "Essential",
    pitch: "A better way to introduce yourself. One beautiful digital card, ready to share anywhere.",
    adds: "Create and share your professional card",
    monthly: 9.99,
    monthlyWas: 9.99,
    yearly: 71.93,
    yearlyPerMonth: 5.99,
    listTitle: "Everything you need to make your mark",
    features: [
      { text: "Your personal digital business card and short link" },
      { text: "Custom designer QR card with colours, backgrounds and labels" },
      { text: "Downloadable, high-resolution QR image" },
      { text: "QR card designed for your phone wallpaper" },
      { text: "Direct Call, WhatsApp and Email buttons" },
      { text: "All your professional and social links in one place" },
      { text: "One-tap contact saving for visitors" },
      { text: "Your QR code continues to work when you update your card" },
    ],
    cta: "Create my card",
    footnote: "Your professional identity starts here.",
  },
  {
    id: "signature",
    eyebrow: "Your presence, elevated",
    name: "Signature",
    pitch: "More than a digital card. Your AI Business Manager helps turn interest into meaningful conversations.",
    adds: "+ AI Business Manager · Signature silver badge",
    monthly: 14.99,
    monthlyWas: 14.99,
    yearly: 107.92,
    yearlyPerMonth: 8.99,
    listTitle: "Everything in Essential, plus",
    features: [
      { text: "Create up to 2 digital business cards" },
      { text: "Your AI Business Manager on your digital card" },
      { text: "Up to 200 AI calls per month", note: 1 },
      { text: "AI assistance for enquiries about your work and services" },
      { text: "Help with appointment bookings, where configured" },
      { text: "Enhanced profile personalisation" },
      { text: "Profile analytics: card opens and link clicks" },
      { text: "Signature silver membership badge" },
    ],
    cta: "Choose Signature",
    footnote: "For professionals ready to do more with every connection.",
  },
  {
    id: "prestige",
    eyebrow: "The premium experience",
    name: "Prestige",
    pitch: "A distinguished professional identity, two AI managers and exclusive privileges for those who expect more.",
    adds: "+ AI Personal Manager · gold identity · ShivAI badge · quarterly rewards",
    monthly: 44.99,
    monthlyWas: 44.99,
    yearly: 323.88,
    yearlyPerMonth: 26.99,
    listTitle: "Everything in Signature, plus",
    features: [
      { text: "AI Business Manager and AI Personal Manager" },
      { text: "Up to 1,000 AI calls per month across your plan", note: 1 },
      { text: "Gold-framed profile photo and premium visual styling" },
      { text: "Exclusive ShivAI Prestige membership badge" },
      { text: "Advanced profile analytics and engagement insights" },
      { text: "Eligibility for verified professional rankings and recognition", note: 2 },
      { text: "Exclusive quarterly reward opportunities for annual members", note: 3 },
      { text: "Priority access to future Prestige benefits" },
    ],
    cta: "Choose Prestige",
    footnote: "A more distinctive identity. A more capable AI team. More to look forward to.",
    premium: true,
  },
];

const NOTES: Record<number, string> = {
  1: "AI calls: each conversation a visitor has with one of your AI managers counts as one call. Allowances reset each calendar month.",
  2: "Rankings and recognition are based on published, transparent criteria.",
  3: "Quarterly rewards are opportunities for eligible annual members, not guaranteed prizes. Terms apply.",
};

const GOLD = "#a8822f";
const money = (n: number) => `$${n.toFixed(2)}`;
const yearlySaving = (p: Plan) => p.monthlyWas * 12 - p.yearly;
const percentOff = (p: Plan) => Math.round((1 - p.yearly / (p.monthlyWas * 12)) * 100);
const MAX_SAVING = Math.max(...PLANS.map(yearlySaving));
const MAX_PERCENT = Math.max(...PLANS.map(percentOff));

/** The custom ShivAI Prestige emblem: a gold medallion with a crown over an "S". */
function PrestigeEmblem({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="prestige-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9c977" />
          <stop offset="0.5" stopColor="#c9a24d" />
          <stop offset="1" stopColor="#8f6d25" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="none" stroke="url(#prestige-gold)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="url(#prestige-gold)" strokeWidth="0.75" opacity="0.6" />
      <path d="M10.5 12.5l2 1.8 3.5-3.8 3.5 3.8 2-1.8-1 4h-9z" fill="url(#prestige-gold)" />
      <text x="16" y="24.2" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="url(#prestige-gold)" fontFamily="Georgia, serif">
        S
      </text>
    </svg>
  );
}

function PlanCard({
  plan,
  billing,
  onBilling,
  signedIn,
  onChoose,
}: {
  plan: Plan;
  billing: Billing;
  onBilling: (b: Billing) => void;
  signedIn: boolean;
  onChoose: (id: PlanId, billing: Billing) => void;
}) {
  const gold = !!plan.premium;
  const popular = plan.id === "signature";
  const annual = billing === "annual";
  const saving = yearlySaving(plan);

  return (
    <article
      className={`relative flex flex-col rounded-[28px] border p-5 sm:p-6 transition-shadow ${
        popular
          ? "border-slate-900 bg-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]"
          : gold
            ? "border-[#e2cd94] bg-gradient-to-b from-[#fffaf0] to-white shadow-[0_24px_60px_-34px_rgba(168,130,47,0.45)]"
            : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-6 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
          <Sparkles className="h-3 w-3" /> Most popular
        </span>
      )}

      {/* What this plan's card looks like — tap for the full preview. */}
      <PlanCardPreview tier={plan.id} height={188} />

      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: gold ? GOLD : "#94a3b8" }}>
            {plan.eyebrow}
          </p>
          <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900" style={gold ? { color: GOLD } : undefined}>
            {plan.name}
          </h3>
        </div>
        {gold && <PrestigeEmblem size={34} />}
      </div>
      <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{plan.pitch}</p>

      {/* Price — fixed height so the three cards line up on either billing */}
      <div className="mt-5 min-h-[124px]" aria-live="polite">
        {annual ? (
          <>
            <p className="flex items-center gap-2 text-sm">
              <s className="tabular-nums text-slate-400">{money(plan.monthlyWas)}/mo</s>
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-600">−{percentOff(plan)}%</span>
            </p>
            <p className="mt-0.5 flex items-baseline gap-1">
              <span className="text-[40px] leading-none font-bold tracking-tight tabular-nums text-slate-900">{money(plan.yearlyPerMonth)}</span>
              <span className="text-sm text-slate-500">/month</span>
            </p>
            <p className="mt-1.5 text-xs text-slate-500">{money(plan.yearly)} billed yearly</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <BadgePercent className="h-3.5 w-3.5" /> You save {money(saving)} a year
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-400">Monthly price</p>
            <p className="mt-0.5 flex items-baseline gap-1">
              <span className="text-[40px] leading-none font-bold tracking-tight tabular-nums text-slate-900">{money(plan.monthly)}</span>
              <span className="text-sm text-slate-500">/month</span>
            </p>
            <p className="mt-1.5 text-xs text-slate-500">Billed monthly · cancel anytime</p>
            <button
              type="button"
              onClick={() => onBilling("annual")}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-emerald-300 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Annual: {money(plan.yearlyPerMonth)}/mo · save {money(saving)}/yr
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChoose(plan.id, billing)}
        className={`mt-5 w-full rounded-2xl px-6 py-3.5 text-[15px] font-semibold transition active:scale-[0.99] ${
          popular ? "bg-slate-900 text-white hover:bg-slate-800" : gold ? "text-white hover:brightness-105" : "bg-slate-100 text-slate-900 hover:bg-slate-200"
        }`}
        style={gold ? { background: "linear-gradient(135deg,#c9a24d,#a8822f)" } : undefined}
      >
        {plan.cta}
      </button>
      <p className="mt-2.5 text-center text-xs text-slate-500">
        {signedIn ? `${annual ? "Annual" : "Monthly"} billing selected.` : "No account needed to start. You'll sign up when you save your card."}
      </p>

      <div className="my-5 h-px bg-slate-200/80" />

      <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-slate-700">
        <InfinityIcon className="h-4 w-4 flex-none text-emerald-600" />
        <span>
          <strong className="font-semibold">Unlimited sharing.</strong> No monthly sharing limits.
        </span>
      </p>

      <p className="mt-5 text-sm font-semibold text-slate-900">{plan.listTitle}</p>
      <ul className="mt-3 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f.text} className="flex gap-2.5 text-[14px] leading-snug text-slate-700">
            <CheckCircle2 className="mt-px h-[18px] w-[18px] flex-none" style={{ color: gold ? GOLD : "#10b981" }} />
            <span>
              {f.text}
              {f.note && <sup className="ml-0.5 text-slate-400">{f.note}</sup>}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-center text-[13px] italic text-slate-500">{plan.footnote}</p>
    </article>
  );
}

export default function DigitalCardPricing({
  signedIn,
  onChoose,
}: {
  signedIn: boolean;
  onChoose: (plan: PlanId, billing: Billing) => void;
}) {
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <section id="pricing" className="scroll-mt-16 sm:scroll-mt-20 bg-[#F0F0F0] text-slate-900">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-[72px]">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pricing</p>
          <h2 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight text-balance">Your professional presence. Your&nbsp;way.</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Start with your digital business card. Unlock more with AI, multiple cards and exclusive benefits as you grow.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              <InfinityIcon size={16} aria-hidden="true" />
              Unlimited sharing on every plan.
            </p>
            <p className="text-sm text-slate-600">A card that works for you and earns for you.</p>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="mt-8 flex justify-center">
          <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {(["annual", "monthly"] as Billing[]).map((b) => {
              const on = billing === b;
              return (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setBilling(b)}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                    on ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {b === "annual" ? "Annual" : "Monthly"}
                  {b === "annual" && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ${on ? "bg-emerald-400 text-slate-900" : "bg-emerald-100 text-emerald-700"}`}>
                      −{MAX_PERCENT}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* On monthly, show what annual would save */}
        {billing === "monthly" && (
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className="group mx-auto mt-5 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 text-left transition hover:border-emerald-300"
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-emerald-500 text-white">
              <BadgePercent className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <strong className="font-semibold text-emerald-800">Switch to annual and save up to {money(MAX_SAVING)} a year.</strong>
              <span className="block text-emerald-700/80">Same plans, {MAX_PERCENT}% less than paying monthly.</span>
            </span>
            <ArrowRight className="hidden sm:block h-4 w-4 flex-none text-emerald-700 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-3 items-stretch">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} billing={billing} onBilling={setBilling} signedIn={signedIn} onChoose={onChoose} />
          ))}
        </div>

        <ol className="mt-10 max-w-3xl mx-auto space-y-1.5 text-xs leading-relaxed text-slate-500">
          {Object.entries(NOTES).map(([n, text]) => (
            <li key={n}>
              <sup>{n}</sup> {text}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
