import QRCode from 'react-qr-code';
import { QrCode, X, Copy } from 'lucide-react';
import ModalOverlay from '../../components/ModalOverlay';
import type { MockAgentRecord } from '../../services/mockAgentStore';

interface TenantAgentQRModalProps {
  agent: MockAgentRecord | null;
  onClose: () => void;
}

/** Visual mirror of AgentQRModal.tsx for a mock sub-tenant agent — the
 * share URL is a placeholder (mock://) since there's no real widget/public
 * page for an agent that doesn't exist on the backend. */
const TenantAgentQRModal = ({ agent, onClose }: TenantAgentQRModalProps) => {
  if (!agent) return null;
  const shareUrl = `https://callshivai.com/MyAIEmployee/${agent.id}`;

  return (
    <ModalOverlay open={!!agent} onClose={onClose} closeOnBackdrop panelClassName="max-w-lg">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Share Agent</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Scan to start a conversation with {agent.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <QRCode value={shareUrl} size={160} bgColor="#ffffff" fgColor="#000000" level="M" />
          </div>
          <div className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Agent Page URL</p>
            <div className="flex items-center gap-2">
              <p className="flex-1 font-mono text-xs text-slate-600 dark:text-slate-300 truncate">{shareUrl}</p>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
                title="Copy link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default TenantAgentQRModal;
