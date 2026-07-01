import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatViewDate, toIsoDate } from "./availabilityStore";

interface Props {
  viewDate: Date;
  onViewDateChange: (date: Date) => void;
  compact?: boolean;
  /** Stretch toolbar full width — use when stacked below title on mobile. */
  fullWidth?: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isSameDay(a: Date, b: Date): boolean {
  return toIsoDate(a) === toIsoDate(b);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function calendarToolbarShellClass(compact = false): string {
  return `inline-flex items-center rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur ${
    compact ? "p-0.5" : "p-1"
  }`;
}

const CalendarDateNav = ({ viewDate, onViewDateChange, compact = false, fullWidth = false }: Props) => {
  const [open, setOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => startOfMonth(viewDate));
  const rootRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);
  const isToday = isSameDay(viewDate, today);
  const label = formatViewDate(viewDate);

  useEffect(() => {
    if (open) setPickerMonth(startOfMonth(viewDate));
  }, [open, viewDate]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const shiftDay = (delta: number) => {
    const next = new Date(viewDate);
    next.setDate(next.getDate() + delta);
    onViewDateChange(next);
  };

  const goToday = () => {
    onViewDateChange(new Date());
    setOpen(false);
  };

  const pickDay = (day: number) => {
    const next = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
    onViewDateChange(next);
    setOpen(false);
  };

  const monthLabel = pickerMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const calendarDays = useMemo(() => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number; inMonth: boolean } | null> = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push({ day, inMonth: true });
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [pickerMonth]);

  const btnClass = compact
    ? "p-1.5 rounded-lg"
    : "p-2 rounded-xl";

  return (
    <div
      ref={rootRef}
      className={`relative ${fullWidth ? "w-full" : "inline-flex flex-col items-end"}`}
    >
      <div
        className={`${calendarToolbarShellClass(compact)} gap-0.5 ${
          fullWidth ? "w-full flex items-center justify-between" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className={`${btnClass} text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
          aria-label="Previous day"
        >
          <ChevronLeft className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border transition-colors min-w-0 ${
            fullWidth ? "flex-1 justify-center mx-0.5" : ""
          } ${
            open
              ? "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/40"
              : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/80"
          } ${compact ? "px-2 py-1" : "px-3 py-1.5"}`}
          aria-label="Pick a date"
          aria-expanded={open}
        >
          <CalendarDays className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} text-violet-600 dark:text-violet-400 flex-shrink-0`} />
          <span className="text-left min-w-0">
            <span className={`block font-semibold text-slate-900 dark:text-white leading-tight ${compact ? "text-[11px]" : "text-sm"}`}>
              {label}
            </span>
            {!compact && (
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[160px] sm:max-w-none">
                {formatFullDate(viewDate)}
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => shiftDay(1)}
          className={`${btnClass} text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
          aria-label="Next day"
        >
          <ChevronRight className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>

        {!isToday && (
          <button
            type="button"
            onClick={goToday}
            className={`shrink-0 rounded-xl font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-200/70 dark:border-violet-800/60 transition-colors ${
              compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs"
            }`}
          >
            Today
          </button>
        )}
      </div>

      {open && (
        <div
          className={`absolute z-50 mt-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3 ${
            compact ? "right-0 w-[min(100vw-1.5rem,17rem)]" : "right-0 w-[min(100vw-1.5rem,18.5rem)]"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={() => setPickerMonth((m) => addMonths(m, -1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setPickerMonth((m) => addMonths(m, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} />;
              const date = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), cell.day);
              const selected = isSameDay(date, viewDate);
              const isTodayCell = isSameDay(date, today);
              return (
                <button
                  key={cell.day}
                  type="button"
                  onClick={() => pickDay(cell.day)}
                  className={`h-8 rounded-lg text-xs font-medium transition-colors ${
                    selected
                      ? "bg-violet-600 text-white shadow-sm"
                      : isTodayCell
                        ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-1 ring-violet-300/60 dark:ring-violet-700/60"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={goToday}
            className="mt-3 w-full py-2 rounded-xl text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200/60 dark:border-violet-800/50"
          >
            Jump to today
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarDateNav;
