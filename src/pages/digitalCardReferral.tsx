import { ArrowUpCircle, Bot, Clock, Coins, CreditCard, Eye, Send, Share2, ShieldCheck, UserPlus } from "lucide-react";

/**
 * ShivAI Points — the referral/loyalty program, explained for members on the marketing page.
 * Not live yet: the values are the program brief's proposed launch configuration (v1.0, 28 Oct 2026),
 * which says they're not final commercial commitments — so the copy says so too.
 */

const STEPS = [
  {
    Icon: Send,
    title: "Share your card",
    text: "Send your link or QR code the way you already do — WhatsApp, email, in person.",
  },
  {
    Icon: UserPlus,
    title: "They make their own",
    text: "Every card has a “Create your own digital card” button at the bottom. Your link remembers it was you.",
  },
  {
    Icon: Coins,
    title: "You earn points",
    text: "When they subscribe, points land in your account — ready to use once the payment is verified.",
  },
];

/** Points for one referred subscription, by plan: [monthly, annual]. */
const REFERRAL_POINTS: { plan: string; monthly: number; annual: number; premium?: boolean }[] = [
  { plan: "Essential", monthly: 100, annual: 200 },
  { plan: "Signature", monthly: 200, annual: 400 },
  { plan: "Prestige", monthly: 500, annual: 1000, premium: true },
];

const UNLOCKS = [
  { Icon: CreditCard, title: "Money off your bill", text: "Use points towards your next subscription payment.", soon: false },
  { Icon: ArrowUpCircle, title: "Try a higher plan", text: "Unlock a time-limited upgrade to Signature or Prestige.", soon: false },
  { Icon: Bot, title: "More AI calls", text: "Top up AI calls on Signature and Prestige.", soon: true },
];

const FINE_PRINT = [
  "Points show as Pending until the referred payment is verified (usually 14–30 days), then become Available.",
  "Refunds or chargebacks reverse the points that came from them.",
  "No points for referring yourself or for duplicate accounts. Email and mobile verification are required to earn.",
  "Points aren't cash and can't be transferred or sold.",
  "Point values shown are our proposed launch rates and may change. Full program terms are published before launch.",
];

const pts = (n: number) => n.toLocaleString("en-US");

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
          <h2 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight">Share your card. Earn rewards.</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Every card you share can bring someone new to ShivAI. When they subscribe, you earn points to spend on your own plan.
          </p>
        </div>

        {/* How it works */}
        <ol className="mt-10 sm:mt-14 grid gap-4 sm:gap-6 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="relative rounded-3xl bg-white border border-slate-200 p-6">
              <span className="absolute top-5 right-6 text-5xl font-semibold text-slate-100 select-none" aria-hidden="true">
                {i + 1}
              </span>
              <span className="relative inline-flex w-11 h-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Icon className="w-5 h-5" />
              </span>
              <h3 className="relative mt-4 text-lg font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          {/* What you earn */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7">
            <h3 className="text-xl font-semibold tracking-tight">What you earn</h3>
            <p className="mt-1 text-sm text-slate-500">For each person who subscribes through your card. Annual plans earn double.</p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">They choose</th>
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

            <p className="mt-5 text-sm font-semibold">Small extras along the way</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <Eye className="w-4 h-4 mt-0.5 flex-none text-slate-400" />
                <span>
                  <strong className="font-semibold text-slate-900">1 point</strong> for each new person who views your card — up to 20 a day.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Share2 className="w-4 h-4 mt-0.5 flex-none text-slate-400" />
                <span>
                  <strong className="font-semibold text-slate-900">2 points</strong> each time you share your card — up to 20 shares a day. Sharing itself is
                  always unlimited.
                </span>
              </li>
            </ul>
          </div>

          {/* What points unlock */}
          <div className="rounded-3xl bg-slate-950 text-white p-6 sm:p-7">
            <h3 className="text-xl font-semibold tracking-tight">What points unlock</h3>
            <p className="mt-1 text-sm text-slate-400">Spend them on your own ShivAI membership.</p>
            <ul className="mt-5 space-y-4">
              {UNLOCKS.map(({ Icon, title, text, soon }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="w-10 h-10 flex-none grid place-items-center rounded-xl bg-white/10">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </span>
                  <span>
                    <span className="flex items-center gap-2 font-semibold">
                      {title}
                      {soon && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">Later</span>}
                    </span>
                    <span className="block text-sm text-slate-400">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-white/[0.06] p-4 text-sm text-slate-300">
              <Clock className="w-4 h-4 mt-0.5 flex-none text-slate-400" />
              Your dashboard will show your views, shares, referrals and points — Pending and Available — at a glance.
            </div>
          </div>
        </div>

        {/* Fine print, in plain words */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
          <h3 className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-5 h-5 text-slate-500" />
            Good to know
          </h3>
          <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm leading-relaxed text-slate-600">
            {FINE_PRINT.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-2 w-1.5 h-1.5 flex-none rounded-full bg-slate-300" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
