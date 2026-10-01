import { useEffect, useState } from "react";
import { minutesToTopPx } from "./calendarUtils";
import { toIsoDate } from "./availabilityStore";

interface Props {
  viewDate: Date;
  dayStartMin: number;
  dayEndMin: number;
}

/** Red "now" line across the grid — only rendered when viewing today, within business hours. */
const CalendarNowLine = ({ viewDate, dayStartMin, dayEndMin }: Props) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (toIsoDate(viewDate) !== toIsoDate(now)) return null;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < dayStartMin || nowMin > dayEndMin) return null;

  const top = minutesToTopPx(nowMin, dayStartMin);
  const label = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top }}>
      <div className="relative flex items-center">
        <span className="absolute -left-[3px] -translate-x-full -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-red-500 tabular-nums leading-none shadow-sm whitespace-nowrap">
          {label}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 -translate-y-1/2 flex-shrink-0" />
        <div className="flex-1 h-px bg-red-500 -translate-y-1/2" />
      </div>
    </div>
  );
};

export default CalendarNowLine;
