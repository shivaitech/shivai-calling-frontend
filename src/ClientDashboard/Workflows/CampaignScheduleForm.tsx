import React from 'react';
import {
  WEEKDAY_OPTIONS,
  type CampaignPriority,
  type CampaignRecurrence,
} from '../../services/phoneNumbersAPI';

export const DEFAULT_WORKING_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

export interface CampaignScheduleState {
  startNow: boolean;
  scheduledAt: string;
  endDate: string;
  timezone: string;
  recurrence: CampaignRecurrence;
  windowStart: string;
  windowEnd: string;
  workingDays: string[];
  maxConcurrent: number;
  callsPerMinute: number;
  dailyLimit: number;
  priority: CampaignPriority;
}

export const defaultCampaignSchedule = (): CampaignScheduleState => ({
  startNow: true,
  scheduledAt: '',
  endDate: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  recurrence: 'none',
  windowStart: '09:00',
  windowEnd: '18:00',
  workingDays: [...DEFAULT_WORKING_DAYS],
  maxConcurrent: 3,
  callsPerMinute: 10,
  dailyLimit: 100,
  priority: 'medium',
});

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'Pacific/Auckland',
];

interface Props {
  value: CampaignScheduleState;
  onChange: (next: CampaignScheduleState) => void;
  compact?: boolean;
}

const CampaignScheduleForm: React.FC<Props> = ({ value, onChange, compact }) => {
  const set = (patch: Partial<CampaignScheduleState>) => onChange({ ...value, ...patch });

  const toggleDay = (id: string) => {
    const has = value.workingDays.includes(id);
    set({
      workingDays: has ? value.workingDays.filter((d) => d !== id) : [...value.workingDays, id],
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Campaign scheduling</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Start now, schedule later, or run on a recurring window in the campaign timezone.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { id: true, label: 'Start Now', desc: 'Begin dialing after launch' },
            { id: false, label: 'Schedule', desc: 'Pick a start date & time' },
          ] as const).map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              onClick={() => set({ startNow: opt.id })}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                value.startNow === opt.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <p className="font-semibold text-sm text-slate-800 dark:text-white">{opt.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {!value.startNow && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              Start at <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={value.scheduledAt}
              min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
              onChange={(e) => set({ scheduledAt: e.target.value })}
              className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">End date (optional)</label>
            <input
              type="date"
              value={value.endDate}
              onChange={(e) => set({ endDate: e.target.value })}
              className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
            />
          </div>
        </div>
      )}

      {value.startNow && (
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">End date (optional)</label>
          <input
            type="date"
            value={value.endDate}
            onChange={(e) => set({ endDate: e.target.value })}
            className="common-bg-icons w-full sm:max-w-xs px-3 py-2.5 rounded-xl text-sm"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Timezone</label>
          <select
            value={value.timezone}
            onChange={(e) => set({ timezone: e.target.value })}
            className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
          >
            {!TIMEZONES.includes(value.timezone) && value.timezone && (
              <option value={value.timezone}>{value.timezone}</option>
            )}
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Recurring campaign</label>
          <select
            value={value.recurrence}
            onChange={(e) => set({ recurrence: e.target.value as CampaignRecurrence })}
            className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          Daily time window / business hours
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="time"
            value={value.windowStart}
            onChange={(e) => set({ windowStart: e.target.value })}
            className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
          />
          <input
            type="time"
            value={value.windowEnd}
            onChange={(e) => set({ windowEnd: e.target.value })}
            className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Working days</label>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_OPTIONS.map((d) => {
            const on = value.workingDays.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDay(d.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  on
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Campaign controls</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Pace outbound dialing so volume stays inside your limits.
        </p>
        <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-3`}>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Max concurrent calls</label>
            <input
              type="number"
              min={1}
              max={50}
              value={value.maxConcurrent}
              onChange={(e) => set({ maxConcurrent: Math.max(1, Number(e.target.value) || 1) })}
              className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Calls per minute</label>
            <input
              type="number"
              min={1}
              max={120}
              value={value.callsPerMinute}
              onChange={(e) => set({ callsPerMinute: Math.max(1, Number(e.target.value) || 1) })}
              className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Daily limit</label>
            <input
              type="number"
              min={1}
              max={10000}
              value={value.dailyLimit}
              onChange={(e) => set({ dailyLimit: Math.max(1, Number(e.target.value) || 1) })}
              className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Campaign priority</label>
            <select
              value={value.priority}
              onChange={(e) => set({ priority: e.target.value as CampaignPriority })}
              className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignScheduleForm;
