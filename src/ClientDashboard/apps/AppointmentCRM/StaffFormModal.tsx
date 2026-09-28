import { useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Check, Pencil, Plus, Trash2, UserCog, UserPlus, X } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import {
  StaffMember,
  addStaffMember,
  getSpecializationSuggestions,
  rememberCustomSpecialization,
  removeStaffMember,
  staffDisplayName,
  updateStaffMember,
} from "./staffStore";
import StaffAvailabilityPanel from "./StaffAvailabilityPanel";
import StaffOfflineBookingPanel from "./StaffOfflineBookingPanel";
import { useAuth } from "../../../contexts/AuthContext";
import { useStaffAssignments } from "../../../services/staffOrgStore";
import {
  departmentsAPI,
  designationsAPI,
  type Department as GlobalDepartment,
  type Designation as GlobalDesignation,
} from "../../../services/departmentsAPI";
import appToast from "../../../components/AppToast";

interface StaffFormState {
  name: string;
  title: string;
  role: string;
  specialization: string;
  email: string;
  phone: string;
  slotDurationMin: number;
}

interface StaffFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  staff?: StaffMember;
  branchId: string;
  departmentId: string;
  departmentName?: string;
  roleOptions: string[];
  specializationOptions?: string[];
  staffLabel: string;
  onClose: () => void;
  onSaved?: (staffId: string) => void;
}

const StaffFormModal = ({
  open,
  mode,
  staff,
  branchId,
  departmentId,
  departmentName,
  roleOptions,
  specializationOptions = [],
  staffLabel,
  onClose,
  onSaved,
}: StaffFormModalProps) => {
  const [form, setForm] = useState<StaffFormState>({
    name: "",
    title: "",
    role: roleOptions[0] ?? "Staff",
    specialization: "",
    email: "",
    phone: "",
    slotDurationMin: 30,
  });

  // ── Org-wide Department / Designation (shared tenant catalog) ──────────────
  // Distinct from the branch/department pair above, which drives this app's
  // own Calendar & Bookings. This pair is the shared org catalog used across
  // ShivAI apps for "who this person is" — purely additive, local-only
  // assignment (the real /staff API has no field for it yet).
  const { user } = useAuth();
  const tenantId = String(user?.tenantId || user?.id || "me");
  const assignments = useStaffAssignments(tenantId);
  const [globalDepartments, setGlobalDepartments] = useState<GlobalDepartment[]>([]);
  const [globalDesignations, setGlobalDesignations] = useState<GlobalDesignation[]>([]);
  const [loadingGlobalDepts, setLoadingGlobalDepts] = useState(false);
  const [loadingGlobalDesigs, setLoadingGlobalDesigs] = useState(false);
  const [globalDeptId, setGlobalDeptId] = useState<string | null>(null);
  const [globalDesigId, setGlobalDesigId] = useState<string | null>(null);
  const [newGlobalDept, setNewGlobalDept] = useState(false);
  const [newGlobalDeptName, setNewGlobalDeptName] = useState("");
  const [newGlobalDeptDesc, setNewGlobalDeptDesc] = useState("");
  const [savingGlobalDept, setSavingGlobalDept] = useState(false);
  const [newGlobalDesig, setNewGlobalDesig] = useState(false);
  const [newGlobalDesigName, setNewGlobalDesigName] = useState("");
  const [newGlobalDesigDesc, setNewGlobalDesigDesc] = useState("");
  const [savingGlobalDesig, setSavingGlobalDesig] = useState(false);

  const loadGlobalDepartments = () => {
    setLoadingGlobalDepts(true);
    departmentsAPI
      .list({ limit: 100, sortBy: "name", sortOrder: "asc" })
      .then((res) => setGlobalDepartments(res.departments))
      .catch(() => setGlobalDepartments([]))
      .finally(() => setLoadingGlobalDepts(false));
  };

  const loadGlobalDesignations = (deptId: string) => {
    setLoadingGlobalDesigs(true);
    designationsAPI
      .list({ department: deptId, limit: 100, sortBy: "name", sortOrder: "asc" })
      .then((res) => setGlobalDesignations(res.designations))
      .catch(() => setGlobalDesignations([]))
      .finally(() => setLoadingGlobalDesigs(false));
  };

  useEffect(() => {
    if (!open) return;
    loadGlobalDepartments();
    setNewGlobalDept(false); setNewGlobalDeptName(""); setNewGlobalDeptDesc("");
    setNewGlobalDesig(false); setNewGlobalDesigName(""); setNewGlobalDesigDesc("");
    if (mode === "edit" && staff) {
      const a = assignments.assignmentFor(staff.id);
      setGlobalDeptId(a.departmentId);
      setGlobalDesigId(a.designationId);
    } else {
      setGlobalDeptId(null);
      setGlobalDesigId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, staff]);

  useEffect(() => {
    if (!open || !globalDeptId) {
      setGlobalDesignations([]);
      return;
    }
    loadGlobalDesignations(globalDeptId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, globalDeptId]);

  const globalInput =
    "w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700";

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && staff) {
      setForm({
        name: staff.name,
        title: staff.title ?? "",
        role: staff.role,
        specialization: staff.specialization ?? "",
        email: staff.email ?? "",
        phone: staff.phone ?? "",
        slotDurationMin: staff.slotDurationMin,
      });
      return;
    }
    setForm({
      name: "",
      title: "",
      role: roleOptions[0] ?? "Staff",
      specialization: "",
      email: "",
      phone: "",
      slotDurationMin: 30,
    });
  }, [open, mode, staff, roleOptions]);

  const specializationSuggestions = useMemo(
    () => getSpecializationSuggestions(specializationOptions),
    [open, specializationOptions],
  );
  const specializationListId = "staff-specialization-suggestions";

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const specialization = form.specialization.trim() || undefined;
    if (specialization) rememberCustomSpecialization(specialization);

    if (mode === "add") {
      const member = await addStaffMember({
        branchId,
        departmentId,
        name: form.name.trim(),
        role: form.role,
        title: form.title || undefined,
        specialization,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      assignments.setAssignment(member.id, globalDeptId, globalDesigId);
      onSaved?.(member.id);
      onClose();
      return;
    }

    if (!staff) return;
    await updateStaffMember(staff.id, {
      name: form.name.trim(),
      role: form.role,
      title: form.title || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      slotDurationMin: form.slotDurationMin,
      specialization,
    });
    assignments.setAssignment(staff.id, globalDeptId, globalDesigId);
    onSaved?.(staff.id);
    onClose();
  };

  const handleRemove = async () => {
    if (!staff) return;
    await removeStaffMember(staff.id);
    onClose();
  };

  const displayName =
    mode === "edit" && staff
      ? staffDisplayName({ ...staff, ...form, title: form.title || undefined })
      : form.title
        ? `${form.title} ${form.name}`.trim()
        : form.name;

  return (
    <ModalOverlay open={open} panelClassName="max-w-2xl" zIndex={110} onClose={onClose} closeOnBackdrop>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 flex-shrink-0" />

        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center flex-shrink-0">
              {mode === "add" ? (
                <Plus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              ) : (
                <Pencil className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {mode === "add" ? `Add ${staffLabel}` : `Edit ${staffLabel}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {departmentName ? `${departmentName}` : `Select ${staffLabel.toLowerCase()} details`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Dr., etc."
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Full name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Specialization</label>
            <input
              list={specializationListId}
              value={form.specialization}
              onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
              placeholder="Select or type a specialization"
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
            />
            <datalist id={specializationListId}>
              {specializationSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {specializationSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {specializationSuggestions.slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, specialization: s }))}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                      form.specialization === s
                        ? "bg-violet-600 text-white border-violet-600"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-300 hover:text-violet-700 dark:hover:text-violet-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5">Choose a suggestion, tap a chip, or type a new specialization.</p>
          </div>

          {/* Org-wide Department & Designation — the shared tenant catalog used
              across ShivAI apps. Separate from Branch/Department above, which
              only drives this app's own Calendar & Bookings. */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-violet-600" />
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Department &amp; Designation</p>
              <span className="text-[10px] text-slate-400">(org-wide, shared across apps)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Global Department */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Department</label>
                  <button
                    type="button"
                    onClick={() => { setNewGlobalDept((v) => !v); setNewGlobalDesig(false); }}
                    className="text-[11px] font-medium text-violet-600 dark:text-violet-400 inline-flex items-center gap-0.5"
                  >
                    <UserPlus className="w-3 h-3" /> New
                  </button>
                </div>
                {newGlobalDept ? (
                  <div className="space-y-1.5">
                    <input value={newGlobalDeptName} onChange={(e) => setNewGlobalDeptName(e.target.value)} placeholder="Department name" className={globalInput} autoFocus />
                    <input value={newGlobalDeptDesc} onChange={(e) => setNewGlobalDeptDesc(e.target.value)} placeholder="Description" className={globalInput} />
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const nm = newGlobalDeptName.trim();
                          const desc = newGlobalDeptDesc.trim();
                          if (nm.length < 2 || !desc) return;
                          setSavingGlobalDept(true);
                          try {
                            const d = await departmentsAPI.create({ name: nm, description: desc });
                            setGlobalDepartments((prev) => [...prev, d].sort((a, b) => a.name.localeCompare(b.name)));
                            setGlobalDeptId(d.id);
                            setGlobalDesigId(null);
                            setNewGlobalDeptName(""); setNewGlobalDeptDesc(""); setNewGlobalDept(false);
                          } catch (err: any) {
                            appToast.error(err?.message || "Failed to create department");
                          } finally {
                            setSavingGlobalDept(false);
                          }
                        }}
                        disabled={savingGlobalDept || newGlobalDeptName.trim().length < 2 || !newGlobalDeptDesc.trim()}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Create
                      </button>
                      <button type="button" onClick={() => { setNewGlobalDept(false); setNewGlobalDeptName(""); setNewGlobalDeptDesc(""); }} className="px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={globalDeptId ?? ""}
                    onChange={(e) => { setGlobalDeptId(e.target.value || null); setGlobalDesigId(null); }}
                    className={globalInput}
                    disabled={loadingGlobalDepts}
                  >
                    <option value="">{loadingGlobalDepts ? "Loading…" : "Select department…"}</option>
                    {globalDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
              </div>

              {/* Global Designation (scoped to the chosen department) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Designation</label>
                  {globalDeptId && !newGlobalDept && (
                    <button
                      type="button"
                      onClick={() => setNewGlobalDesig((v) => !v)}
                      className="text-[11px] font-medium text-violet-600 dark:text-violet-400 inline-flex items-center gap-0.5"
                    >
                      <UserPlus className="w-3 h-3" /> New
                    </button>
                  )}
                </div>
                {!globalDeptId ? (
                  <div className={`${globalInput} flex items-center text-slate-400`}>Pick a department first</div>
                ) : newGlobalDesig ? (
                  <div className="space-y-1.5">
                    <input value={newGlobalDesigName} onChange={(e) => setNewGlobalDesigName(e.target.value)} placeholder="Designation name" className={globalInput} autoFocus />
                    <input value={newGlobalDesigDesc} onChange={(e) => setNewGlobalDesigDesc(e.target.value)} placeholder="Description" className={globalInput} />
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const nm = newGlobalDesigName.trim();
                          const desc = newGlobalDesigDesc.trim();
                          if (nm.length < 2 || !desc || !globalDeptId) return;
                          setSavingGlobalDesig(true);
                          try {
                            const created = await designationsAPI.create({ name: nm, description: desc, department: globalDeptId });
                            setGlobalDesignations((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                            setGlobalDesigId(created.id);
                            setNewGlobalDesigName(""); setNewGlobalDesigDesc(""); setNewGlobalDesig(false);
                          } catch (err: any) {
                            appToast.error(err?.message || "Failed to create designation");
                          } finally {
                            setSavingGlobalDesig(false);
                          }
                        }}
                        disabled={savingGlobalDesig || newGlobalDesigName.trim().length < 2 || !newGlobalDesigDesc.trim()}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Create
                      </button>
                      <button type="button" onClick={() => { setNewGlobalDesig(false); setNewGlobalDesigName(""); setNewGlobalDesigDesc(""); }} className="px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={globalDesigId ?? ""}
                    onChange={(e) => setGlobalDesigId(e.target.value || null)}
                    className={globalInput}
                    disabled={loadingGlobalDesigs}
                  >
                    <option value="">{loadingGlobalDesigs ? "Loading…" : "Select designation…"}</option>
                    {globalDesignations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Shown on this person's profile across ShivAI apps — separate from the Role above, which only affects this app's Calendar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {mode === "edit" && staff && (
            <>
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Slot duration (min)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={form.slotDurationMin}
                  onChange={(e) => setForm((f) => ({ ...f, slotDurationMin: Number(e.target.value) || 30 }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserCog className="w-4 h-4 text-violet-600" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Availability & leaves</p>
                </div>
                <StaffOfflineBookingPanel staffId={staff.id} staffName={displayName || staff.name} />
                <StaffAvailabilityPanel staffId={staff.id} staffName={displayName || staff.name} />
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          {mode === "edit" && staff ? (
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium common-button-bg disabled:opacity-50"
            >
              {mode === "add" ? `Add ${staffLabel}` : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default StaffFormModal;
