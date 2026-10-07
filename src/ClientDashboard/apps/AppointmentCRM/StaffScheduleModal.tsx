import { useState } from "react";
import { Clock, Loader2, Trash2, X } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import appToast from "../../../components/AppToast";
import StaffAvailabilityPanel from "./StaffAvailabilityPanel";
import StaffOfflineBookingPanel from "./StaffOfflineBookingPanel";
import { removeStaffMember } from "./staffStore";

interface Props {
  open: boolean;
  staffId: string | null;
  staffName: string;
  onClose: () => void;
  /** Fires after the staff member's calendar integration (schedule + branch
   * record) has been deleted, so the caller can close this modal and drop
   * them from the calendar view. */
  onRemoved?: () => void;
}

const StaffScheduleModal = ({ open, staffId, staffName, onClose, onRemoved }: Props) => {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  if (!staffId) return null;

  const handleRemove = async () => {
    if (removing || !staffId) return;
    setRemoving(true);
    const toastId = appToast.loading("Removing from calendar…");
    try {
      await removeStaffMember(staffId);
      appToast.dismiss(toastId);
      appToast.success(`${staffName} removed from the calendar`);
      setConfirmingRemove(false);
      onRemoved?.();
    } catch {
      appToast.dismiss(toastId);
      appToast.error("Could not remove this staff member. Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <ModalOverlay open={open} panelClassName="max-w-lg" zIndex={110} onClose={onClose} closeOnBackdrop={!removing}>
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

          {onRemoved && (
            <div className="pt-4 mt-1 border-t border-slate-100 dark:border-slate-800">
              {confirmingRemove ? (
                <div className="space-y-2 px-0.5">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Remove {staffName} from this calendar? Their schedule, breaks and leave will be deleted. This
                    can't be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingRemove(false)}
                      disabled={removing}
                      className="flex-1 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemove()}
                      disabled={removing}
                      className="flex-1 py-2 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      {removing ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingRemove(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove from calendar
                </button>
              )}
            </div>
          )}
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
