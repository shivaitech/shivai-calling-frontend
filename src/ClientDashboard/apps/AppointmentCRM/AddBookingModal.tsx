import { useEffect, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import appToast from "../../../components/AppToast";
import { useAppointmentIndustry } from "./industryConfig";
import { Branch } from "./branchesStore";
import { addBooking } from "./bookingsStore";
import { toIsoDate, useIntegratedSchedules } from "./availabilityStore";
import { parseTimeToMinutes } from "./calendarUtils";
import { useCombinedStaffDirectory } from "./combinedStaffDirectory";

interface Prefill {
  staffId: string;
  date: string;
  fromTime: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  defaultBranchId?: string | null;
  /** When opened from a Calendar slot click: locks staff/date/start-time to
   * the clicked slot, leaving only patient details + end time editable. */
  prefill?: Prefill;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function defaultToTime(fromTime: string, durationMin = 30): string {
  const mins = Math.min(parseTimeToMinutes(fromTime) + durationMin, 23 * 60 + 59);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function createEmptyForm(prefill?: Prefill) {
  const fromTime = prefill?.fromTime ?? "09:00";
  return {
    customer: "",
    phone: "",
    staffId: prefill?.staffId ?? "",
    date: prefill?.date ?? todayIso(),
    fromTime,
    toTime: defaultToTime(fromTime),
    notes: "",
  };
}

const INPUT = "mt-1 w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white";
const LABEL = "text-xs font-medium text-slate-600 dark:text-slate-400";

/** Manual booking creation — lets staff book any staff member who has a
 * live schedule (the same list the Calendar shows), with an explicit
 * start/end time rather than a single time + hidden default duration.
 * Creates a real Booking row, so it shows up in both the Bookings table and
 * the Calendar. */
const AddBookingModal = ({ open, onClose, branches, defaultBranchId, prefill }: Props) => {
  const { terms } = useAppointmentIndustry();
  const { schedules, loading: staffLoading } = useIntegratedSchedules();
  const { rows: directoryRows } = useCombinedStaffDirectory();
  const [form, setForm] = useState(() => createEmptyForm(prefill));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(createEmptyForm(prefill));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const staffOptions = schedules.filter((s) => s.staff);
  const selected = staffOptions.find((s) => s.staff_id === form.staffId);
  // Department/designation aren't on the Schedule API's staff summary — look
  // them up from the tenant staff directory by the same real id.
  const selectedDirectoryRow = selected ? directoryRows.find((r) => r.rawId === selected.staff_id) : undefined;

  const primaryBranch = branches.find((b) => b.id === defaultBranchId) ?? branches.find((b) => b.isPrimary) ?? branches[0];

  const timeError =
    parseTimeToMinutes(form.toTime) <= parseTimeToMinutes(form.fromTime)
      ? "End time must be after start time"
      : null;

  const canSubmit =
    form.customer.trim().length > 0 &&
    Boolean(form.staffId) &&
    Boolean(form.date) &&
    Boolean(form.fromTime) &&
    Boolean(form.toTime) &&
    !timeError;

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || saving || !selected?.staff) {
      if (!selected) setError(`Select a ${terms.staff.toLowerCase()} member`);
      return;
    }
    if (!primaryBranch) {
      setError(`Set up a ${terms.branch.toLowerCase()} before adding bookings.`);
      return;
    }

    setError(null);
    setSaving(true);
    const toastId = appToast.loading("Adding booking…");
    try {
      await addBooking({
        customer: form.customer.trim(),
        phone: form.phone.trim() || undefined,
        branchName: primaryBranch.name,
        department: selectedDirectoryRow?.departmentName,
        designation: selectedDirectoryRow?.designation,
        staffId: selected.staff_id,
        provider: selected.staff.fullName,
        dateIso: form.date,
        time: form.fromTime,
        endTime: form.toTime,
        notes: form.notes.trim() || undefined,
      });
      appToast.dismiss(toastId);
      appToast.success(`Booking added for ${form.customer.trim()}`);
      onClose();
    } catch {
      appToast.dismiss(toastId);
      appToast.error("Could not add booking. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={handleClose} closeOnBackdrop={!saving} panelClassName="max-w-lg">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center flex-shrink-0">
            <CalendarPlus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Add booking</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {prefill
                ? `Booking ${selected?.staff?.fullName ?? "this slot"} at ${form.fromTime} on ${form.date}`
                : `Book any ${terms.staff.toLowerCase()} member manually`}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>{terms.customer} name <span className="text-red-500">*</span></label>
              <input
                value={form.customer}
                onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                placeholder="Full name"
                className={INPUT}
                autoFocus
              />
            </div>
            <div>
              <label className={LABEL}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210 (optional)"
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>{terms.staff} <span className="text-red-500">*</span></label>
            {prefill ? (
              <div className={`${INPUT} bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 cursor-not-allowed`}>
                {selected?.staff?.fullName ?? "…"}
              </div>
            ) : (
              <select
                value={form.staffId}
                onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
                className={INPUT}
                disabled={staffLoading || staffOptions.length === 0}
              >
                <option value="">
                  {staffLoading
                    ? "Loading…"
                    : staffOptions.length === 0
                      ? `No ${terms.staffPlural.toLowerCase()} on the calendar yet`
                      : `Select ${terms.staff.toLowerCase()}…`}
                </option>
                {staffOptions.map((s) => (
                  <option key={s.staff_id} value={s.staff_id}>{s.staff!.fullName}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.date}
                min={todayIso()}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={INPUT}
                disabled={Boolean(prefill)}
              />
            </div>
            <div>
              <label className={LABEL}>From <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={form.fromTime}
                onChange={(e) =>
                  setForm((f) => {
                    const fromTime = e.target.value;
                    const toTime =
                      parseTimeToMinutes(f.toTime) <= parseTimeToMinutes(fromTime)
                        ? defaultToTime(fromTime)
                        : f.toTime;
                    return { ...f, fromTime, toTime };
                  })
                }
                className={INPUT}
                disabled={Boolean(prefill)}
              />
            </div>
            <div>
              <label className={LABEL}>To <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={form.toTime}
                onChange={(e) => setForm((f) => ({ ...f, toTime: e.target.value }))}
                className={INPUT}
              />
            </div>
          </div>
          {timeError && <p className="text-[11px] text-red-600 dark:text-red-400">{timeError}</p>}

          <div>
            <label className={LABEL}>Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional"
              className={INPUT}
            />
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            {saving ? "Adding…" : "Add booking"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default AddBookingModal;
