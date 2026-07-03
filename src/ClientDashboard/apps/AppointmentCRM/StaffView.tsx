import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useActiveBranch } from "./branchesStore";
import { useDepartments, addDepartment, removeDepartment } from "./departmentsStore";
import { useStaff, staffRoleLine } from "./staffStore";
import { useEnsureOrgSeeded } from "./orgSeed";
import StaffFormModal from "./StaffFormModal";

type StaffModalState =
  | { mode: "add" }
  | { mode: "edit"; staffId: string }
  | null;

const StaffView = () => {
  const { terms, preset } = useAppointmentIndustry();
  const { branches, activeBranch, activeBranchId } = useActiveBranch();
  useEnsureOrgSeeded(branches);
  const { departments } = useDepartments();
  const { staff, displayName } = useStaff();

  const selectedBranchId = activeBranchId;

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [staffModal, setStaffModal] = useState<StaffModalState>(null);

  useEffect(() => {
    setSelectedDeptId(null);
    setStaffModal(null);
  }, [selectedBranchId]);

  const [newDeptName, setNewDeptName] = useState("");

  const branchDepts = useMemo(
    () => departments.filter((d) => d.branchId === selectedBranchId && d.active),
    [departments, selectedBranchId],
  );

  const deptStaff = useMemo(
    () => staff.filter((s) => s.departmentId === selectedDeptId && s.active),
    [staff, selectedDeptId],
  );

  const selectedBranch = activeBranch;
  const selectedDept = departments.find((d) => d.id === selectedDeptId);
  const editingStaff = staffModal?.mode === "edit"
    ? staff.find((s) => s.id === staffModal.staffId)
    : undefined;

  const handleAddDepartment = async () => {
    if (!selectedBranchId || !newDeptName.trim()) return;
    const dept = await addDepartment(selectedBranchId, newDeptName.trim());
    setNewDeptName("");
    setSelectedDeptId(dept.id);
  };

  if (!branches.length) {
    return (
      <div className="space-y-5">
        <SectionTitle title={`${terms.staffPlural} & ${terms.departments}`} subtitle="Complete setup to add branches first" />
        <GlassCard>
          <p className="p-6 text-sm text-slate-500">No {terms.branches.toLowerCase()} configured yet. Run the setup wizard from Settings.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title={`${terms.staffPlural} & ${terms.departments}`}
        subtitle={`Organize your team: ${terms.branch} → ${terms.department} → ${terms.staff} → ${terms.appointment.toLowerCase()}`}
      />

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300 border border-violet-200/70 dark:border-violet-800/50 font-medium">
          <Building2 className="w-3 h-3" />
          {selectedBranch?.name ?? terms.branch}
        </span>
        {selectedDept && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              <Layers className="w-3 h-3" />
              {selectedDept.name}
            </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlassCard className="lg:col-span-5">
          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{terms.departments}</h3>
              </div>
              <span className="text-[10px] text-slate-400">{branchDepts.length} total</span>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder={`New ${terms.department.toLowerCase()}…`}
                className="flex-1 px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                disabled={!newDeptName.trim()}
                className="p-2 rounded-lg common-button-bg disabled:opacity-50"
                aria-label="Add department"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
              {branchDepts.map((d) => {
                const count = staff.filter((s) => s.departmentId === d.id).length;
                return (
                  <div
                    key={d.id}
                    className={`flex items-center gap-2 rounded-xl border transition-all ${
                      selectedDeptId === d.id
                        ? "border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/15"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDeptId(d.id);
                        setStaffModal(null);
                      }}
                      className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 text-left min-w-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{d.name}</p>
                        <p className="text-[10px] text-slate-400">{count} {terms.staffPlural.toLowerCase()}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>
                    {branchDepts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          void removeDepartment(d.id);
                          if (selectedDeptId === d.id) setSelectedDeptId(null);
                        }}
                        className="p-2 mr-1 text-slate-400 hover:text-red-500 rounded-lg"
                        aria-label="Remove department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {!branchDepts.length && (
                <p className="text-xs text-slate-400 py-4 text-center">Add a {terms.department.toLowerCase()} to this {terms.branch.toLowerCase()}</p>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-7">
          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{terms.staffPlural}</h3>
              </div>
              {selectedDeptId && (
                <button
                  type="button"
                  onClick={() => setStaffModal({ mode: "add" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium common-button-bg"
                >
                  <Plus className="w-3.5 h-3.5" /> Add {terms.staff}
                </button>
              )}
            </div>

            {!selectedDeptId ? (
              <p className="text-xs text-slate-400 py-8 text-center">Select a {terms.department.toLowerCase()} to manage {terms.staffPlural.toLowerCase()}</p>
            ) : deptStaff.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm text-slate-500">No {terms.staffPlural.toLowerCase()} in {selectedDept?.name}</p>
                <button
                  type="button"
                  onClick={() => setStaffModal({ mode: "add" })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium common-button-bg"
                >
                  <Plus className="w-4 h-4" /> Add {terms.staff}
                </button>
              </div>  
            ) : (
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                {deptStaff.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStaffModal({ mode: "edit", staffId: s.id })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 group"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, hsl(${s.hue},70%,55%), hsl(${s.hue + 20},65%,45%))` }}
                    >
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{displayName(s)}</p>
                      <p className="text-[11px] text-slate-500">{staffRoleLine(s)}</p>
                    </div>
                    <Pencil className="w-4 h-4 text-slate-300 group-hover:text-violet-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <p className="text-[11px] text-slate-400">
        {terms.appointments} are booked against a specific {terms.staff.toLowerCase()} in a {terms.department.toLowerCase()} at a {terms.branch.toLowerCase()}.
        Set weekly hours and leaves per staff — they appear on the Calendar.
      </p>

      {selectedDeptId && selectedBranchId && staffModal && (
        <StaffFormModal
          open
          mode={staffModal.mode}
          staff={editingStaff}
          branchId={selectedBranchId}
          departmentId={selectedDeptId}
          departmentName={selectedDept?.name}
          roleOptions={preset.staffRoles}
          specializationOptions={preset.services}
          staffLabel={terms.staff}
          onClose={() => setStaffModal(null)}
        />
      )}
    </div>
  );
};

export default StaffView;
