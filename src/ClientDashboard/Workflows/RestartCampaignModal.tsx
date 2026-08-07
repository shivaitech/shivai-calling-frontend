import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  updateCampaign,
  uploadCampaignContacts,
  restartCampaign,
  getCampaignContacts,
  contactsToCsvFile,
  type Campaign,
} from '../../services/phoneNumbersAPI';
import CampaignScheduleForm, {
  defaultCampaignSchedule,
  type CampaignScheduleState,
} from './CampaignScheduleForm';
import appToast from '../../components/AppToast';
import { Loader2, Plus, RotateCcw, Trash2, X, Phone } from 'lucide-react';

interface ContactRow {
  id: string;
  phone: string;
  name?: string;
  context?: string;
}

const toLocalDateTimeValue = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const scheduleFromCampaign = (campaign: Campaign): CampaignScheduleState => ({
  ...defaultCampaignSchedule(),
  startNow: !campaign.scheduled_at,
  scheduledAt: toLocalDateTimeValue(campaign.scheduled_at),
  endDate: campaign.end_date ? String(campaign.end_date).slice(0, 10) : '',
  timezone: campaign.timezone || defaultCampaignSchedule().timezone,
  recurrence: (campaign.recurrence as CampaignScheduleState['recurrence']) || 'none',
  windowStart: campaign.window_start || campaign.business_hours_start || '09:00',
  windowEnd: campaign.window_end || campaign.business_hours_end || '18:00',
  workingDays: campaign.working_days?.length ? campaign.working_days : defaultCampaignSchedule().workingDays,
  maxConcurrent: campaign.max_concurrent || 3,
  callsPerMinute: campaign.calls_per_minute || 10,
  dailyLimit: campaign.daily_limit || 100,
  priority: (campaign.priority as CampaignScheduleState['priority']) || 'medium',
});

interface Props {
  campaign: Campaign;
  onClose: () => void;
  onDone: () => void;
}

const RestartCampaignModal: React.FC<Props> = ({ campaign, onClose, onDone }) => {
  const [schedule, setSchedule] = useState<CampaignScheduleState>(() => scheduleFromCampaign(campaign));
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingContacts(true);
    getCampaignContacts(campaign._id, { page: 1, limit: 500 })
      .then((result) => {
        if (cancelled) return;
        setContacts(
          (result.data || []).map((c) => ({
            id: c._id,
            phone: c.phone_number,
            name: c.name || '',
            context: c.custom_fields?.call_context || c.custom_fields?.context || '',
          }))
        );
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message || 'Failed to load contacts');
      })
      .finally(() => {
        if (!cancelled) setLoadingContacts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaign._id]);

  const addContact = () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setError('Enter a phone number');
      return;
    }
    if (contacts.some((c) => c.phone.replace(/\D/g, '') === trimmed.replace(/\D/g, ''))) {
      setError('This number is already in the list');
      return;
    }
    setError(null);
    setContacts((prev) => [
      ...prev,
      { id: `new_${Date.now()}`, phone: trimmed, name: name.trim(), context: context.trim() || undefined },
    ]);
    setPhone('');
    setName('');
    setContext('');
  };

  const handleRestart = async () => {
    if (!schedule.startNow) {
      if (!schedule.scheduledAt) {
        setError('Pick a date and time to schedule this restart');
        return;
      }
      const when = new Date(schedule.scheduledAt);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        setError('Scheduled time must be in the future');
        return;
      }
    }
    if (contacts.length === 0) {
      setError('Add at least one contact before restarting');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateCampaign(campaign._id, {
        max_concurrent: schedule.maxConcurrent,
        calls_per_minute: schedule.callsPerMinute,
        daily_limit: schedule.dailyLimit,
        priority: schedule.priority,
        timezone: schedule.timezone,
        recurrence: schedule.recurrence,
        window_start: schedule.windowStart,
        window_end: schedule.windowEnd,
        business_hours_start: schedule.windowStart,
        business_hours_end: schedule.windowEnd,
        working_days: schedule.workingDays,
        ...(schedule.endDate ? { end_date: schedule.endDate } : {}),
        scheduled_at: schedule.startNow ? undefined : new Date(schedule.scheduledAt).toISOString(),
      });

      await uploadCampaignContacts(
        campaign._id,
        contactsToCsvFile(
          contacts.map((c) => ({
            phone: c.phone,
            name: c.name,
            call_context: c.context,
          }))
        )
      );

      if (schedule.startNow) {
        await restartCampaign(campaign._id);
        appToast.success(`Campaign "${campaign.name}" restarted`);
      } else {
        appToast.success(`Campaign "${campaign.name}" scheduled to restart`);
      }
      onDone();
    } catch (err: any) {
      const msg = err.message || 'Failed to restart campaign';
      setError(msg);
      appToast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Restart campaign</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{campaign.name}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Update contacts</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Existing contacts are prefilled. Add, remove, or keep them as-is.
            </p>

            <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="common-bg-icons px-3 py-2.5 rounded-xl text-sm"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name (optional)"
                  className="common-bg-icons px-3 py-2.5 rounded-xl text-sm"
                />
              </div>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Call context (optional)"
                rows={2}
                className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm resize-y"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addContact}
                  className="common-button-bg !px-3.5 !py-2.5 !min-w-[44px] rounded-xl inline-flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {loadingContacts ? (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading contacts…</span>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                  </p>
                  {contacts.length > 0 && (
                    <button type="button" onClick={() => setContacts([])} className="text-xs text-rose-500 inline-flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2 gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-mono text-slate-800 dark:text-white truncate flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {c.phone}
                          {c.name ? <span className="font-sans text-slate-500">· {c.name}</span> : null}
                        </p>
                        {c.context && <p className="text-xs text-slate-400 truncate pl-5">{c.context}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => setContacts((prev) => prev.filter((x) => x.id !== c.id))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">No contacts yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <CampaignScheduleForm value={schedule} onChange={setSchedule} compact />

          {error && <p className="text-sm text-rose-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRestart}
            disabled={saving || loadingContacts}
            className="common-button-bg px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {schedule.startNow ? 'Restart now' : 'Schedule restart'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default RestartCampaignModal;
