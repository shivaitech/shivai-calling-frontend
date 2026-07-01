import { Loader2, Trash2, X } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import type { StaffOfflineBlock } from "./offlineBlocksStore";
import {
  blockTypeLabel,
  formatBlockTimeRange,
  isManualBookingBlock,
} from "./offlineBlocksStore";
import { useAppointmentIndustry } from "./industryConfig";

interface Props {
  open: boolean;
  block: StaffOfflineBlock | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting?: boolean;
}

const DeleteOfflineBlockModal = ({
  open,
  block,
  onClose,
  onConfirm,
  deleting = false,
}: Props) => {
  const { terms } = useAppointmentIndustry();
  if (!block) return null;

  const isManual = isManualBookingBlock(block);
  const label = blockTypeLabel(block);

  return (
    <ModalOverlay open={open} panelClassName="max-w-sm" zIndex={120} onClose={onClose} closeOnBackdrop>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <div className="h-1 bg-red-500" />
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Remove {label.toLowerCase()}?</h2>
              <p className="text-xs text-slate-500">This cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300 space-y-1">
          <p>
            <span className="text-slate-500">When:</span> {block.date} · {formatBlockTimeRange(block)}
          </p>
          {isManual && block.patientName && (
            <p>
              <span className="text-slate-500">{terms.customer}:</span> {block.patientName}
            </p>
          )}
          {!isManual && block.notes && (
            <p>
              <span className="text-slate-500">Notes:</span> {block.notes}
            </p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default DeleteOfflineBlockModal;
