import { useCallback, useEffect, useState } from "react";
import { getActiveIndustryId, getActivePreset } from "./industryConfig";
import { getDepartments } from "./departmentsStore";

/**
 * ── Roles store ──────────────────────────────────────────────────────────────
 *
 * Roles belong to a department (strict hierarchy: Department → Role → Staff).
 * Seeded once per industry from the active preset's job term (e.g. a couple of
 * roles per department), then user-editable and persisted in localStorage.
 * When the backend lands this becomes an API read/write.
 */

export interface Role {
  id: string;
  name: string;
  departmentId: string;
  desc?: string;
}

const ROLES_EVENT = "shivai:supportcrm-roles-changed";
const rolesKey = () => `shivai_supportcrm_roles_${getActiveIndustryId()}`;

function seedRoles(): Role[] {
  const preset = getActivePreset();
  const depts = getDepartments();
  const agentWord = preset.terms.agent || "Agent";
  const out: Role[] = [];
  depts.forEach((d, i) => {
    out.push({ id: `role-${preset.id}-${i}-lead`, name: `Lead ${agentWord}`, departmentId: d.id });
    out.push({ id: `role-${preset.id}-${i}-agent`, name: agentWord, departmentId: d.id });
  });
  return out;
}

export function getRoles(): Role[] {
  try {
    const raw = localStorage.getItem(rolesKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  const seeded = seedRoles();
  try {
    localStorage.setItem(rolesKey(), JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

function writeRoles(list: Role[]) {
  try {
    localStorage.setItem(rolesKey(), JSON.stringify(list));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(ROLES_EVENT));
}

export function useRoles() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(ROLES_EVENT, sync);
    window.addEventListener("shivai:industry-changed", sync);
    window.addEventListener("shivai:departments-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ROLES_EVENT, sync);
      window.removeEventListener("shivai:industry-changed", sync);
      window.removeEventListener("shivai:departments-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const roles = getRoles();

  const rolesForDepartment = useCallback(
    (departmentId: string | null | undefined) =>
      departmentId ? getRoles().filter((r) => r.departmentId === departmentId) : [],
    []
  );

  const addRole = useCallback((departmentId: string, name: string, desc?: string): Role => {
    const role: Role = {
      id: `role-${Date.now()}`,
      name: name.trim(),
      departmentId,
      desc: desc?.trim() || undefined,
    };
    writeRoles([...getRoles(), role]);
    return role;
  }, []);

  const updateRole = useCallback((id: string, patch: Partial<Role>) => {
    writeRoles(getRoles().map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeRole = useCallback((id: string) => {
    writeRoles(getRoles().filter((r) => r.id !== id));
  }, []);

  const roleName = useCallback((id: string | null | undefined): string | undefined => {
    if (!id) return undefined;
    return getRoles().find((r) => r.id === id)?.name;
  }, []);

  return { roles, rolesForDepartment, addRole, updateRole, removeRole, roleName };
}
