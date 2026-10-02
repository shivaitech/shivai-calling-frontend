import { useState } from "react";
import { Building2, UsersRound } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useActiveBranch } from "./branchesStore";
import { useEnsureOrgSeeded } from "./orgSeed";
import TenantStaffModule from "./TenantStaffModule";

const StaffView = () => {
  const { terms } = useAppointmentIndustry();
  const { branches, activeBranch, activeBranchId } = useActiveBranch();
  useEnsureOrgSeeded(branches);

  const [scope, setScope] = useState<"branch" | "tenant">("branch");

  const scopeTabs = (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
      {([
        { key: "branch", label: `${terms.branch} ${terms.staffPlural}`, icon: Building2 },
        { key: "tenant", label: "Main Tenant Staff", icon: UsersRound },
      ] as const).map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => setScope(key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            scope === key
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <Icon className="w-3.5 h-3.5" /> {label}
        </button>
      ))}
    </div>
  );

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
      {scopeTabs}
      {scope === "tenant" ? (
        <TenantStaffModule />
      ) : (
        <TenantStaffModule key={activeBranchId} branchId={activeBranchId ?? undefined} />
      )}
      {scope === "branch" && !activeBranch && (
        <p className="text-xs text-slate-400">Select a {terms.branch.toLowerCase()} to manage its departments &amp; staff.</p>
      )}
    </div>
  );
};

export default StaffView;
