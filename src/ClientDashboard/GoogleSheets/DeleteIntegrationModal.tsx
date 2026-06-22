import {
  AlertTriangle,
  Check,
  FileSpreadsheet,
  Link2,
  Loader2,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import ModalOverlay from '../../components/ModalOverlay';

interface DeleteIntegrationModalProps {
  open: boolean;
  sheetName: string;
  integrationId?: string;
  hasLinkedRoster?: boolean;
  deleting: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

const KEPT_ITEMS = [
  'Google Sheet file in your Drive',
  'All rows and cell data in the sheet',
];

const REMOVED_ITEMS = [
  'ShivAI agent link to this sheet',
  'Column roles and integration config',
];

const DeleteIntegrationModal = ({
  open,
  sheetName,
  integrationId,
  hasLinkedRoster,
  deleting,
  error,
  onClose,
  onConfirm,
}: DeleteIntegrationModalProps) => {
  const shortId =
    integrationId && integrationId.length > 10
      ? `${integrationId.slice(0, 6)}…${integrationId.slice(-4)}`
      : integrationId;

  return (
    <ModalOverlay
      open={open}
      panelClassName="max-w-[420px]"
      onClose={onClose}
      closeOnBackdrop={!deleting}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full border border-slate-200/80 dark:border-slate-700 overflow-hidden"
        aria-labelledby="delete-integration-title"
      >
        <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400" />

        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h2
                  id="delete-integration-title"
                  className="text-base font-semibold text-slate-900 dark:text-white"
                >
                  Delete integration?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This cannot be undone from ShivAI.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Integration
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate" title={sheetName}>
                {sheetName}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
                Stays in Drive
              </p>
              <ul className="space-y-1.5">
                {KEPT_ITEMS.map(item => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-red-200/60 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/15 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
                Removed from ShivAI
              </p>
              <ul className="space-y-1.5">
                {REMOVED_ITEMS.map(item => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <X className="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {hasLinkedRoster && (
            <div className="mt-3 flex gap-2.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                Staff roster link and auto-assignment rules for this sheet will also be removed.
                The roster Google Sheet is not deleted.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {shortId && (
            <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mb-3 font-mono">
              <Link2 className="w-3 h-3" />
              ID {shortId}
            </p>
          )}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default DeleteIntegrationModal;
