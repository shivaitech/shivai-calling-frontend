import { useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { shuffleIdeas, TAGLINE_STYLES, taglineIdeas, type TaglineStyle } from "./taglineTemplates";

const SHOWN = 3;

/** Tagline ideas under the tagline box: pick a style, tap an idea to use it, or get new ones. */
export default function TaglineIdeas({
  title,
  company,
  current,
  onPick,
}: {
  title: string;
  company: string;
  current: string;
  onPick: (tagline: string) => void;
}) {
  const [style, setStyle] = useState<TaglineStyle>("professional");
  // A shuffled order, kept while the owner types (ideas fill in their title live but don't jump).
  const [order, setOrder] = useState(() => shuffleIdeas());

  const ideas = useMemo(() => {
    const byId = new Map(taglineIdeas(title, company, style).map((i) => [i.id, i]));
    return order.flatMap((id) => byId.get(id) ?? []).slice(0, SHOWN);
  }, [title, company, style, order]);

  const regenerate = () => setOrder(shuffleIdeas(ideas.map((i) => i.id)));

  return (
    <div className="tg-ideas">
      <div className="tg-ideas-head">
        <span className="tg-ideas-title">
          <Sparkles size={14} aria-hidden="true" /> Tagline ideas
        </span>
        <button type="button" className="tg-regen" onClick={regenerate}>
          <RefreshCw size={13} aria-hidden="true" /> New ideas
        </button>
      </div>
      <div className="tg-styles" role="tablist" aria-label="Tagline style">
        {TAGLINE_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={style === s.id}
            className={style === s.id ? "is-on" : undefined}
            onClick={() => setStyle(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="tg-list">
        {ideas.map(({ id, text }) => (
          <button key={id} type="button" className={`tg-idea${text === current.trim() ? " is-on" : ""}`} onClick={() => onPick(text)}>
            {text}
          </button>
        ))}
      </div>
      {!title.trim() && !company.trim() && <small className="field-help">Add your job title and company for ideas made for you.</small>}
    </div>
  );
}
