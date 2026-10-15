import { durationToHeightPx, minutesToTopPx } from "./calendarUtils";
import type { CalendarCellState } from "./availabilityStore";

/** "past" isn't a real schedule state — it's a display-only overlay for an
 * otherwise-available slot whose time has already gone by today. */
export type BandLabelState = CalendarCellState | "past";

const LABEL: Partial<Record<BandLabelState, string>> = {
  leave: "On leave",
  unavailable: "Off hours",
  break: "Break",
  past: "Time passed",
};

const LABEL_CLS: Partial<Record<BandLabelState, string>> = {
  leave: "text-red-600/70 dark:text-red-400/70",
  unavailable: "text-slate-400 dark:text-slate-500",
  break: "text-sky-600/70 dark:text-sky-400/70",
  past: "text-slate-400/80 dark:text-slate-500/80",
};

interface Props {
  state: BandLabelState;
  startMin: number;
  endMin: number;
  dayStartMin: number;
}

/** A centered caption over one hour-tall chunk of a non-bookable cell state
 * (a whole leave day, a non-working day, a recurring break) — repeated every
 * hour (via splitBandsHourly) so it stays visible while scrolling a long
 * run, rather than showing once and scrolling out of view. Purely
 * decorative: never intercepts clicks, sits behind bookings/blocks/the Book
 * button. */
const CalendarStateBandLabel = ({ state, startMin, endMin, dayStartMin }: Props) => {
  const label = LABEL[state];
  if (!label) return null;
  const top = minutesToTopPx(startMin, dayStartMin);
  const height = durationToHeightPx(endMin - startMin);
  if (height < 24) return null;

  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-center pointer-events-none select-none z-0"
      style={{ top, height }}
    >
      <span className={`text-[10px] font-medium uppercase tracking-wide ${LABEL_CLS[state] ?? "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
};

export default CalendarStateBandLabel;
