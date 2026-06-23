import { useState } from "react";
import { CalendarOff, Clock, Coffee, Plus, Trash2 } from "lucide-react";
import {
  DaySlot,
  DailyBreak,
  StaffLeave,
  WEEKDAYS,
  addStaffLeave,
  defaultDailyBreak,
  getAvailabilityForStaff,
  getLeaveOnDate,
  readLeaves,
  removeStaffLeave,
  saveStaffAvailability,
  saveStaffDailyBreak,
  toIsoDate,
} from "./availabilityStore";

interface Props {
  staffId: string;
  staffName: string;
}

const StaffAvailabilityPanel = ({ staffId, staffName }: Props) => {
  const [weekly, setWeekly] = useState<DaySlot[]>(() => getAvailabilityForStaff(staffId).weekly);
  const [dailyBreak, setDailyBreak] = useState<DailyBreak>(
    () => getAvailabilityForStaff(staffId).dailyBreak ?? defaultDailyBreak(),
  );
  const [leaves, setLeaves] = useState<StaffLeave[]>(() =>
    readLeaves().filter((l) => l.staffId === staffId),
  );
  const [leaveForm, setLeaveForm] = useState({
    fromDate: toIsoDate(new Date()),
    toDate: toIsoDate(new Date()),
    reason: "",
    type: "leave" as const,
  });

  const persistWeekly = (next: DaySlot[]) => {
    setWeekly(next);
    saveStaffAvailability(staffId, next, dailyBreak);
  };

  const persistDailyBreak = (next: DailyBreak) => {
    setDailyBreak(next);
    saveStaffDailyBreak(staffId, next);
  };

  const updateDay = (day: DaySlot["day"], patch: Partial<DaySlot>) => {
    persistWeekly(weekly.map((s) => (s.day === day ? { ...s, ...patch } : s)));
  };

  const refreshLeaves = () => {
    setLeaves(readLeaves().filter((l) => l.staffId === staffId));
  };

  const handleAddLeave = () => {
    if (!leaveForm.fromDate || !leaveForm.toDate) return;
    addStaffLeave({
      staffId,
      fromDate: leaveForm.fromDate,
      toDate: leaveForm.toDate >= leaveForm.fromDate ? leaveForm.toDate : leaveForm.fromDate,
      reason: leaveForm.reason || "Leave",
      type: leaveForm.type,
    });
    setLeaveForm({ fromDate: toIsoDate(new Date()), toDate: toIsoDate(new Date()), reason: "", type: "leave" });
    refreshLeaves();
  };

  const todayLeave = getLeaveOnDate(staffId, toIsoDate(new Date()));

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3.5 h-3.5 text-violet-600" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weekly availability</p>
        </div>
        <p className="text-[10px] text-slate-400 mb-2">
          Open hours for {staffName} — shown as bookable slots on the calendar.
        </p>
        <div className="space-y-1.5">
          {WEEKDAYS.map(({ key, label }) => {
            const slot = weekly.find((s) => s.day === key)!;
            return (
              <div
                key={key}
                className={`flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-lg border text-xs ${
                  slot.enabled
                    ? "border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                }`}
              >
                <label className="flex items-center gap-1.5 w-12 flex-shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={(e) => updateDay(key, { enabled: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                </label>
                {slot.enabled ? (
                  <>
                    <input
                      type="time"
                      value={slot.from}
                      onChange={(e) => updateDay(key, { from: e.target.value })}
                      className="px-2 py-1 rounded-md text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="time"
                      value={slot.to}
                      onChange={(e) => updateDay(key, { to: e.target.value })}
                      className="px-2 py-1 rounded-md text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
                    />
                  </>
                ) : (
                  <span className="text-slate-400">Off</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Coffee className="w-3.5 h-3.5 text-sky-600" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Daily lunch / break</p>
        </div>
        <p className="text-[10px] text-slate-400 mb-2">
          Recurring break each working day for {staffName} — blocked on the calendar automatically.
        </p>
        <div
          className={`flex flex-wrap items-center gap-2 px-2.5 py-2 rounded-lg border text-xs ${
            dailyBreak.enabled
              ? "border-sky-200/70 dark:border-sky-900/40 bg-sky-50/30 dark:bg-sky-950/10"
              : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
          }`}
        >
          <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={dailyBreak.enabled}
              onChange={(e) => persistDailyBreak({ ...dailyBreak, enabled: e.target.checked })}
              className="rounded border-slate-300"
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">Enable daily break</span>
          </label>
          {dailyBreak.enabled && (
            <>
              <input
                type="time"
                value={dailyBreak.from}
                onChange={(e) => persistDailyBreak({ ...dailyBreak, from: e.target.value })}
                className="px-2 py-1 rounded-md text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
              />
              <span className="text-slate-400">–</span>
              <input
                type="time"
                value={dailyBreak.to}
                onChange={(e) => persistDailyBreak({ ...dailyBreak, to: e.target.value })}
                className="px-2 py-1 rounded-md text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <CalendarOff className="w-3.5 h-3.5 text-red-500" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Leaves & time off</p>
        </div>
        {todayLeave && (
          <p className="text-[10px] text-red-600 dark:text-red-400 mb-2 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/70 dark:border-red-900/40">
            On leave today: {todayLeave.reason}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-slate-500">From</label>
            <input
              type="date"
              value={leaveForm.fromDate}
              onChange={(e) => setLeaveForm((f) => ({ ...f, fromDate: e.target.value }))}
              className="mt-0.5 w-full px-2 py-1.5 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500">To</label>
            <input
              type="date"
              value={leaveForm.toDate}
              onChange={(e) => setLeaveForm((f) => ({ ...f, toDate: e.target.value }))}
              className="mt-0.5 w-full px-2 py-1.5 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
        <input
          value={leaveForm.reason}
          onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
          placeholder="Reason (e.g. Annual leave, Conference)"
          className="w-full px-2 py-1.5 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700 mb-2"
        />
        <button
          type="button"
          onClick={handleAddLeave}
          className="w-full py-2 rounded-lg text-xs font-medium border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add leave
        </button>

        {leaves.length > 0 && (
          <ul className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto">
            {leaves.map((lv) => (
              <li
                key={lv.id}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-red-50/60 dark:bg-red-950/15 border border-red-100 dark:border-red-900/30 text-[11px]"
              >
                <span className="text-slate-700 dark:text-slate-300 truncate">
                  {lv.fromDate === lv.toDate ? lv.fromDate : `${lv.fromDate} → ${lv.toDate}`}
                  {" · "}{lv.reason}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    removeStaffLeave(lv.id);
                    refreshLeaves();
                  }}
                  className="text-slate-400 hover:text-red-500 flex-shrink-0"
                  aria-label="Remove leave"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StaffAvailabilityPanel;
