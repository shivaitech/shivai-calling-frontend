import React, { useMemo, useState } from "react";
import GlassCard from "../../../components/GlassCard";
import {
  ArrowLeft, Ticket, Users, ListChecks, LayoutDashboard, Mail, Phone as PhoneIcon,
  Send, CheckCircle2, RotateCcw, Paperclip, X, Plus, Trash2, Check, Clock,
  MessageSquare, ShieldCheck, Share2, Copy, ExternalLink, CalendarClock,
} from "lucide-react";
import { useIndustry } from "./industryConfig";
import { useDepartments } from "./departmentsStore";
import { StaffMember, STAFF_STATUS_META, WEEKDAYS, useStaff, DEFAULT_HOURS, Holiday } from "./staffStore";
import { useStaffWork, TicketProof } from "./staffWorkStore";
import { ticketStatusMeta, priorityMeta } from "./mockData";
import { AgentAvatar, StatCard, SectionTitle } from "./ui";

type Tab = "overview" | "tickets" | "customers" | "tasks" | "calendar";

const tabMeta: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "tickets", label: "Tickets", icon: Ticket },
  { key: "customers", label: "Customers", icon: Users },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "calendar", label: "Calendar", icon: CalendarClock },
];

const StaffDetailView: React.FC<{ staff: StaffMember; onBack: () => void }> = ({ staff, onBack }) => {
  const { terms } = useIndustry();
  const { departments } = useDepartments();
  const { shifts, hours, holidays, toggleShift, setHours, addHoliday, removeHoliday } = useStaff();
  const work = useStaffWork();

  const [tab, setTab] = useState<Tab>("overview");
  const [showShare, setShowShare] = useState(false);

  const tickets = work.ticketsForStaff(staff.id);
  const customers = work.customersForStaff(staff.id);
  const tasks = work.tasksForStaff(staff.id);

  const openTickets = tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length;
  const closedTickets = tickets.filter((t) => t.status === "closed").length;
  const pendingTasks = tasks.filter((t) => !t.done).length;
  const meta = STAFF_STATUS_META[staff.status];
  const deptName = departments.find((d) => d.id === staff.departmentId)?.name || "Unassigned";
  const shiftDays = shifts[staff.id] || [];

  return (
    <div className="space-y-5">
      {/* Back + Share */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Staff
        </button>
        <button
          onClick={() => setShowShare(true)}
          className="common-button-bg inline-flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm"
        >
          <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share to staff member</span>
          <span className="sm:hidden">Share</span>
        </button>
      </div>

      {/* Header card */}
      <GlassCard>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <AgentAvatar name={staff.name} hue={staff.hue} size={64} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{staff.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{staff.role || terms.agent}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.bg} ${meta.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/50">
                {deptName}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 sm:text-right">
            {staff.email && <p className="flex items-center gap-1.5 sm:justify-end"><Mail className="w-3.5 h-3.5" /> {staff.email}</p>}
            {staff.phone && <p className="flex items-center gap-1.5 sm:justify-end"><PhoneIcon className="w-3.5 h-3.5" /> {staff.phone}</p>}
            <div className="flex items-center gap-1 sm:justify-end pt-0.5">
              {WEEKDAYS.map((d, i) => (
                <span
                  key={d}
                  className={`w-5 text-center text-[10px] font-medium rounded py-0.5 ${
                    shiftDays.includes(i)
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {d[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Ticket} color="blue" label="Assigned Tickets" value={tickets.length} />
        <StatCard icon={MessageSquare} color="amber" label="Open" value={openTickets} />
        <StatCard icon={CheckCircle2} color="emerald" label="Closed" value={closedTickets} />
        <StatCard icon={ListChecks} color="purple" label="Pending Tasks" value={pendingTasks} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-full overflow-x-auto no-scrollbar">
        {tabMeta.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === key
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab staff={staff} tickets={tickets} customers={customers} tasks={tasks} onGo={setTab} />
      )}
      {tab === "tickets" && <TicketsTab staff={staff} tickets={tickets} work={work} />}
      {tab === "customers" && <CustomersTab customers={customers} termsCustomer={terms.customer} />}
      {tab === "tasks" && <TasksTab staff={staff} tasks={tasks} work={work} />}
      {tab === "calendar" && (
        <CalendarTab
          days={shifts[staff.id] || []}
          hours={hours[staff.id] || DEFAULT_HOURS}
          holidays={holidays[staff.id] || []}
          onToggleDay={(d) => toggleShift(staff.id, d)}
          onHours={(h) => setHours(staff.id, h)}
          onAddHoliday={(date, label) => addHoliday(staff.id, date, label)}
          onRemoveHoliday={(date) => removeHoliday(staff.id, date)}
        />
      )}

      {showShare && <ShareModal staff={staff} onClose={() => setShowShare(false)} />}
    </div>
  );
};

// ── Share modal ───────────────────────────────────────────────────────────────

const ShareModal: React.FC<{ staff: StaffMember; onClose: () => void }> = ({ staff, onClose }) => {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/staff-portal/${staff.id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const waHref = staff.phone
    ? `https://wa.me/${staff.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi ${staff.name}, here's your ShivAI staff workspace — see your tickets, tasks and update your calendar: ${url}`
      )}`
    : null;
  const mailHref = staff.email
    ? `mailto:${staff.email}?subject=${encodeURIComponent("Your ShivAI staff workspace")}&body=${encodeURIComponent(
        `Hi ${staff.name},\n\nOpen your personal workspace to see your tickets, tasks and update your working calendar:\n${url}\n`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <Share2 className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Share workspace</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">A personal app link for {staff.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {staff.name} can open this link to see their tickets, tasks and customers, reply/close tickets with proof, and update their working days &amp; hours — all in one mobile-friendly app.
          </p>
          <div className="flex items-center gap-2">
            <input readOnly value={url} className="flex-1 px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 truncate" />
            <button onClick={copy} className="common-button-bg inline-flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
              <ExternalLink className="w-4 h-4" /> Open
            </a>
            {waHref && (
              <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </a>
            )}
            {mailHref && (
              <a href={mailHref} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                <Mail className="w-4 h-4" /> Email
              </a>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Anyone with the link can view and update this staff member's workspace, so share it only with {staff.name}.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Holidays editor (shared with the staff portal) ────────────────────────────

export const HolidaysEditor: React.FC<{
  holidays: Holiday[];
  onAdd: (date: string, label?: string) => void;
  onRemove: (date: string) => void;
}> = ({ holidays, onAdd, onRemove }) => {
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = holidays.filter((h) => h.date >= today);
  const past = holidays.filter((h) => h.date < today);

  const fmt = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const submit = () => {
    if (!date) return;
    onAdd(date, label);
    setDate("");
    setLabel("");
  };

  const inputCls =
    "px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

  const Row = ({ h, muted }: { h: Holiday; muted?: boolean }) => (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 ${muted ? "opacity-60" : ""}`}>
      <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center flex-shrink-0">
        <CalendarClock className="w-4 h-4 text-rose-500 dark:text-rose-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{h.label || "Holiday"}</p>
        <p className="text-[11px] text-slate-400">{fmt(h.date)}</p>
      </div>
      <button onClick={() => onRemove(h.date)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className={`${inputCls} sm:w-40`} />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Reason (optional)" className={`${inputCls} flex-1`} />
        <button onClick={submit} disabled={!date} className="common-button-bg inline-flex items-center justify-center gap-1.5 !px-3 !py-2 rounded-lg text-sm disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {upcoming.length === 0 && past.length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">No holidays marked.</p>
        )}
        {upcoming.map((h) => <Row key={h.date} h={h} />)}
        {past.length > 0 && (
          <>
            <p className="text-[11px] font-medium text-slate-400 pt-1">Past</p>
            {past.map((h) => <Row key={h.date} h={h} muted />)}
          </>
        )}
      </div>
    </div>
  );
};

// ── Calendar tab (admin edits staff days + hours + holidays) ──────────────────

const CalendarTab: React.FC<{
  days: number[];
  hours: { start: string; end: string };
  holidays: Holiday[];
  onToggleDay: (d: number) => void;
  onHours: (h: { start: string; end: string }) => void;
  onAddHoliday: (date: string, label?: string) => void;
  onRemoveHoliday: (date: string) => void;
}> = ({ days, hours, holidays, onToggleDay, onHours, onAddHoliday, onRemoveHoliday }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <GlassCard>
        <div className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Working days</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d, i) => {
              const on = days.includes(i);
              return (
                <button
                  key={d}
                  onClick={() => onToggleDay(i)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg transition-colors ${on ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
                >
                  <span className="text-[11px] font-semibold">{d}</span>
                  <span className="text-[10px]">{on ? "On" : "Off"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Working hours</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start</label>
              <input type="time" value={hours.start} onChange={(e) => onHours({ ...hours, start: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">End</label>
              <input type="time" value={hours.end} onChange={(e) => onHours({ ...hours, end: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">The staff member can also edit these from their shared workspace.</p>
        </div>
      </GlassCard>
    </div>
    <GlassCard>
      <div className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Holidays &amp; days off</h3>
        <HolidaysEditor holidays={holidays} onAdd={onAddHoliday} onRemove={onRemoveHoliday} />
      </div>
    </GlassCard>
  </div>
);

// ── Overview tab ──────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  staff: StaffMember;
  tickets: ReturnType<ReturnType<typeof useStaffWork>["ticketsForStaff"]>;
  customers: ReturnType<ReturnType<typeof useStaffWork>["customersForStaff"]>;
  tasks: ReturnType<ReturnType<typeof useStaffWork>["tasksForStaff"]>;
  onGo: (t: Tab) => void;
}> = ({ tickets, customers, tasks, onGo }) => {
  const recentTickets = tickets.slice(0, 4);
  const openTasks = tasks.filter((t) => !t.done).slice(0, 4);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <GlassCard>
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Recent Tickets</h3>
            <button onClick={() => onGo("tickets")} className="text-xs text-violet-600 dark:text-violet-400 font-medium">View all</button>
          </div>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No tickets assigned.</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((t) => {
                const sm = ticketStatusMeta(t.status);
                return (
                  <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.subject}</p>
                      <p className="text-[11px] text-slate-400 truncate">{t.id} · {t.customer}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sm.cls}`}>{sm.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Open Tasks</h3>
            <button onClick={() => onGo("tasks")} className="text-xs text-violet-600 dark:text-violet-400 font-medium">View all</button>
          </div>
          {openTasks.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No open tasks.</p>
          ) : (
            <div className="space-y-2">
              {openTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t.due}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-3">{customers.length} customers assigned</p>
        </div>
      </GlassCard>
    </div>
  );
};

// ── Tickets tab ───────────────────────────────────────────────────────────────

const TicketsTab: React.FC<{
  staff: StaffMember;
  tickets: ReturnType<ReturnType<typeof useStaffWork>["ticketsForStaff"]>;
  work: ReturnType<typeof useStaffWork>;
}> = ({ staff, tickets, work }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [closing, setClosing] = useState<string | null>(null);

  if (tickets.length === 0) {
    return (
      <GlassCard>
        <div className="p-10 text-center">
          <Ticket className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No tickets assigned to {staff.name}.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((t) => {
        const sm = ticketStatusMeta(t.status);
        const pm = priorityMeta(t.priority);
        const isOpen = expanded === t.id;
        const canAct = t.status !== "closed";
        return (
          <GlassCard key={t.id}>
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{t.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sm.cls}`}>{sm.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${pm.cls}`}>{pm.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{t.subject}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.customer} · {t.createdAt}</p>
                </div>
                <button
                  onClick={() => { setExpanded(isOpen ? null : t.id); setReplyText(""); }}
                  className="text-xs text-violet-600 dark:text-violet-400 font-medium flex-shrink-0"
                >
                  {isOpen ? "Hide" : "Open"}
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{t.lastMessage}</p>

              {/* Closed summary */}
              {t.status === "closed" && t.closeReason && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200/60 dark:border-emerald-800/40">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Closed {t.closedBy ? `by ${t.closedBy}` : ""}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t.closeReason}</p>
                  {t.proofs && t.proofs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {t.proofs.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          <Paperclip className="w-3 h-3" /> {p.name || p.note}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  {/* Replies thread */}
                  {t.replies.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {t.replies.map((r) => (
                        <div key={r.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{r.by} · {new Date(r.at).toLocaleString()}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {canAct ? (
                    <>
                      <div className="flex items-end gap-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          placeholder="Write a reply to the customer…"
                          className="flex-1 px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                        />
                        <button
                          onClick={() => {
                            if (!replyText.trim()) return;
                            work.addReply(t.id, staff.name, replyText);
                            setReplyText("");
                          }}
                          disabled={!replyText.trim()}
                          className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" /> <span className="hidden sm:inline">Reply</span>
                        </button>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => setClosing(t.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Close with proof
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => work.reopenTicket(t.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <RotateCcw className="w-4 h-4" /> Reopen ticket
                    </button>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        );
      })}

      {closing && (
        <CloseTicketModal
          onClose={() => setClosing(null)}
          onConfirm={(reason, proofs) => {
            work.closeTicket(closing, staff.name, reason, proofs);
            setClosing(null);
            setExpanded(null);
          }}
        />
      )}
    </div>
  );
};

// ── Close-ticket modal (reason + proof) ───────────────────────────────────────

const CloseTicketModal: React.FC<{
  onClose: () => void;
  onConfirm: (reason: string, proofs: TicketProof[]) => void;
}> = ({ onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofs, setProofs] = useState<TicketProof[]>([]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const isImage = f.type.startsWith("image/") && f.size < 400 * 1024; // inline small images only
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () =>
          setProofs((p) => [...p, { name: f.name, dataUrl: String(reader.result) }]);
        reader.readAsDataURL(f);
      } else {
        setProofs((p) => [...p, { name: f.name }]);
      }
    });
  };

  const addLink = () => {
    if (!proofNote.trim()) return;
    setProofs((p) => [...p, { name: proofNote.trim(), note: proofNote.trim() }]);
    setProofNote("");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Close ticket</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add a resolution reason and proof of completion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Resolution reason <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Describe how the issue was resolved…"
              className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Proof of completion</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                <Paperclip className="w-4 h-4" /> Attach file
                <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
              <div className="flex-1 flex gap-2">
                <input
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="…or paste a link / note"
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button onClick={addLink} disabled={!proofNote.trim()} className="px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {proofs.length > 0 && (
              <div className="mt-3 space-y-2">
                {proofs.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    {p.dataUrl ? (
                      <img src={p.dataUrl} alt={p.name} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Paperclip className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                    <span className="text-sm text-slate-700 dark:text-slate-200 truncate flex-1">{p.name}</span>
                    <button
                      onClick={() => setProofs((prev) => prev.filter((_, j) => j !== i))}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason, proofs)}
            disabled={reason.trim().length < 3}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" /> Close ticket
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Customers tab ─────────────────────────────────────────────────────────────

const CustomersTab: React.FC<{
  customers: ReturnType<ReturnType<typeof useStaffWork>["customersForStaff"]>;
  termsCustomer: string;
}> = ({ customers, termsCustomer }) => {
  if (customers.length === 0) {
    return (
      <GlassCard>
        <div className="p-10 text-center">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No {termsCustomer.toLowerCase()}s assigned.</p>
        </div>
      </GlassCard>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {customers.map((c) => c && (
        <GlassCard key={c.id} hover>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 dark:text-white truncate">{c.name}</p>
                <p className="text-xs text-slate-400 truncate">{c.location}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
              <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate"><Mail className="w-3.5 h-3.5" /> {c.email}</p>
              <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><PhoneIcon className="w-3.5 h-3.5" /> {c.phone}</p>
              <div className="flex items-center gap-3 pt-1 text-[11px]">
                <span className="text-amber-600 dark:text-amber-400 font-medium">{c.activeTickets} active</span>
                <span className="text-slate-400">{c.totalTickets} total tickets</span>
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};

// ── Tasks tab ─────────────────────────────────────────────────────────────────

const TasksTab: React.FC<{
  staff: StaffMember;
  tasks: ReturnType<ReturnType<typeof useStaffWork>["tasksForStaff"]>;
  work: ReturnType<typeof useStaffWork>;
}> = ({ staff, tasks, work }) => {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const submit = () => {
    if (title.trim().length < 2) return;
    work.addTask(staff.id, title, due || "No due date");
    setTitle(""); setDue(""); setAdding(false);
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!adding && (
          <button onClick={() => setAdding(true)} className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm">
            <Plus className="w-4 h-4" /> Assign Task
          </button>
        )}
      </div>

      {adding && (
        <GlassCard>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className={inputCls} />
              <input value={due} onChange={(e) => setDue(e.target.value)} placeholder="Due (e.g. Today 4pm)" className={inputCls} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setAdding(false)} className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={submit} disabled={title.trim().length < 2} className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm disabled:opacity-50">
                <Check className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {tasks.length === 0 ? (
        <GlassCard>
          <div className="p-10 text-center">
            <ListChecks className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No tasks assigned yet.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <GlassCard key={t.id}>
              <div className="p-3.5 flex items-center gap-3">
                <button
                  onClick={() => work.toggleTask(t.id)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    t.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {t.done && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${t.done ? "line-through text-slate-400" : "text-slate-800 dark:text-white"}`}>{t.title}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t.due}{t.ticketId ? ` · ${t.ticketId}` : ""}</p>
                </div>
                <button onClick={() => work.removeTask(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffDetailView;
