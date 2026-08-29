import { useEffect, useState } from 'react';
import { Bot, X, Loader2, Check } from 'lucide-react';
import ModalOverlay from '../../components/ModalOverlay';
import SearchableSelect from '../../components/SearchableSelect';
import { mockAgentStore, type MockAgentRecord } from '../../services/mockAgentStore';

interface TenantAgentDetailModalProps {
  agent: MockAgentRecord | null;
  mode: 'view' | 'edit';
  tenantId: string;
  onClose: () => void;
  onSaved: () => void;
}

const CHANNEL_OPTIONS = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'webrtc', label: 'Web Call' },
];

const VOICE_OPTIONS = ['Aria', 'Kore', 'Puck', 'Charon', 'Fenrir'].map((v) => ({ value: v, label: v }));

const inputClass =
  'w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white';

const readOnlyRow = (label: string, value?: string | number | null) => (
  <div>
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-sm font-medium text-slate-800 dark:text-white">{value || '—'}</p>
  </div>
);

/** Handles both "View" (read-only summary) and "Edit" (form) for a single
 * mock agent — self-contained, no route/navigation like EditAgent.tsx. */
const TenantAgentDetailModal = ({ agent, mode, tenantId, onClose, onSaved }: TenantAgentDetailModalProps) => {
  const [name, setName] = useState('');
  const [agentType, setAgentType] = useState<'inbound' | 'outbound' | 'webrtc'>('inbound');
  const [voice, setVoice] = useState('Aria');
  const [businessProcess, setBusinessProcess] = useState('');
  const [industry, setIndustry] = useState('');
  const [greeting, setGreeting] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!agent) return;
    setName(agent.name);
    setAgentType((agent.agent_type as any) || 'inbound');
    setVoice(agent.voice);
    setBusinessProcess(agent.business_process || '');
    setIndustry(agent.industry || '');
    setGreeting(
      typeof agent.greeting_message === 'object' && agent.greeting_message
        ? Object.values(agent.greeting_message)[0] || ''
        : '',
    );
    setInstructions(agent.custom_instructions || '');
    setSaved(false);
  }, [agent]);

  if (!agent) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      mockAgentStore.update(tenantId, agent.id, {
        name: name.trim() || agent.name,
        agent_type: agentType,
        voice,
        business_process: businessProcess.trim() || undefined,
        industry: industry.trim() || undefined,
        greeting_message: greeting.trim() ? { en: greeting.trim() } : undefined,
        custom_instructions: instructions.trim() || undefined,
      } as any);
      setSaved(true);
      setTimeout(() => onSaved(), 500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalOverlay open={!!agent} onClose={isSaving ? undefined : onClose} closeOnBackdrop={!isSaving} panelClassName="max-w-lg">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white truncate">{agent.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{mode === 'edit' ? 'Edit AI Employee' : 'AI Employee Details'}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0 disabled:opacity-40">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {mode === 'view' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {readOnlyRow('Status', agent.status)}
                {readOnlyRow('Channel', agent.agent_type)}
                {readOnlyRow('Voice', agent.voice)}
                {readOnlyRow('Business Process', agent.business_process)}
                {readOnlyRow('Industry', agent.industry)}
                {readOnlyRow('Created', new Date(agent.createdAt).toLocaleDateString())}
              </div>
              {agent.stats && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {readOnlyRow('Conversations', agent.stats.conversations)}
                  {readOnlyRow('Success Rate', `${agent.stats.successRate}%`)}
                  {readOnlyRow('Active Users', agent.stats.activeUsers)}
                </div>
              )}
              {agent.custom_instructions && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">System Prompt</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{agent.custom_instructions}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Channel</label>
                  <SearchableSelect options={CHANNEL_OPTIONS} value={agentType} onChange={(v) => setAgentType(v as any)} placeholder="Select channel…" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Voice</label>
                  <SearchableSelect options={VOICE_OPTIONS} value={voice} onChange={setVoice} placeholder="Select voice…" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Business Process</label>
                  <input type="text" value={businessProcess} onChange={(e) => setBusinessProcess(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Industry</label>
                  <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Greeting Message</label>
                <input type="text" value={greeting} onChange={(e) => setGreeting(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">System Prompt / Instructions</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} className={`${inputClass} resize-none`} />
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </button>
          {mode === 'edit' && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {isSaving ? 'Saving…' : saved ? 'Saved' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
};

export default TenantAgentDetailModal;
