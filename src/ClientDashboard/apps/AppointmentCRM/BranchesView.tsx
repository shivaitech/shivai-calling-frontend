import { useState } from "react";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useAppointmentSetup } from "./setupStore";
import { useActiveBranch, addBranch, removeBranch, updateBranch } from "./branchesStore";

const BranchesView = () => {
  const { terms } = useAppointmentIndustry();
  const setup = useAppointmentSetup();
  const { branches, activeBranchId, setActiveBranch } = useActiveBranch();
  const [newName, setNewName] = useState("");

  const canAdd = setup.branchMode === "multi";

  return (
    <div className="space-y-5">
      <SectionTitle
        title={terms.branches}
        subtitle={
          setup.branchMode === "single"
            ? `Single-${terms.branch.toLowerCase()} mode — add more in Setup`
            : `Manage ${terms.branches.toLowerCase()}, hours & calendars`
        }
        right={
          canAdd ? (
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`New ${terms.branch.toLowerCase()}…`}
                className="px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 w-40 sm:w-48"
              />
              <button
                type="button"
                onClick={() => {
                  if (newName.trim()) {
                    addBranch(newName.trim());
                    setNewName("");
                  }
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium common-button-bg"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((b) => (
          <GlassCard key={b.id} hover>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800 dark:text-white truncate">{b.name}</h3>
                      {b.isPrimary && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/70">
                          <Star className="w-3 h-3" /> Primary
                        </span>
                      )}
                      {b.id === activeBranchId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    {b.address && <p className="text-xs text-slate-500 mt-0.5">{b.address}</p>}
                    <p className="text-[11px] text-slate-400 mt-2">Mon–Sat · 09:00 – 18:00</p>
                  </div>
                </div>
                {canAdd && branches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBranch(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {!b.isPrimary && canAdd && (
                <button
                  type="button"
                  onClick={() => {
                    branches.forEach((br) => updateBranch(br.id, { isPrimary: br.id === b.id }));
                  }}
                  className="mt-3 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Set as primary
                </button>
              )}
              {b.id !== activeBranchId && (
                <button
                  type="button"
                  onClick={() => setActiveBranch(b.id)}
                  className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"
                >
                  Switch to this {terms.branch.toLowerCase()}
                </button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default BranchesView;
