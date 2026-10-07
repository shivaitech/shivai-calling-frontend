import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import appToast from "../../../components/AppToast";
import { useAppointmentIndustry } from "./industryConfig";
import { Branch } from "./branchesStore";
import { Department } from "./departmentsStore";
import { StaffMember } from "./staffStore";
import { useCombinedStaffDirectory } from "./combinedStaffDirectory";
import { addBooking } from "./bookingsStore";
import { toIsoDate } from "./availabilityStore";

interface Props {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  departments: Department[];
  staff: StaffMember[];
  defaultBranchId?: string | null;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function createEmptyForm(defaultBranchId?: string | null) {
  return {
    customer: "",
    phone: "",
    branchId: defaultBranchId ?? "",
    departmentId: "",
    designation: "",
    staffRowId: "",
    date: todayIso(),
    time: "09:00",
    notes: "",
  };
}

const INPUT = "mt-1 w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white";
const LABEL = "text-xs font-medium text-slate-600 dark:text-slate-400";
const DEFAULT_SLOT_MIN = 30;

/** Manual booking creation — lets staff book ANY staff member directly,
 * whether they're on a branch calendar (doctors, engineers with a schedule)
 * or Main Tenant Staff (org-wide roster, no branch of their own — their
 * bookings file under the tenant's primary branch). Creates a real Booking
 * row, so it shows up in both the Bookings table and the Calendar. */
const AddBookingModal = ({ open, onClose, branches, departments, staff, defaultBranchId }: Props) => {
  const { terms } = useAppointmentIndustry();
  const { rows: combinedStaff } = useCombinedStaffDirectory();
  const [form, setForm] = useState(() => createEmptyForm(defaultBranchId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(createEmptyForm(defaultBranchId));
      setError(null);
    }
  }, [open, defaultBranchId]);

  const primaryBranch = useMemo(() => branches.find((b) => b.isPrimary) ?? branches[0], [branches]);

  const branchDepts = useMemo(
    () => (form.branchId ? departments.filter((d) => d.branchId === form.branchId) : departments),
    [departments, form.branchId],
  );

  // Branch-scoped staff for the picked branch/department; Main Tenant Staff
  // (source: "tenant") has no branchId/departmentId of its own, so it's
  // always included unless the user has narrowed to a specific branch/dept
  // that obviously excludes it.
  const staffInScope = useMemo(() => {
    const branchFiltered = combinedStaff.filter((row) => {
      if (row.source === "tenant") return !form.branchId && !form.departmentId;
      const member = staff.find((s) => `branch:${s.id}` === row.id);
      if (!member) return false;
      if (form.branchId && member.branchId !== form.branchId) return false;
      if (form.departmentId && member.departmentId !== form.departmentId) return false;
      return true;
    });
    return branchFiltered;
  }, [combinedStaff, staff, form.branchId, form.departmentId]);

  const designations = useMemo(
    () => [...new Set(staffInScope.map((r) => r.designation).filter(Boolean))].sort(),
    [staffInScope],
  );
  const availableStaff = useMemo(
    () => (form.designation ? staffInScope.filter((r) => r.designation === form.designation) : staffInScope),
    [staffInScope, form.designation],
  );

  const selectedRow = availableStaff.find((r) => r.id === form.staffRowId);

  const canSubmit =
    form.customer.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    Boolean(form.staffRowId) &&
    Boolean(form.date) &&
    Boolean(form.time);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || saving || !selectedRow) {
      if (!selectedRow) setError(`Select a ${terms.staff.toLowerCase()} member`);
      return;
    }

    setError(null);
    setSaving(true);
    const toastId = appToast.loading("Adding booking…");
    try {
      if (selectedRow.source === "tenant") {
        // Main Tenant Staff has no branch/department of its own — the tenant
        // itself is the default branch, so file the booking there.
        if (!primaryBranch) {
          appToast.dismiss(toastId);
          appToast.error(`Set up a ${terms.branch.toLowerCase()} before adding bookings.`);
          setSaving(false);
          return;
        }
        await addBooking({
          customer: form.customer.trim(),
          phone: form.phone.trim(),
          branchId: primaryBranch.id,
          branchName: primaryBranch.name,
          provider: selectedRow.name,
          service: selectedRow.designation,
          dateIso: form.date,
          time: form.time,
          durationMin: DEFAULT_SLOT_MIN,
          notes: form.notes.trim() || undefined,
        });
      } else {
        const memberId = selectedRow.id.replace(/^branch:/, "");
        const member = staff.find((s) => s.id === memberId);
        if (!member) {
          setError(`Select a ${terms.staff.toLowerCase()} member`);
          setSaving(false);
          appToast.dismiss(toastId);
          return;
        }
        const branch = branches.find((b) => b.id === member.branchId);
        const dept = departments.find((d) => d.id === member.departmentId);
        await addBooking({
          customer: form.customer.trim(),
          phone: form.phone.trim(),
          branchId: member.branchId,
          branchName: branch?.name ?? "",
          departmentId: member.departmentId,
          departmentName: dept?.name,
          staffId: member.id,
          provider: selectedRow.name,
          service: dept?.name ?? "Consultation",
          dateIso: form.date,
          time: form.time,
          durationMin: member.slotDurationMin,
          notes: form.notes.trim() || undefined,
        });
      }
      appToast.dismiss(toastId);
      appToast.success(`Booking added for ${form.customer.trim()}`);
      onClose();
    } catch {
      appToast.dismiss(toastId);
      appToast.error("Could not add booking. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={handleClose} closeOnBackdrop={!saving} panelClassName="max-w-lg">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center flex-shrink-0">
            <CalendarPlus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Add booking</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Book any {terms.staff.toLowerCase()} member manually</p>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>{terms.customer} name <span className="text-red-500">*</span></label>
              <input
                value={form.customer}
                onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                placeholder="Full name"
                className={INPUT}
                autoFocus
              />
            </div>
            <div>
              <label className={LABEL}>Phone <span className="text-red-500">*</span></label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className={INPUT}
              />
            </div>
          </div>

          {branches.length > 1 && (
            <div>
              <label className={LABEL}>{terms.branch}</label>
              <select
                value={form.branchId}
                onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value, departmentId: "", designation: "", staffRowId: "" }))}
                className={INPUT}
              >
                <option value="">All {terms.branches.toLowerCase()} + Main Tenant Staff</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>{terms.department}</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, designation: "", staffRowId: "" }))}
                className={INPUT}
              >
                <option value="">All {terms.departments.toLowerCase()}</option>
                {branchDepts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Designation</label>
              <select
                value={form.designation}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value, staffRowId: "" }))}
                className={INPUT}
                disabled={designations.length === 0}
              >
                <option value="">All designations</option>
                {designations.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL}>{terms.staff} <span className="text-red-500">*</span></label>
            <select
              value={form.staffRowId}
              onChange={(e) => setForm((f) => ({ ...f, staffRowId: e.target.value }))}
              className={INPUT}
              disabled={availableStaff.length === 0}
            >
              <option value="">{availableStaff.length === 0 ? `No ${terms.staffPlural.toLowerCase()} found` : `Select ${terms.staff.toLowerCase()}…`}</option>
              {availableStaff.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.source === "tenant" ? " · Main Tenant Staff" : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedRow && (
            <p className="text-[11px] text-slate-400">
              {selectedRow.source === "tenant"
                ? [selectedRow.designation, "Main Tenant Staff"].filter(Boolean).join(" · ")
                : [selectedRow.branchName, selectedRow.departmentName].filter(Boolean).join(" · ")}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.date}
                min={todayIso()}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional"
              className={INPUT}
            />
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            {saving ? "Adding…" : "Add booking"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default AddBookingModal;
