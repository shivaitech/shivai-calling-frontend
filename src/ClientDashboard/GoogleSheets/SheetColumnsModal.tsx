import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, X, Columns3, Check } from 'lucide-react';
import { authAPI, SheetColumn } from '../../services/authAPI';
import SheetColumnEditor from './SheetColumnEditor';
import {
  applyAiFillDefaults,
  cloneColumns,
  ensureRecordIdColumn,
  mergeColumnsFromSheet,
  normalizeColumnsForApi,
  normalizeFetchedColumns,
} from './sheetColumnUtils';
import {
  buildAssignmentConfig,
  buildFullIntegrationConfig,
  GoogleSheetsIntegrationConfig,
  hasAutoAssignment,
} from './sheetTypes';

export type SheetColumnsModalMode = 'integration' | 'draft';

export interface SheetColumnsModalTarget {
  mode: SheetColumnsModalMode;
  sheetName: string;
  columns?: SheetColumn[];
  /** Required for integration mode */
  sheetId?: string;
  tabName?: string;
  integrationId?: string;
  credentialId?: string;
  config?: GoogleSheetsIntegrationConfig;
  timezone?: string;
}

interface SheetColumnsModalProps {
  target: SheetColumnsModalTarget | null;
  onClose: () => void;
  onSaved?: (
    integrationId: string,
    columns: SheetColumn[],
    fullConfig: ReturnType<typeof buildFullIntegrationConfig>,
  ) => void;
  onDraftApply?: (columns: SheetColumn[]) => void;
}

const SheetColumnsModal = ({
  target,
  onClose,
  onSaved,
  onDraftApply,
}: SheetColumnsModalProps) => {
  const [draftColumns, setDraftColumns] = useState<SheetColumn[]>([]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [syncNote, setSyncNote] = useState('');

  const isDraft = target?.mode === 'draft';

  useEffect(() => {
    if (!target) return;
    setDraftColumns(applyAiFillDefaults(ensureRecordIdColumn(cloneColumns(target.columns ?? []))));
    setError('');
    setSuccess(false);
    setSyncNote('');
  }, [target]);

  if (!target) return null;

  const handleSyncFromSheet = async () => {
    if (!target.sheetId) return;
    setSyncing(true);
    setError('');
    setSyncNote('');
    try {
      const raw = await authAPI.fetchSheetColumns(target.sheetId, {
        tab_name: target.tabName,
        credential_id: target.credentialId,
      });
      const fetched = normalizeFetchedColumns(raw);
      if (!fetched.length) {
        setError('No column headers found in the sheet. Add a header row in Google Sheets first.');
        return;
      }
      const merged = mergeColumnsFromSheet(fetched, draftColumns);
      setDraftColumns(merged);
      setSyncNote(
        `Synced ${fetched.length} column${fetched.length === 1 ? '' : 's'} from Google Sheets.`,
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setError(msg ?? 'Could not fetch columns from the sheet.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    const normalized = normalizeColumnsForApi(draftColumns);
    if (!normalized.length) {
      setError('Add at least one column with a name and field key.');
      return;
    }

    if (isDraft) {
      onDraftApply?.(normalized);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 500);
      return;
    }

    if (!target.integrationId || target.integrationId.startsWith('tmp-')) {
      setError('Save the sheet integration first before updating columns.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const gs = target.config;
      let assignment = gs?.assignment;
      if (hasAutoAssignment(gs)) {
        assignment = buildAssignmentConfig({
          directorySheetId: gs!.assignment!.directory_sheet_id,
          directorySheetName: gs!.assignment!.directory_sheet_name,
          directoryTabName: gs!.assignment!.directory_tab_name,
          dataSheetColumns: normalized,
        });
      }

      const fullConfig = buildFullIntegrationConfig({
        sheetId: target.sheetId!,
        sheetName: gs?.sheet_name ?? target.sheetName,
        tabName: target.tabName ?? gs?.tab_name,
        columns: normalized,
        assignment,
        timezone: target.timezone,
      });

      await authAPI.updateIntegration(target.integrationId, { config: fullConfig });
      setSuccess(true);
      onSaved?.(target.integrationId, normalized, fullConfig);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 900);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setError(msg ?? 'Failed to save columns. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[min(760px,94vw)] max-h-[min(90vh,780px)] border border-slate-200/80 dark:border-slate-700 flex flex-col overflow-hidden"
        role="dialog"
        aria-labelledby="columns-modal-title"
      >
        {/* Header — fixed */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              <Columns3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2
                id="columns-modal-title"
                className="text-sm font-semibold text-slate-800 dark:text-white"
              >
                {isDraft ? 'Manage columns' : 'Manage columns & roles'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {target.sheetName}
                {isDraft && (
                  <span className="text-slate-400"> · {draftColumns.length} columns</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 flex-shrink-0">
          {!isDraft && target.sheetId && (
            <button
              type="button"
              onClick={handleSyncFromSheet}
              disabled={syncing || saving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium common-button-bg2 disabled:opacity-50"
            >
              {syncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Sync from Sheet
            </button>
          )}
          {isDraft && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Template columns are pre-filled. Adjust names and roles if needed.
            </p>
          )}
          {syncNote && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">{syncNote}</span>
          )}
        </div>

        {/* Body — scroll only inside table if many rows */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <SheetColumnEditor
            columns={draftColumns}
            onChange={setDraftColumns}
            disabled={saving}
            compact
          />
        </div>

        {error && (
          <p className="mx-5 mb-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 flex-shrink-0">
            {error}
          </p>
        )}

        {/* Footer — fixed */}
        <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || success}
            className="flex-1 py-2 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" /> {isDraft ? 'Applied!' : 'Saved!'}
              </>
            ) : isDraft ? (
              'Apply columns'
            ) : (
              'Save columns'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SheetColumnsModal;
