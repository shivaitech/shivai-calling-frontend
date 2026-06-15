import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Plus,
  ArrowRight,
  Lock,
  Trash2,
  Sparkles,
  ShieldCheck,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { getAppById, MarketplaceApp, openAppWorkspace, getVisibleApps } from "../../marketplace/apps";
import { useInstalledApps } from "../../marketplace/useInstalledApps";
import { useAuth } from "../../contexts/AuthContext";

const pricingStyles: Record<MarketplaceApp["pricing"], string> = {
  Free: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/60",
  Included:
    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200/70 dark:border-blue-800/60",
  Premium:
    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/60",
};

const AppDetail = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInstalled, install, uninstall } = useInstalledApps();

  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const app = appId ? getAppById(appId) : undefined;
  const visibleApps = getVisibleApps(user?.email);
  const isAppVisible = app && visibleApps.some((a) => a.id === app.id);

  if (!app || !isAppVisible) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">App not found</p>
        <button
          onClick={() => navigate("/marketplace")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium common-button-bg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </button>
      </div>
    );
  }

  const installed = isInstalled(app.id);
  const comingSoon = app.status === "coming-soon";
  const Icon = app.icon;

  const handleInstall = () => {
    setInstalling(true);
    // Small delay purely for UX polish — feels like a real install.
    setTimeout(() => {
      install(app.id);
      setInstalling(false);
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 1800);
    }, 600);
  };

  return (
    <div className="space-y-5 w-full">
      {/* Header / breadcrumb bar */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate("/marketplace")}
          className="common-button-bg2 inline-flex items-center gap-1.5 !px-3 !py-2 rounded-xl flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="hidden sm:flex items-center gap-2 text-slate-400 dark:text-slate-500 min-w-0">
          <button onClick={() => navigate("/marketplace")} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            Marketplace
          </button>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{app.name}</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-800/90">
        {/* Content row */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg shadow-slate-300/30 dark:shadow-black/30 flex-shrink-0`}
              >
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white truncate">
                    {app.name}
                  </h1>
                  {installed && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/60 flex-shrink-0">
                      <Check className="w-3.5 h-3.5" /> Installed
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{app.category}</p>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {comingSoon ? (
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" /> Coming Soon
                </button>
              ) : installed ? (
                <>
                  <button
                    onClick={() => openAppWorkspace(app.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
                  >
                    Open <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => uninstall(app.id)}
                    title="Uninstall"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  {installing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Installing…
                    </>
                  ) : justInstalled ? (
                    <>
                      <Check className="w-4 h-4" /> Installed!
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Install
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Description + features */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 p-6">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">About this app</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {app.description}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 p-6">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">What you get</h2>
            <ul className="space-y-2.5">
              {app.features.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{f}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Side info card */}
        <div className="space-y-5">
          <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Plan</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${pricingStyles[app.pricing]}`}
              >
                {app.pricing}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Category</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {app.category}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {comingSoon ? "Coming soon" : installed ? "Installed" : "Available"}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Installs instantly into your ShivAI dashboard. You can uninstall anytime —
                your data stays safe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDetail;
