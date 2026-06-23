import { Ban, CalendarPlus, Clock, Coffee, X } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import type { StaffOfflineBlock } from "./offlineBlocksStore";
import { blockTypeLabel, formatBlockTimeRange, isManualBookingBlock } from "./offlineBlocksStore";
import { useAppointmentIndustry } from "./industryConfig";

interface Props {
  open: boolean;
  block: StaffOfflineBlock | null;
  staffName: string;
  onClose: () => void;
  onRemove?: (id: string) => void;
}

const OfflineBlockDetailModal = ({ open, block, staffName, onClose, onRemove }: Props) => {
  const { terms } = useAppointmentIndustry();
  if (!block) return null;

  const isManual = isManualBookingBlock(block);
  const isBreak = block.type === "break";
  const accent = isManual ? "bg-amber-500" : isBreak ? "bg-sky-500" : "bg-slate-500";

  return (
    <ModalOverlay open={open} panelClassName="max-w-sm" zIndex={110} onClose={onClose} closeOnBackdrop>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <div className={`h-1 ${accent}`} />
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isManual
                  ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                  : isBreak
                    ? "bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800"
                    : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {isManual ? (
                <CalendarPlus className="w-5 h-5 text-amber-600" />
              ) : isBreak ? (
                <Coffee className="w-5 h-5 text-sky-600" />
              ) : (
                <Ban className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{blockTypeLabel(block)}</h2>
              <p className="text-xs text-slate-500">{staffName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{block.date} · {formatBlockTimeRange(block)}</span>
          </div>
          {isManual && block.patientName && (
            <p><span className="text-slate-500">{terms.customer} name:</span> {block.patientName}</p>
          )}
          {isManual && block.patientId && (
            <p><span className="text-slate-500">{terms.customer} ID:</span> {block.patientId}</p>
          )}
          {block.notes && (
            <p><span className="text-slate-500">Notes:</span> {block.notes}</p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                onRemove(block.id);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Remove
            </button>
          )}
          <button type="button" onClick={onClose} className={`${onRemove ? "flex-1" : "w-full"} py-2.5 rounded-xl text-sm font-medium common-button-bg`}>
            Close
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default OfflineBlockDetailModal;
