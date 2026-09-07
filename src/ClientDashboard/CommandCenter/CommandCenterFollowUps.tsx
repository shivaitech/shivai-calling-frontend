import { useEffect, useMemo, useState } from 'react';
import { Plus, CheckSquare, Square, Clock, AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ModalOverlay from '../../components/ModalOverlay';
import appToast from '../../components/AppToast';
import { useAuth } from '../../contexts/AuthContext';
import {
  followUpStore,
  activityStore,
  type FollowUp,
  type FollowUpPriority,
} from '../../services/commandCenterAPI';

interface Props {
  scopeTenantId: string;
}

type DueFilter = 'all' | 'overdue' | 'today' | 'upcoming' | 'done';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const priorityMeta: Record<FollowUpPriority, { label: string; cls: string }> = {
  high: { label: 'High', cls: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  medium: { label: 'Medium', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  low: { label: 'Low', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
};

const fmtDue = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const emptyDraft = () => ({
  id: undefined as string | undefined,
  title: '',
  contactName: '',
  phoneNumber: '',
  dueAt: '',
  priority: 'medium' as FollowUpPriority,
  assigneeName: '',
  notes: '',
});

const CommandCenterFollowUps = ({ scopeTenantId }: Props) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [priority, setPriority] = useState<'all' | FollowUpPriority>('all');
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  // Follow-ups are scoped to a sub-tenant; use the chosen scope, else this user's own.
  const tenantId = scopeTenantId || String(user?.tenantId || user?.id || 'me');

  const refresh = () => {
    setLoading(true);
    setRows(followUpStore.list(tenantId));
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const filtered = useMemo(() => {
    const t0 = startOfToday().getTime();
    const t1 = endOfToday().getTime();
    return rows
      .filter((r) => (priority === 'all' ? true : r.priority === priority))
      .filter((r) => {
        if (dueFilter === 'all') return r.status === 'open';
        if (dueFilter === 'done') return r.status === 'done';
        if (r.status !== 'open') return false;
        const due = new Date(r.dueAt).getTime();
        if (dueFilter === 'overdue') return due < t0;
        if (dueFilter === 'today') return due >= t0 && due <= t1;
        if (dueFilter === 'upcoming') return due > t1;
        return true;
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [rows, dueFilter, priority]);

  const openCreate = () => {
    setDraft(emptyDraft());
    setShowModal(true);
  };

  const openEdit = (r: FollowUp) => {
    setDraft({
      id: r.id,
      title: r.title,
      contactName: r.contactName || '',
      phoneNumber: r.phoneNumber || '',
      dueAt: r.dueAt ? r.dueAt.slice(0, 16) : '',
      priority: r.priority,
      assigneeName: r.assigneeName || '',
      notes: r.notes || '',
    });
    setShowModal(true);
  };

  const save = () => {
    if (!draft.title.trim()) {
      appToast.error('Give the follow-up a title.');
      return;
    }
    if (!draft.dueAt) {
      appToast.error('Pick a due date/time.');
      return;
    }
    const isNew = !draft.id;
    followUpStore.upsert({
      id: draft.id,
      tenantId,
      title: draft.title.trim(),
      contactName: draft.contactName.trim() || undefined,
      phoneNumber: draft.phoneNumber.trim() || undefined,
      dueAt: new Date(draft.dueAt).toISOString(),
      priority: draft.priority,
      assigneeName: draft.assigneeName.trim() || undefined,
      notes: draft.notes.trim() || undefined,
    });
    activityStore.log({
      tenantId,
      actorId: String(user?.id || ''),
      actorName: user?.fullName || 'You',
      kind: isNew ? 'follow_up_created' : 'note_added',
      summary: isNew ? `Created follow-up “${draft.title.trim()}”` : `Updated follow-up “${draft.title.trim()}”`,
      target: draft.contactName || draft.phoneNumber,
    });
    appToast.success(isNew ? 'Follow-up added' : 'Follow-up updated');
    setShowModal(false);
    refresh();
  };

  const toggleDone = (r: FollowUp) => {
    const next = r.status === 'done' ? 'open' : 'done';
    followUpStore.setStatus(r.id, next);
    if (next === 'done') {
      activityStore.log({
        tenantId,
        actorId: String(user?.id || ''),
        actorName: user?.fullName || 'You',
        kind: 'follow_up_completed',
        summary: `Completed follow-up “${r.title}”`,
        target: r.contactName || r.phoneNumber,
      });
    }
    refresh();
  };

  const remove = (r: FollowUp) => {
    followUpStore.remove(r.id);
    refresh();
  };

  const DUE_TABS: Array<{ id: DueFilter; label: string }> = [
    { id: 'all', label: 'Open' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <div className="space-y-3">
      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">
            {DUE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDueFilter(t.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  dueFilter === t.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Nothing here. Add a follow-up to stay on top of the cycle.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((r) => {
              const overdue = r.status === 'open' && new Date(r.dueAt).getTime() < startOfToday().getTime();
              return (
                <div key={r.id} className="flex items-start gap-3 px-4 py-3 group">
                  <button type="button" onClick={() => toggleDone(r)} className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400">
                    {r.status === 'done' ? <CheckSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" /> : <Square className="w-5 h-5" />}
                  </button>
                  <button type="button" onClick={() => openEdit(r)} className="min-w-0 flex-1 text-left">
                    <p className={`text-sm font-medium truncate ${r.status === 'done' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                      {r.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-2 mt-0.5">
                      {overdue ? <AlertTriangle className="w-3 h-3 text-rose-500" /> : <Clock className="w-3 h-3" />}
                      <span className={overdue ? 'text-rose-600 dark:text-rose-400' : ''}>{fmtDue(r.dueAt)}</span>
                      {r.contactName && <span>· {r.contactName}</span>}
                      {r.assigneeName && <span>· {r.assigneeName}</span>}
                    </p>
                  </button>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${priorityMeta[r.priority].cls}`}>
                    {priorityMeta[r.priority].label}
                  </span>
                  <button type="button" onClick={() => remove(r)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Create/Edit modal */}
      <ModalOverlay open={showModal} onClose={() => setShowModal(false)} closeOnBackdrop panelClassName="max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">{draft.id ? 'Edit follow-up' : 'New follow-up'}</h3>
            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <Field label="Title">
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Call back about brand deal" className={INPUT} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact name">
                <input value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} placeholder="Optional" className={INPUT} />
              </Field>
              <Field label="Phone">
                <input value={draft.phoneNumber} onChange={(e) => setDraft({ ...draft, phoneNumber: e.target.value })} placeholder="Optional" className={INPUT} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due">
                <input type="datetime-local" value={draft.dueAt} onChange={(e) => setDraft({ ...draft, dueAt: e.target.value })} className={INPUT} />
              </Field>
              <Field label="Priority">
                <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as FollowUpPriority })} className={INPUT}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </Field>
            </div>
            <Field label="Assignee">
              <input value={draft.assigneeName} onChange={(e) => setDraft({ ...draft, assigneeName: e.target.value })} placeholder="Human employee" className={INPUT} />
            </Field>
            <Field label="Notes">
              <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={2} className={`${INPUT} resize-none`} />
            </Field>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80">
              Cancel
            </button>
            <button onClick={save} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white">
              {draft.id ? 'Save' : 'Add follow-up'}
            </button>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
};

const INPUT =
  'w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
    {children}
  </div>
);

export default CommandCenterFollowUps;
