import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, FlaskConical, LucideIcon } from "lucide-react";
import type { Range } from "../../../services/cardInsightsAPI";

/** Shared pieces for the Monitoring and Affiliate dashboards. */

export const fmt = (n: number) => n.toLocaleString("en-US");

/** Shown whenever a dashboard is filling in with sample data instead of live numbers. */
export function SampleBanner({ children }: { children: ReactNode }) {
  return (
    <div className="ins-sample" role="note">
      <FlaskConical size={16} />
      <span>
        <strong>Preview — sample numbers.</strong> {children}
      </span>
    </div>
  );
}

const RANGES: { value: Range; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

export function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="ins-range" role="radiogroup" aria-label="Period">
      {RANGES.map((r) => (
        <button key={r.value} type="button" role="radio" aria-checked={value === r.value} className={value === r.value ? "on" : ""} onClick={() => onChange(r.value)}>
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function StatTile({ label, value, prev, Icon, hint }: { label: string; value: number; prev?: number; Icon: LucideIcon; hint?: string }) {
  const change = prev ? Math.round(((value - prev) / prev) * 100) : null;
  return (
    <div className="ins-tile">
      <span className="ins-tile-label">
        <Icon size={14} />
        {label}
      </span>
      <strong className="ins-tile-value">{fmt(value)}</strong>
      {change !== null ? (
        <span className={`ins-change ${change >= 0 ? "up" : "down"}`}>
          {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(change)}% vs previous
        </span>
      ) : (
        hint && <span className="ins-tile-hint">{hint}</span>
      )}
    </div>
  );
}

export function BarList({ rows }: { rows: { label: string; value: number; Icon: LucideIcon }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return (
    <ul className="ins-barlist">
      {rows.map(({ label, value, Icon }) => (
        <li key={label}>
          <span className="ins-barlist-name">
            <Icon size={14} />
            {label}
          </span>
          <span className="ins-barlist-track" aria-hidden="true">
            <span style={{ width: `${(value / max) * 100}%` }} />
          </span>
          <span className="ins-barlist-num">
            {fmt(value)} <small>{Math.round((value / total) * 100)}%</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
