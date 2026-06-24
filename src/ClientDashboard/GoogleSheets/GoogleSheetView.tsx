import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/authAPI';
import { agentAPI, ApiAgent } from '../../services/agentAPI';
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Loader2,
  Check,
  X,
  RefreshCw,
  UserCog,
  Trash2,
  Settings2,
} from 'lucide-react';
import ModalOverlay from '../../components/ModalOverlay';
import SheetColumnsModal, { SheetColumnsModalTarget } from './SheetColumnsModal';
import DeleteIntegrationModal from './DeleteIntegrationModal';
import AgentPickerField from './AgentPickerField';
import { getLinkedGoogleSheetsAgentIds } from './agentPickerUtils';
import {
  buildFullIntegrationConfig,
  isDirectorySheet,
  getDirectorySheetId,
  DEFAULT_DIRECTORY_TAB_NAME,
  GoogleSheetsIntegrationConfig,
  buildSheetIframeUrl,
  isGoogleSheetRecent,
  NEW_SHEET_WARM_MS,
  IFRAME_READY_DELAY_MS,
  IFRAME_LOAD_FALLBACK_MS,
} from './sheetTypes';

const SheetIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#0F9D58" />
    <rect x="7" y="7" width="4" height="10" rx="0.5" fill="white" fillOpacity="0.9" />
    <rect x="13" y="7" width="4" height="10" rx="0.5" fill="white" fillOpacity="0.9" />
    <rect x="7" y="11" width="10" height="1.5" fill="#0F9D58" />
  </svg>
);

const GoogleSheetView = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sheetName = searchParams.get('name') ?? 'Google Sheet';
  const isNew = searchParams.get('new') === 'true';
  const isDirectoryParam = searchParams.get('role') === 'directory';
  const gidParam = searchParams.get('gid');

  const [displayName, setDisplayName] = useState(sheetName);

  useEffect(() => {
    setDisplayName(sheetName);
  }, [sheetName]);

  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const [warming, setWarming] = useState(false);

  // Existing assignment (fetched on mount)
  const [existingIntegrationId, setExistingIntegrationId] = useState('');
  const [assignedAgentName, setAssignedAgentName] = useState('');

  // Assign modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [sheetIntegrations, setSheetIntegrations] = useState<unknown[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const [credentialId, setCredentialId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [sheetRole, setSheetRole] = useState<'data' | 'directory'>('data');
  const [linkedDataSheet, setLinkedDataSheet] = useState<{ id: string; name: string } | null>(null);
  const [linkedStaffRoster, setLinkedStaffRoster] = useState<{ id: string; name: string } | null>(null);
  const [integrationConfig, setIntegrationConfig] = useState<GoogleSheetsIntegrationConfig | null>(null);
  const [integrationTimezone, setIntegrationTimezone] = useState<string | undefined>();
  const [columnsModalTarget, setColumnsModalTarget] = useState<SheetColumnsModalTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!id) return;
    setIframeLoaded(false);
    setIframeKey(k => k + 1);
    setWarming(isNew || isGoogleSheetRecent(id));
    setIframeSrc(buildSheetIframeUrl(id, gidParam ? { gid: gidParam } : undefined));
  }, [id, isNew, gidParam]);

  useEffect(() => {
    if (!id || !warming) return;
    const timer = setTimeout(() => setWarming(false), NEW_SHEET_WARM_MS);
    return () => clearTimeout(timer);
  }, [id, warming]);

  useEffect(() => {
    if (!id || warming || iframeLoaded) return;
    const timer = setTimeout(() => setIframeLoaded(true), IFRAME_LOAD_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [id, warming, iframeLoaded]);

  // Fetch existing assignment on mount so the button reflects current state
  useEffect(() => {
    if (!id) return;
    Promise.all([
      authAPI.getIntegrations('google_sheets').catch(() => []),
      agentAPI.getAgents().catch(() => []),
    ]).then(([integrations, agentList]) => {
      const integrationList = integrations as any[];
      setSheetIntegrations(integrationList);
      const existing = integrationList.find((i: any) =>
        i.config?.google_sheets?.sheet_id === id || i.sheet_id === id
      );

      const parentForDirectory = integrationList.find((i: any) => {
        const gs = i.config?.google_sheets as GoogleSheetsIntegrationConfig | undefined;
        return getDirectorySheetId(gs) === id;
      });

      const isDirectory = isDirectoryParam || isDirectorySheet(id!, integrationList);

      if (isDirectory) {
        setSheetRole('directory');
        if (parentForDirectory) {
          const parentGs = parentForDirectory.config?.google_sheets as GoogleSheetsIntegrationConfig;
          setLinkedDataSheet({
            id: parentGs.sheet_id,
            name: parentGs.sheet_name || parentForDirectory.label || 'Data Sheet',
          });
          if (parentGs.assignment?.directory_sheet_name) {
            setDisplayName(parentGs.assignment.directory_sheet_name);
          }
          const agentId = parentForDirectory.agent_id ?? parentForDirectory.agentId ?? '';
          const agent = (agentList as ApiAgent[]).find(a => a.id === agentId);
          setAssignedAgentName(agent?.name ?? '');
        }
        return;
      }

      if (existing) {
        setExistingIntegrationId(existing._id ?? existing.id ?? '');
        const agentId = existing.agent_id ?? existing.agentId ?? '';
        const agent = (agentList as ApiAgent[]).find(a => a.id === agentId);
        setAssignedAgentName(agent?.name ?? '');
        setSelectedAgentId(agentId);

        const gs = existing.config?.google_sheets as GoogleSheetsIntegrationConfig | undefined;
        setSheetRole('data');
        setIntegrationConfig(gs ?? null);
        setIntegrationTimezone(existing.config?.timezone);
        const directoryId = getDirectorySheetId(gs);
        if (directoryId) {
          setLinkedStaffRoster({
            id: directoryId,
            name: gs?.assignment?.directory_sheet_name || 'Staff Directory',
          });
        }
      }
    });
  }, [id, isDirectoryParam]);

  const handleIframeLoad = () => {
    window.setTimeout(() => setIframeLoaded(true), IFRAME_READY_DELAY_MS);
  };

  const assignBlockedAgentIds = useMemo(
    () => getLinkedGoogleSheetsAgentIds(sheetIntegrations, { excludeSheetId: id }),
    [sheetIntegrations, id],
  );

  const openAssignModal = async () => {
    setAssignOpen(true);
    setAssignSuccess(false);
    setAssignError('');
    try {
      const oauthStatus = await authAPI.getOAuthStatus();
      const googleCred = oauthStatus.find(s => s.provider?.includes('google'));
      setCredentialId(googleCred?.credential_id ?? '');
    } catch {
      // ignore
    }
  };

  const handleAssignSave = async () => {
    if (!id || !selectedAgentId) return;
    if (assignBlockedAgentIds.has(selectedAgentId)) {
      setAssignError('This AI employee is already linked to another sheet.');
      return;
    }
    setAssigning(true);
    setAssignError('');
    try {
      if (existingIntegrationId) {
        await authAPI.updateIntegration(existingIntegrationId, { agent_id: selectedAgentId });
      } else {
        await authAPI.createIntegration({
          agent_id: selectedAgentId,
          service_name: 'google_sheets',
          label: sheetName,
          credential_id: credentialId,
          config: {
            google_sheets: {
              sheet_id: id,
              sheet_name: sheetName,
              tab_name: 'Sheet1',
            },
          },
        });
      }
      // Update local state so button reflects new assignment immediately
      const saved = agents.find(a => a.id === selectedAgentId);
      setAssignedAgentName(saved?.name ?? '');
      setAssignSuccess(true);
      setTimeout(() => {
        setAssignOpen(false);
        setAssignSuccess(false);
      }, 1500);
    } catch (err: any) {
      setAssignError(err?.response?.data?.message ?? 'Failed to assign. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const tabFromUrl = searchParams.get('tab') ?? undefined;

  const openColumnsModal = () => {
    if (!id || !existingIntegrationId || sheetRole === 'directory') return;
    setColumnsModalTarget({
      mode: 'integration',
      sheetId: id,
      sheetName: displayName,
      tabName: tabFromUrl ?? integrationConfig?.tab_name,
      integrationId: existingIntegrationId,
      credentialId: credentialId || undefined,
      columns: integrationConfig?.columns,
      config: integrationConfig ?? undefined,
      timezone: integrationTimezone,
    });
  };

  const handleColumnsSaved = (
    integrationId: string,
    _cols: unknown,
    fullConfig: ReturnType<typeof buildFullIntegrationConfig>,
  ) => {
    setIntegrationConfig(fullConfig.google_sheets);
    setIntegrationTimezone(fullConfig.timezone);
    void integrationId;
  };

  const handleDeleteIntegration = async () => {
    if (!existingIntegrationId) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await authAPI.deleteIntegration(existingIntegrationId);
      setDeleteOpen(false);
      navigate('/google-sheets');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(msg ?? 'Failed to delete integration.');
    } finally {
      setDeleting(false);
    }
  };

  const openUrl = iframeSrc || (id ? buildSheetIframeUrl(id, gidParam ? { gid: gidParam } : undefined) : '');

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 105px)' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-1 pb-3 flex-shrink-0">
        {/* Back */}
        <button
          onClick={() => navigate('/google-sheets')}
          className="common-button-bg2 flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Back</span>
        </button>

        <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

        {/* Sheet identity */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
            <SheetIcon />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight truncate">{displayName}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
              {sheetRole === 'directory' ? `Assignment directory · ${DEFAULT_DIRECTORY_TAB_NAME}` : 'Google Sheets'}
            </p>
          </div>
        </div>

        {/* Linked sheet shortcuts */}
        {(linkedDataSheet || linkedStaffRoster) && (
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {linkedDataSheet && (
              <button
                onClick={() => navigate(`/google-sheets/${linkedDataSheet.id}/view?name=${encodeURIComponent(linkedDataSheet.name)}`)}
                className="common-button-bg2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                Data sheet
              </button>
            )}
            {linkedStaffRoster && (
              <button
                onClick={() => navigate(`/google-sheets/${linkedStaffRoster.id}/view?name=${encodeURIComponent(linkedStaffRoster.name)}&role=directory&tab=${encodeURIComponent(DEFAULT_DIRECTORY_TAB_NAME)}`)}
                className="common-button-bg2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400"
              >
                <UserCog className="w-3 h-3" />
                Staff roster
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Manage columns — data sheets only */}
          {sheetRole !== 'directory' && existingIntegrationId && (
            <button
              onClick={openColumnsModal}
              className="common-button-bg2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manage cols</span>
            </button>
          )}

          {/* Reload */}
          <button
            onClick={() => {
              setIframeLoaded(false);
              setWarming(isGoogleSheetRecent(id!));
              setIframeKey(k => k + 1);
            }}
            title="Reload"
            className="common-button-bg2 p-2 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Open in Google */}
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="common-button-bg2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in Google</span>
          </a>

          {/* Assign / Update AI — hidden for staff roster sheets (inherits parent agent) */}
          {sheetRole !== 'directory' && (
          <button
            onClick={openAssignModal}
            className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-xl text-xs font-medium flex-shrink-0"
          >
            {assignedAgentName ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="hidden sm:inline truncate max-w-[100px]">{assignedAgentName}</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Assign AI</span>
              </>
            )}
          </button>
          )}
          {sheetRole === 'directory' && assignedAgentName && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium common-button-bg2 flex-shrink-0">
              <UserCog className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline truncate max-w-[100px]">{assignedAgentName}</span>
            </div>
          )}

          {sheetRole !== 'directory' && existingIntegrationId && (
            <button
              onClick={() => {
                setDeleteError('');
                setDeleteOpen(true);
              }}
              title="Delete integration"
              className="p-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Iframe area ── */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-0">
        {(warming || !iframeLoaded) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 z-10">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {warming ? 'Preparing your sheet…' : 'Loading spreadsheet…'}
            </p>
          </div>
        )}
        {!warming && iframeSrc && (
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className="w-full h-full border-0"
            title={sheetName}
            allow="clipboard-read; clipboard-write"
            onLoad={handleIframeLoad}
          />
        )}
      </div>

      {/* ── Assign AI modal ── */}
      <ModalOverlay open={assignOpen} onClose={() => setAssignOpen(false)} panelClassName="max-w-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-700">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  <SheetIcon />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{existingIntegrationId ? 'Update Assignment' : 'Assign AI'}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{sheetName}</p>
                </div>
              </div>
              <button
                onClick={() => setAssignOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AgentPickerField
              value={selectedAgentId}
              onChange={setSelectedAgentId}
              blockedAgentIds={assignBlockedAgentIds}
              label="Select AI Employee"
              required
              active={assignOpen}
            />

            {assignError && (
              <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {assignError}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={() => setAssignOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSave}
                disabled={!selectedAgentId || assigning || assignSuccess}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {assigning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : assignSuccess ? (
                  <><Check className="w-4 h-4" /> Assigned!</>
                ) : existingIntegrationId ? 'Update' : 'Assign'}
              </button>
            </div>
          </div>
      </ModalOverlay>

      <SheetColumnsModal
        target={columnsModalTarget}
        onClose={() => setColumnsModalTarget(null)}
        onSaved={handleColumnsSaved}
      />

      <DeleteIntegrationModal
        open={deleteOpen}
        sheetName={displayName}
        integrationId={existingIntegrationId || undefined}
        hasLinkedRoster={Boolean(linkedStaffRoster)}
        deleting={deleting}
        error={deleteError}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
            setDeleteError('');
          }
        }}
        onConfirm={handleDeleteIntegration}
      />
    </div>
  );
};

export default GoogleSheetView;
