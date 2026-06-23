import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Loader2,
  MapPin,
  Scissors,
  Sparkles,
  Stethoscope,
  Building,
} from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import {
  APPOINTMENT_INDUSTRY_PRESETS,
  AppointmentIndustryPreset,
  setActiveIndustryId,
} from "./industryConfig";
import { BranchMode, completeSetup } from "./setupStore";
import { seedBranchesFromPreset, ensureActiveBranch } from "./branchesStore";
import { seedOrgHierarchy } from "./orgSeed";

interface SetupModalProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = ["Welcome", "Industry", "Locations", "Review"] as const;

const industryIcon = (id: string) => {
  const cls = "w-5 h-5";
  switch (id) {
    case "hospital":
      return <Building2 className={cls} />;
    case "clinic":
      return <Stethoscope className={cls} />;
    case "school":
      return <GraduationCap className={cls} />;
    case "dental":
      return <HeartPulse className={cls} />;
    case "salon":
      return <Scissors className={cls} />;
    case "fitness":
      return <Dumbbell className={cls} />;
    default:
      return <Sparkles className={cls} />;
  }
};

const SetupModal = ({ open, onComplete }: SetupModalProps) => {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [industryId, setIndustryId] = useState("clinic");
  const [branchMode, setBranchMode] = useState<BranchMode>("single");
  const [branchNames, setBranchNames] = useState<string[]>(["Main Location"]);
  const [saving, setSaving] = useState(false);

  const preset = useMemo(
    () => APPOINTMENT_INDUSTRY_PRESETS.find((p) => p.id === industryId) ?? APPOINTMENT_INDUSTRY_PRESETS[1],
    [industryId],
  );

  const selectIndustry = (p: AppointmentIndustryPreset) => {
    setIndustryId(p.id);
    const seeds = p.defaultBranches.map((b) => b.name);
    setBranchNames(branchMode === "single" ? [seeds[0] ?? "Main Location"] : seeds.length ? seeds : ["Main Location", "Branch 2"]);
  };

  const canNext = () => {
    if (step === 0) return companyName.trim().length >= 2;
    if (step === 1) return Boolean(industryId);
    if (step === 2) return branchNames.some((n) => n.trim());
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      setActiveIndustryId(industryId);
      const seeds = branchNames
        .filter((n) => n.trim())
        .map((name) => {
          const match = preset.defaultBranches.find((b) => b.name === name);
          return { name: name.trim(), address: match?.address };
        });
      const createdBranches = seedBranchesFromPreset(
        seeds.length ? seeds : [{ name: companyName.trim() }],
        branchMode,
      );
      seedOrgHierarchy(createdBranches);
      ensureActiveBranch(createdBranches);
      completeSetup({
        companyName: companyName.trim(),
        industryId,
        branchMode,
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay open={open} panelClassName="max-w-2xl" zIndex={110}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Set up your scheduling CRM
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Industry templates, terminology & branches — tailored in under a minute.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                    i < step
                      ? "bg-violet-600 text-white"
                      : i === step
                        ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium truncate hidden sm:block ${i === step ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 ${i < step ? "bg-violet-400" : "bg-slate-200 dark:bg-slate-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 min-h-[280px]">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                  Welcome — let&apos;s configure your workspace
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your AI scheduling agents will use this profile for bookings, reminders, and customer records.
                  You can change everything later in Setup.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Company / Organization name <span className="text-red-400">*</span>
                </label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. CityCare Hospital, Bright Minds School"
                  className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
                  autoFocus
                />
              </div>
              <div className="rounded-xl border border-violet-200/70 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20 p-3">
                <p className="text-[11px] text-violet-800 dark:text-violet-200 leading-relaxed">
                  <strong>What you get:</strong> industry-specific booking types, {preset.terms.customer.toLowerCase()} records,
                  multi-channel reminders, AI agents that book &amp; reschedule by phone, and branch-aware calendars.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Choose your industry</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Templates adjust terminology, services, and default booking fields.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[240px] overflow-y-auto pr-1">
                {APPOINTMENT_INDUSTRY_PRESETS.map((p) => {
                  const active = industryId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectIndustry(p)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        active
                          ? "border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/25 ring-1 ring-violet-500/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 common-bg-icons"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-violet-200/60 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                        {industryIcon(p.id)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{p.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                  {preset.terms.branch} setup
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Single location or multiple {preset.terms.branches.toLowerCase()} — each gets its own calendar &amp; staff.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {(["single", "multi"] as BranchMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setBranchMode(mode);
                      if (mode === "single") {
                        setBranchNames([branchNames[0] || preset.defaultBranches[0]?.name || "Main Location"]);
                      } else if (branchNames.length < 2) {
                        setBranchNames(
                          preset.defaultBranches.length >= 2
                            ? preset.defaultBranches.map((b) => b.name)
                            : [branchNames[0] || "Main Location", "Branch 2"],
                        );
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      branchMode === mode
                        ? "border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/25"
                        : "border-slate-200 dark:border-slate-700 common-bg-icons"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {mode === "single" ? <Building className="w-4 h-4 text-violet-600" /> : <MapPin className="w-4 h-4 text-violet-600" />}
                      <span className="text-sm font-semibold text-slate-800 dark:text-white capitalize">
                        {mode === "single" ? "Single branch" : "Multi-branch"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {mode === "single"
                        ? `One ${preset.terms.branch.toLowerCase()} — simplest setup`
                        : `Multiple ${preset.terms.branches.toLowerCase()} with separate schedules`}
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {branchMode === "single" ? `${preset.terms.branch} name` : `${preset.terms.branch} names`}
                </label>
                {branchNames.map((name, i) => (
                  <input
                    key={i}
                    value={name}
                    onChange={(e) => {
                      const next = [...branchNames];
                      next[i] = e.target.value;
                      setBranchNames(next);
                    }}
                    placeholder={`${preset.terms.branch} ${i + 1}`}
                    className="w-full px-3 py-2 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                ))}
                {branchMode === "multi" && branchNames.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setBranchNames([...branchNames, `${preset.terms.branch} ${branchNames.length + 1}`])}
                    className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    + Add another {preset.terms.branch.toLowerCase()}
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Review &amp; launch</h3>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                <ReviewRow label="Organization" value={companyName.trim()} />
                <ReviewRow label="Industry" value={preset.name} />
                <ReviewRow label="Mode" value={branchMode === "single" ? "Single branch" : `Multi-branch (${branchNames.filter(Boolean).length})`} />
                <ReviewRow label="Locations" value={branchNames.filter((n) => n.trim()).join(" · ")} />
                <ReviewRow label="Booking types" value={`${preset.appointmentTypes.length} pre-configured`} />
                <ReviewRow label="Default slot" value={`${preset.slotDurationMin} minutes`} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                AI agents will greet callers as <strong>{companyName.trim()}</strong> and book {preset.terms.appointments.toLowerCase()} for {preset.terms.customers.toLowerCase()}.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-2.5">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || saving}
            className="px-4 py-2.5 rounded-xl text-sm font-medium common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 flex items-center justify-center gap-1"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : <><Check className="w-4 h-4" /> Launch CRM</>}
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
};

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-medium text-slate-800 dark:text-white text-right truncate">{value}</span>
  </div>
);

export default SetupModal;
