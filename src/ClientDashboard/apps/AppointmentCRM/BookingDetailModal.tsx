import { useEffect, useState } from "react";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import appToast from "../../../components/AppToast";
import type { Booking } from "./mockData";
import { bookingStatusMeta } from "./mockData";
import { formatTimeRange, getBookingDuration, getBookingStartMinutes } from "./calendarUtils";
import {
  bookingIsoDate,
  cancelBookingRecord,
  rescheduleBookingRecord,
  setBookingOutcomeRecord,
  useBookings,
} from "./bookingsStore";
import { toIsoDate } from "./availabilityStore";
import { useAppointmentIndustry } from "./industryConfig";

interface Props {
  open: boolean;
  booking: Booking | null;
  staffLabel: string;
  customerLabel: string;
  onClose: () => void;
}

type Mode = "view" | "confirmCancel" | "reschedule";

const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const fromHHMM = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const INPUT =
  "mt-1 w-full px-2.5 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white";

const BookingDetailModal = ({ open, booking: initialBooking, staffLabel, customerLabel, onClose }: Props) => {
  // Show the live cached copy so status/time changes made here appear at once.
  const liveBookings = useBookings();
  const booking = initialBooking ? liveBookings.find((b) => b.id === initialBooking.id) ?? initialBooking : null;
  const { terms, fields } = useAppointmentIndustry();
  const [mode, setMode] = useState<Mode>("view");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ date: "", from: "", to: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode("view");
    setError(null);
  }, [initialBooking?.id]);

  if (!booking) return null;

  const startMin = getBookingStartMinutes(booking);
  const duration = getBookingDuration(booking);
  const status = bookingStatusMeta(booking.status);
  const isoDate = bookingIsoDate(booking);
  const today = toIsoDate(new Date());
  // Attended / no-show only make sense once the start time has passed.
  const hasStarted = isoDate < today || (isoDate === today && startMin <= nowMinutes());
  const isBooked = booking.status === "booked";
  const appt = terms.appointment.toLowerCase();

  const reset = () => {
    setMode("view");
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const run = async (loading: string, success: string, failure: string, action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const toastId = appToast.loading(loading);
    try {
      await action();
      appToast.dismiss(toastId);
      appToast.success(success);
      reset();
    } catch (err) {
      appToast.dismiss(toastId);
      const message = err instanceof Error && err.message ? err.message : failure;
      appToast.error(message);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const openReschedule = () => {
    setDraft({ date: isoDate < today ? today : isoDate, from: toHHMM(startMin), to: toHHMM(startMin + duration) });
    setError(null);
    setMode("reschedule");
  };

  const draftError = (() => {
    if (mode !== "reschedule") return null;
    if (!draft.date || !draft.from || !draft.to) return "Pick a date and time";
    if (fromHHMM(draft.to) <= fromHHMM(draft.from)) return "End time must be after the start time";
    if (draft.date < today || (draft.date === today && fromHHMM(draft.from) <= nowMinutes())) {
      return "That time has already passed — pick a later slot";
    }
    return null;
  })();

  return (
    <ModalOverlay open={open} panelClassName="max-w-md" zIndex={110} onClose={handleClose} closeOnBackdrop={!busy}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 flex-shrink-0" />
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              {booking.id}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5">{customerLabel}</p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white -mt-0.5">{booking.customer}</h2>
            <span className={`inline-flex mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${status.cls}`}>
              {status.label}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 text-sm overflow-y-auto">
          <DetailRow icon={Clock} label="When">
            {formatTimeRange(startMin, duration)}
            <span className="text-slate-400"> · {booking.date}</span>
          </DetailRow>
          <DetailRow icon={User} label={staffLabel}>{booking.provider}</DetailRow>
          {(booking.service || booking.appointmentType) && (
            <DetailRow icon={Calendar} label="Service">
              {[booking.service, booking.appointmentType].filter(Boolean).join(" · ")}
            </DetailRow>
          )}
          {booking.branchName && <DetailRow icon={MapPin} label={terms.branch}>{booking.branchName}</DetailRow>}
          {booking.departmentName && (
            <DetailRow icon={MapPin} label={terms.department}>{booking.departmentName}</DetailRow>
          )}
          {booking.phone && <DetailRow icon={Phone} label="Phone">{booking.phone}</DetailRow>}
          {booking.email && (
            <DetailRow icon={Mail} label="Email">{booking.email}</DetailRow>
          )}
          {Object.entries(booking.customFields ?? {}).map(([key, value]) => (
            <DetailRow key={key} icon={FileText} label={fields.find((f) => f.key === key)?.label ?? key}>
              {value}
            </DetailRow>
          ))}
          {booking.notes && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 flex-shrink-0">
          {mode === "confirmCancel" && (
            <div className="space-y-2">
              <p className="text-xs text-red-600 dark:text-red-400">
                Cancel this {appt}? This frees up the slot and can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={busy}
                  className="flex-1 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Keep {appt}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void run("Cancelling…", `${terms.appointment} cancelled`, `Could not cancel this ${appt}. Please try again.`, () =>
                      cancelBookingRecord(booking.id),
                    )
                  }
                  disabled={busy}
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  {busy ? "Cancelling…" : `Cancel ${appt}`}
                </button>
              </div>
            </div>
          )}

          {mode === "reschedule" && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Move to a new time</p>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-[10px] text-slate-500">
                  Date
                  <input
                    type="date"
                    min={today}
                    value={draft.date}
                    onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                    className={INPUT}
                  />
                </label>
                <label className="text-[10px] text-slate-500">
                  From
                  <input
                    type="time"
                    step={900}
                    value={draft.from}
                    onChange={(e) => {
                      // Keep the same length when the start moves.
                      const nextFrom = e.target.value;
                      setDraft((d) => ({ ...d, from: nextFrom, to: toHHMM(Math.min(fromHHMM(nextFrom) + duration, 23 * 60 + 59)) }));
                    }}
                    className={INPUT}
                  />
                </label>
                <label className="text-[10px] text-slate-500">
                  To
                  <input
                    type="time"
                    step={900}
                    value={draft.to}
                    onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                    className={INPUT}
                  />
                </label>
              </div>
              {(draftError || error) && (
                <p className="text-[11px] text-red-600 dark:text-red-400">{draftError ?? error}</p>
              )}
              <p className="text-[10px] text-slate-400">
                Same {terms.provider.toLowerCase()}. The {customerLabel.toLowerCase()} is notified by your reminder rules.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={busy}
                  className="flex-1 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void run("Rescheduling…", `${terms.appointment} moved`, `Could not move this ${appt}. Please try again.`, () =>
                      rescheduleBookingRecord(booking.id, { dateIso: draft.date, time: draft.from, endTime: draft.to }),
                    )
                  }
                  disabled={busy || Boolean(draftError)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium common-button-bg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarClock className="w-3.5 h-3.5" />}
                  {busy ? "Saving…" : "Save new time"}
                </button>
              </div>
            </div>
          )}

          {mode === "view" && (
            <>
              {isBooked && (
                <div className="flex flex-wrap gap-2">
                  {hasStarted ? (
                    <>
                      <ActionButton
                        icon={CheckCircle2}
                        tone="sky"
                        disabled={busy}
                        onClick={() =>
                          void run("Saving…", `Marked as completed`, `Could not update this ${appt}.`, () =>
                            setBookingOutcomeRecord(booking.id, "completed"),
                          )
                        }
                      >
                        Completed
                      </ActionButton>
                      <ActionButton
                        icon={UserX}
                        tone="amber"
                        disabled={busy}
                        onClick={() =>
                          void run("Saving…", `Marked as no-show`, `Could not update this ${appt}.`, () =>
                            setBookingOutcomeRecord(booking.id, "no_show"),
                          )
                        }
                      >
                        No-show
                      </ActionButton>
                    </>
                  ) : (
                    <ActionButton icon={CalendarClock} tone="violet" disabled={busy} onClick={openReschedule}>
                      Reschedule
                    </ActionButton>
                  )}
                  <ActionButton icon={XCircle} tone="red" disabled={busy} onClick={() => setMode("confirmCancel")}>
                    Cancel
                  </ActionButton>
                </div>
              )}
              {error && <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>}
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl text-sm font-medium common-button-bg"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
};

const TONES = {
  violet: "text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60 hover:bg-violet-50 dark:hover:bg-violet-950/30",
  sky: "text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/30",
  amber: "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30",
  red: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20",
} as const;

const ActionButton = ({
  icon: Icon,
  tone,
  disabled,
  onClick,
  children,
}: {
  icon: React.ElementType;
  tone: keyof typeof TONES;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 min-w-[96px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors disabled:opacity-50 ${TONES[tone]}`}
  >
    <Icon className="w-3.5 h-3.5" /> {children}
  </button>
);

const DetailRow = ({
  icon: Icon,
  label,
  children,
  capitalize,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  capitalize?: boolean;
}) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-slate-800 dark:text-white ${capitalize ? "capitalize" : ""}`}>{children}</p>
    </div>
  </div>
);

export default BookingDetailModal;
