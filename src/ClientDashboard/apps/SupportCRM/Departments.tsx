import React, { useState } from "react";
import GlassCard from "../../../components/GlassCard";
import {
  Building2, Users, PhoneCall, Inbox, ShieldCheck, Plus, ArrowLeft,
  ChevronRight, Pencil, Trash2, Check, X, Star, UserPlus,
} from "lucide-react";
import { AGENTS, fmtDuration } from "./mockData";
import { useIndustry } from "./industryConfig";
import { useDepartments, Department } from "./departmentsStore";
import { AgentAvatar, StatusPill, StatCard, SectionTitle } from "./ui";

export const Departments: React.FC = () => {
  const { terms } = useIndustry();
  const dept = useDepartments();
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", desc: "" });

  if (selected) {
    const d = dept.departments.find((x) => x.id === selected);
    if (d) return <DepartmentDetail dept={d} onBack={() => setSelected(null)} />;
  }

  const deptLabel = terms.department;
  const deptPlural = `${deptLabel}s`;

  const totalAssigned = AGENTS.filter((a) => dept.assignments[a.id]).length;

  const startAdd = () => { setForm({ name: "", desc: "" }); setAdding(true); setEditing(null); };
  const startEdit = (d: Department) => { setForm({ name: d.name, desc: d.desc }); setEditing(d); setAdding(true); };
  const submit = () => {
    if (form.name.trim().length < 2) return;
    if (editing) dept.updateDepartment(editing.id, { name: form.name.trim(), desc: form.desc.trim() });
    else dept.addDepartment(form.name, form.desc);
    setAdding(false); setEditing(null); setForm({ name: "", desc: "" });
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title={deptPlural}
        subtitle={`Organise work into ${deptPlural.toLowerCase()} — your AI ${terms.agent.toLowerCase()}s work under them`}
        right={
          !adding && (
            <button onClick={startAdd} className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add {deptLabel}</span>
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Building2} color="blue" label={deptPlural} value={dept.departments.length} />
        <StatCard icon={Users} color="purple" label={`AI ${terms.agent}s Assigned`} value={totalAssigned} />
        <StatCard icon={PhoneCall} color="green" label="On Call Now" value={AGENTS.filter((a) => a.status === "on-call").length} />
        <StatCard icon={Inbox} color="amber" label="Unassigned" value={AGENTS.length - totalAssigned} />
      </div>

      {/* Add / edit form */}
      {adding && (
        <GlassCard>
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">{editing ? `Edit ${deptLabel}` : `New ${deptLabel}`}</h3>
              <button onClick={() => { setAdding(false); setEditing(null); }} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{deptLabel} name</label>
                <input autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={`e.g. ${terms.department === "Cell" ? "Grievance Cell" : "Billing & Payments"}`}
                  className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <input value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                  placeholder="What this team handles" className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setAdding(false); setEditing(null); }} className="common-button-bg2 !px-4 !py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={form.name.trim().length < 2} className="common-button-bg flex items-center gap-1.5 !px-4 !py-2 rounded-lg text-sm disabled:opacity-50">
                <Check className="w-4 h-4" /> {editing ? "Save" : `Add ${deptLabel}`}
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Department cards */}
      {dept.departments.length === 0 ? (
        <GlassCard>
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No {deptPlural.toLowerCase()} yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first {deptLabel.toLowerCase()} to organise your AI workforce.</p>
            <button onClick={startAdd} className="common-button-bg inline-flex items-center gap-1.5 !px-4 !py-2 rounded-lg text-sm mt-4"><Plus className="w-4 h-4" /> Add {deptLabel}</button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dept.departments.map((d) => {
            const s = dept.statsFor(d.id);
            return (
              <GlassCard key={d.id} hover>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: `linear-gradient(135deg, hsl(${d.hue},65%,52%), hsl(${d.hue + 25},60%,42%))` }}>
                      <Building2 className="w-5 h-5" />
                    </span>
                    <button onClick={() => setSelected(d.id)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 dark:text-white truncate">{d.name}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{d.desc || "—"}</p>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => dept.removeDepartment(d.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    <DeptMini icon={Users} value={s.agentCount} label={terms.agent + "s"} />
                    <DeptMini icon={PhoneCall} value={s.callsToday} label="Calls" />
                    <DeptMini icon={Inbox} value={s.openTickets} label="Open" />
                    <DeptMini icon={ShieldCheck} value={`${s.avgSla}%`} label="SLA" />
                  </div>

                  {/* Agents preview */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    {s.agents.length === 0 ? (
                      <span className="text-xs text-slate-400">No {terms.agent.toLowerCase()}s assigned yet</span>
                    ) : (
                      <div className="flex items-center -space-x-2">
                        {s.agents.slice(0, 5).map((a) => (
                          <div key={a.id} className="ring-2 ring-white dark:ring-slate-800 rounded-xl">
                            <AgentAvatar name={a.name} hue={a.avatarHue} size={28} />
                          </div>
                        ))}
                        {s.agents.length > 5 && (
                          <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-500">+{s.agents.length - 5}</span>
                        )}
                      </div>
                    )}
                    {s.onCall > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {s.onCall} on call
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DeptMini: React.FC<{ icon: React.ElementType; value: React.ReactNode; label: string }> = ({ icon: Icon, value, label }) => (
  <div className="text-center p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40">
    <Icon className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
    <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{value}</p>
    <p className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
  </div>
);

// ── Department detail: agents under it + assign more ──────────────────────────
const DepartmentDetail: React.FC<{ dept: Department; onBack: () => void }> = ({ dept: d, onBack }) => {
  const { terms } = useIndustry();
  const depts = useDepartments();
  const s = depts.statsFor(d.id);
  const [assigning, setAssigning] = useState(false);

  const unassigned = AGENTS.filter((a) => depts.assignments[a.id] !== d.id);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> All {terms.department.toLowerCase()}s
      </button>

      <GlassCard>
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: `linear-gradient(135deg, hsl(${d.hue},65%,52%), hsl(${d.hue + 25},60%,42%))` }}>
              <Building2 className="w-7 h-7" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{d.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{d.desc || "—"}</p>
            </div>
            <button onClick={() => setAssigning((v) => !v)} className="common-button-bg2 flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm">
              <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Assign {terms.agent}</span>
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} color="blue" label={`${terms.agent}s`} value={s.agentCount} />
        <StatCard icon={PhoneCall} color="green" label="Calls Today" value={s.callsToday} />
        <StatCard icon={Inbox} color="amber" label="Open Tickets" value={s.openTickets} />
        <StatCard icon={Star} color="purple" label="Avg CSAT" value={s.avgCsat} />
      </div>

      {/* Assign agents panel */}
      {assigning && (
        <GlassCard>
          <div className="p-5 sm:p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-3">Assign {terms.agent}s to {d.name}</h3>
            {unassigned.length === 0 ? (
              <p className="text-sm text-slate-400">All {terms.agent.toLowerCase()}s are already in this {terms.department.toLowerCase()}.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unassigned.map((a) => {
                  const current = depts.departments.find((x) => x.id === depts.assignments[a.id]);
                  return (
                    <button key={a.id} onClick={() => depts.assignAgent(a.id, d.id)}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all text-left">
                      <AgentAvatar name={a.name} hue={a.avatarHue} status={a.status} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{a.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{current ? `in ${current.name}` : a.role}</p>
                      </div>
                      <Plus className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Agents in this department */}
      <GlassCard>
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">{terms.agent}s in this {terms.department.toLowerCase()}</h3>
          {s.agents.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No {terms.agent.toLowerCase()}s assigned. Use “Assign {terms.agent}” to add some.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {s.agents.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <AgentAvatar name={a.name} hue={a.avatarHue} status={a.status} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{a.name}</p>
                      <span className="text-xs text-slate-400">{a.role}</span>
                    </div>
                    {a.status === "on-call" && a.liveCustomer ? (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">On call · {a.liveCustomer} · {fmtDuration(a.liveSinceSec || 0)}</p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">{a.metrics.callsToday} calls today · CSAT {a.metrics.csat.toFixed(1)}</p>
                    )}
                  </div>
                  <StatusPill status={a.status} pulse />
                  <button onClick={() => depts.assignAgent(a.id, "")} title="Remove from department"
                    className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
