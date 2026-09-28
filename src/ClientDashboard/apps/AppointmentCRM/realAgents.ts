// Real AI agents for the Appointment CRM's "AI Agents" tab & Overview widget —
// pulled from the same /agents API the main dashboard's Agent Management page
// uses (agentAPI.getAgents()), instead of the mock SCHEDULING_AGENTS list.

import { useEffect, useState } from "react";
import { agentAPI, type ApiAgent } from "../../../services/agentAPI";
import type { AgentStatus } from "../SupportCRM/mockData";
import type { SchedulingAgent } from "./mockData";

const HUES = [220, 280, 160, 40, 310, 180, 100, 250];

function hueFromSeed(seed: string, fallback = 0): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return HUES[Math.abs(hash) % HUES.length] ?? fallback;
}

function statusFromApi(agent: ApiAgent): AgentStatus {
  return agent.status === "Published" ? "available" : "paused";
}

function languagesOf(agent: ApiAgent): string[] {
  if (Array.isArray(agent.language)) return agent.language;
  if (typeof agent.language === "string" && agent.language.trim()) return [agent.language];
  return ["English"];
}

export function adaptApiAgent(agent: ApiAgent, index = 0): SchedulingAgent {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.business_process || agent.personality || "AI Agent",
    avatarHue: hueFromSeed(agent.id, HUES[index % HUES.length]),
    status: statusFromApi(agent),
    bookingsToday: agent.stats?.conversations ?? 0,
    noShowRate: 0, // not tracked by the real agent API — appointment-level stat, not agent-level
    languages: languagesOf(agent),
  };
}

/** Loads real agents once and adapts them to the CRM's SchedulingAgent shape. */
export function useRealSchedulingAgents() {
  const [rawAgents, setRawAgents] = useState<ApiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    agentAPI
      .getAgents()
      .then(setRawAgents)
      .catch((err: any) => setError(err?.message || "Failed to load agents"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const agents = rawAgents.map(adaptApiAgent);
  return { agents, rawAgents, loading, error, reload: load };
}
