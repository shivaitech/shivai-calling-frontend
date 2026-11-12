import { useEffect, useState } from "react";
import { ArrowRight, BadgePercent, CheckCircle2, Crown, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import PlanCardPreview from "../ClientDashboard/apps/DigitalCard/PlanCardPreview";
import { cardBillingAPI, type PlansData } from "../services/billingAPI";
import { FOUNDING_OFFER_LABEL, isFoundingFree } from "./foundingOffer";

/**
 * Digital card plans for the marketing page. The copy lives here; prices come live from the public
 * GET /billing/plans (usePlans), with the figures below as the fallback. Savings are computed, not rounded up.
 */

export type PlanId = "essential" | "signature" | "prestige";

export { FOUNDING_OFFER_ENDS, FOUNDING_OFFER_LABEL, foundingOfferActive, isFoundingFree } from "./foundingOffer";
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
  /** Currency of the prices (live prices say which; the built-in ones are USD). */
  currency?: string;
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
      { text: "Downloadable, high resolution QR image" },
      { text: "QR card designed for your phone wallpaper" },
      { text: "Direct Call, WhatsApp and Email buttons" },
      { text: "All your professional and social links in one place" },
      { text: "One tap contact saving for visitors" },
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
    monthly: 24.99,
    monthlyWas: 24.99,
    yearly: 179.93,
    yearlyPerMonth: 14.99,
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
    monthly: 49.99,
    monthlyWas: 49.99,
    yearly: 359.93,
    yearlyPerMonth: 29.99,
    listTitle: "Everything in Signature, plus",
    features: [
      { text: "AI Business Manager and AI Personal Manager" },
      { text: "Up to 1,000 AI calls per month across your plan", note: 1 },
      { text: "Gold framed profile photo and premium visual styling" },
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
  1: "Each conversation a visitor has with your AI Manager counts as one call.",
  2: "Rankings and recognition are based on published, transparent criteria.",
  3: "Quarterly rewards are opportunities for eligible annual members, not guaranteed prizes. Terms apply.",
};

const GOLD = "#a8822f";
export const money = (n: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(n);
const yearlySaving = (p: Plan) => p.monthlyWas * 12 - p.yearly;
const percentOff = (p: Plan) => (p.monthlyWas > 0 ? Math.round((1 - p.yearly / (p.monthlyWas * 12)) * 100) : 0);
/** The biggest annual discount across the plans ("−40%" on the Annual toggle). */
export const maxPercentOff = (plans: Plan[]) => Math.max(...plans.map(percentOff));

// One request per page load, shared by every component that shows prices.
let livePlans: Promise<PlansData | null> | null = null;
const fetchLivePlans = () => (livePlans ??= cardBillingAPI.publicPlans().catch(() => null));

/** The plans with the live prices from the server; a plan the server doesn't price keeps the built-in figures. */
const withLivePrices = (data: PlansData | null): Plan[] =>
  PLANS.map((p) => {
    const live = data?.plans?.find((l) => l.key === p.id);
    const m = live?.prices.month;
    const y = live?.prices.year;
    if (!live || !m || !y) return p;
    const monthly = m.amount / 100;
    return {
      ...p,
      currency: live.currency || data!.currency || "usd",
      monthly,
      monthlyWas: monthly,
      yearly: y.amount / 100,
      yearlyPerMonth: y.monthly_equivalent / 100,
    };
  });

/** PLANS with live prices once GET /billing/plans answers (public, no sign-in needed). */
export function usePlans(): Plan[] {
  const [plans, setPlans] = useState<Plan[]>(PLANS);
  useEffect(() => {
    let on = true;
    void fetchLivePlans().then((d) => on && d && setPlans(withLivePrices(d)));
    return () => {
      on = false;
    };
  }, []);
  return plans;
}

/** The Prestige mark: the same gold crown the Prestige card shows in its PRESTIGE title. */
function PrestigeEmblem({ size = 28 }: { size?: number }) {
  return <Crown size={size} strokeWidth={1.7} aria-hidden="true" className="flex-none" style={{ color: GOLD, fill: "rgba(231,182,74,.22)" }} />;
}

function PlanCard({
  plan,
  billing,
  onBilling,
  onChoose,
}: {
  plan: Plan;
  billing: Billing;
  onBilling: (b: Billing) => void;
  onChoose: (id: PlanId, billing: Billing) => void;
}) {
  const gold = !!plan.premium;
  const popular = plan.id === "signature";
  const founding = isFoundingFree(plan.id);
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
      {founding && (
        <span className="absolute -top-3 left-6 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
          <Sparkles className="h-3 w-3" /> Founding Member offer · until 31 Dec 2026
        </span>
      )}
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
        {founding ? (
          <>
            <p className="text-[34px] leading-none font-extrabold uppercase tracking-tight text-slate-900">Free for life</p>
            <p className="mt-2.5 text-[17px] text-slate-500">
              {/* Larger, with a thin line, so the struck-through 99 still reads as 99. */}
              <s className="tabular-nums decoration-1 decoration-slate-400">Regularly {money(plan.monthlyWas, plan.currency)}/month</s>
            </p>
            <p className="mt-2 text-[13px] font-medium leading-snug text-slate-600">
              Create your card by {FOUNDING_OFFER_LABEL} and keep Essential free for life.
            </p>
          </>
        ) : annual ? (
          <>
            <p className="flex items-center gap-2 text-sm">
              <s className="tabular-nums text-[15px] text-slate-400 decoration-1">{money(plan.monthlyWas, plan.currency)}/mo</s>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">−{percentOff(plan)}%</span>
            </p>
            <p className="mt-0.5 flex items-baseline gap-1">
              <span className="text-[40px] leading-none font-bold tracking-tight tabular-nums text-slate-900">{money(plan.yearlyPerMonth, plan.currency)}</span>
              <span className="text-sm text-slate-500">/month</span>
            </p>
            <p className="mt-1.5 text-xs text-slate-500">{money(plan.yearly, plan.currency)} billed yearly</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <BadgePercent className="h-3.5 w-3.5" /> You save {money(saving, plan.currency)} a year
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-400">Monthly price</p>
            <p className="mt-0.5 flex items-baseline gap-1">
              <span className="text-[40px] leading-none font-bold tracking-tight tabular-nums text-slate-900">{money(plan.monthly, plan.currency)}</span>
              <span className="text-sm text-slate-500">/month</span>
            </p>
            <p className="mt-1.5 text-xs text-slate-500">Billed monthly · cancel anytime</p>
            <button
              type="button"
              onClick={() => onBilling("annual")}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Annual: {money(plan.yearlyPerMonth, plan.currency)}/mo · save {money(saving, plan.currency)}/yr
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
        {founding ? "Create my free card" : plan.cta}
      </button>
      <p className="mt-2.5 text-center text-xs text-slate-500">
        {founding ? `Founding Member offer. Available until ${FOUNDING_OFFER_LABEL}.` : `${annual ? "Annual" : "Monthly"} billing selected.`}
      </p>
      {founding && (
        <p className="mt-1 text-center text-[11px] leading-snug text-slate-400">
          Free for life covers the Essential plan only. It doesn't include future paid upgrades or extras.
        </p>
      )}

      <div className="my-5 h-px bg-slate-200/80" />

      <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-slate-700">
        <InfinityIcon className="h-4 w-4 flex-none text-slate-500" />
        <span>
          <strong className="font-semibold">Unlimited sharing.</strong> No monthly sharing limits.
        </span>
      </p>

      <p className="mt-5 text-sm font-semibold text-slate-900">{plan.listTitle}</p>
      <ul className="mt-3 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f.text} className="flex gap-2.5 text-[14px] leading-snug text-slate-700">
            <CheckCircle2 className="mt-px h-[18px] w-[18px] flex-none" style={{ color: gold ? GOLD : "#334155" }} />
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
  onChoose,
  sectionY = "py-12 sm:py-[72px]",
}: {
  /** The page's shared section padding. */
  sectionY?: string;
  /** Accepted for existing callers; the plan cards read the same either way. */
  signedIn?: boolean;
  onChoose: (plan: PlanId, billing: Billing) => void;
}) {
  const [billing, setBilling] = useState<Billing>("annual");
  const plans = usePlans();
  const maxPercent = maxPercentOff(plans);
  const biggestSaver = plans.reduce((a, b) => (yearlySaving(b) > yearlySaving(a) ? b : a));

  return (
    <section id="pricing" className="scroll-mt-16 sm:scroll-mt-20 bg-[#F0F0F0] text-slate-900">
      <div className={`max-w-6xl mx-auto px-5 sm:px-8 ${sectionY}`}>
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pricing</p>
          <h2 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight text-balance">Your professional presence. Your&nbsp;way.</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Start with your digital business card. Unlock more with AI, multiple cards and exclusive benefits as you grow.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-800">
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
                      −{maxPercent}%
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
            className="group mx-auto mt-5 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left transition hover:border-slate-400"
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-slate-900 text-white">
              <BadgePercent className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <strong className="font-semibold text-slate-900">Switch to annual and save up to {money(yearlySaving(biggestSaver), biggestSaver.currency)} a year.</strong>
              <span className="block text-slate-600">
                Same plans, <span className="font-semibold text-emerald-700">{maxPercent}% less</span> than paying monthly.
              </span>
            </span>
            <ArrowRight className="hidden sm:block h-4 w-4 flex-none text-slate-500 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-3 items-stretch">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} billing={billing} onBilling={setBilling} onChoose={onChoose} />
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
