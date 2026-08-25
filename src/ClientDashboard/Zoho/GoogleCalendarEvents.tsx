import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  authAPI,
  type CalendarEvent,
  type CreateCalendarEventPayload,
} from '../../services/authAPI';
import GlassCard from '../../components/GlassCard';
import appToast from '../../components/AppToast';
import {
  Plus,
  Loader2,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bot,
  UserRound,
  ListChecks,
  CalendarClock,
  AlignLeft,
  CheckCircle2,
  HelpCircle,
  XCircle,
  CircleDot,
} from 'lucide-react';

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Google Calendar has no "who created this" field for our purposes, so ShivAI
 * marks its own bookings with a hidden tag in the description. Anything without
 * it (created directly in Google Calendar, or via the New Event form here) is
 * a manual event. Stripped from the description before it's ever shown/edited.
 */
const AI_MARKER = '[ShivAI:auto]';
const isAiCreated = (event: CalendarEvent) => (event.description || '').includes(AI_MARKER);
const stripMarker = (description: string | null) => (description || '').replace(AI_MARKER, '').trim();

const eventStart = (event: CalendarEvent) => event.start?.dateTime || event.start?.date || null;
const eventEnd = (event: CalendarEvent) => event.end?.dateTime || event.end?.date || null;
const isAllDay = (event: CalendarEvent) => !event.start?.dateTime && !!event.start?.date;

const formatEventTime = (event: CalendarEvent) => {
  const start = eventStart(event);
  const end = eventEnd(event);
  if (!start) return 'No time set';
  if (isAllDay(event)) return new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const startD = new Date(start);
  const endD = end ? new Date(end) : null;
  const dateLabel = startD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const startLabel = startD.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endLabel = endD ? endD.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
  return endLabel ? `${dateLabel}, ${startLabel} – ${endLabel}` : `${dateLabel}, ${startLabel}`;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  tentative: { label: 'Tentative', className: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
};

const RESPONSE_META: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  accepted: { icon: CheckCircle2, className: 'text-emerald-500', label: 'Accepted' },
  declined: { icon: XCircle, className: 'text-rose-500', label: 'Declined' },
  tentative: { icon: HelpCircle, className: 'text-amber-500', label: 'Maybe' },
  needsAction: { icon: CircleDot, className: 'text-slate-400', label: 'Awaiting response' },
};

const formatRelativeTimestamp = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

/** <input type="datetime-local"> value ↔ naive-local ISO the backend expects (no offset, + timeZone field). */
const toDatetimeLocalValue = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocalValue = (value: string): string => value; // already naive-local, matches doc's expected format

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dayLabel = (d: Date) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

interface EventFormState {
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  attendees: string;
}

const emptyForm: EventFormState = { summary: '', description: '', location: '', start: '', end: '', attendees: '' };

type TabId = 'all' | 'ai' | 'manual' | 'daily';

const TABS: Array<{ id: TabId; label: string; icon: typeof ListChecks }> = [
  { id: 'all', label: 'All Events', icon: ListChecks },
  { id: 'ai', label: 'AI Created Events', icon: Bot },
  { id: 'manual', label: 'Manual Events', icon: UserRound },
  { id: 'daily', label: 'Daily Calendar', icon: CalendarClock },
];

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
const HOUR_HEIGHT = 56;

const GoogleCalendarEvents = () => {
  const [tab, setTab] = useState<TabId>('all');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadEvents = useCallback((pageToken?: string) => {
    const setBusy = pageToken ? setLoadingMore : setLoading;
    setBusy(true);
    setError(null);
    authAPI
      .listCalendarEvents({
        timeMin: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        maxResults: 100,
        pageToken,
      })
      .then((result) => {
        setEvents((prev) => (pageToken ? [...prev, ...result.events] : result.events));
        setNextPageToken(result.nextPageToken);
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load calendar events');
      })
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const aiEvents = useMemo(() => events.filter(isAiCreated), [events]);
  const manualEvents = useMemo(() => events.filter((e) => !isAiCreated(e)), [events]);
  const upcomingSorted = useCallback(
    (list: CalendarEvent[]) =>
      [...list].sort((a, b) => {
        const ta = new Date(eventStart(a) || 0).getTime();
        const tb = new Date(eventStart(b) || 0).getTime();
        return ta - tb;
      }),
    []
  );

  const dailyEvents = useMemo(
    () =>
      events.filter((e) => {
        const start = eventStart(e);
        if (!start) return false;
        return sameDay(new Date(start), selectedDay);
      }),
    [events, selectedDay]
  );

  const openCreateForm = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (event: CalendarEvent) => {
    setEditingEvent(event);
    setForm({
      summary: event.summary || '',
      description: stripMarker(event.description),
      location: event.location || '',
      start: toDatetimeLocalValue(eventStart(event)),
      end: toDatetimeLocalValue(eventEnd(event)),
      attendees: event.attendees?.map((a) => a.email).filter(Boolean).join(', ') || '',
    });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.summary.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!form.start || !form.end) {
      setFormError('Start and end time are required');
      return;
    }
    if (new Date(form.end).getTime() <= new Date(form.start).getTime()) {
      setFormError('End time must be after start time');
      return;
    }

    const attendees = form.attendees
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    setSaving(true);
    setFormError(null);
    try {
      if (editingEvent?.id) {
        // Preserve the AI marker on edit — this form is for manual edits to
        // content/time, not for reclassifying who created the event.
        const wasAi = isAiCreated(editingEvent);
        const description = form.description.trim();
        const updated = await authAPI.updateCalendarEvent(editingEvent.id, {
          summary: form.summary.trim(),
          description: wasAi ? `${description} ${AI_MARKER}`.trim() : description || undefined,
          location: form.location.trim() || undefined,
          start: fromDatetimeLocalValue(form.start),
          end: fromDatetimeLocalValue(form.end),
          timeZone: DEFAULT_TIMEZONE,
          attendees: attendees.length ? attendees : undefined,
        });
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        appToast.success('Event updated');
      } else {
        const payload: CreateCalendarEventPayload = {
          summary: form.summary.trim(),
          description: form.description.trim() || undefined,
          location: form.location.trim() || undefined,
          start: fromDatetimeLocalValue(form.start),
          end: fromDatetimeLocalValue(form.end),
          timeZone: DEFAULT_TIMEZONE,
          attendees: attendees.length ? attendees : undefined,
        };
        const created = await authAPI.createCalendarEvent(payload);
        setEvents((prev) => [created, ...prev]);
        appToast.success('Event created');
      }
      setFormOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await authAPI.deleteCalendarEvent(deleteTarget.id, deleteTarget.calendarId || 'primary');
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      appToast.success('Event deleted');
    } catch (err: any) {
      appToast.error(err?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const renderEventCard = (event: CalendarEvent) => {
    const ai = isAiCreated(event);
    const description = stripMarker(event.description);
    const statusMeta = event.status ? STATUS_META[event.status] : null;
    const updatedLabel = formatRelativeTimestamp(event.updated);

    return (
      <div
        key={event.id || `${event.summary}-${eventStart(event)}`}
        className="group relative flex flex-col p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
      >
        {/* Header: icon, title, actions */}
        <div className="flex items-start gap-2.5 mb-2">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${
              ai
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            {ai ? (
              <Bot className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            ) : (
              <CalendarDays className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug break-words">
                {event.summary || '(No title)'}
              </p>
              <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    title="Open in Google Calendar"
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-500 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => openEditForm(event)}
                  title="Edit"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(event)}
                  title="Delete"
                  className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {ai && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                  AI Created
                </span>
              )}
              {statusMeta && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Time + location */}
        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            {formatEventTime(event)}
          </span>
          {event.location && (
            <span className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span className="break-words">{event.location}</span>
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
            <AlignLeft className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
            <p className="line-clamp-3 break-words">{description}</p>
          </div>
        )}

        {/* Attendees */}
        {!!event.attendees?.length && (
          <div className="mb-2">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">
              <Users className="w-3 h-3" /> {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-1">
              {event.attendees.slice(0, 3).map((attendee, i) => {
                const meta = RESPONSE_META[attendee.responseStatus || 'needsAction'] || RESPONSE_META.needsAction;
                const ResponseIcon = meta.icon;
                return (
                  <div key={attendee.email || i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <ResponseIcon className={`w-3.5 h-3.5 flex-shrink-0 ${meta.className}`} />
                    <span className="truncate">{attendee.displayName || attendee.email}</span>
                  </div>
                );
              })}
              {event.attendees.length > 3 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-5">+{event.attendees.length - 3} more</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {updatedLabel && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-auto pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
            Last updated {updatedLabel}
          </p>
        )}
      </div>
    );
  };

  const renderList = (list: CalendarEvent[], emptyLabel: string) => (
    <div>
      {loading ? (
        <GlassCard>
          <div className="flex items-center justify-center py-10 gap-2.5">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Loading events…</span>
          </div>
        </GlassCard>
      ) : error ? (
        <GlassCard>
          <div className="text-center py-10">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{error}</p>
            <button
              onClick={() => loadEvents()}
              className="common-button-bg2 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
            >
              Try again
            </button>
          </div>
        </GlassCard>
      ) : list.length === 0 ? (
        <GlassCard>
          <div className="text-center py-10">
            <CalendarDays className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{emptyLabel}</p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {upcomingSorted(list).map(renderEventCard)}
        </div>
      )}

      {tab !== 'daily' && nextPageToken && !loading && !error && (
        <div className="pt-4 mt-1 flex justify-center">
          <button
            onClick={() => loadEvents(nextPageToken)}
            disabled={loadingMore}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );

  const renderDailyCalendar = () => {
    const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);
    const allDayEvents = dailyEvents.filter(isAllDay);
    const timedEvents = dailyEvents.filter((e) => !isAllDay(e));

    const now = new Date();
    const isToday = sameDay(selectedDay, now);
    const nowOffset = ((now.getHours() + now.getMinutes() / 60) - DAY_START_HOUR) * HOUR_HEIGHT;

    return (
      <GlassCard>
        <div className="p-2 sm:p-3">
          {/* Date navigator */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              onClick={() => setSelectedDay((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{dayLabel(selectedDay)}</p>
              <button
                onClick={() => setSelectedDay(new Date())}
                className="text-[11px] text-blue-500 hover:underline"
              >
                Jump to today
              </button>
            </div>
            <button
              onClick={() => setSelectedDay((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {allDayEvents.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
              {allDayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => openEditForm(event)}
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:opacity-80 transition-opacity"
                >
                  {event.summary || '(No title)'}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2.5">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Loading events…</span>
            </div>
          ) : (
            <div className="relative overflow-y-auto" style={{ maxHeight: 520 }}>
              <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
                {/* Hour rows */}
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 flex items-start gap-2 border-t border-slate-100 dark:border-slate-800"
                    style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  >
                    <span className="w-12 flex-shrink-0 text-[10px] text-slate-400 dark:text-slate-500 -mt-2 text-right pr-1">
                      {new Date(0, 0, 0, hour).toLocaleTimeString(undefined, { hour: 'numeric' })}
                    </span>
                  </div>
                ))}

                {/* Now indicator */}
                {isToday && nowOffset >= 0 && nowOffset <= hours.length * HOUR_HEIGHT && (
                  <div
                    className="absolute left-12 right-0 h-px bg-red-500 z-10"
                    style={{ top: nowOffset }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 -mt-[3px] -ml-[3px]" />
                  </div>
                )}

                {/* Timed events */}
                <div className="absolute left-14 right-1 top-0 bottom-0">
                  {timedEvents.map((event) => {
                    const start = new Date(eventStart(event) || 0);
                    const end = new Date(eventEnd(event) || 0);
                    const startHour = start.getHours() + start.getMinutes() / 60;
                    const endHour = Math.max(startHour + 0.5, end.getHours() + end.getMinutes() / 60);
                    const top = Math.max(0, (startHour - DAY_START_HOUR) * HOUR_HEIGHT);
                    const height = Math.max(24, (endHour - Math.max(startHour, DAY_START_HOUR)) * HOUR_HEIGHT);
                    const ai = isAiCreated(event);
                    return (
                      <button
                        key={event.id}
                        onClick={() => openEditForm(event)}
                        className={`absolute left-0 right-0 rounded-lg border px-2 py-1 text-left overflow-hidden transition-opacity hover:opacity-90 ${
                          ai
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                        style={{ top, height }}
                      >
                        <p className={`text-[11px] font-semibold truncate ${ai ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                          {event.summary || '(No title)'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {!loading && dailyEvents.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs text-slate-400 dark:text-slate-500">No events on this day</p>
            </div>
          )}
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Live from your connected Google Calendar.
        </p>
        <button
          onClick={openCreateForm}
          className="common-button-bg flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700 overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.id;
          const count =
            t.id === 'all' ? events.length : t.id === 'ai' ? aiEvents.length : t.id === 'manual' ? manualEvents.length : null;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <t.icon className={`w-3.5 h-3.5 ${active ? 'opacity-100' : 'opacity-70'}`} />
              {t.label}
              {count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md tabular-nums font-semibold ${
                    active
                      ? 'bg-white/20 dark:bg-slate-900/15 text-white dark:text-slate-900'
                      : 'bg-slate-300/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'all' && renderList(events, 'No upcoming events')}
      {tab === 'ai' && renderList(aiEvents, 'No AI-created events yet')}
      {tab === 'manual' && renderList(manualEvents, 'No manually created events')}
      {tab === 'daily' && renderDailyCalendar()}

      {/* Create / edit event modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={closeForm}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button onClick={closeForm} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">{formError}</p>
                </div>
              )}
              {editingEvent && isAiCreated(editingEvent) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <Bot className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">This event was created by ShivAI.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.summary}
                  onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                  placeholder="e.g., Client demo call"
                  className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start *</label>
                  <input
                    type="datetime-local"
                    value={form.start}
                    onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">End *</label>
                  <input
                    type="datetime-local"
                    value={form.end}
                    onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-1">Times are in {DEFAULT_TIMEZONE}.</p>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Attendees</label>
                <input
                  type="text"
                  value={form.attendees}
                  onChange={(e) => setForm((p) => ({ ...p, attendees: e.target.value }))}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
              <button
                onClick={closeForm}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400" />
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Delete event?</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    "{deleteTarget.summary || 'This event'}" will be removed from Google Calendar.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarEvents;
