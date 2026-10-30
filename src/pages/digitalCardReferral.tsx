import { ArrowUpCircle, Bot, Coins, CreditCard, Eye, LayoutDashboard, Send, Share2, ShieldCheck, UserPlus } from "lucide-react";

/**
 * ShivAI Points — the referral/loyalty program, explained for members on the marketing page.
 * Not live yet: the values are the proposed launch configuration and not final commercial
 * commitments, so the copy says so too. Views and shares only earn when they "qualify"
 * (unique, genuine visitors; duplicates, the owner's own visits and automated traffic excluded).
 */

const STEPS = [
  {
    Icon: Send,
    title: "Share your card",
    text: "Share your personal link or QR code through WhatsApp, email or in person.",
  },
  {
    Icon: UserPlus,
    title: "They join ShivAI",
    text: "When someone discovers your card and subscribes through your referral, you get rewarded.",
  },
  {
    Icon: Coins,
    title: "You earn points",
    text: "Points are credited to your account once their subscription payment is verified. Use your points towards your own ShivAI benefits.",
  },
];

/** Points for one referred subscription, by plan: [monthly, annual]. */
const REFERRAL_POINTS: { plan: string; monthly: number; annual: number; premium?: boolean }[] = [
  { plan: "Essential", monthly: 10, annual: 20 },
  { plan: "Signature", monthly: 20, annual: 40 },
  { plan: "Prestige", monthly: 40, annual: 80, premium: true },
];

const REWARDS = [
  { Icon: CreditCard, title: "Save on your subscription", text: "Use your points towards your next ShivAI membership payment.", soon: false },
  { Icon: ArrowUpCircle, title: "Move up to a higher plan", text: "Use your points to unlock a temporary upgrade to Signature or Prestige.", soon: false },
  { Icon: Bot, title: "Get more AI calls", text: "Use your points to add more AI calls to your Signature or Prestige plan.", soon: true },
];

/** The status words match the dashboard's labels: Pending, Available, Redeemed. */
const FINE_PRINT = [
  <>
    Points remain <strong className="font-semibold text-slate-900">Pending</strong> until the referred customer’s payment is verified (typically 14–30 days).
  </>,
  <>
    Verified points move to your <strong className="font-semibold text-slate-900">Available</strong> balance.
  </>,
  <>Only eligible views, shares and successful subscriptions earn points.</>,
  <>Points can be redeemed according to the programme’s terms.</>,
];

const pts = (n: number) => n.toLocaleString("en-US");
const num = (i: number) => String(i + 1).padStart(2, "0");

export default function DigitalCardReferral() {
  return (
    <section id="rewards" className="scroll-mt-16 sm:scroll-mt-20 bg-[#F5F5F2] text-slate-900">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-[68px]">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            ShivAI Points
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] tracking-normal normal-case text-white">Coming soon</span>
          </p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight">Share your card. Earn as you&nbsp;connect.</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Your ShivAI card does more than introduce you. It can bring new people into the ShivAI community and earn you points along the way.
          </p>
        </div>

        {/* How it works */}
        <ol className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="rounded-3xl bg-white border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tabular-nums tracking-wider text-slate-400" aria-hidden="true">
                  {num(i)}
                </span>
                <span className="inline-flex w-10 h-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          {/* What you earn */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7">
            <h3 className="text-xl font-semibold tracking-tight">Every connection can add up.</h3>
            <p className="mt-1 text-sm text-slate-500">
              Earn points when people subscribe through your card. Choose annual billing and earn double the points.
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">Their subscription</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Monthly</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Annual</th>
                  </tr>
                </thead>
                <tbody>
                  {REFERRAL_POINTS.map((r) => (
                    <tr key={r.plan} className="border-t border-slate-200">
                      <th scope="row" className="px-4 py-3 text-left font-semibold" style={r.premium ? { color: "#a8822f" } : undefined}>
                        {r.plan}
                      </th>
                      <td className="px-4 py-3 text-right tabular-nums">{pts(r.monthly)} pts</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{pts(r.annual)} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Small extras along the way */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7">
            <h3 className="text-xl font-semibold tracking-tight">More ways to earn.</h3>
            <p className="mt-1 text-sm text-slate-500">Small extras along the way.</p>
            <ul className="mt-5 space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 flex-none grid place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Eye className="w-4 h-4" />
                </span>
                <span className="pt-0.5">
                  <strong className="font-semibold text-slate-900">1 point</strong> for every new person who views your card — up to 20 qualifying views per
                  day.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 flex-none grid place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Share2 className="w-4 h-4" />
                </span>
                <span className="pt-0.5">
                  <strong className="font-semibold text-slate-900">2 points</strong> for each qualifying card share — up to 20 rewarded shares per day. Sharing
                  itself remains unlimited.
                </span>
              </li>
            </ul>
            <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
              We count genuine new visitors, not repeat refreshes or your own visits.
            </p>
          </div>
        </div>

        {/* What your points can do */}
        <div className="mt-6 rounded-3xl bg-slate-950 text-white p-6 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">What your points can do</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-300">Turn your points into more value from your ShivAI membership.</p>
              <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-white/[0.06] p-4 text-sm text-slate-300">
                <LayoutDashboard className="w-4 h-4 mt-0.5 flex-none text-slate-400" />
                Your dashboard keeps track of your card views, shares, referrals and points — all in one place.
              </p>
            </div>
            <ul className="grid gap-3">
              {REWARDS.map(({ Icon, title, text, soon }) => (
                <li key={title} className="flex gap-3.5 rounded-2xl border border-white/10 p-4">
                  <span className="w-10 h-10 flex-none grid place-items-center rounded-xl bg-white/10">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </span>
                  <span>
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      {title}
                      {soon && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">Coming soon</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-400">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-8 border-t border-white/10 pt-6 text-center text-lg sm:text-2xl font-semibold tracking-tight">
            Your ShivAI card introduces you. <span className="text-emerald-300">Your network rewards you.</span>
          </p>
        </div>

        {/* Fine print, in plain words */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
          <h3 className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-5 h-5 text-slate-500" />
            Good to know
          </h3>
          <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm leading-relaxed text-slate-600">
            {FINE_PRINT.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 w-1.5 h-1.5 flex-none rounded-full bg-slate-300" aria-hidden="true" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
