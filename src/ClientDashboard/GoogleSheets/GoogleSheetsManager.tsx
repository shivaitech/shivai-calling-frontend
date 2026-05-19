import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgent } from '../../contexts/AgentContext';
import { authAPI } from '../../services/authAPI';
import GlassCard from '../../components/GlassCard';
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Users,
  Loader2,
  X,
  FileSpreadsheet,
  Check,
  ChevronDown,
} from 'lucide-react';

interface Sheet {
  id: string;
  name: string;
}

const SheetIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#0F9D58" />
    <rect x="7" y="7" width="4" height="10" rx="0.5" fill="white" fillOpacity="0.9" />
    <rect x="13" y="7" width="4" height="10" rx="0.5" fill="white" fillOpacity="0.9" />
    <rect x="7" y="11" width="10" height="1.5" fill="#0F9D58" />
  </svg>
);

const GoogleSheetsManager = () => {
  const navigate = useNavigate();
  const { agents } = useAgent();

  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);

  const [iframeSheet, setIframeSheet] = useState<Sheet | null>(null);

  const [assignSheet, setAssignSheet] = useState<Sheet | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  useEffect(() => {
    authAPI.fetchGoogleSheets()
      .then(data => setSheets(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = (sheet: Sheet) => {
    setAssignSheet(sheet);
    setSelectedAgentId('');
    setAssignSuccess(false);
  };

  const handleAssignSave = async () => {
    if (!assignSheet || !selectedAgentId) return;
    setAssigning(true);
    try {
      await authAPI.saveSelectedSheet(assignSheet.id, assignSheet.name);
      setAssignSuccess(true);
      setTimeout(() => { setAssignSheet(null); setAssignSuccess(false); }, 1500);
    } catch {
      // ignore
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-5 w-full">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings#accounts')}
            className="p-2 rounded-xl common-bg-icons border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">Google Sheets</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage and assign spreadsheets to your AI Employees</p>
          </div>
        </div>
        <button
          onClick={() => window.open('https://docs.google.com/spreadsheets/create', '_blank')}
          className="common-button-bg flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Sheet</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* ── Sheets grid ── */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Loading your spreadsheets…</span>
            </div>
          ) : sheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">No spreadsheets found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create a new sheet or connect your Google account</p>
              </div>
              <button
                onClick={() => window.open('https://docs.google.com/spreadsheets/create', '_blank')}
                className="common-button-bg flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Create Sheet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sheets.map(sheet => (
                <div
                  key={sheet.id}
                  className="common-bg-icons rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  {/* Sheet info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <SheetIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2">{sheet.name}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIframeSheet(sheet)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleAssign(sheet)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg transition-all active:scale-[0.98]"
                    >
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      Assign AI Employee
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* ── Iframe modal ── */}
      {iframeSheet && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                <SheetIcon />
              </div>
              <span className="font-semibold text-slate-800 dark:text-white text-sm truncate max-w-[180px] sm:max-w-xs">{iframeSheet.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://docs.google.com/spreadsheets/d/${iframeSheet.id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Open in Google
              </a>
              <button
                onClick={() => setIframeSheet(null)}
                className="p-1.5 rounded-lg common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <iframe
            src={`https://docs.google.com/spreadsheets/d/${iframeSheet.id}/edit?rm=embedded`}
            className="flex-1 w-full border-0"
            title={iframeSheet.name}
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}

      {/* ── Assign modal ── */}
      {assignSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <SheetIcon />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Assign AI Employee</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{assignSheet.name}</p>
                </div>
              </div>
              <button
                onClick={() => setAssignSheet(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Agent picker */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Select AI Employee</label>
              <div className="relative">
                <select
                  value={selectedAgentId}
                  onChange={e => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white appearance-none pr-8"
                >
                  <option value="">Choose an AI Employee…</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={() => setAssignSheet(null)}
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
                ) : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsManager;
