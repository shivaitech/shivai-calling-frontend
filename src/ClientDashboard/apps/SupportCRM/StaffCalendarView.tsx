import React from "react";
import GlassCard from "../../../components/GlassCard";
import { CalendarClock, Users, UserPlus } from "lucide-react";
import { useIndustry } from "./industryConfig";
import { useStaff, WEEKDAYS, STAFF_STATUS_META } from "./staffStore";
import { AgentAvatar, StatCard, SectionTitle } from "./ui";

const StaffCalendarView: React.FC = () => {
  const { terms } = useIndustry();
  const { staff, shifts, toggleShift } = useStaff();

  // Coverage per weekday (count of staff scheduled).
  const coverage = WEEKDAYS.map(
    (_, day) => staff.filter((s) => (shifts[s.id] || []).includes(day)).length
  );
  const totalShifts = Object.values(shifts).reduce(
    (sum, days) => sum + (days?.length || 0),
    0
  );
  const busiest = coverage.indexOf(Math.max(...coverage, 0));
  const thinnest = (() => {
    // Weekday (Mon–Fri) with the least coverage — where a gap hurts most.
    let min = Infinity;
    let idx = 0;
    for (let d = 0; d < 5; d++) {
      if (coverage[d] < min) {
        min = coverage[d];
        idx = d;
      }
    }
    return idx;
  })();

  if (staff.length === 0) {
    return (
      <div className="space-y-5">
        <SectionTitle
          title="Staff Calendar"
          subtitle="Weekly shift & coverage for your human support team"
        />
        <GlassCard>
          <div className="p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl common-bg-icons flex items-center justify-center mb-3">
              <CalendarClock className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No staff to schedule</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add team members in the Staff module to build the shift calendar.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Staff Calendar"
        subtitle={`Weekly shift & coverage — tap a cell to toggle when each ${terms.agent.toLowerCase()} works`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} color="blue" label="Team Members" value={staff.length} />
        <StatCard icon={CalendarClock} color="purple" label="Shifts / Week" value={totalShifts} />
        <StatCard icon={UserPlus} color="emerald" label={`Peak Day (${WEEKDAYS[busiest]})`} value={coverage[busiest]} sub="staff covering" />
        <StatCard icon={CalendarClock} color="amber" label={`Thinnest (${WEEKDAYS[thinnest]})`} value={coverage[thinnest]} sub="staff covering" subTone={coverage[thinnest] === 0 ? "warn" : "muted"} />
      </div>

      {/* Weekly grid — mobile: stacked per-staff cards */}
      <div className="sm:hidden space-y-3">
        {staff.map((m) => {
          const days = shifts[m.id] || [];
          const meta = STAFF_STATUS_META[m.status];
          return (
            <GlassCard key={m.id}>
              <div className="p-3.5">
                <div className="flex items-center gap-2.5 mb-3">
                  <AgentAvatar name={m.name} hue={m.hue} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{m.name}</p>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {m.role || meta.label}
                    </p>
                  </div>
                  <span className="ml-auto text-[11px] font-medium text-slate-400">
                    {days.length}d/wk
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((d, i) => {
                    const on = days.includes(i);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleShift(m.id, i)}
                        className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                          on
                            ? "bg-violet-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}
                        title={on ? `${m.name} working ${d}` : `${m.name} off ${d}`}
                      >
                        <span className="text-[10px] font-semibold leading-none">{d[0]}</span>
                        <span className="text-[10px] leading-none">{on ? "On" : "—"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          );
        })}
        {/* Coverage summary card */}
        <GlassCard>
          <div className="p-3.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Coverage</p>
            <div className="grid grid-cols-7 gap-1.5">
              {coverage.map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-medium">{WEEKDAYS[i][0]}</span>
                  <span
                    className={`w-full text-center py-1 rounded-md text-xs font-bold ${
                      c === 0
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Weekly grid — desktop table */}
      <GlassCard className="hidden sm:block">
        <div className="p-3 sm:p-5 overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pl-1 w-48">
                  Staff
                </th>
                {WEEKDAYS.map((d) => (
                  <th
                    key={d}
                    className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 px-1"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((m) => {
                const days = shifts[m.id] || [];
                const meta = STAFF_STATUS_META[m.status];
                return (
                  <tr key={m.id}>
                    <td className="py-1.5 pr-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AgentAvatar name={m.name} hue={m.hue} size={32} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{m.name}</p>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {m.role || meta.label}
                          </p>
                        </div>
                      </div>
                    </td>
                    {WEEKDAYS.map((d, i) => {
                      const on = days.includes(i);
                      return (
                        <td key={d} className="text-center px-1 py-1.5">
                          <button
                            onClick={() => toggleShift(m.id, i)}
                            className={`w-full h-9 rounded-lg text-[11px] font-semibold transition-colors ${
                              on
                                ? "bg-violet-500 text-white hover:bg-violet-600"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                            title={on ? `${m.name} working ${d} — tap to clear` : `${m.name} off ${d} — tap to add shift`}
                          >
                            {on ? "On" : "—"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Coverage summary row */}
              <tr>
                <td className="pt-3 pl-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Coverage
                </td>
                {coverage.map((c, i) => (
                  <td key={i} className="pt-3 px-1 text-center">
                    <span
                      className={`inline-block min-w-[28px] px-2 py-1 rounded-md text-xs font-bold ${
                        c === 0
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                          : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {c}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Shifts are saved locally per industry. A red coverage cell means no one is scheduled that day.
      </p>
    </div>
  );
};

export default StaffCalendarView;
