import { MapPin, Star } from "lucide-react";
import { useActiveBranch } from "./branchesStore";
import { useAppointmentIndustry } from "./industryConfig";

interface BranchSwitcherProps {
  variant?: "command" | "compact";
  className?: string;
}

const BranchSwitcher = ({ variant = "compact", className = "" }: BranchSwitcherProps) => {
  const { terms } = useAppointmentIndustry();
  const { branches, activeBranchId, setActiveBranch } = useActiveBranch();

  if (branches.length <= 1) {
    if (!activeBranchId || variant === "compact") return null;
    const only = branches[0];
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 ${className}`}>
        <MapPin className="w-4 h-4 text-violet-600" />
        <span className="text-sm font-medium text-slate-800 dark:text-white">{only?.name}</span>
        <span className="text-[10px] text-slate-400">Active {terms.branch.toLowerCase()}</span>
      </div>
    );
  }

  if (variant === "command") {
    return (
      <div className={className}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Active {terms.branch}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              All sections — staff, calendar, bookings — follow this {terms.branch.toLowerCase()}
            </p>
          </div>
          {branches.find((b) => b.id === activeBranchId)?.isPrimary && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/70">
              <Star className="w-3 h-3" /> Primary
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => {
            const active = b.id === activeBranchId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveBranch(b.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  active
                    ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        {terms.branch}
      </span>
      {branches.map((b) => {
        const active = b.id === activeBranchId;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => setActiveBranch(b.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              active
                ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900"
                : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            {b.name}
          </button>
        );
      })}
    </div>
  );
};

export default BranchSwitcher;
