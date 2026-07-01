import { useEffect, useState } from "react";
import { Ban, CalendarPlus, Coffee, Loader2, Plus, Trash2 } from "lucide-react";
import appToast from "../../../components/AppToast";
import {
  StaffOfflineBlock,
  OfflineBlockType,
  addOfflineBlock,
  blockTypeLabel,
  formatBlockTimeRange,
  getOfflineBlocksForStaff,
  isManualBookingBlock,
  removeOfflineBlock,
} from "./offlineBlocksStore";
import { toIsoDate } from "./availabilityStore";
import { parseTimeToMinutes } from "./calendarUtils";
import { useAppointmentIndustry } from "./industryConfig";
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
    patientName: "",
    patientId: "",
    notes: "",
  };
}

const EMPTY_FORM = createEmptyForm();

function addSuccessMessage(
  type: OfflineBlockType,
  terms: { customer: string },
  patientName?: string,
): string {
  if (type === "manual_booking") {
    return patientName
      ? `Manual booking added for ${patientName}`
      : "Manual booking added";
  }
  if (type === "break") return "Break added to schedule";
  return "Time blocked as unavailable";
}

const StaffOfflineBookingPanel = ({ staffId, staffName }: Props) => {
  const { terms } = useAppointmentIndustry();
  const [blocks, setBlocks] = useState<StaffOfflineBlock[]>(() => getOfflineBlocksForStaff(staffId));
  const [activeForm, setActiveForm] = useState<OfflineBlockType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [patientNameError, setPatientNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffOfflineBlock | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const sync = () => setBlocks(getOfflineBlocksForStaff(staffId));
    sync();
    window.addEventListener(SCHEDULE_EVENT, sync);
    return () => window.removeEventListener(SCHEDULE_EVENT, sync);
  }, [staffId]);

  const openForm = (type: OfflineBlockType) => {
    if (activeForm === type) {
      setActiveForm(null);
      return;
    }
    setPatientNameError(null);
    setActiveForm(type);
    const base = createEmptyForm();
    if (type === "break") {
      const lunch = clampFormTimes(base.date, "13:00", "14:00");
      setForm({ ...base, ...lunch, notes: "Lunch break" });
    } else if (type === "manual_booking") {
      setForm({ ...base, notes: "" });
    } else {
      setForm({ ...base, notes: "" });
    }
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
    if (!activeForm || !form.date || !form.fromTime || !form.toTime || saving) return;
    const timeError = validateSchedule(form.date, form.fromTime, form.toTime);
    if (timeError) return;
    if (activeForm === "manual_booking" && !form.patientName.trim()) {
      setPatientNameError(`${terms.customer} name is required`);
      return;
    }
    setPatientNameError(null);
    setSaving(true);
    const toastId = appToast.loading("Saving…");
    try {
      const patientName = form.patientName.trim();
      await addOfflineBlock({
        staffId,
        date: form.date,
        fromTime: form.fromTime,
        toTime: form.toTime,
        type: activeForm,
        patientName: activeForm === "manual_booking" ? patientName : undefined,
        patientId: activeForm === "manual_booking" ? form.patientId : undefined,
        notes: form.notes,
      });
      appToast.dismiss(toastId);
      appToast.success(addSuccessMessage(activeForm, terms, patientName));
      setForm((f) => ({ ...f, patientName: "", patientId: "", notes: "" }));
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
      await removeOfflineBlock(deleteTarget.id);
      appToast.dismiss(toastId);
      const label = blockTypeLabel(deleteTarget).toLowerCase();
      appToast.success(
        isManualBookingBlock(deleteTarget) && deleteTarget.patientName
          ? `Removed booking for ${deleteTarget.patientName}`
          : `${label.charAt(0).toUpperCase() + label.slice(1)} removed`,
      );
      setDeleteTarget(null);
      setBlocks(getOfflineBlocksForStaff(staffId));
    } catch {
      appToast.dismiss(toastId);
      appToast.error("Could not remove. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const manualBookingReady =
    activeForm !== "manual_booking" || Boolean(form.patientName.trim());
  const scheduleError = validateSchedule(form.date, form.fromTime, form.toTime);
  const canSubmit = manualBookingReady && !scheduleError;

  const tabs: { type: OfflineBlockType; label: string; icon: typeof CalendarPlus }[] = [
    { type: "manual_booking", label: "Manual booking", icon: CalendarPlus },
    { type: "unavailable", label: "Unavailable", icon: Ban },
    { type: "break", label: "Lunch / break", icon: Coffee },
  ];

  return (
    <>
      <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarPlus className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-semibold text-slate-800 dark:text-white">Manual booking & block slots</p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Choose an action below — the form opens when you tap Manual booking, Unavailable, or Lunch / break.
          </p>
        </div>

        <div className="flex gap-1.5">
          {tabs.map(({ type, label, icon: Icon }) => {
            const active = activeForm === type;
            const isManual = type === "manual_booking";
            const isBreak = type === "break";
            return (
              <button
                key={type}
                type="button"
                onClick={() => openForm(type)}
                className={`flex-1 py-2 px-1.5 rounded-lg text-[10px] font-medium border transition-colors flex flex-col items-center gap-1 ${
                  active
                    ? isManual
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                      : isBreak
                        ? "bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-200"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {activeForm && (
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

            {activeForm === "manual_booking" && (
              <>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    {terms.customer} name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.patientName}
                    onChange={(e) => {
                      setPatientNameError(null);
                      setForm((f) => ({ ...f, patientName: e.target.value }));
                    }}
                    placeholder={`${staffName}'s walk-in ${terms.customer.toLowerCase()}`}
                    required
                    aria-invalid={Boolean(patientNameError)}
                    className={`mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border ${
                      patientNameError
                        ? "border-red-400 dark:border-red-500 ring-1 ring-red-400/30"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  {patientNameError && (
                    <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">{patientNameError}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    {terms.customer} ID
                  </label>
                  <input
                    value={form.patientId}
                    onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                    placeholder="e.g. UHID-10482"
                    className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder={
                  activeForm === "unavailable"
                    ? "e.g. Surgery, meeting"
                    : activeForm === "break"
                      ? "e.g. Lunch break"
                      : "Optional"
                }
                className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!canSubmit || saving}
              className={`w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeForm === "manual_booking"
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : activeForm === "break"
                    ? "bg-sky-600 hover:bg-sky-700 text-white"
                    : "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 text-white"
              }`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {saving
                ? "Saving…"
                : activeForm === "manual_booking"
                  ? "Add manual booking"
                  : activeForm === "break"
                    ? "Add break"
                    : "Block as unavailable"}
            </button>
          </div>
        )}

        {blocks.length > 0 && (
          <ul className="space-y-1.5 max-h-[140px] overflow-y-auto pt-1">
            {blocks
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date) || a.fromTime.localeCompare(b.fromTime))
              .map((block) => {
                const isManual = isManualBookingBlock(block);
                const isBreak = block.type === "break";
                return (
                  <li
                    key={block.id}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-[11px] ${
                      isManual
                        ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/50"
                        : isBreak
                          ? "bg-sky-50/80 dark:bg-sky-950/20 border-sky-200/70 dark:border-sky-800/50"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex items-start gap-1.5">
                      {isManual ? (
                        <CalendarPlus className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      ) : isBreak ? (
                        <Coffee className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Ban className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-white truncate">
                          {block.date} · {formatBlockTimeRange(block)}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 truncate">
                          {isManual
                            ? [block.patientName || "Manual booking", block.patientId].filter(Boolean).join(" · ")
                            : block.notes || blockTypeLabel(block)}
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
                );
              })}
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
