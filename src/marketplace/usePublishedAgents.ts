import { useEffect, useState } from "react";
import { useAgent } from "../contexts/AgentContext";
import type { MarketplaceApp } from "./apps";

/**
 * How many published AI employees the account has, for apps that need one to work
 * (MarketplaceApp.requiresPublishedAgent). The agent list only loads by itself on agent
 * pages, so this loads it once here.
 */
export function usePublishedAgents() {
  const { agents, isLoading, refreshAgents } = useAgent();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let live = true;
    refreshAgents()
      .catch(() => {})
      .finally(() => live && setChecked(true));
    return () => {
      live = false;
    };
    // Once per page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const published = agents.filter((a) => a.status === "Published").length;
  return { ready: checked && !isLoading, published };
}

/** Why this app can't be installed yet, or "" when it can. */
export function agentRequirementProblem(app: MarketplaceApp, check: { ready: boolean; published: number }): string {
  if (!app.requiresPublishedAgent) return "";
  if (!check.ready) return "Checking your AI employees…";
  return check.published > 0 ? "" : `${app.name} needs at least one published AI employee. Create and publish one first.`;
}
