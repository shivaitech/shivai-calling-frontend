import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, UserPlus, Users } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import appToast from "../../../components/AppToast";
import { Branch } from "./branchesStore";
import { useCombinedStaffDirectory, type CombinedStaffRow } from "./combinedStaffDirectory";
import { ScheduleApiError } from "./api/scheduleClient";
import {
  DaySlot,
  DailyBreak,
  defaultDailyBreak,
  defaultWeeklySchedule,
  useIntegratedStaffIds,
  SCHEDULE_EVENT,
} from "./availabilityStore";
import scheduleAPI from "./api/scheduleAPI";
import { leaveToApiBody, mapWeeklyToApi } from "./api/scheduleMappers";
import IntegrateStaffSetupPanel, { type DraftLeave } from "./IntegrateStaffSetupPanel";

interface Props {
  open: boolean;
  onClose: () => void;
  branchId: string;
  branches: Branch[];
  /** Fires once the staff member's schedule has been fully saved — the
   * Calendar reads its staff list straight from the Schedule API, so this is
   * purely informational for the caller (e.g. to close its own state). */
  onIntegrated: () => void;
}

const LABEL = "text-xs font-medium text-slate-600 dark:text-slate-400";

/** Lets a user pick a Main Tenant Staff member who doesn't have a schedule
 * yet, set up their weekly hours/break/leave entirely locally, and only
 * then save. There is no separate branch staff record to create — the
 * Schedule API is keyed directly on the tenant staff member's own id, and
 * that id alone is what makes them show up on the Calendar. Nothing is
 * written to the backend while the user is still picking or editing. */
const IntegrateStaffModal = ({ open, onClose, branchId, branches, onIntegrated }: Props) => {
  const { rows: combinedStaff } = useCombinedStaffDirectory();
  const [pickedRow, setPickedRow] = useState<CombinedStaffRow | null>(null);
  const [weekly, setWeekly] = useState<DaySlot[]>(() => defaultWeeklySchedule());
  const [dailyBreak, setDailyBreak] = useState<DailyBreak>(() => defaultDailyBreak());
  const [leaves, setLeaves] = useState<DraftLeave[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The real source of truth for "already integrated" — a live Schedule API
  // document for this staff member's own id. No branch record, no name
  // matching: the id from the tenant staff listing IS the staff_id.
  const { staffIds: liveScheduleStaffIds, loading: liveScheduleLoading } = useIntegratedStaffIds();

  useEffect(() => {
    if (open) {
      setPickedRow(null);
      setWeekly(defaultWeeklySchedule());
      setDailyBreak(defaultDailyBreak());
      setLeaves([]);
      setSaving(false);
      setError(null);
    }
  }, [open]);

  const branch = branches.find((b) => b.id === branchId);

  const tenantRows = useMemo(
    () => combinedStaff.filter((row) => row.source === "tenant"),
    [combinedStaff],
  );

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleBack = () => {
    if (saving) return;
    setPickedRow(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!pickedRow || saving) return;
    setSaving(true);
    setError(null);
    const toastId = appToast.loading("Saving schedule…");
    const staffId = pickedRow.rawId;
    try {
      const weekly_availability = mapWeeklyToApi(weekly, dailyBreak);
      try {
        await scheduleAPI.createSchedule({ staff_id: staffId, weekly_availability });
      } catch (err) {
        // A schedule already exists for this staff id (409) — fall back to
        // updating it instead of failing.
        if (err instanceof ScheduleApiError && err.statusCode === 409) {
          await scheduleAPI.updateSchedule(staffId, { weekly_availability });
        } else {
          throw err;
        }
      }
      for (const l of leaves) {
        await scheduleAPI.addScheduleLeave(staffId, leaveToApiBody({ fromDate: l.fromDate, toDate: l.toDate, reason: l.reason }));
      }
      appToast.dismiss(toastId);
      appToast.success(`${pickedRow.name} added to the calendar`);
      // Tell every SCHEDULE_EVENT listener (the Calendar's staff list among
      // them) to re-fetch — this flow writes straight through scheduleAPI,
      // bypassing the availabilityStore functions that normally fire this.
      window.dispatchEvent(new CustomEvent(SCHEDULE_EVENT));
      onClose();
      onIntegrated();
    } catch (err) {
      appToast.dismiss(toastId);
      const message = err instanceof ScheduleApiError || err instanceof Error ? err.message : "Something went wrong — please try again.";
      appToast.error(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={handleClose} closeOnBackdrop={!saving} panelClassName="max-w-lg">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-shrink-0">
          {pickedRow && (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {pickedRow ? `Set up ${pickedRow.name}` : "Integrate staff"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pickedRow
                ? "Hours, breaks & leave — saved once you tap Save"
                : `Add a Main Tenant Staff member to ${branch?.name ?? "this calendar"}`}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-3.5">
          {!pickedRow && (
            <div>
              <label className={LABEL}>Pick a staff member to set up <span className="text-red-500">*</span></label>
              {tenantRows.length === 0 ? (
                <div className="mt-1 flex flex-col items-center justify-center gap-1.5 py-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                  <Users className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-400">No Main Tenant Staff yet</p>
                  <p className="text-[11px] text-slate-400">Add people under Main Tenant Staff first.</p>
                </div>
              ) : (
                <div className="mt-1 space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
                  {tenantRows.map((r) => {
                    const alreadyAdded = !liveScheduleLoading && liveScheduleStaffIds.has(r.rawId);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => !alreadyAdded && setPickedRow(r)}
                        disabled={alreadyAdded}
                        title={alreadyAdded ? `${r.name} is already on this calendar` : undefined}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                          alreadyAdded
                            ? "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: `linear-gradient(135deg, hsl(${r.hue},70%,55%), hsl(${r.hue + 20},65%,45%))` }}
                        >
                          {r.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{r.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            {r.designation && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200/70 dark:border-violet-800/60">
                                {r.designation}
                              </span>
                            )}
                            {r.departmentName && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                                {r.departmentName}
                              </span>
                            )}
                            {!r.designation && !r.departmentName && (
                              <span className="text-[10px] text-slate-400">Main Tenant Staff</span>
                            )}
                          </div>
                        </div>
                        {alreadyAdded && (
                          <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">Added</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!pickedRow && (
            <p className="text-[11px] text-slate-400">
              Picking someone opens their schedule setup — hours, breaks and leave. They're only added to the
              calendar once you save there.
            </p>
          )}

          {pickedRow && (
            <IntegrateStaffSetupPanel
              staffName={pickedRow.name}
              weekly={weekly}
              onWeeklyChange={setWeekly}
              dailyBreak={dailyBreak}
              onDailyBreakChange={setDailyBreak}
              leaves={leaves}
              onLeavesChange={setLeaves}
            />
          )}

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 flex gap-2.5">
          {pickedRow ? (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {saving ? "Saving…" : "Save & add to calendar"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
};

export default IntegrateStaffModal;
