import React, { useState } from "react";
import GlassCard from "../../../components/GlassCard";
import {
  Users, UserPlus, Pencil, Trash2, Check, X, Mail, Phone as PhoneIcon,
  UserCheck, CalendarClock, Building2, Briefcase, Plus, ChevronRight,
} from "lucide-react";
import { useIndustry } from "./industryConfig";
import { useDepartments, getDepartments } from "./departmentsStore";
import { useRoles } from "./rolesStore";
import {
  useStaff, StaffMember, StaffStatus, STAFF_STATUS_META, WEEKDAYS,
} from "./staffStore";
import { AgentAvatar, StatCard, SectionTitle } from "./ui";
import StaffDetailView from "./StaffDetailView";

type Tab = "staff" | "departments" | "roles";

const STATUS_OPTIONS: StaffStatus[] = ["active", "on-leave", "inactive"];
const HUES = [210, 150, 280, 25, 330, 190, 95, 250];

const inputCls =
  "w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

const DepartmentsStaffView: React.FC = () => {
  const { terms } = useIndustry();
  const [tab, setTab] = useState<Tab>("staff");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const { staff } = useStaff();
  const selected = staff.find((s) => s.id === selectedStaffId) || null;
  if (selected) {
    return <StaffDetailView staff={selected} onBack={() => setSelectedStaffId(null)} />;
  }

  const tabMeta: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "staff", label: "Staff", icon: Users },
    { key: "departments", label: `${terms.department}s`, icon: Building2 },
    { key: "roles", label: "Roles", icon: Briefcase },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        title={`${terms.department}s & Staff`}
        subtitle={`Build your org: create ${terms.department.toLowerCase()}s, add roles under them, then hire staff into those roles`}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-full sm:w-auto sm:inline-flex overflow-x-auto no-scrollbar">
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

      {tab === "staff" && <StaffTab onOpen={setSelectedStaffId} />}
      {tab === "departments" && <DepartmentsTab />}
      {tab === "roles" && <RolesTab />}
    </div>
  );
};

// ── Staff tab ─────────────────────────────────────────────────────────────────

const StaffTab: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const { terms } = useIndustry();
  const { departments } = useDepartments();
  const { staff, shifts, removeStaff } = useStaff();
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [showModal, setShowModal] = useState(false);

  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name || "Unassigned";
  const activeCount = staff.filter((s) => s.status === "active").length;
  const onLeaveCount = staff.filter((s) => s.status === "on-leave").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} color="blue" label="Team Members" value={staff.length} />
        <StatCard icon={UserCheck} color="emerald" label="Active" value={activeCount} />
        <StatCard icon={CalendarClock} color="amber" label="On Leave" value={onLeaveCount} />
        <StatCard icon={Building2} color="purple" label={`${terms.department}s`} value={departments.length} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm"
        >
          <UserPlus className="w-4 h-4" /> <span>Create Staff</span>
        </button>
      </div>

      {staff.length === 0 ? (
        <GlassCard>
          <div className="p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl common-bg-icons flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No staff yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create a {terms.department.toLowerCase()} and role first, then hire staff into it.</p>
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="mt-4 inline-flex items-center gap-1.5 common-button-bg !px-4 !py-2 rounded-lg text-sm">
              <UserPlus className="w-4 h-4" /> Create Staff
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
                <div
                  className="p-4 sm:p-5 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(m.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(m.id)}
                >
                  <div className="flex items-start gap-3">
                    <AgentAvatar name={m.name} hue={m.hue} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-white truncate">{m.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.role || "—"}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setEditing(m); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); removeStaff(m.id); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
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
                    {m.email && <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> {m.email}</p>}
                    {m.phone && <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><PhoneIcon className="w-3.5 h-3.5 flex-shrink-0" /> {m.phone}</p>}
                    <div className="flex items-center gap-1 pt-1">
                      <CalendarClock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAYS.map((d, i) => (
                          <span key={d} className={`w-6 text-center text-[10px] font-medium rounded py-0.5 ${shiftDays.includes(i) ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>{d[0]}</span>
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

      {showModal && (
        <StaffModal editing={editing} onClose={() => { setShowModal(false); setEditing(null); }} />
      )}
    </div>
  );
};

// ── Enhanced Staff create/edit modal (dept + role + inline quick-create) ───────

const StaffModal: React.FC<{ editing: StaffMember | null; onClose: () => void }> = ({ editing, onClose }) => {
  const { terms } = useIndustry();
  const { departments, addDepartment } = useDepartments();
  const { rolesForDepartment, addRole, roleName } = useRoles();
  const { addStaff, updateStaff } = useStaff();

  const [name, setName] = useState(editing?.name || "");
  const [departmentId, setDepartmentId] = useState<string | null>(editing?.departmentId ?? null);
  const [roleId, setRoleId] = useState<string | null>(editing?.roleId ?? null);
  const [email, setEmail] = useState(editing?.email || "");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [status, setStatus] = useState<StaffStatus>(editing?.status || "active");

  const [newDept, setNewDept] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [newRole, setNewRole] = useState(false);
  const [roleNameInput, setRoleNameInput] = useState("");

  const roles = rolesForDepartment(departmentId);

  // addDepartment doesn't return the new id, so re-read the store and match by
  // name to auto-select the department we just created.
  const createDeptAndSelect = () => {
    const nm = deptName.trim();
    if (nm.length < 2) return;
    addDepartment(nm, "");
    setDeptName("");
    setNewDept(false);
    requestAnimationFrame(() => {
      const match = getDepartments().find((d) => d.name === nm);
      if (match) { setDepartmentId(match.id); setRoleId(null); }
    });
  };

  const createRoleAndSelect = () => {
    if (!departmentId) return;
    const nm = roleNameInput.trim();
    if (nm.length < 2) return;
    const created = addRole(departmentId, nm);
    setRoleId(created.id);
    setRoleNameInput("");
    setNewRole(false);
  };

  const canSubmit = name.trim().length >= 2 && !!departmentId;

  const submit = () => {
    if (!canSubmit) return;
    const roleLabel = roleName(roleId) || (roleId ? "" : "");
    const base = {
      name: name.trim(),
      role: roleLabel || "",
      roleId: roleId,
      departmentId,
      email: email.trim(),
      phone: phone.trim(),
      status,
    };
    if (editing) updateStaff(editing.id, base);
    else addStaff(base);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center"><UserPlus className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" /></div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">{editing ? "Edit staff member" : "Create staff member"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assign a {terms.department.toLowerCase()} and role</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full name <span className="text-red-500">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as StaffStatus)} className={inputCls}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STAFF_STATUS_META[s].label}</option>)}
              </select>
            </div>
          </div>

          {/* Department */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">{terms.department} <span className="text-red-500">*</span></label>
              <button onClick={() => { setNewDept((v) => !v); setNewRole(false); }} className="text-[11px] font-medium text-violet-600 dark:text-violet-400 inline-flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> New {terms.department.toLowerCase()}
              </button>
            </div>
            {newDept ? (
              <div className="flex gap-2">
                <input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder={`New ${terms.department.toLowerCase()} name`} className={inputCls} autoFocus />
                <button onClick={createDeptAndSelect} disabled={deptName.trim().length < 2} className="common-button-bg !px-3 !py-2 rounded-lg text-sm disabled:opacity-50"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setNewDept(false); setDeptName(""); }} className="px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <select
                value={departmentId ?? ""}
                onChange={(e) => { setDepartmentId(e.target.value || null); setRoleId(null); }}
                className={inputCls}
              >
                <option value="">Select {terms.department.toLowerCase()}…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
          </div>

          {/* Role (scoped to department) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Role</label>
              {departmentId && (
                <button onClick={() => { setNewRole((v) => !v); setNewDept(false); }} className="text-[11px] font-medium text-violet-600 dark:text-violet-400 inline-flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> New role
                </button>
              )}
            </div>
            {!departmentId ? (
              <p className="text-xs text-slate-400 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">Select a {terms.department.toLowerCase()} first to choose a role.</p>
            ) : newRole ? (
              <div className="flex gap-2">
                <input value={roleNameInput} onChange={(e) => setRoleNameInput(e.target.value)} placeholder="New role name" className={inputCls} autoFocus />
                <button onClick={createRoleAndSelect} disabled={roleNameInput.trim().length < 2} className="common-button-bg !px-3 !py-2 rounded-lg text-sm disabled:opacity-50"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setNewRole(false); setRoleNameInput(""); }} className="px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <select value={roleId ?? ""} onChange={(e) => setRoleId(e.target.value || null)} className={inputCls}>
                <option value="">Select role…</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98XXXXXX21" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={submit} disabled={!canSubmit} className="common-button-bg flex items-center gap-1.5 !px-4 !py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Check className="w-4 h-4" /> {editing ? "Save" : "Create Staff"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Departments tab ───────────────────────────────────────────────────────────

const DepartmentsTab: React.FC = () => {
  const { terms } = useIndustry();
  const { departments, addDepartment, updateDepartment, removeDepartment } = useDepartments();
  const { staff } = useStaff();
  const { roles } = useRoles();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const start = (d?: { id: string; name: string; desc: string }) => {
    setEditingId(d?.id ?? null);
    setName(d?.name ?? "");
    setDesc(d?.desc ?? "");
    setAdding(true);
  };
  const submit = () => {
    if (name.trim().length < 2) return;
    if (editingId) updateDepartment(editingId, { name: name.trim(), desc: desc.trim() });
    else addDepartment(name.trim(), desc.trim());
    setAdding(false); setEditingId(null); setName(""); setDesc("");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!adding && (
          <button onClick={() => start()} className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm">
            <Plus className="w-4 h-4" /> Add {terms.department}
          </button>
        )}
      </div>

      {adding && (
        <GlassCard>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${terms.department} name`} className={inputCls} autoFocus />
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className={inputCls} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => { setAdding(false); setEditingId(null); }} className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={submit} disabled={name.trim().length < 2} className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm disabled:opacity-50"><Check className="w-4 h-4" /> {editingId ? "Save" : "Add"}</button>
            </div>
          </div>
        </GlassCard>
      )}

      {departments.length === 0 ? (
        <GlassCard><div className="p-10 text-center"><Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">No {terms.department.toLowerCase()}s yet. Create one to get started.</p></div></GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {departments.map((d) => {
            const staffCount = staff.filter((s) => s.departmentId === d.id).length;
            const roleCount = roles.filter((r) => r.departmentId === d.id).length;
            return (
              <GlassCard key={d.id}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `hsl(${d.hue},70%,95%)`, color: `hsl(${d.hue},60%,40%)` }}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-white truncate">{d.name}</p>
                        {d.desc && <p className="text-xs text-slate-400 truncate">{d.desc}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => start(d)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-violet-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeDepartment(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400"><Briefcase className="w-3.5 h-3.5" /> {roleCount} roles</span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400"><Users className="w-3.5 h-3.5" /> {staffCount} staff</span>
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

// ── Roles tab ─────────────────────────────────────────────────────────────────

const RolesTab: React.FC = () => {
  const { terms } = useIndustry();
  const { departments } = useDepartments();
  const { roles, addRole, removeRole } = useRoles();
  const { staff } = useStaff();

  const [adding, setAdding] = useState(false);
  const [deptId, setDeptId] = useState<string>("");
  const [name, setName] = useState("");

  const submit = () => {
    if (!deptId || name.trim().length < 2) return;
    addRole(deptId, name.trim());
    setName(""); setAdding(false);
  };

  const noDepts = departments.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!adding && (
          <button onClick={() => setAdding(true)} disabled={noDepts} className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm disabled:opacity-50" title={noDepts ? `Create a ${terms.department.toLowerCase()} first` : undefined}>
            <Plus className="w-4 h-4" /> Add Role
          </button>
        )}
      </div>

      {noDepts && (
        <GlassCard><div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Create a {terms.department.toLowerCase()} first — roles belong to a {terms.department.toLowerCase()}.</div></GlassCard>
      )}

      {adding && !noDepts && (
        <GlassCard>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className={inputCls}>
                <option value="">Select {terms.department.toLowerCase()}…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name (e.g. Senior Agent)" className={inputCls} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setAdding(false)} className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={submit} disabled={!deptId || name.trim().length < 2} className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-lg text-sm disabled:opacity-50"><Check className="w-4 h-4" /> Add</button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Roles grouped by department */}
      {departments.map((d) => {
        const deptRoles = roles.filter((r) => r.departmentId === d.id);
        return (
          <GlassCard key={d.id}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{d.name}</h3>
                <span className="text-[11px] text-slate-400">· {deptRoles.length} roles</span>
              </div>
              {deptRoles.length === 0 ? (
                <p className="text-xs text-slate-400">No roles in this {terms.department.toLowerCase()} yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {deptRoles.map((r) => {
                    const count = staff.filter((s) => s.roleId === r.id).length;
                    return (
                      <span key={r.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-200">{r.name}</span>
                        {count > 0 && <span className="text-[10px] text-slate-400">· {count}</span>}
                        <button onClick={() => removeRole(r.id)} className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};

export default DepartmentsStaffView;
