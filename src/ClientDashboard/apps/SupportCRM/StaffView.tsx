import React, { useState } from "react";
import GlassCard from "../../../components/GlassCard";
import {
  Users, UserPlus, Pencil, Trash2, Check, X, Mail, Phone as PhoneIcon,
  UserCheck, CalendarClock,
} from "lucide-react";
import { useIndustry } from "./industryConfig";
import { useDepartments } from "./departmentsStore";
import {
  useStaff,
  StaffMember,
  StaffStatus,
  STAFF_STATUS_META,
  WEEKDAYS,
} from "./staffStore";
import { AgentAvatar, StatCard, SectionTitle } from "./ui";

const STATUS_OPTIONS: StaffStatus[] = ["active", "on-leave", "inactive"];

const emptyForm = (): Omit<StaffMember, "id" | "hue"> => ({
  name: "",
  role: "",
  departmentId: null,
  email: "",
  phone: "",
  status: "active",
});

const StaffView: React.FC = () => {
  const { terms } = useIndustry();
  const { departments } = useDepartments();
  const { staff, shifts, addStaff, updateStaff, removeStaff } = useStaff();

  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<StaffMember, "id" | "hue">>(emptyForm());

  const deptName = (id: string | null) =>
    departments.find((d) => d.id === id)?.name || "Unassigned";

  const startAdd = () => {
    setForm(emptyForm());
    setEditing(null);
    setAdding(true);
  };
  const startEdit = (m: StaffMember) => {
    setForm({
      name: m.name,
      role: m.role,
      departmentId: m.departmentId,
      email: m.email,
      phone: m.phone,
      status: m.status,
    });
    setEditing(m);
    setAdding(true);
  };
  const submit = () => {
    if (form.name.trim().length < 2) return;
    if (editing) updateStaff(editing.id, form);
    else addStaff(form);
    setAdding(false);
    setEditing(null);
    setForm(emptyForm());
  };
  const cancel = () => {
    setAdding(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const activeCount = staff.filter((s) => s.status === "active").length;
  const onLeaveCount = staff.filter((s) => s.status === "on-leave").length;

  const inputCls =
    "w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400";

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Staff"
        subtitle={`Your human support team — the people who work alongside your AI ${terms.agent.toLowerCase()}s`}
        right={
          !adding && (
            <button
              onClick={startAdd}
              className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm"
            >
              <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Add Staff</span>
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} color="blue" label="Team Members" value={staff.length} />
        <StatCard icon={UserCheck} color="emerald" label="Active" value={activeCount} />
        <StatCard icon={CalendarClock} color="amber" label="On Leave" value={onLeaveCount} />
        <StatCard icon={Users} color="purple" label={`${terms.department}s`} value={departments.length} />
      </div>

      {/* Add / Edit form */}
      {adding && (
        <GlassCard>
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                {editing ? "Edit staff member" : "Add staff member"}
              </h3>
              <button
                onClick={cancel}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Role</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder={`e.g. Senior ${terms.agent}`}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{terms.department}</label>
                <select
                  value={form.departmentId ?? ""}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value || null })}
                  className={inputCls}
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as StaffStatus })}
                  className={inputCls}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{STAFF_STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@company.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98XXXXXX21"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={cancel}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={form.name.trim().length < 2}
                className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" /> {editing ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Roster */}
      {staff.length === 0 ? (
        <GlassCard>
          <div className="p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl common-bg-icons flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No staff yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add your human support team to build the shift calendar.
            </p>
            <button
              onClick={startAdd}
              className="mt-4 inline-flex items-center gap-1.5 common-button-bg !px-4 !py-2 rounded-lg text-sm"
            >
              <UserPlus className="w-4 h-4" /> Add Staff
            </button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {staff.map((m) => {
            const meta = STAFF_STATUS_META[m.status];
            const shiftDays = shifts[m.id] || [];
            return (
              <GlassCard key={m.id} hover>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <AgentAvatar name={m.name} hue={m.hue} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-white truncate">{m.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.role || "—"}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEdit(m)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeStaff(m.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.bg} ${meta.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/50">
                          {deptName(m.departmentId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                    {m.email && (
                      <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {m.email}
                      </p>
                    )}
                    {m.phone && (
                      <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <PhoneIcon className="w-3.5 h-3.5 flex-shrink-0" /> {m.phone}
                      </p>
                    )}
                    <div className="flex items-center gap-1 pt-1">
                      <CalendarClock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAYS.map((d, i) => (
                          <span
                            key={d}
                            className={`w-6 text-center text-[10px] font-medium rounded py-0.5 ${
                              shiftDays.includes(i)
                                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}
                            title={shiftDays.includes(i) ? `Working ${d}` : `Off ${d}`}
                          >
                            {d[0]}
                          </span>
                        ))}
                      </div>
                    </div>
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

export default StaffView;
