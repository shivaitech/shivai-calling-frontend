import { useState } from "react";
import { CheckCircle2, Infinity as InfinityIcon } from "lucide-react";

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

const GOLD = "#d9b25a";
const money = (n: number) => `$${n.toFixed(2)}`;

/** The custom ShivAI Prestige emblem: a gold medallion with a crown over an "S". */
function PrestigeEmblem({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="prestige-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d98b" />
          <stop offset="0.5" stopColor="#d9b25a" />
          <stop offset="1" stopColor="#a8822f" />
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
  signedIn,
  onChoose,
}: {
  plan: Plan;
  billing: Billing;
  signedIn: boolean;
  onChoose: (id: PlanId, billing: Billing) => void;
}) {
  const gold = plan.premium;
  const annual = billing === "annual";
  // Saving against the regular price, computed rather than rounded up.
  const annualSaving = Math.round((1 - plan.yearly / (plan.monthlyWas * 12)) * 100);
  const saving = annual ? annualSaving : Math.round((1 - plan.monthly / plan.monthlyWas) * 100);

  return (
    <article
      className={`flex flex-col rounded-[28px] border bg-[#0b0b0c] p-6 sm:p-7 text-white ${
        gold ? "border-[#d9b25a]/55 shadow-[0_24px_60px_-36px_rgba(217,178,90,0.45)]" : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: gold ? GOLD : "rgb(163 163 163)" }}>
            {plan.eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight" style={gold ? { color: "#f1dca3" } : undefined}>
            {plan.name}
          </h3>
        </div>
        {gold && <PrestigeEmblem size={36} />}
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-neutral-300">{plan.pitch}</p>
      <p
        className="mt-3 inline-flex self-start rounded-full px-3 py-1 text-xs font-medium"
        style={gold ? { color: GOLD, background: "rgba(217,178,90,0.1)" } : { color: "#d4d4d4", background: "rgba(255,255,255,0.07)" }}
      >
        {plan.adds}
      </p>

      {/* The per-month price for the selected billing, then how it's billed and the regular price. */}
      <div className="mt-6" aria-live="polite">
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight">{money(annual ? plan.yearlyPerMonth : plan.monthly)}</span>
          <span className="text-neutral-400">/month</span>
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-neutral-300">
          {annual ? `Billed annually at ${money(plan.yearly)}` : "Billed monthly"}
          {saving > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">Save {saving}%</span>
            </>
          )}
        </p>
        <p className="mt-1.5 text-sm text-neutral-500">
          {annual ? (
            <>
              Regular price <s>{money(plan.monthlyWas)}</s>/month
            </>
          ) : (
            `Save ${annualSaving}% with annual billing (${money(plan.yearlyPerMonth)}/month).`
          )}
        </p>
      </div>

      {/* Same wording and treatment on every plan. */}
      <div className="mt-5 rounded-2xl bg-white/[0.08] p-4">
        <p className="flex items-center gap-2 font-semibold">
          <InfinityIcon className="w-5 h-5" />
          Unlimited sharing. Always.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-300">Share your cards as often as you like, with no monthly sharing limits.</p>
      </div>

      <hr className="my-6 border-white/10" />

      <p className="font-semibold">{plan.listTitle}</p>
      <ul className="mt-4 space-y-3.5 flex-1">
        {plan.features.map((f) => (
          <li key={f.text} className="flex gap-3 text-[15px] leading-snug text-neutral-100">
            <CheckCircle2 className="w-5 h-5 flex-none mt-px" style={{ color: gold ? GOLD : "#34d399" }} />
            <span>
              {f.text}
              {f.note && <sup className="ml-0.5 text-neutral-500">{f.note}</sup>}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChoose(plan.id, billing)}
        className={`mt-8 w-full rounded-full px-6 py-3.5 text-[15px] font-semibold transition active:scale-[0.99] ${
          gold ? "bg-neutral-700 text-white hover:bg-neutral-600" : "bg-neutral-100 text-neutral-900 hover:bg-white"
        }`}
      >
        {plan.cta}
      </button>
      <p className="mt-3 text-center text-xs text-neutral-500">
        {signedIn ? `${annual ? "Annual" : "Monthly"} billing selected.` : "No account needed to start — you'll sign up when you save your card."}
      </p>
      <p className="mt-2 text-center text-sm text-neutral-400">{plan.footnote}</p>
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
  const tab = (b: Billing) =>
    `rounded-full px-4 sm:px-5 py-2 text-sm font-semibold transition ${billing === b ? "bg-white text-neutral-900" : "text-neutral-400 hover:text-white"}`;

  return (
    <section id="pricing" className="scroll-mt-16 sm:scroll-mt-20 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-[68px]">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Pricing</p>
          <h2 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight">Your professional presence. Your&nbsp;way.</h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            Start with your digital business card. Unlock more with AI, multiple cards and exclusive benefits as you grow.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">
              <InfinityIcon size={16} aria-hidden="true" />
              Unlimited sharing on every plan.
            </p>
            <p className="text-sm text-neutral-300">A card that works for you and earns for you.</p>
          </div>
        </div>

        <div role="radiogroup" aria-label="Billing" className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] p-1">
            <button type="button" role="radio" aria-checked={billing === "annual"} className={tab("annual")} onClick={() => setBilling("annual")}>
              Annual <span className={billing === "annual" ? "text-emerald-600" : "text-emerald-400"}>· save 40%</span>
            </button>
            <button type="button" role="radio" aria-checked={billing === "monthly"} className={tab("monthly")} onClick={() => setBilling("monthly")}>
              Monthly
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3 items-stretch">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} billing={billing} signedIn={signedIn} onChoose={onChoose} />
          ))}
        </div>

        <ol className="mt-10 max-w-3xl mx-auto space-y-1.5 text-xs leading-relaxed text-neutral-500">
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
