import { useCallback, useEffect, useState } from "react";
import { getActiveIndustryId, getActivePreset } from "./industryConfig";
import { AGENTS, TICKETS, AIAgentEmployee } from "./mockData";

/**
 * ── Departments store ────────────────────────────────────────────────────────
 *
 * Companies and institutions organise work into departments / processes, and
 * AI employees work under them (one department per agent). This store holds the
 * user's departments and the agent→department assignment.
 *
 * Seeded from the active industry preset the first time, then user-editable and
 * persisted in localStorage (per industry, so switching verticals gives the
 * right starter set). When the backend lands this becomes an API read/write.
 */

export interface Department {
  id: string;
  name: string;
  desc: string;
  hue: number;             // for a consistent department color
}

const DEPTS_EVENT = "shivai:departments-changed";
const deptKey = () => `shivai_supportcrm_departments_${getActiveIndustryId()}`;
const assignKey = () => `shivai_supportcrm_agent_dept_${getActiveIndustryId()}`;

const HUES = [210, 150, 280, 25, 330, 190, 95, 250];

// ── Seed + persistence ────────────────────────────────────────────────────────

function seedDepartments(): Department[] {
  const preset = getActivePreset();
  return preset.departments.map((d, i) => ({
    id: `dept-${preset.id}-${i}`,
    name: d.name,
    desc: d.desc,
    hue: HUES[i % HUES.length],
  }));
}

export function getDepartments(): Department[] {
  try {
    const raw = localStorage.getItem(deptKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  const seeded = seedDepartments();
  try { localStorage.setItem(deptKey(), JSON.stringify(seeded)); } catch { /* ignore */ }
  return seeded;
}

function writeDepartments(list: Department[]) {
  try { localStorage.setItem(deptKey(), JSON.stringify(list)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(DEPTS_EVENT));
}

/** agentId → departmentId map. Seeded by round-robin across departments. */
export function getAssignments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(assignKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    /* ignore */
  }
  const depts = getDepartments();
  const map: Record<string, string> = {};
  AGENTS.forEach((a, i) => {
    if (depts.length) map[a.id] = depts[i % depts.length].id;
  });
  try { localStorage.setItem(assignKey(), JSON.stringify(map)); } catch { /* ignore */ }
  return map;
}

function writeAssignments(map: Record<string, string>) {
  try { localStorage.setItem(assignKey(), JSON.stringify(map)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(DEPTS_EVENT));
}

// ── Derived data ──────────────────────────────────────────────────────────────

export interface DepartmentStats {
  agents: AIAgentEmployee[];
  agentCount: number;
  callsToday: number;
  onCall: number;
  openTickets: number;
  avgCsat: string;
  avgSla: number;
}

export function statsForDepartment(deptId: string, assignments: Record<string, string>): DepartmentStats {
  const agents = AGENTS.filter((a) => assignments[a.id] === deptId);
  const agentIds = new Set(agents.map((a) => a.id));
  const openTickets = TICKETS.filter(
    (t) => agentIds.has(t.assignedAgentId) && t.status !== "resolved" && t.status !== "closed"
  ).length;
  const callsToday = agents.reduce((s, a) => s + a.metrics.callsToday, 0);
  const onCall = agents.filter((a) => a.status === "on-call").length;
  const avgCsat = agents.length ? (agents.reduce((s, a) => s + a.metrics.csat, 0) / agents.length).toFixed(1) : "—";
  const avgSla = agents.length ? Math.round(agents.reduce((s, a) => s + a.metrics.slaCompliance, 0) / agents.length) : 0;
  return { agents, agentCount: agents.length, callsToday, onCall, openTickets, avgCsat, avgSla };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDepartments() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(DEPTS_EVENT, sync);
    window.addEventListener("shivai:industry-changed", sync); // re-seed view on industry switch
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEPTS_EVENT, sync);
      window.removeEventListener("shivai:industry-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const departments = getDepartments();
  const assignments = getAssignments();

  const addDepartment = useCallback((name: string, desc: string) => {
    const list = getDepartments();
    const dept: Department = {
      id: `dept-${Date.now()}`,
      name: name.trim(),
      desc: desc.trim(),
      hue: HUES[list.length % HUES.length],
    };
    writeDepartments([...list, dept]);
  }, []);

  const updateDepartment = useCallback((id: string, patch: Partial<Department>) => {
    writeDepartments(getDepartments().map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const removeDepartment = useCallback((id: string) => {
    writeDepartments(getDepartments().filter((d) => d.id !== id));
    // Unassign agents from the removed department.
    const map = getAssignments();
    let changed = false;
    Object.keys(map).forEach((aid) => { if (map[aid] === id) { delete map[aid]; changed = true; } });
    if (changed) writeAssignments(map);
  }, []);

  const assignAgent = useCallback((agentId: string, deptId: string) => {
    writeAssignments({ ...getAssignments(), [agentId]: deptId });
  }, []);

  const departmentOf = useCallback(
    (agentId: string): Department | undefined => {
      const id = getAssignments()[agentId];
      return getDepartments().find((d) => d.id === id);
    },
    []
  );

  return {
    departments,
    assignments,
    addDepartment,
    updateDepartment,
    removeDepartment,
    assignAgent,
    departmentOf,
    statsFor: (id: string) => statsForDepartment(id, assignments),
  };
}
