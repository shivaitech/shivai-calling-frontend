import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserCog, X } from "lucide-react";
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

  const handleSave = () => {
    if (!form.name.trim()) return;
    const specialization = form.specialization.trim() || undefined;
    if (specialization) rememberCustomSpecialization(specialization);

    if (mode === "add") {
      const member = addStaffMember({
        branchId,
        departmentId,
        name: form.name.trim(),
        role: form.role,
        title: form.title || undefined,
        specialization,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      onSaved?.(member.id);
      onClose();
      return;
    }

    if (!staff) return;
    updateStaffMember(staff.id, {
      name: form.name.trim(),
      role: form.role,
      title: form.title || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      slotDurationMin: form.slotDurationMin,
      specialization,
    });
    onSaved?.(staff.id);
    onClose();
  };

  const handleRemove = () => {
    if (!staff) return;
    removeStaffMember(staff.id);
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
