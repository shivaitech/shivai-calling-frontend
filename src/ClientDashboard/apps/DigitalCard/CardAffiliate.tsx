import { useEffect, useState } from "react";
import { Check, Coins, Copy, Eye, Gift, Hourglass, Share2, ShieldCheck, Trophy, UserPlus, Users } from "lucide-react";
import { businessCardAPI, cardUrl } from "../../../services/businessCardAPI";
import { LoyaltyActivity, LoyaltyReward, LoyaltySummary, cardInsightsAPI } from "../../../services/cardInsightsAPI";
import { SampleBanner, StatTile, fmt } from "./insightsUi";

/** ShivAI Points — the member's referral & loyalty dashboard (program in pre-launch). */
export default function CardAffiliate({ go }: { go: (s: string, id?: string | null) => void }) {
  const [summary, setSummary] = useState<{ s: LoyaltySummary; live: boolean } | null>(null);
  const [activity, setActivity] = useState<LoyaltyActivity[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    Promise.all([cardInsightsAPI.loyaltySummary(), cardInsightsAPI.loyaltyActivity(), cardInsightsAPI.loyaltyRewards()])
      .then(([s, a, r]) => {
        if (!live) return;
        setSummary({ s: s.data, live: s.live });
        setActivity(a.data);
        setRewards(r.data);
      })
      .catch((e: Error) => live && setError(e.message));
    // Referrals come through the "Create your own digital card" button on your public card.
    businessCardAPI
      .list({ limit: 1, sortBy: "updatedAt", sortOrder: "desc" })
      .then(({ cards }) => live && setLink(cards[0] ? cardUrl(cards[0]) : ""))
      .catch(() => live && setLink(""));
    return () => {
      live = false;
    };
  }, []);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (error) {
    return (
      <section className="panel">
        <p className="err">{error}</p>
      </section>
    );
  }
  if (!summary) return <p className="muted">Loading…</p>;

  const { s, live } = summary;
  const f = s.funnel;
  const steps = [
    { label: "Card views", value: f.views },
    { label: "Tapped “Create your own”", value: f.referralClicks },
    { label: "Created a card", value: f.newCards },
    { label: "Subscribed", value: f.paidSubscriptions },
  ];

  return (
    <div className="stackv">
      <div className="head">
        <div>
          <h2 className="title">
            Affiliate <span className="ins-soon">ShivAI Points · {live ? "Live" : "Coming soon"}</span>
          </h2>
          <p className="muted">Your network is building your rewards.</p>
        </div>
      </div>

      {!live && <SampleBanner>The ShivAI Points program launches soon. This is how your rewards dashboard will look.</SampleBanner>}

      {/* Points */}
      <section className="ins-points">
        <div className="ins-points-main">
          <span className="ins-points-label">
            <Coins size={16} /> Available to redeem
          </span>
          <strong>{fmt(s.points.available)}</strong>
          <span className="ins-points-sub">points</span>
        </div>
        <div className="ins-points-side">
          <div>
            <span>
              <Hourglass size={13} /> Pending verification
            </span>
            <strong>{fmt(s.points.pending)}</strong>
          </div>
          <div>
            <span>
              <Trophy size={13} /> Lifetime earned
            </span>
            <strong>{fmt(s.points.lifetime)}</strong>
          </div>
          <div>
            <span>
              <Gift size={13} /> Redeemed
            </span>
            <strong>{fmt(s.points.redeemed)}</strong>
          </div>
        </div>
      </section>

      <div className="ins-tiles four">
        <StatTile label="Card views" value={s.totals.views} Icon={Eye} />
        <StatTile label="Shares" value={s.totals.shares} Icon={Share2} />
        <StatTile label="Cards created via you" value={s.totals.cardsCreated} Icon={UserPlus} />
        <StatTile label="Paid referrals" value={s.totals.paidReferrals} Icon={Users} />
      </div>

      <div className="ins-two">
        {/* Funnel */}
        <section className="panel">
          <h3>Your referral funnel</h3>
          <ol className="ins-funnel">
            {steps.map((st, i) => {
              const pct = steps[0].value ? (st.value / steps[0].value) * 100 : 0;
              const conv = i > 0 && steps[i - 1].value ? Math.round((st.value / steps[i - 1].value) * 1000) / 10 : null;
              return (
                <li key={st.label}>
                  <div className="ins-funnel-row">
                    <span>{st.label}</span>
                    <strong>{fmt(st.value)}</strong>
                  </div>
                  <span className="ins-funnel-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(pct, 1.5)}%` }} />
                  </span>
                  {conv !== null && <small className="muted">{conv}% of the step before</small>}
                </li>
              );
            })}
          </ol>
        </section>

        {/* Referral link */}
        <section className="panel">
          <h3>Your referral link</h3>
          <p className="muted text-sm">
            Every view of your card can become a referral: the <strong>“Create your own digital card”</strong> button at the bottom of your card
            credits you when someone subscribes.
          </p>
          {link === null ? (
            <p className="muted">Loading…</p>
          ) : link ? (
            <div className="ins-link">
              <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Your card link" />
              <button type="button" className="btn small" onClick={copy}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <button type="button" className="btn small" onClick={() => go("card", null)}>
              Create your card to start earning
            </button>
          )}
          <ul className="ins-howto">
            <li>
              <ShieldCheck size={15} /> Points are pending until the payment is verified, then become available.
            </li>
            <li>
              <ShieldCheck size={15} /> Annual plans earn double. Self-referrals don't count.
            </li>
            <li>
              <ShieldCheck size={15} /> Verify your email and mobile to earn and redeem.
            </li>
          </ul>
        </section>
      </div>

      {/* Activity */}
      <section className="panel">
        <h3>Activity</h3>
        {activity.length === 0 ? (
          <p className="muted">No activity yet — share your card to get started.</p>
        ) : (
          <ul className="ins-activity">
            {activity.map((a) => (
              <li key={a.id}>
                <span className="ins-activity-date">{new Date(a.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                <span className="ins-activity-what">{describe(a)}</span>
                <span className={`ins-status ${a.status}`}>{STATUS[a.status]}</span>
                <span className={`ins-activity-pts ${a.points < 0 ? "neg" : ""}`}>
                  {a.points > 0 ? "+" : ""}
                  {fmt(a.points)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rewards */}
      <section className="panel">
        <h3>Redeem your points</h3>
        <div className="ins-rewards">
          {rewards.map((r) => {
            const enough = s.points.available >= r.pointsCost;
            return (
              <div key={r.id} className="ins-reward">
                <strong>{r.title}</strong>
                <span className="muted text-sm">{r.description}</span>
                <span className="ins-reward-cost">
                  <Coins size={14} /> {fmt(r.pointsCost)} points
                </span>
                {/* Redemption needs the backend (POST /me/loyalty/redemptions) — disabled until launch. */}
                <button type="button" className="btn small ghost" disabled title={!live ? "Opens when the program launches" : undefined}>
                  {!live || !r.available ? "Opens at launch" : enough ? "Redeem" : `${fmt(r.pointsCost - s.points.available)} more points`}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const STATUS: Record<LoyaltyActivity["status"], string> = {
  pending: "Pending verification",
  available: "Available",
  redeemed: "Redeemed",
  reversed: "Reversed",
};

function describe(a: LoyaltyActivity): string {
  const plan = a.plan ? `${a.plan}${a.billing ? ` · ${a.billing}` : ""}` : "";
  switch (a.kind) {
    case "referral_paid":
      return `A referral subscribed${plan ? ` (${plan})` : ""}`;
    case "referral_signup":
      return "Someone created a card through your link";
    case "views_bonus":
      return "Card views bonus";
    case "shares_bonus":
      return "Sharing bonus";
    case "redeemed":
      return "Reward redeemed";
    case "reversed":
      return "Points reversed (refund or review)";
  }
}
