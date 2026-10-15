import { useEffect, useState } from "react";
import { Coffee, Info, Loader2, Plus, Trash2 } from "lucide-react";
import appToast from "../../../components/AppToast";
import {
  StaffOfflineBlock,
  addOfflineBlock,
  blockTypeLabel,
  formatBlockTimeRange,
  getOfflineBlocksForStaff,
  removeOfflineBlock,
} from "./offlineBlocksStore";
import { fetchScheduleFor, toIsoDate } from "./availabilityStore";
import { parseTimeToMinutes } from "./calendarUtils";
import DeleteOfflineBlockModal from "./DeleteOfflineBlockModal";

interface Props {
  staffId: string;
  staffName: string;
}

const SCHEDULE_EVENT = "shivai:appointment-schedule-changed";

function minutesToTimeInput(mins: number): string {
  const clamped = Math.max(0, Math.min(mins, 23 * 60 + 59));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function nextSlotFromNow(stepMin = 15): string {
  return minutesToTimeInput(Math.ceil(nowMinutes() / stepMin) * stepMin);
}

function defaultToTime(fromTime: string, durationMin = 30): string {
  return minutesToTimeInput(parseTimeToMinutes(fromTime) + durationMin);
}

function clampFormTimes(date: string, fromTime: string, toTime: string): { fromTime: string; toTime: string } {
  let from = fromTime;
  let to = toTime;
  if (date === todayIso()) {
    const minFrom = nowMinutes();
    if (parseTimeToMinutes(from) < minFrom) from = nextSlotFromNow();
  }
  if (parseTimeToMinutes(to) <= parseTimeToMinutes(from)) {
    to = defaultToTime(from);
  }
  return { fromTime: from, toTime: to };
}

function validateSchedule(date: string, fromTime: string, toTime: string): string | null {
  if (date < todayIso()) return "Date cannot be in the past";
  const fromMin = parseTimeToMinutes(fromTime);
  const toMin = parseTimeToMinutes(toTime);
  if (toMin <= fromMin) return "End time must be after start time";
  if (date === todayIso() && fromMin < nowMinutes()) return "Start time cannot be in the past";
  return null;
}

function createEmptyForm() {
  const date = todayIso();
  const fromTime = nextSlotFromNow();
  return {
    date,
    fromTime,
    toTime: defaultToTime(fromTime),
    notes: "",
  };
}

const EMPTY_FORM = createEmptyForm();

/**
 * Dated one-off break blocks only — POST /schedules/:staffId/blocks now
 * rejects anything but "break" (422): manual bookings go through the real
 * booking flow (see "Add Booking" on the Calendar toolbar) and absences go
 * through leaves (see the Leaves & time off section below), per the current
 * Schedule API.
 */
const StaffOfflineBookingPanel = ({ staffId, staffName }: Props) => {
  const [blocks, setBlocks] = useState<StaffOfflineBlock[]>(() => getOfflineBlocksForStaff(staffId));
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffOfflineBlock | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const sync = () => setBlocks(getOfflineBlocksForStaff(staffId));
    sync();
    window.addEventListener(SCHEDULE_EVENT, sync);
    return () => window.removeEventListener(SCHEDULE_EVENT, sync);
  }, [staffId]);

  useEffect(() => {
    void fetchScheduleFor(staffId);
  }, [staffId]);

  const openForm = () => {
    if (formOpen) {
      setFormOpen(false);
      return;
    }
    setFormOpen(true);
    const base = createEmptyForm();
    const lunch = clampFormTimes(base.date, "13:00", "14:00");
    setForm({ ...base, ...lunch, notes: "Lunch break" });
  };

  const updateFormDate = (date: string) => {
    setForm((f) => {
      const safeDate = date < todayIso() ? todayIso() : date;
      const times = clampFormTimes(safeDate, f.fromTime, f.toTime);
      return { ...f, date: safeDate, ...times };
    });
  };

  const updateFormFromTime = (fromTime: string) => {
    setForm((f) => {
      const times = clampFormTimes(f.date, fromTime, f.toTime);
      return { ...f, ...times };
    });
  };

  const updateFormToTime = (toTime: string) => {
    setForm((f) => ({ ...f, toTime }));
  };

  const minDate = todayIso();
  const minFromTime = form.date === minDate ? minutesToTimeInput(nowMinutes()) : undefined;
  const minToTime =
    form.date === minDate
      ? minutesToTimeInput(Math.max(nowMinutes(), parseTimeToMinutes(form.fromTime) + 1))
      : minutesToTimeInput(parseTimeToMinutes(form.fromTime) + 1);

  const handleAdd = async () => {
    if (!form.date || !form.fromTime || !form.toTime || saving) return;
    const timeError = validateSchedule(form.date, form.fromTime, form.toTime);
    if (timeError) return;
    setSaving(true);
    const toastId = appToast.loading("Saving…");
    try {
      await addOfflineBlock({
        staffId,
        date: form.date,
        fromTime: form.fromTime,
        toTime: form.toTime,
        notes: form.notes,
      });
      appToast.dismiss(toastId);
      appToast.success("Break added to schedule");
      setForm((f) => ({ ...f, notes: "" }));
      setBlocks(getOfflineBlocksForStaff(staffId));
    } catch {
      appToast.dismiss(toastId);
      appToast.error("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const toastId = appToast.loading("Removing…");
    try {
      await removeOfflineBlock(staffId, deleteTarget.id);
      appToast.dismiss(toastId);
      const label = blockTypeLabel(deleteTarget).toLowerCase();
      appToast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} removed`);
      setDeleteTarget(null);
      setBlocks(getOfflineBlocksForStaff(staffId));
    } catch {
      appToast.dismiss(toastId);
      appToast.error("Could not remove. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const scheduleError = validateSchedule(form.date, form.fromTime, form.toTime);
  const canSubmit = !scheduleError;

  return (
    <>
      <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Coffee className="w-4 h-4 text-sky-600" />
            <p className="text-xs font-semibold text-slate-800 dark:text-white">One-off breaks</p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-1">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            To book {staffName} for a patient, use <strong>Add Booking</strong> on the Calendar
            toolbar. For time off, use Leaves &amp; time off below.
          </p>
        </div>

        <button
          type="button"
          onClick={openForm}
          className={`w-full py-2 px-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
            formOpen
              ? "bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300"
              : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          {formOpen ? "Close" : "Add a one-off break"}
        </button>

        {formOpen && (
          <div className="space-y-2.5 pt-1 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-3">
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={form.date}
                min={minDate}
                onChange={(e) => updateFormDate(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">From</label>
                <input
                  type="time"
                  value={form.fromTime}
                  min={minFromTime}
                  onChange={(e) => updateFormFromTime(e.target.value)}
                  className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">To</label>
                <input
                  type="time"
                  value={form.toTime}
                  min={minToTime}
                  onChange={(e) => updateFormToTime(e.target.value)}
                  className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
            {scheduleError && (
              <p className="text-[10px] text-red-600 dark:text-red-400">{scheduleError}</p>
            )}

            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Lunch break"
                className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!canSubmit || saving}
              className="w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-sky-600 hover:bg-sky-700 text-white"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : "Add break"}
            </button>
          </div>
        )}

        {blocks.length > 0 && (
          <ul className="space-y-1.5 max-h-[140px] overflow-y-auto pt-1">
            {blocks
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date) || a.fromTime.localeCompare(b.fromTime))
              .map((block) => (
                <li
                  key={block.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-[11px] bg-sky-50/80 dark:bg-sky-950/20 border-sky-200/70 dark:border-sky-800/50"
                >
                  <div className="min-w-0 flex items-start gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white truncate">
                        {block.date} · {formatBlockTimeRange(block)}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 truncate">
                        {block.notes || blockTypeLabel(block)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(block)}
                    className="text-slate-400 hover:text-red-500 flex-shrink-0"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <DeleteOfflineBlockModal
        open={Boolean(deleteTarget)}
        block={deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </>
  );
};

export default StaffOfflineBookingPanel;
