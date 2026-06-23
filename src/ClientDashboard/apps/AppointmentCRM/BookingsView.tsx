import { useState } from "react";
import { Search } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useActiveBranch } from "./branchesStore";
import { useBookings } from "./bookingsStore";
import { BookingStatus, bookingStatusMeta } from "./mockData";

const FILTERS: (BookingStatus | "all")[] = ["all", "confirmed", "pending", "checked-in", "completed", "cancelled", "no-show"];

const BookingsView = () => {
  const { terms } = useAppointmentIndustry();
  const { activeBranch, activeBranchId } = useActiveBranch();
  const bookings = useBookings();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");

  const list = bookings.filter((b) => {
    if (activeBranchId && b.branchId !== activeBranchId) return false;
    if (filter !== "all" && b.status !== filter) return false;
    const hay = `${b.customer} ${b.id} ${b.service} ${b.provider} ${b.branchName} ${b.departmentName ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <SectionTitle
        title={terms.appointments}
        subtitle={
          activeBranch
            ? `${terms.appointments} at ${activeBranch.name} — book, reschedule, cancel & track status`
            : `All ${terms.appointments.toLowerCase()} — book, reschedule, cancel & track status`
        }
        right={
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
              filter === f
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            {f === "all" ? "All" : bookingStatusMeta(f as BookingStatus).label}
          </button>
        ))}
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">{terms.customer}</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 hidden lg:table-cell">{terms.branch}</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">{terms.department}</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">{terms.staff}</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">When</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => {
                const st = bookingStatusMeta(b.status);
                return (
                  <tr key={b.id} className="border-b border-slate-50 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-white">{b.customer}</p>
                      <p className="text-[11px] text-slate-400">{b.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell">{b.branchName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">{b.departmentName ?? b.service}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{b.provider}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{b.date} · {b.time}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default BookingsView;
