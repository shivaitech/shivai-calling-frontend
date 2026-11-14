import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Eye, Link2, Linkedin, Mail, MessageCircle, MousePointerClick, Percent, Phone, QrCode, Share2, Sparkles, Trophy, UserPlus, Users, X } from "lucide-react";
import { CardAnalytics, Range, cardInsightsAPI } from "../../../services/cardInsightsAPI";
import { BarList, RangePicker, SampleBanner, StatTile, fmt } from "./insightsUi";

export type StatsTab = "views" | "taps";

/** Button taps on a card, in the same order and wording as Monitoring. */
export function tapRows(a: CardAnalytics) {
  return [
    { label: "WhatsApp", value: a.actions.whatsapp, Icon: MessageCircle },
    { label: "Call", value: a.actions.call, Icon: Phone },
    { label: "Save Contact", value: a.actions.saveContact, Icon: UserPlus },
    { label: "Links", value: a.actions.links, Icon: Link2 },
    { label: "AI Manager", value: a.actions.askMyAi, Icon: Sparkles },
    { label: "Email", value: a.actions.email, Icon: Mail },
    { label: "LinkedIn", value: a.actions.linkedin, Icon: Linkedin },
  ].sort((x, y) => y.value - x.value);
}

export const totalTaps = (a: CardAnalytics) => Object.values(a.actions ?? {}).reduce((s, n) => s + (Number(n) || 0), 0);

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * Opens from a card's Views or Taps number in My cards: the full breakdown for that card,
 * for 7 days by default, with a link to the Monitoring page.
 */
export default function CardStatsSheet({
  cardId,
  cardName,
  initialTab,
  onClose,
  onOpenInsights,
}: {
  cardId: string;
  cardName: string;
  initialTab: StatsTab;
  onClose: () => void;
  onOpenInsights: () => void;
}) {
  const [tab, setTab] = useState<StatsTab>(initialTab);
  const [range, setRange] = useState<Range>("7d");
  const [data, setData] = useState<{ a: CardAnalytics; live: boolean } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    let live = true;
    setData(null);
    setError("");
    cardInsightsAPI
      .analytics(cardId, range)
      .then((r) => live && setData({ a: r.data, live: r.live }))
      .catch((e: Error) => live && setError(e.message || "Couldn't load these numbers"));
    return () => {
      live = false;
    };
  }, [cardId, range]);

  return createPortal(
    <div className="dc">
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet stats-sheet" role="dialog" aria-modal="true" aria-labelledby="stats-title" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-head">
            <div className="min-w-0">
              <h2 id="stats-title">{tab === "views" ? "Views" : "Taps"}</h2>
              <p className="stats-sub">{cardName}</p>
            </div>
            <button type="button" className="sheet-x" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="stats-bar">
            <div className="ins-range" role="tablist" aria-label="Details">
              {(["views", "taps"] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                  {t === "views" ? <Eye size={13} aria-hidden="true" /> : <BarChart3 size={13} aria-hidden="true" />} {t === "views" ? "Views" : "Taps"}
                </button>
              ))}
            </div>
            <RangePicker value={range} onChange={setRange} />
          </div>

          {data && !data.live && <SampleBanner>Card tracking isn't switched on yet, so these are sample numbers.</SampleBanner>}
          {error && <p className="sheet-error">{error}</p>}
          {!data && !error && <p className="stats-loading">Loading…</p>}
          {data && (tab === "views" ? <ViewsDetail a={data.a} /> : <TapsDetail a={data.a} />)}

          <button type="button" className="sheet-option stats-more" onClick={onOpenInsights}>
            <span className="sheet-text">
              <strong>Open full insights</strong>
              <small>Compare periods and see all your cards</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ViewsDetail({ a }: { a: CardAnalytics }) {
  const t = a.totals;
  const p = a.previous;
  const peak = Math.max(1, ...a.series.map((s) => s.views));
  const labelEvery = Math.max(1, Math.ceil(a.series.length / 6));
  const weekly = a.series.length > 1 && new Date(a.series[1].date).getTime() - new Date(a.series[0].date).getTime() > 2 * 864e5;
  const best = a.series.reduce<CardAnalytics["series"][number] | null>((b, s) => (!b || s.views > b.views ? s : b), null);
  const sources = [
    { label: "Direct link", value: a.sources.direct, Icon: Link2 },
    { label: "QR code", value: a.sources.qr, Icon: QrCode },
    { label: "WhatsApp", value: a.sources.whatsapp, Icon: MessageCircle },
    { label: "Social media", value: a.sources.social, Icon: Share2 },
    { label: "Other", value: a.sources.other, Icon: Eye },
  ].sort((x, y) => y.value - x.value);

  return (
    <div className="stats-body">
      <div className="ins-tiles stats-tiles">
        <StatTile label="Views" value={t.views} prev={p?.views} Icon={Eye} />
        <StatTile label="Unique visitors" value={t.uniqueVisitors} prev={p?.uniqueVisitors} Icon={Users} />
        <StatTile label="QR scans" value={t.qrScans} prev={p?.qrScans} Icon={QrCode} />
        <StatTile label="Contact saves" value={t.contactSaves} prev={p?.contactSaves} Icon={UserPlus} />
      </div>

      <section className="stats-block">
        <div className="stats-block-head">
          <h3>{weekly ? "Views per week" : "Views per day"}</h3>
          {best && best.views > 0 && (
            <span>
              Best: {dayLabel(best.date)} · {fmt(best.views)}
            </span>
          )}
        </div>
        <div className="ins-chart stats-chart" role="img" aria-label={`Views ${weekly ? "per week" : "per day"}, highest ${fmt(peak)}`}>
          {a.series.map((s, i) => (
            <div key={s.date} className="ins-bar-col" title={`${dayLabel(s.date)}: ${fmt(s.views)} views`}>
              <div className="ins-bar" style={{ height: `${Math.max((s.views / peak) * 100, 2)}%` }} />
              <span className="ins-bar-label">{i % labelEvery === 0 ? dayLabel(s.date) : ""}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-block">
        <div className="stats-block-head">
          <h3>Where views came from</h3>
        </div>
        {t.views ? <BarList rows={sources} /> : <p className="stats-empty">No views in this period yet.</p>}
      </section>
    </div>
  );
}

function TapsDetail({ a }: { a: CardAnalytics }) {
  const rows = tapRows(a);
  const total = totalTaps(a);
  const rate = a.totals.views ? Math.round((total / a.totals.views) * 100) : 0;
  const top = rows[0];

  return (
    <div className="stats-body">
      <div className="ins-tiles stats-tiles three">
        <StatTile label="Taps" value={total} Icon={MousePointerClick} hint="buttons pressed" />
        <StatTile label="Tap rate" value={rate} Icon={Percent} hint={`taps per 100 views`} />
        <div className="ins-tile">
          <span className="ins-tile-label">
            <Trophy size={14} />
            Most tapped
          </span>
          <strong className="ins-tile-value stats-top">{top && top.value ? top.label : "—"}</strong>
          <span className="ins-tile-hint">{top && top.value ? `${fmt(top.value)} taps` : "no taps yet"}</span>
        </div>
      </div>

      <section className="stats-block">
        <div className="stats-block-head">
          <h3>Taps by button</h3>
          <span>{fmt(total)} in total</span>
        </div>
        {total ? <BarList rows={rows} /> : <p className="stats-empty">No one has tapped a button on this card in this period.</p>}
      </section>
    </div>
  );
}
