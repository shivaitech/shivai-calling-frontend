import { useEffect, useState } from 'react';
import { Bot, X, Loader2 } from 'lucide-react';
import ModalOverlay from '../../components/ModalOverlay';
import SearchableSelect from '../../components/SearchableSelect';
import { mockAgentStore } from '../../services/mockAgentStore';

interface CreateTenantAgentModalProps {
  open: boolean;
  tenantId: string;
  onClose: () => void;
  onCreated: () => void;
}

const CHANNEL_OPTIONS = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'webrtc', label: 'Web Call' },
];

const VOICE_OPTIONS = ['Aria', 'Kore', 'Puck', 'Charon', 'Fenrir'].map((v) => ({ value: v, label: v }));

const inputClass =
  'w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white';

const CreateTenantAgentModal = ({ open, tenantId, onClose, onCreated }: CreateTenantAgentModalProps) => {
  const [name, setName] = useState('');
  const [agentType, setAgentType] = useState<'inbound' | 'outbound' | 'webrtc'>('inbound');
  const [voice, setVoice] = useState('Aria');
  const [businessProcess, setBusinessProcess] = useState('');
  const [industry, setIndustry] = useState('');
  const [greeting, setGreeting] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setAgentType('inbound');
    setVoice('Aria');
    setBusinessProcess('');
    setIndustry('');
    setGreeting('');
    setInstructions('');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Give this AI employee a name.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      mockAgentStore.create(tenantId, {
        name: name.trim(),
        agent_type: agentType,
        voice,
        business_process: businessProcess.trim() || undefined,
        industry: industry.trim() || undefined,
        greeting_message: greeting.trim() ? { en: greeting.trim() } : undefined,
        custom_instructions: instructions.trim() || undefined,
        personality: 'friendly',
      });
      onCreated();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={isSubmitting ? undefined : onClose} closeOnBackdrop={!isSubmitting} panelClassName="max-w-lg">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Create AI Employee</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Adds a new agent for this sub-tenant.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0 disabled:opacity-40">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Name</label>
            <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Front Desk Assistant" className={inputClass} />
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
              <input type="text" value={businessProcess} onChange={(e) => setBusinessProcess(e.target.value)} placeholder="e.g. Appointment Booking" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Industry</label>
              <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Healthcare" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Greeting Message</label>
            <input type="text" value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="What the agent says first" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">System Prompt / Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="Describe how this agent should behave…"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            {isSubmitting ? 'Creating…' : 'Create AI Employee'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default CreateTenantAgentModal;
