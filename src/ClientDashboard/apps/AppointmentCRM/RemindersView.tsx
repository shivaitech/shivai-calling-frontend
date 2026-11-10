import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2, Mail, MessageCircle, MessageSquare, Phone, Plus, RefreshCw, Trash2, X } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import appToast from "../../../components/AppToast";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import appointmentCrmAPI from "./api/index";
import { AppointmentCrmApiError } from "./api/client";
import { apiId } from "./api/mappers";
import type { ApiReminderRule, ReminderChannel, ReminderTrigger } from "./api/types";

type Rule = ApiReminderRule & { id: string };
type Draft = Omit<ApiReminderRule, "id" | "_id" | "offset_minutes"> & { amount: number; unit: Unit };
type Unit = "minutes" | "hours" | "days";

const UNIT_MIN: Record<Unit, number> = { minutes: 1, hours: 60, days: 1440 };

const CHANNELS: { key: ReminderChannel; label: string; icon: React.ElementType }[] = [
  { key: "sms", label: "SMS", icon: MessageSquare },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "voice", label: "AI voice call", icon: Phone },
  { key: "email", label: "Email", icon: Mail },
];

const channelMeta = (c: ReminderChannel) => CHANNELS.find((x) => x.key === c) ?? { key: c, label: c, icon: Bell };

/** "2 hours", "1 day", "30 minutes" — the largest whole unit. */
function formatOffset(min: number): string {
  const [unit, size] = min % 1440 === 0 && min >= 1440 ? ["day", 1440] : min % 60 === 0 && min >= 60 ? ["hour", 60] : ["minute", 1];
  const n = min / (size as number);
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function splitOffset(min: number): { amount: number; unit: Unit } {
  if (min >= 1440 && min % 1440 === 0) return { amount: min / 1440, unit: "days" };
  if (min >= 60 && min % 60 === 0) return { amount: min / 60, unit: "hours" };
  return { amount: min, unit: "minutes" };
}

/** Reminder rules live on the server (/reminder-rules) — the backend sends
 * them. Nothing here is seeded locally: an org with no rules gets a one-click
 * "add recommended rules" that POSTs real ones. */
const RemindersView = () => {
  const { preset, terms } = useAppointmentIndustry();
  const appt = terms.appointment.toLowerCase();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ message: string; notAvailable: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const triggerText = (trigger: ReminderTrigger, offset: number) => {
    if (trigger === "before_start") return `${formatOffset(offset)} before the ${appt}`;
    if (trigger === "after_no_show") return `${formatOffset(offset)} after a no-show`;
    return `${formatOffset(offset)} after the ${appt} is completed`;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await appointmentCrmAPI.fetchReminderRules();
      setRules(list.map((r) => ({ ...r, id: apiId(r) })));
    } catch (err) {
      const status = err instanceof AppointmentCrmApiError ? err.statusCode : 0;
      setLoadError({
        message: err instanceof Error ? err.message : "Couldn't load reminder rules.",
        notAvailable: status === 404 || status === 501,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const recommended = (): Omit<ApiReminderRule, "id" | "_id">[] => {
    const has = (c: ReminderChannel) => preset.reminderChannels.includes(c);
    return [
      { name: "Confirmation call", channel: "voice", trigger: "before_start", offset_minutes: 1440, active: has("voice") },
      { name: "2-hour reminder", channel: has("whatsapp") ? "whatsapp" : "sms", trigger: "before_start", offset_minutes: 120, active: true },
      { name: "No-show follow-up", channel: "voice", trigger: "after_no_show", offset_minutes: 30, active: has("voice") },
    ];
  };

  const addRecommended = async () => {
    setSaving(true);
    try {
      for (const body of recommended()) await appointmentCrmAPI.createReminderRule(body);
      appToast.success("Recommended reminders added");
      await load();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Couldn't add reminders");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (rule: Rule) => {
    setBusyId(rule.id);
    try {
      const updated = await appointmentCrmAPI.patchReminderRule(rule.id, { active: !rule.active });
      setRules((list) => list.map((r) => (r.id === rule.id ? { ...r, ...updated, id: rule.id } : r)));
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Couldn't update this reminder");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (rule: Rule) => {
    setBusyId(rule.id);
    try {
      await appointmentCrmAPI.deleteReminderRule(rule.id);
      setRules((list) => list.filter((r) => r.id !== rule.id));
      appToast.success("Reminder removed");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Couldn't remove this reminder");
    } finally {
      setBusyId(null);
    }
  };

  const saveDraft = async () => {
    if (!draft || saving) return;
    const offset = Math.round(draft.amount * UNIT_MIN[draft.unit]);
    if (!draft.name.trim() || offset <= 0) return;
    setSaving(true);
    try {
      const created = await appointmentCrmAPI.createReminderRule({
        name: draft.name.trim(),
        channel: draft.channel,
        trigger: draft.trigger,
        offset_minutes: offset,
        active: draft.active,
      });
      setRules((list) => [...list, { ...created, id: apiId(created) }]);
      setDraft(null);
      appToast.success("Reminder added");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Couldn't add this reminder");
    } finally {
      setSaving(false);
    }
  };

  const newDraft = (): Draft => ({
    name: "",
    channel: preset.reminderChannels[0] ?? "sms",
    trigger: "before_start",
    active: true,
    ...splitOffset(120),
  });

  const SELECT = "mt-1 w-full px-2.5 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700";

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Reminders & Confirmations"
        subtitle={`Cut no-shows with automatic voice, SMS, WhatsApp & email around every ${appt}`}
        right={
          !loading && !loadError && !draft ? (
            <button
              type="button"
              onClick={() => setDraft(newDraft())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg"
            >
              <Plus className="w-3.5 h-3.5" /> Add reminder
            </button>
          ) : undefined
        }
      />

      {loading && (
        <GlassCard>
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        </GlassCard>
      )}

      {!loading && loadError && (
        <GlassCard>
          <div className="p-8 flex flex-col items-center text-center gap-2">
            <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {loadError.notAvailable ? "Automatic reminders are coming soon" : "Couldn't load reminders"}
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              {loadError.notAvailable
                ? `Reminders aren't switched on for your account yet. Your ${terms.appointments.toLowerCase()} still work normally.`
                : loadError.message}
            </p>
            {!loadError.notAvailable && (
              <button
                type="button"
                onClick={() => void load()}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try again
              </button>
            )}
          </div>
        </GlassCard>
      )}

      {draft && (
        <GlassCard>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">New reminder</p>
              <button type="button" onClick={() => setDraft(null)} className="p-1 rounded text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-slate-500 sm:col-span-2">
                Name
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Day-before confirmation"
                  className={SELECT}
                  autoFocus
                />
              </label>
              <label className="text-xs text-slate-500">
                Send by
                <select value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value as ReminderChannel })} className={SELECT}>
                  {CHANNELS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-500">
                When
                <select value={draft.trigger} onChange={(e) => setDraft({ ...draft, trigger: e.target.value as ReminderTrigger })} className={SELECT}>
                  <option value="before_start">Before the {appt}</option>
                  <option value="after_no_show">After a no-show</option>
                  <option value="after_complete">After it's completed</option>
                </select>
              </label>
              <div className="text-xs text-slate-500 sm:col-span-2">
                How long
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={draft.amount}
                    onChange={(e) => setDraft({ ...draft, amount: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-24 px-2.5 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
                  />
                  <select value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value as Unit })} className="flex-1 px-2.5 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700">
                    <option value="minutes">minutes</option>
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                  </select>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Sends {triggerText(draft.trigger, Math.round(draft.amount * UNIT_MIN[draft.unit]))} by {channelMeta(draft.channel).label}.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={saving || !draft.name.trim()}
                className="px-3 py-2 rounded-lg text-xs font-medium common-button-bg disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save reminder
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {!loading && !loadError && rules.length === 0 && !draft && (
        <GlassCard>
          <div className="p-8 flex flex-col items-center text-center gap-2">
            <Bell className="w-6 h-6 text-violet-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No reminders yet</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Start with our recommended set: a confirmation call the day before, a reminder 2 hours before, and a
              follow-up call after a no-show.
            </p>
            <button
              type="button"
              onClick={() => void addRecommended()}
              disabled={saving}
              className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add recommended reminders
            </button>
          </div>
        </GlassCard>
      )}

      {!loading && !loadError && rules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((r) => {
            const { icon: Icon, label } = channelMeta(r.channel);
            const busy = busyId === r.id;
            return (
              <GlassCard key={r.id}>
                <div className="p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.active ? "bg-violet-50 dark:bg-violet-900/30 text-violet-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800 dark:text-white truncate">{r.name}</p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={r.active}
                        aria-label={r.active ? "Turn off" : "Turn on"}
                        onClick={() => void toggle(r)}
                        disabled={busy}
                        className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors disabled:opacity-50 ${r.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${r.active ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{triggerText(r.trigger, r.offset_minutes)}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[11px] text-slate-400">Channel: {label}</p>
                      <button
                        type="button"
                        onClick={() => void remove(r)}
                        disabled={busy}
                        className="p-1 rounded text-slate-300 hover:text-red-500 disabled:opacity-50"
                        aria-label={`Remove ${r.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Messages use your own words ({terms.customer.toLowerCase()}, {appt}, {terms.provider.toLowerCase()}) and skip
        cancelled {terms.appointments.toLowerCase()} automatically.
      </p>
    </div>
  );
};

export default RemindersView;
