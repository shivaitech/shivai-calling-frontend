import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Check,
  Plus,
  ArrowRight,
  Sparkles,
  Lock,
  PackageCheck,
} from "lucide-react";
import {
  APPS,
  CATEGORIES,
  MarketplaceApp,
  AppCategory,
  openAppWorkspace,
} from "../../marketplace/apps";
import { useInstalledApps } from "../../marketplace/useInstalledApps";

const pricingStyles: Record<MarketplaceApp["pricing"], string> = {
  Free: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/60",
  Included:
    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200/70 dark:border-blue-800/60",
  Premium:
    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/60",
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { isInstalled, install } = useInstalledApps();

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<AppCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return APPS.filter((app) => {
      const matchesCat = activeCat === "all" || app.category === activeCat;
      const matchesQuery =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.tagline.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, activeCat]);

  const installedCount = APPS.filter((a) => isInstalled(a.id)).length;

  const handlePrimary = (app: MarketplaceApp, e: React.MouseEvent) => {
    e.stopPropagation();
    if (app.status === "coming-soon") return;
    if (isInstalled(app.id)) {
      openAppWorkspace(app.id); // opens the app's workspace in a new tab
    } else {
      install(app.id);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── Hero header (compact) ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-16 left-1/4 w-56 h-56 rounded-full bg-cyan-300/30 blur-3xl" />
        </div>
        <div className="relative px-5 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wide">
                <Sparkles className="w-3 h-3" /> Marketplace
              </span>
            </div>
            <h1 className="text-white text-xl sm:text-2xl font-bold leading-tight">
              Supercharge your AI workforce
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
              Install apps to add new powers to your dashboard — one click, instantly available.
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium">
              <PackageCheck className="w-4 h-4" /> {installedCount} installed
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-white/90 text-xs font-medium">
              <Sparkles className="w-4 h-4" /> {APPS.length} available
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + category filters ── */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = activeCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── App grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <Search className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No apps match your search
          </p>
          <p className="text-xs text-slate-400">Try a different keyword or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((app, i) => {
            const installed = isInstalled(app.id);
            const Icon = app.icon;
            const comingSoon = app.status === "coming-soon";
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => navigate(`/marketplace/${app.id}`)}
                className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 p-5 flex flex-col gap-4 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-slate-900/40 hover:-translate-y-0.5 transition-all"
              >
                {/* Top row: icon + badges */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg shadow-slate-300/30 dark:shadow-black/30 flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {app.badge && !comingSoon && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
                        {app.badge}
                      </span>
                    )}
                    {comingSoon && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Name + tagline */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-base leading-tight">
                      {app.name}
                    </h3>
                    {installed && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3" /> Installed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                    {app.tagline}
                  </p>
                </div>

                {/* Footer: pricing + CTA */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${pricingStyles[app.pricing]}`}
                  >
                    {app.pricing}
                  </span>

                  <button
                    onClick={(e) => handlePrimary(app, e)}
                    disabled={comingSoon}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
                      comingSoon
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        : installed
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                        : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 shadow-md shadow-indigo-500/20"
                    }`}
                  >
                    {comingSoon ? (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Soon
                      </>
                    ) : installed ? (
                      <>
                        Open <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Install
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
