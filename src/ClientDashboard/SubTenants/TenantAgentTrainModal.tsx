import { useState } from 'react';
import { Zap, X, UploadCloud, Check, FileText } from 'lucide-react';
import ModalOverlay from '../../components/ModalOverlay';
import type { MockAgentRecord } from '../../services/mockAgentStore';

interface TenantAgentTrainModalProps {
  agent: MockAgentRecord | null;
  onClose: () => void;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  idle: { label: 'Not started', className: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  processing: { label: 'Processing', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  completed: { label: 'Trained', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  failed: { label: 'Failed', className: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
};

/** Mock training view for a sub-tenant's agent — mirrors the KB status
 * language used in AgentManagement.tsx, without a real upload pipeline. */
const TenantAgentTrainModal = ({ agent, onClose }: TenantAgentTrainModalProps) => {
  const [files, setFiles] = useState<File[]>([]);

  if (!agent) return null;
  const status = agent.knowledge_base_status || 'idle';
  const meta = STATUS_META[status];

  return (
    <ModalOverlay open={!!agent} onClose={onClose} closeOnBackdrop panelClassName="max-w-md">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white truncate">Train {agent.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upload documents to teach this agent.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Knowledge Base Status</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>{meta.label}</span>
          </div>

          {agent.knowledge_base_file_urls && agent.knowledge_base_file_urls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Existing Files</p>
              <div className="space-y-1">
                {agent.knowledge_base_file_urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{decodeURIComponent(url.split('/').pop() || url)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
            <UploadCloud className="w-6 h-6 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400 text-center">
              {files.length > 0 ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'Click to upload documents (PDF, DOCX, TXT)'}
            </span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors"
          >
            Close
          </button>
          <button
            disabled={files.length === 0}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Start Training
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default TenantAgentTrainModal;
