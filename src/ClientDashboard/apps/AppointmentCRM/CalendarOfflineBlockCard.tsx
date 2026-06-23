import type { StaffOfflineBlock } from "./offlineBlocksStore";
import {
  blockTypeLabel,
  formatBlockTimeRange,
  getBlockDurationMinutes,
  getBlockStartMinutes,
  isManualBookingBlock,
} from "./offlineBlocksStore";
import {
  CALENDAR_SLOT_HEIGHT_PX,
  durationToHeightPx,
  minutesToTopPx,
} from "./calendarUtils";

interface Props {
  block: StaffOfflineBlock;
  dayStartMin: number;
  dayEndMin: number;
  onClick: () => void;
}

const CalendarOfflineBlockCard = ({ block, dayStartMin, dayEndMin, onClick }: Props) => {
  const startMin = getBlockStartMinutes(block);
  const duration = getBlockDurationMinutes(block);
  if (startMin < dayStartMin || startMin >= dayEndMin) return null;

  const top = minutesToTopPx(startMin, dayStartMin);
  const height = durationToHeightPx(duration);
  const timeLabel = formatBlockTimeRange(block);
  const isManual = isManualBookingBlock(block);
  const isBreak = block.type === "break";
  const compact = height < CALENDAR_SLOT_HEIGHT_PX * 2;
  const medium = height < CALENDAR_SLOT_HEIGHT_PX * 4;
  const showBadge = height >= CALENDAR_SLOT_HEIGHT_PX * 5;
  const label = blockTypeLabel(block);

  const cardCls = isManual
    ? "border-amber-400/70 dark:border-amber-600/50 bg-amber-100/90 dark:bg-amber-950/50 hover:bg-amber-200/90 dark:hover:bg-amber-900/60"
    : isBreak
      ? "border-sky-400/70 dark:border-sky-600/50 bg-sky-100/90 dark:bg-sky-950/50 hover:bg-sky-200/90 dark:hover:bg-sky-900/60"
      : "border-slate-400/60 dark:border-slate-500/50 bg-slate-200/90 dark:bg-slate-700/80 hover:bg-slate-300/90 dark:hover:bg-slate-600/80";

  const accentCls = isManual ? "bg-amber-600" : isBreak ? "bg-sky-600" : "bg-slate-500";

  const titleLine = isManual
    ? block.patientName || "Manual"
    : isBreak
      ? block.notes || "Break"
      : "Unavailable";

  const subLine = isManual
    ? [block.patientId, block.notes].filter(Boolean).join(" · ") || "Walk-in"
    : block.notes || (isBreak ? "Break" : "Blocked");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute left-px right-px z-10 group text-left rounded-[3px] overflow-hidden border hover:z-20 transition-colors shadow-sm ${cardCls}`}
      style={{ top, height: Math.max(height - 1, 14) }}
      title={`${label} · ${timeLabel}${isManual && block.patientId ? ` · ${block.patientId}` : ""}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${accentCls}`} />
      <div className={`h-full flex min-h-0 ${compact ? "items-center px-1.5 py-0" : "flex-col justify-between px-1.5 py-0.5"}`}>
        {compact ? (
          <p className="text-[9px] font-semibold text-slate-900 dark:text-white leading-tight truncate w-full">
            {titleLine}
          </p>
        ) : (
          <>
            {!medium && (
              <p className="text-[8px] font-semibold leading-none tabular-nums shrink-0 truncate opacity-80">
                {timeLabel}
              </p>
            )}
            <div className={`min-h-0 ${medium ? "flex flex-col justify-center" : "flex-1 flex flex-col justify-center"}`}>
              <p className={`font-semibold text-slate-900 dark:text-white leading-tight truncate ${medium ? "text-[9px]" : "text-[10px]"}`}>
                {titleLine}
              </p>
              {!medium && (
                <p className="text-[8px] text-slate-600 dark:text-slate-400 leading-tight truncate">{subLine}</p>
              )}
            </div>
            {showBadge && (
              <span
                className={`self-start text-[7px] px-1 py-px rounded font-medium shrink-0 leading-none ${
                  isManual
                    ? "bg-amber-200/90 text-amber-900"
                    : isBreak
                      ? "bg-sky-200/90 text-sky-900"
                      : "bg-slate-300/90 text-slate-800"
                }`}
              >
                {isManual ? "Manual" : isBreak ? "Break" : "Blocked"}
              </span>
            )}
          </>
        )}
      </div>
    </button>
  );
};

export default CalendarOfflineBlockCard;
