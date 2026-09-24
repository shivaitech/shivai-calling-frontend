import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Ticket, ListChecks, Users, CalendarClock, Send, CheckCircle2, RotateCcw,
  Paperclip, X, Plus, Check, Clock, Mail, Phone as PhoneIcon, ShieldCheck,
  LayoutDashboard, RefreshCw,
} from "lucide-react";
import { useStaff, STAFF_STATUS_META, WEEKDAYS, DEFAULT_HOURS, Holiday } from "../ClientDashboard/apps/SupportCRM/staffStore";
import { useStaffWork, TicketProof } from "../ClientDashboard/apps/SupportCRM/staffWorkStore";
import { ticketStatusMeta, priorityMeta } from "../ClientDashboard/apps/SupportCRM/mockData";
import { HolidaysEditor } from "../ClientDashboard/apps/SupportCRM/StaffDetailView";

/**
 * Shareable staff mini-app (PWA-style). A staff member opens
 * /staff-portal/:staffId to see and update their own work in real time:
 * tickets (reply / close with proof), tasks, customers, and their calendar
 * (working days + hours). Public route — no dashboard chrome. Backed by the
 * same local stores the admin uses, so changes reflect live on the same device.
 */

type Tab = "today" | "tickets" | "tasks" | "customers" | "calendar";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "today", label: "Today", icon: LayoutDashboard },
  { key: "tickets", label: "Tickets", icon: Ticket },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "customers", label: "Customers", icon: Users },
  { key: "calendar", label: "Calendar", icon: CalendarClock },
];

const StaffPortalPage: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const { staff, shifts, hours, holidays, toggleShift, setHours, addHoliday, removeHoliday } = useStaff();
  const work = useStaffWork();
  const [tab, setTab] = useState<Tab>("today");

  const me = staff.find((s) => s.id === staffId);

  if (!me) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
        <div>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-base font-semibold text-slate-800 dark:text-white">Staff not found</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            This staff link is invalid or was opened on a different device.
          </p>
        </div>
      </div>
    );
  }

  const tickets = work.ticketsForStaff(me.id);
  const tasks = work.tasksForStaff(me.id);
  const customers = work.customersForStaff(me.id);
  const meta = STAFF_STATUS_META[me.status];
  const openTickets = tickets.filter((t) => t.status !== "closed" && t.status !== "resolved");
  const pendingTasks = tasks.filter((t) => !t.done);
  const myHours = hours[me.id] || DEFAULT_HOURS;

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* App header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-white flex-shrink-0"
            style={{ background: `linear-gradient(135deg, hsl(${me.hue},70%,55%), hsl(${me.hue + 25},65%,45%))` }}
          >
            {me.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{me.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {me.role || "Staff"} · My workspace
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-2 flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === key
                  ? "bg-violet-600 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4">
        {tab === "today" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Open Tickets" value={openTickets.length} />
              <Stat label="Tasks Due" value={pendingTasks.length} />
              <Stat label="Customers" value={customers.length} />
            </div>
            <Card title="Open tickets">
              {openTickets.length === 0 ? (
                <Empty text="No open tickets. 🎉" />
              ) : (
                <div className="space-y-2">
                  {openTickets.slice(0, 5).map((t) => {
                    const sm = ticketStatusMeta(t.status);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTab("tickets")}
                        className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.subject}</p>
                          <p className="text-[11px] text-slate-400 truncate">{t.id} · {t.customer}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sm.cls}`}>{sm.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
            <Card title="Today's tasks">
              {pendingTasks.length === 0 ? (
                <Empty text="No pending tasks." />
              ) : (
                <div className="space-y-2">
                  {pendingTasks.slice(0, 5).map((t) => (
                    <label key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <button
                        onClick={() => work.toggleTask(t.id)}
                        className="w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.title}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t.due}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === "tickets" && <PortalTickets staffName={me.name} tickets={tickets} work={work} />}
        {tab === "tasks" && <PortalTasks tasks={tasks} work={work} />}
        {tab === "customers" && (
          <div className="space-y-2">
            {customers.length === 0 ? (
              <Empty text="No customers assigned." />
            ) : (
              customers.map((c) => c && (
                <Card key={c.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-semibold flex-shrink-0">{c.name.charAt(0)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-white truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1.5"><Mail className="w-3 h-3" /> {c.email}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5"><PhoneIcon className="w-3 h-3" /> {c.phone}</p>
                    </div>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">{c.activeTickets} active</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === "calendar" && (
          <PortalCalendar
            days={shifts[me.id] || []}
            hours={myHours}
            holidays={holidays[me.id] || []}
            onToggleDay={(d) => toggleShift(me.id, d)}
            onHours={(h) => setHours(me.id, h)}
            onAddHoliday={(date, label) => addHoliday(me.id, date, label)}
            onRemoveHoliday={(date) => removeHoliday(me.id, date)}
          />
        )}
      </main>

      <footer className="max-w-2xl mx-auto w-full px-4 py-3 text-center text-[11px] text-slate-400">
        Your changes are saved automatically.
      </footer>
    </div>
  );
};

// ── Small shared atoms ────────────────────────────────────────────────────────

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
    <p className="text-xl font-bold text-slate-800 dark:text-white leading-none">{value}</p>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{label}</p>
  </div>
);

const Card: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
    {title && <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">{title}</h3>}
    {children}
  </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-sm text-slate-400 py-6 text-center">{text}</p>
);

// ── Tickets ───────────────────────────────────────────────────────────────────

const PortalTickets: React.FC<{
  staffName: string;
  tickets: ReturnType<ReturnType<typeof useStaffWork>["ticketsForStaff"]>;
  work: ReturnType<typeof useStaffWork>;
}> = ({ staffName, tickets, work }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [closing, setClosing] = useState<string | null>(null);

  if (tickets.length === 0) return <Empty text="No tickets assigned." />;

  return (
    <div className="space-y-3">
      {tickets.map((t) => {
        const sm = ticketStatusMeta(t.status);
        const pm = priorityMeta(t.priority);
        const isOpen = expanded === t.id;
        const canAct = t.status !== "closed";
        return (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-400">{t.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sm.cls}`}>{sm.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${pm.cls}`}>{pm.label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{t.subject}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{t.customer} · {t.createdAt}</p>
              </div>
              <button onClick={() => { setExpanded(isOpen ? null : t.id); setReply(""); }} className="text-xs text-violet-600 dark:text-violet-400 font-medium flex-shrink-0">
                {isOpen ? "Hide" : "Open"}
              </button>
            </div>

            {t.status === "closed" && t.closeReason && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200/60 dark:border-emerald-800/40">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Closed</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t.closeReason}</p>
                {t.proofs && t.proofs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {t.proofs.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"><Paperclip className="w-3 h-3" /> {p.name || p.note}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isOpen && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
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
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={2}
                      placeholder="Reply to the customer…"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                    />
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <button
                        onClick={() => setClosing(t.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Close with proof
                      </button>
                      <button
                        onClick={() => { if (reply.trim()) { work.addReply(t.id, staffName, reply); setReply(""); } }}
                        disabled={!reply.trim()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" /> Reply
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={() => work.reopenTicket(t.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <RotateCcw className="w-4 h-4" /> Reopen
                  </button>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {closing && (
        <CloseModal
          onClose={() => setClosing(null)}
          onConfirm={(reason, proofs) => { work.closeTicket(closing, staffName, reason, proofs); setClosing(null); setExpanded(null); }}
        />
      )}
    </div>
  );
};

const CloseModal: React.FC<{ onClose: () => void; onConfirm: (reason: string, proofs: TicketProof[]) => void }> = ({ onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [proofs, setProofs] = useState<TicketProof[]>([]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const isImg = f.type.startsWith("image/") && f.size < 400 * 1024;
      if (isImg) {
        const r = new FileReader();
        r.onload = () => setProofs((p) => [...p, { name: f.name, dataUrl: String(r.result) }]);
        r.readAsDataURL(f);
      } else setProofs((p) => [...p, { name: f.name }]);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Close ticket</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Resolution reason <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="How was it resolved?" className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Proof of completion</label>
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">
                <Paperclip className="w-4 h-4" /> Attach
                <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="or paste link/note" className="flex-1 px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              <button onClick={() => { if (note.trim()) { setProofs((p) => [...p, { name: note.trim(), note: note.trim() }]); setNote(""); } }} disabled={!note.trim()} className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
            </div>
            {proofs.length > 0 && (
              <div className="mt-3 space-y-2">
                {proofs.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    {p.dataUrl ? <img src={p.dataUrl} className="w-9 h-9 rounded object-cover" alt={p.name} /> : <div className="w-9 h-9 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><Paperclip className="w-4 h-4 text-slate-500" /></div>}
                    <span className="text-sm text-slate-700 dark:text-slate-200 truncate flex-1">{p.name}</span>
                    <button onClick={() => setProofs((prev) => prev.filter((_, j) => j !== i))} className="p-1 text-slate-400"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300">Cancel</button>
          <button onClick={() => onConfirm(reason, proofs)} disabled={reason.trim().length < 3} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"><Check className="w-4 h-4" /> Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

const PortalTasks: React.FC<{
  tasks: ReturnType<ReturnType<typeof useStaffWork>["tasksForStaff"]>;
  work: ReturnType<typeof useStaffWork>;
}> = ({ tasks, work }) => {
  if (tasks.length === 0) return <Empty text="No tasks assigned." />;
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <Card key={t.id}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => work.toggleTask(t.id)}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${t.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"}`}
            >
              {t.done && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${t.done ? "line-through text-slate-400" : "text-slate-800 dark:text-white"}`}>{t.title}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t.due}{t.ticketId ? ` · ${t.ticketId}` : ""}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ── Calendar (working days + hours) ───────────────────────────────────────────

const PortalCalendar: React.FC<{
  days: number[];
  hours: { start: string; end: string };
  holidays: Holiday[];
  onToggleDay: (d: number) => void;
  onHours: (h: { start: string; end: string }) => void;
  onAddHoliday: (date: string, label?: string) => void;
  onRemoveHoliday: (date: string) => void;
}> = ({ days, hours, holidays, onToggleDay, onHours, onAddHoliday, onRemoveHoliday }) => {
  return (
    <div className="space-y-4">
      <Card title="Working days">
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
        <p className="text-[11px] text-slate-400 mt-2">Tap a day to mark yourself working / off.</p>
      </Card>

      <Card title="Working hours">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start</label>
            <input
              type="time"
              value={hours.start}
              onChange={(e) => onHours({ ...hours, start: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">End</label>
            <input
              type="time"
              value={hours.end}
              onChange={(e) => onHours({ ...hours, end: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">These hours apply to your working days above.</p>
      </Card>

      <Card title="Holidays & days off">
        <HolidaysEditor holidays={holidays} onAdd={onAddHoliday} onRemove={onRemoveHoliday} />
      </Card>
    </div>
  );
};

export default StaffPortalPage;
