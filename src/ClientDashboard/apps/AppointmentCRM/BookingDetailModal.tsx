import { useState } from "react";
import { Calendar, Clock, Loader2, Mail, MapPin, Phone, User, X, XCircle } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import appToast from "../../../components/AppToast";
import type { Booking } from "./mockData";
import { bookingStatusMeta } from "./mockData";
import { formatTimeRange, getBookingDuration, getBookingStartMinutes } from "./calendarUtils";
import { cancelBookingRecord } from "./bookingsStore";

interface Props {
  open: boolean;
  booking: Booking | null;
  staffLabel: string;
  customerLabel: string;
  onClose: () => void;
}

const BookingDetailModal = ({ open, booking, staffLabel, customerLabel, onClose }: Props) => {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!booking) return null;

  const startMin = getBookingStartMinutes(booking);
  const duration = getBookingDuration(booking);
  const status = bookingStatusMeta(booking.status);

  const handleClose = () => {
    if (cancelling) return;
    setConfirmingCancel(false);
    onClose();
  };

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    const toastId = appToast.loading("Cancelling…");
    try {
      await cancelBookingRecord(booking.id);
      appToast.dismiss(toastId);
      appToast.success("Booking cancelled");
      setConfirmingCancel(false);
    } catch {
      appToast.dismiss(toastId);
      appToast.error("Could not cancel this booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <ModalOverlay open={open} panelClassName="max-w-md" zIndex={110} onClose={handleClose} closeOnBackdrop={!cancelling}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
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

        <div className="px-5 py-4 space-y-3 text-sm">
          <DetailRow icon={Clock} label="When">
            {formatTimeRange(startMin, duration)}
            <span className="text-slate-400"> · {booking.date}</span>
          </DetailRow>
          <DetailRow icon={User} label={staffLabel}>{booking.provider}</DetailRow>
          <DetailRow icon={Calendar} label="Service">{booking.service} · {booking.appointmentType}</DetailRow>
          <DetailRow icon={MapPin} label="Branch">{booking.branchName}</DetailRow>
          {booking.departmentName && (
            <DetailRow icon={MapPin} label="Department">{booking.departmentName}</DetailRow>
          )}
          <DetailRow icon={Phone} label="Phone">{booking.phone}</DetailRow>
          {booking.email && (
            <DetailRow icon={Mail} label="Email">{booking.email}</DetailRow>
          )}
          {booking.notes && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          {confirmingCancel ? (
            <div className="space-y-2">
              <p className="text-xs text-red-600 dark:text-red-400">
                Cancel this booking? This frees up the slot and can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(false)}
                  disabled={cancelling}
                  className="flex-1 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Keep booking
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  disabled={cancelling}
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  {cancelling ? "Cancelling…" : "Cancel booking"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {booking.status === "booked" && (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel booking
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
};

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
