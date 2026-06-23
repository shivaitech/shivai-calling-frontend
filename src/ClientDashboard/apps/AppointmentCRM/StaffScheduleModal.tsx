import { Clock, X } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import StaffAvailabilityPanel from "./StaffAvailabilityPanel";
import StaffOfflineBookingPanel from "./StaffOfflineBookingPanel";

interface Props {
  open: boolean;
  staffId: string | null;
  staffName: string;
  onClose: () => void;
}

const StaffScheduleModal = ({ open, staffId, staffName, onClose }: Props) => {
  if (!staffId) return null;

  return (
    <ModalOverlay open={open} panelClassName="max-w-lg" zIndex={110} onClose={onClose} closeOnBackdrop>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 flex-shrink-0" />
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">{staffName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hours, manual bookings & leave</p>
            </div>
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
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-0">
          <StaffOfflineBookingPanel staffId={staffId} staffName={staffName} />
          <StaffAvailabilityPanel staffId={staffId} staffName={staffName} />
        </div>
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium common-button-bg"
          >
            Done
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default StaffScheduleModal;
