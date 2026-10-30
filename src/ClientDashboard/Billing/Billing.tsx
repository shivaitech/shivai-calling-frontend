import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Clock, Layers, LayoutGrid, Receipt } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import { APPS, appWorkspacePath, getAppById } from "../../marketplace/apps";
import { useInstalledApps } from "../../marketplace/useInstalledApps";
import type { Billing as Cycle, PlanId } from "../../pages/digitalCardPricing";
import CardBilling from "./CardBilling";
import { ItemIcon, Pill, SOON_CLS } from "./billingUi";

/**
 * Billing, filterable by All / Platform / Apps (and per app). Only the Digital Business
 * Card is billed for real today; the platform and the other apps show "Coming soon".
 * The filter lives in the URL (?view=&app=), so the pricing page and checkout can link
 * straight to the card's billing (?view=apps&app=digital-card&plan=&billing=).
 */

type View = "all" | "platform" | "apps";

const CARD_APP = "digital-card";
const PLAN_IDS: PlanId[] = ["essential", "signature", "prestige"];

const VIEWS: { id: View; label: string; Icon: typeof Layers }[] = [
  { id: "all", label: "All billing", Icon: Receipt },
  { id: "platform", label: "Platform", Icon: Layers },
  { id: "apps", label: "Apps", Icon: LayoutGrid },
];

const PLATFORM_COMING = ["Your ShivAI plan", "AI call minutes & limits", "Phone numbers", "Invoices & receipts"];

function PlatformSoon() {
  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <ItemIcon />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">ShivAI Platform</h3>
            <Pill label="Coming soon" cls={SOON_CLS} />
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Platform billing is on its way. Your plan, usage and invoices for your ShivAI account will appear here.
          </p>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {PLATFORM_COMING.map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5 rounded-full common-bg-icons px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {t}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

function AppsSoon({ appIds, single }: { appIds: string[]; single: boolean }) {
  if (!appIds.length) return null;
  return (
    <GlassCard className="p-4 sm:p-6">
      {!single && (
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Other apps</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Billing for these apps is coming soon. They keep working as they do today.</p>
        </div>
      )}
      <ul className="divide-y divide-slate-200/70 dark:divide-slate-700/60">
        {appIds.map((id) => {
          const app = getAppById(id);
          if (!app) return null;
          return (
            <li key={id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <ItemIcon appId={id} size={single ? "md" : "sm"} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`${single ? "text-lg" : "text-sm"} font-semibold text-slate-800 dark:text-white truncate`}>{app.name}</p>
                  <Pill label="Billing coming soon" cls={SOON_CLS} />
                </div>
                {single && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Plans and invoices for this app will appear here.</p>}
              </div>
              <Link
                to={appWorkspacePath(id)}
                className="flex-none inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Open <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}

export default function Billing() {
  const [params, setParams] = useSearchParams();
  const view: View = params.get("view") === "platform" ? "platform" : params.get("view") === "apps" ? "apps" : "all";
  const appFilter = view === "apps" ? params.get("app") : null;
  const { installedIds } = useInstalledApps();

  const planParam = params.get("plan") as PlanId | null;
  const preselect =
    planParam && PLAN_IDS.includes(planParam) ? { plan: planParam, billing: (params.get("billing") === "annual" ? "annual" : "monthly") as Cycle } : null;
  const checkout = params.get("checkout");
  const checkoutResult = checkout === "success" || checkout === "cancelled" ? checkout : null;

  const update = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(params);
    mutate(p);
    setParams(p, { replace: true });
  };
  const setView = (next: View, app?: string) =>
    update((p) => {
      if (next === "all") p.delete("view");
      else p.set("view", next);
      if (next === "apps" && app) p.set("app", app);
      else p.delete("app");
    });

  // Installed apps other than the card, in catalog order.
  const otherApps = APPS.filter((a) => a.id !== CARD_APP && installedIds.includes(a.id)).map((a) => a.id);
  const showCard = view === "all" || (view === "apps" && (!appFilter || appFilter === CARD_APP));
  const shownOthers = view === "platform" ? [] : appFilter ? otherApps.filter((id) => id === appFilter) : otherApps;
  const counts: Record<View, number | null> = { all: null, platform: null, apps: otherApps.length + 1 };

  const chip = (on: boolean) =>
    `flex-none inline-flex items-center gap-1.5 rounded-full border py-1 text-xs font-semibold transition ${
      on
        ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
    }`;

  return (
    <div className="space-y-4 sm:space-y-5 w-full">
      {/* All / Platform / Apps */}
      <div role="tablist" aria-label="Billing view" className="inline-flex max-w-full overflow-x-auto rounded-xl common-bg-icons p-1 gap-1">
        {VIEWS.map(({ id, label, Icon }) => {
          const on = view === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setView(id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 sm:px-3.5 py-2 text-sm font-medium transition ${
                on ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {counts[id] !== null && <span className="text-xs tabular-nums text-slate-400">{counts[id]}</span>}
            </button>
          );
        })}
      </div>

      {/* Per-app filter */}
      {view === "apps" && (
        <div className="-mx-1 px-1 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by app">
          <button type="button" onClick={() => setView("apps")} className={`${chip(!appFilter)} px-3`}>
            All apps
          </button>
          {[CARD_APP, ...otherApps].map((id) => (
            <button key={id} type="button" onClick={() => setView("apps", id)} className={`${chip(appFilter === id)} pl-1 pr-3`}>
              <span className="scale-75 -my-1">
                <ItemIcon appId={id} size="sm" />
              </span>
              {getAppById(id)?.name ?? id}
            </button>
          ))}
        </div>
      )}

      {view !== "apps" && <PlatformSoon />}
      {showCard && (
        <CardBilling
          preselect={preselect}
          checkoutResult={checkoutResult}
          onCheckoutHandled={() =>
            update((p) => {
              p.delete("checkout");
              p.delete("plan");
              p.delete("billing");
            })
          }
        />
      )}
      <AppsSoon appIds={shownOthers} single={!!appFilter} />
    </div>
  );
}
