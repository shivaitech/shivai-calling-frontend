import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Eye, Link2, Linkedin, Mail, MessageCircle, Phone, QrCode, Share2, Sparkles, UserPlus, Users } from "lucide-react";
import { BusinessCard, businessCardAPI } from "../../../services/businessCardAPI";
import { CardAnalytics, Range, cardInsightsAPI } from "../../../services/cardInsightsAPI";
import { SampleBanner, RangePicker, StatTile, BarList, fmt } from "./insightsUi";

/** How a card is performing: views, scans, saves, button taps and where visitors came from. */
export default function CardMonitoring({ cardId, go }: { cardId: string | null; go: (s: string, id?: string | null) => void }) {
  const [cards, setCards] = useState<BusinessCard[] | null>(null);
  const [selected, setSelected] = useState<string | null>(cardId);
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<{ a: CardAnalytics; live: boolean } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    businessCardAPI
      .list({ limit: 50, sortBy: "updatedAt", sortOrder: "desc" })
      .then(({ cards }) => {
        setCards(cards);
        setSelected((s) => (s && cards.some((c) => c._id === s) ? s : cards[0]?._id ?? null));
      })
      .catch((e) => setError(e.message || "Couldn't load your cards"));
  }, []);

  useEffect(() => {
    if (!selected) return;
    let live = true;
    setData(null);
    setError("");
    cardInsightsAPI
      .analytics(selected, range)
      .then((r) => live && setData({ a: r.data, live: r.live }))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [selected, range]);

  if (cards && cards.length === 0) {
    return (
      <section className="panel empty">
        <h3>No cards to monitor yet</h3>
        <p className="muted">Create your digital card and its views, scans and saves will show up here.</p>
        <button className="btn small" onClick={() => go("card", null)}>
          Create a card
        </button>
      </section>
    );
  }

  return (
    <div className="stackv">
      <div className="head">
        <div>
          <h2 className="title">Monitoring</h2>
          <p className="muted">How people find and use your card.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cards && cards.length > 1 && (
            <select className="ins-select" value={selected ?? ""} onChange={(e) => setSelected(e.target.value)} aria-label="Card">
              {cards.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.full_name}
                  {c.company_name ? ` — ${c.company_name}` : ""}
                </option>
              ))}
            </select>
          )}
          <RangePicker value={range} onChange={setRange} />
        </div>
      </div>

      {data && !data.live && <SampleBanner>Card tracking isn't switched on yet — these are sample numbers to preview the dashboard.</SampleBanner>}
      {error && (
        <section className="panel">
          <p className="err">{error}</p>
        </section>
      )}
      {!data && !error && <p className="muted">Loading…</p>}
      {data && <Dashboard a={data.a} />}
    </div>
  );
}

function Dashboard({ a }: { a: CardAnalytics }) {
  const t = a.totals;
  const p = a.previous;
  const saveRate = t.views ? Math.round((t.contactSaves / t.views) * 1000) / 10 : 0;
  const peak = Math.max(1, ...a.series.map((s) => s.views));
  const labelEvery = Math.max(1, Math.ceil(a.series.length / 6));
  const weekly = a.series.length > 1 && new Date(a.series[1].date).getTime() - new Date(a.series[0].date).getTime() > 2 * 864e5;

  const actions = useMemo(
    () => [
      { label: "WhatsApp", value: a.actions.whatsapp, Icon: MessageCircle },
      { label: "Call", value: a.actions.call, Icon: Phone },
      { label: "Save Contact", value: a.actions.saveContact, Icon: UserPlus },
      { label: "Links", value: a.actions.links, Icon: Link2 },
      { label: "Ask My AI", value: a.actions.askMyAi, Icon: Sparkles },
      { label: "Email", value: a.actions.email, Icon: Mail },
      { label: "LinkedIn", value: a.actions.linkedin, Icon: Linkedin },
    ].sort((x, y) => y.value - x.value),
    [a],
  );
  const sources = [
    { label: "Direct link", value: a.sources.direct, Icon: Link2 },
    { label: "QR code", value: a.sources.qr, Icon: QrCode },
    { label: "WhatsApp", value: a.sources.whatsapp, Icon: MessageCircle },
    { label: "Social media", value: a.sources.social, Icon: Share2 },
    { label: "Other", value: a.sources.other, Icon: Eye },
  ].sort((x, y) => y.value - x.value);

  return (
    <>
      <div className="ins-tiles">
        <StatTile label="Card views" value={t.views} prev={p?.views} Icon={Eye} />
        <StatTile label="Unique visitors" value={t.uniqueVisitors} prev={p?.uniqueVisitors} Icon={Users} />
        <StatTile label="QR scans" value={t.qrScans} prev={p?.qrScans} Icon={QrCode} />
        <StatTile label="Contact saves" value={t.contactSaves} prev={p?.contactSaves} Icon={UserPlus} />
        <StatTile label="Shares" value={t.shares} prev={p?.shares} Icon={Share2} />
      </div>

      <section className="panel">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3>Views over time</h3>
          <span className="muted text-xs">{weekly ? "Per week" : "Per day"}</span>
        </div>
        <div className="ins-chart" role="img" aria-label={`Views ${weekly ? "per week" : "per day"}: peak ${fmt(peak)}`}>
          {a.series.map((s, i) => (
            <div key={s.date} className="ins-bar-col" title={`${new Date(s.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}: ${fmt(s.views)} views`}>
              <div className="ins-bar" style={{ height: `${Math.max((s.views / peak) * 100, 2)}%` }} />
              <span className="ins-bar-label">
                {i % labelEvery === 0 ? new Date(s.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="ins-two">
        <section className="panel">
          <h3>Button taps</h3>
          <p className="muted text-xs -mt-1">What visitors did on your card.</p>
          <BarList rows={actions} />
        </section>
        <section className="panel">
          <h3>Where views come from</h3>
          <p className="muted text-xs -mt-1">How people opened your card.</p>
          <BarList rows={sources} />
        </section>
      </div>

      <section className="panel ins-insight">
        <p>
          <strong>{saveRate}%</strong> of views ended with someone saving your contact.{" "}
          {a.sources.qr > a.sources.direct ? "Most people find you through your QR code — keep it on your phone's lock screen." : "Most people open your link directly — share it in your email signature and bio."}
        </p>
        {p && (
          <span className={`ins-chip ${t.views >= p.views ? "up" : "down"}`}>
            {t.views >= p.views ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {fmt(Math.abs(t.views - p.views))} views vs previous period
          </span>
        )}
      </section>
    </>
  );
}
