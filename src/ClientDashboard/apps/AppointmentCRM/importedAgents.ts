// Which real AI agents (from the main dashboard's Agent Management) have been
// imported into this Appointment CRM, and under what AI Role Name (e.g. "AI
// Receptionist", "AI Officer"). The CRM's AI Agents tab only shows imported
// records — a real agent stays invisible here until explicitly imported.
// The same real agent can be imported more than once under different role
// names, so each import gets its own id.

import { useEffect, useState } from "react";

export interface ImportedAgent {
  importId: string;
  agentId: string;
  aiRoleName: string;
  importedAt: string;
}

const STORAGE_KEY = "shivai_appointmentcrm_imported_agents";
const EVENT = "shivai:appointment-imported-agents-changed";

function readAll(): ImportedAgent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: ImportedAgent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

function makeImportId(): string {
  return `imp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function importAgent(agentId: string, aiRoleName: string): ImportedAgent {
  const list = readAll();
  const record: ImportedAgent = {
    importId: makeImportId(),
    agentId,
    aiRoleName: aiRoleName.trim() || "AI Agent",
    importedAt: new Date().toISOString(),
  };
  writeAll([...list, record]);
  return record;
}

export function updateImportedAgentRoleName(importId: string, aiRoleName: string): void {
  const list = readAll();
  writeAll(
    list.map((r) => (r.importId === importId ? { ...r, aiRoleName: aiRoleName.trim() || "AI Agent" } : r)),
  );
}

export function removeImportedAgent(importId: string): void {
  writeAll(readAll().filter((r) => r.importId !== importId));
}

export function useImportedAgents() {
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
    imported: readAll(),
    importAgent,
    updateRoleName: updateImportedAgentRoleName,
    remove: removeImportedAgent,
  };
}
