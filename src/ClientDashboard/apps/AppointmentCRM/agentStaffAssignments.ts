// Local additive layer linking an AI agent (real agentAPI agent) to one or
// more branch-scoped staff members it's allowed to book appointments for.
// The real Agent API has no such field, so — same pattern as staffOrgStore's
// staffId→{departmentId,designationId} map — this is kept client-side and
// merged in at render time. What the AI actually *knows* about each assigned
// staff member (name, specialization, availability) is injected server-side
// into the agent's instructions; this store is only the assignment itself.

import { useEffect, useState } from "react";

const STORAGE_KEY = "shivai_appointmentcrm_agent_staff_assignments";
const EVENT = "shivai:appointment-agent-staff-changed";

type AssignmentMap = Record<string, string[]>; // agentId -> staffId[]

function readAll(): AssignmentMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: AssignmentMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

export function getAssignedStaffIds(agentId: string): string[] {
  return readAll()[agentId] ?? [];
}

export function setAssignedStaffIds(agentId: string, staffIds: string[]): void {
  const map = readAll();
  if (staffIds.length) {
    map[agentId] = staffIds;
  } else {
    delete map[agentId];
  }
  writeAll(map);
}

/** All agentIds assigned to a given staff member — used by booking filters. */
export function getAgentIdsForStaff(staffId: string): string[] {
  const map = readAll();
  return Object.keys(map).filter((agentId) => map[agentId].includes(staffId));
}

export function useAgentStaffAssignments() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return {
    assignedStaffIds: (agentId: string) => getAssignedStaffIds(agentId),
    setAssignedStaffIds,
    agentIdsForStaff: (staffId: string) => getAgentIdsForStaff(staffId),
  };
}
