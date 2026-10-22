import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useActiveBranch } from "./branchesStore";
import { useBookings, fetchAllBookingsForStaff } from "./bookingsStore";
import { useIntegratedSchedules, toIsoDate } from "./availabilityStore";
import { Booking, BookingStatus, bookingStatusMeta } from "./mockData";
import AddBookingModal from "./AddBookingModal";
import BookingDetailModal from "./BookingDetailModal";
import appToast from "../../../components/AppToast";

const FILTERS: (BookingStatus | "all")[] = ["all", "booked", "cancelled"];
const ALL = "all";
const PAGE_SIZE = 10;

const FILTER_SELECT =
  "px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40";

/** Bookings only before this date (a date-only ISO string, "YYYY-MM-DD" or a
 * display label like "Today") — compared against the booking's own raw date. */
function bookingIsoDate(booking: Booking, today: string): string {
  if (booking.date === "Today") return today;
  if (booking.date === "Tomorrow" || booking.date === "Yesterday") {
    const d = new Date(today);
    d.setDate(d.getDate() + (booking.date === "Tomorrow" ? 1 : -1));
    return toIsoDate(d);
  }
  return booking.date;
}

const BookingsView = () => {
  const { terms } = useAppointmentIndustry();
  const { branches, activeBranch, activeBranchId, setActiveBranch } = useActiveBranch();
  const bookings = useBookings();
  const { schedules: integratedSchedules, loading: staffLoading } = useIntegratedSchedules();

  useEffect(() => {
    if (staffLoading) return;
    const staffWithNames = integratedSchedules
      .filter((s) => s.staff)
      .map((s) => ({ id: s.staff_id, name: s.staff!.fullName }));
    void fetchAllBookingsForStaff({
      staff: staffWithNames,
      branchName: activeBranch?.name,
    }).catch(() => {
      appToast.error("Couldn't load bookings.");
    });
  }, [integratedSchedules, staffLoading, activeBranch?.name]);

  const integratedStaff = useMemo(
    () => integratedSchedules.filter((s) => s.staff).map((s) => ({ id: s.staff_id, name: s.staff!.fullName })),
    [integratedSchedules],
  );

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [staffFilter, setStaffFilter] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const selectedBooking: Booking | null = selectedBookingId
    ? bookings.find((b) => b.id === selectedBookingId) ?? null
    : null;

  const filtersActive = staffFilter !== ALL || dateFrom !== "" || dateTo !== "";

  const clearFilters = () => {
    setStaffFilter(ALL);
    setDateFrom("");
    setDateTo("");
  };

  const today = toIsoDate(new Date());

  const list = useMemo(() => {
    return bookings.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (staffFilter !== ALL && b.staffId !== staffFilter) return false;
      if (dateFrom || dateTo) {
        const iso = bookingIsoDate(b, today);
        if (dateFrom && iso < dateFrom) return false;
        if (dateTo && iso > dateTo) return false;
      }
      const hay = `${b.customer} ${b.id} ${b.service} ${b.provider} ${b.branchName} ${b.departmentName ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [bookings, filter, staffFilter, dateFrom, dateTo, today, q]);

  // Reset to page 1 whenever the result set changes shape.
  useEffect(() => {
    setPage(1);
  }, [filter, staffFilter, dateFrom, dateTo, q]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageList = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium common-button-bg flex-shrink-0"
            >
              <CalendarPlus className="w-3.5 h-3.5" /> Add Booking
            </button>
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

      <div className="flex flex-wrap items-center gap-2">
        {branches.length > 1 && (
          <select
            value={activeBranchId ?? ""}
            onChange={(e) => void setActiveBranch(e.target.value)}
            className={FILTER_SELECT}
            title="Bookings don't carry a branch yet — this only switches which branch's name shows above."
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className={FILTER_SELECT}>
          <option value={ALL}>All {terms.staffPlural.toLowerCase()}</option>
          {integratedStaff.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={FILTER_SELECT}
          />
          <label className="text-xs text-slate-500">To</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className={FILTER_SELECT}
          />
        </div>
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Clear filters
          </button>
        )}
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">{terms.customer}</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">{terms.department}</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">{terms.staff}</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">When</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageList.map((b) => {
                const st = bookingStatusMeta(b.status);
                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBookingId(b.id)}
                    className="border-b border-slate-50 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-white">{b.customer}</p>
                      <p className="text-[11px] text-slate-400">{b.phone}</p>
                    </td>
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
              {pageList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                    No {terms.appointments.toLowerCase()} match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {list.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, list.length)} of {list.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-500 px-1 tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      <AddBookingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        branches={branches}
        defaultBranchId={activeBranchId}
      />

      <BookingDetailModal
        open={Boolean(selectedBooking)}
        booking={selectedBooking}
        staffLabel={terms.staff}
        customerLabel={terms.customer}
        onClose={() => setSelectedBookingId(null)}
      />
    </div>
  );
};

export default BookingsView;
