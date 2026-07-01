import { useState } from "react";
import { Clock, MapPin, Plus, Star, Trash2 } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import appToast from "../../../components/AppToast";
import { useAppointmentIndustry } from "./industryConfig";
import { useAppointmentSetup } from "./setupStore";
import {
  useActiveBranch,
  addBranch,
  removeBranch,
  updateBranch,
  type Branch,
} from "./branchesStore";
import {
  DEFAULT_BRANCH_CALENDAR,
  formatBranchCalendarHours,
  isValidBranchCalendarHours,
  resolveCalendarHours,
} from "./calendarConfig";

function BranchCalendarHoursEditor({ branch }: { branch: Branch }) {
  const hours = resolveCalendarHours(branch);
  const [dayStart, setDayStart] = useState(hours.dayStart);
  const [dayEnd, setDayEnd] = useState(hours.dayEnd);
  const [saving, setSaving] = useState(false);

  const dirty =
    dayStart !== (branch.calendar?.dayStart ?? DEFAULT_BRANCH_CALENDAR.dayStart) ||
    dayEnd !== (branch.calendar?.dayEnd ?? DEFAULT_BRANCH_CALENDAR.dayEnd);

  const save = async () => {
    if (!isValidBranchCalendarHours(dayStart, dayEnd)) {
      appToast.error("End time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      await updateBranch(branch.id, { calendar: { dayStart, dayEnd } });
      appToast.success("Calendar hours updated.");
    } catch {
      appToast.error("Could not save calendar hours.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="w-3.5 h-3.5 text-violet-500" />
        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Calendar hours</p>
      </div>
      <p className="text-[10px] text-slate-400 mb-2">
        The calendar grid loads between these times for this location.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500">Opens</span>
          <input
            type="time"
            value={dayStart}
            onChange={(e) => setDayStart(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500">Closes</span>
          <input
            type="time"
            value={dayEnd}
            onChange={(e) => setDayEnd(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
          />
        </label>
        {dirty && (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium common-button-bg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>
      {!dirty && (
        <p className="text-[10px] text-slate-400 mt-2 tabular-nums">{formatBranchCalendarHours(branch)}</p>
      )}
    </div>
  );
}

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
                    void addBranch(newName.trim()).then(() => setNewName(""));
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
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
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
                    <BranchCalendarHoursEditor key={`${b.id}-${b.calendar?.dayStart}-${b.calendar?.dayEnd}`} branch={b} />
                  </div>
                </div>
                {canAdd && branches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => void removeBranch(b.id)}
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
                    void Promise.all(
                      branches.map((br) =>
                        updateBranch(br.id, { isPrimary: br.id === b.id }),
                      ),
                    );
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
