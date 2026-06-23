import { Calendar, Clock, Mail, MapPin, Phone, User, X } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import type { Booking } from "./mockData";
import { bookingStatusMeta } from "./mockData";
import { formatTimeRange, getBookingDuration, getBookingStartMinutes } from "./calendarUtils";

interface Props {
  open: boolean;
  booking: Booking | null;
  staffLabel: string;
  customerLabel: string;
  onClose: () => void;
}

const BookingDetailModal = ({ open, booking, staffLabel, customerLabel, onClose }: Props) => {
  if (!booking) return null;

  const startMin = getBookingStartMinutes(booking);
  const duration = getBookingDuration(booking);
  const status = bookingStatusMeta(booking.status);

  return (
    <ModalOverlay open={open} panelClassName="max-w-md" zIndex={110} onClose={onClose} closeOnBackdrop>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              {booking.id}
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{booking.customer}</h2>
            <span className={`inline-flex mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${status.cls}`}>
              {status.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
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
          <DetailRow icon={Calendar} label="Channel" capitalize>
            {booking.channel.replace("-", " ")}
          </DetailRow>
          {booking.notes && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium common-button-bg"
          >
            Close
          </button>
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
