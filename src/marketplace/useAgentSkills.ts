import { useCallback, useEffect, useState } from "react";

/**
 * ── Agent skills store ───────────────────────────────────────────────────────
 *
 * A "skill" is an installed marketplace app (see useInstalledApps.ts) assigned
 * to a specific AI agent. Architecture: the agent is a single conversational
 * orchestrator — installing an app does NOT spin up a separate agent, it
 * registers a capability that must be explicitly attached to an agent before
 * that agent can use it. One app = one skill (1:1).
 *
 * STORAGE: localStorage for now, keyed by agentId. This is intentionally the
 * ONLY place that touches persistence — when the backend lands (mirroring the
 * agent-documents join-row shape: { agent_id, tenant_id, skill_ids: [] }),
 * swap `readAgentSkills` + `writeAgentSkills` for API calls and every consumer
 * (Edit Agent's Skills tab, Agent View's Skills card, the agent list's
 * workflow chips) keeps working unchanged.
 *
 * SYNC: components in the same tab stay in sync via a custom window event
 * (AGENT_SKILLS_EVENT); other tabs sync via the native `storage` event.
 */

const STORAGE_PREFIX = "shivai_agent_skills_";
const AGENT_SKILLS_EVENT = "shivai:agent-skills-changed";

function storageKey(agentId: string): string {
  return `${STORAGE_PREFIX}${agentId}`;
}

// ── Persistence layer (the swap point for a future backend) ───────────────────

export function readAgentSkillIds(agentId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(agentId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeAgentSkillIds(agentId: string, ids: string[]): void {
  try {
    localStorage.setItem(storageKey(agentId), JSON.stringify(ids));
  } catch {
    /* storage full / unavailable — ignore */
  }
  window.dispatchEvent(new CustomEvent(AGENT_SKILLS_EVENT, { detail: { agentId } }));
}

/** All agentIds (from the given list) that currently have this skill assigned. */
export function getAgentIdsForSkill(appId: string, agentIds: string[]): string[] {
  return agentIds.filter((id) => readAgentSkillIds(id).includes(appId));
}

/**
 * Whether ANY agent (across the whole tenant) has this skill assigned yet.
 * Checks every per-agent localStorage key under the skills prefix directly
 * rather than requiring the caller to pass a full agent list — used by the
 * AppWorkspace "no agent assigned" nag, which needs this answer before it
 * even knows which agents exist.
 */
export function hasAnyAgentAssignedSkill(appId: string): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.includes(appId)) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function useHasAnyAgentAssignedSkill(appId: string): boolean {
  const [assigned, setAssigned] = useState(() => hasAnyAgentAssignedSkill(appId));

  useEffect(() => {
    const sync = () => setAssigned(hasAnyAgentAssignedSkill(appId));
    sync();
    window.addEventListener(AGENT_SKILLS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AGENT_SKILLS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [appId]);

  return assigned;
}

/** Module-level assign/unassign for multi-agent flows (e.g. the marketplace
 * install picker) that operate across several agents at once rather than
 * through the single-agent useAgentSkills hook. */
export function assignSkillToAgent(agentId: string, appId: string): void {
  const current = readAgentSkillIds(agentId);
  if (current.includes(appId)) return;
  writeAgentSkillIds(agentId, [...current, appId]);
}

export function unassignSkillFromAgent(agentId: string, appId: string): void {
  const current = readAgentSkillIds(agentId);
  if (!current.includes(appId)) return;
  writeAgentSkillIds(agentId, current.filter((id) => id !== appId));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseAgentSkills {
  skillIds: string[];
  hasSkill: (appId: string) => boolean;
  assignSkill: (appId: string) => void;
  unassignSkill: (appId: string) => void;
  toggleSkill: (appId: string) => void;
}

export function useAgentSkills(agentId: string | null | undefined): UseAgentSkills {
  const [skillIds, setSkillIds] = useState<string[]>(() => (agentId ? readAgentSkillIds(agentId) : []));

  useEffect(() => {
    setSkillIds(agentId ? readAgentSkillIds(agentId) : []);
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;
    const sync = (e: Event) => {
      const detail = (e as CustomEvent<{ agentId?: string }>).detail;
      if (!detail || detail.agentId === agentId) {
        setSkillIds(readAgentSkillIds(agentId));
      }
    };
    window.addEventListener(AGENT_SKILLS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AGENT_SKILLS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [agentId]);

  const hasSkill = useCallback((appId: string) => skillIds.includes(appId), [skillIds]);

  const assignSkill = useCallback(
    (appId: string) => {
      if (!agentId) return;
      const current = readAgentSkillIds(agentId);
      if (current.includes(appId)) return;
      writeAgentSkillIds(agentId, [...current, appId]);
    },
    [agentId],
  );

  const unassignSkill = useCallback(
    (appId: string) => {
      if (!agentId) return;
      const current = readAgentSkillIds(agentId);
      if (!current.includes(appId)) return;
      writeAgentSkillIds(agentId, current.filter((id) => id !== appId));
    },
    [agentId],
  );

  const toggleSkill = useCallback(
    (appId: string) => {
      if (!agentId) return;
      const current = readAgentSkillIds(agentId);
      writeAgentSkillIds(
        agentId,
        current.includes(appId) ? current.filter((id) => id !== appId) : [...current, appId],
      );
    },
    [agentId],
  );

  return { skillIds, hasSkill, assignSkill, unassignSkill, toggleSkill };
}
