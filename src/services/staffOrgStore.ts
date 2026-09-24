// Staff ↔ Department/Designation assignment.
//
// Departments and Designations are now real, global API entities (see
// departmentsAPI.ts) — they are NOT tenant-scoped and are managed there.
// The one thing that still has no backend field is the assignment of a
// PARTICULAR staff member to a department/designation (the /staff API only
// stores a free-text role_name). So we keep a small local map,
// staffId → { departmentId, designationId }, persisted per tenant, purely so
// the Staff list/cards can show "which department/designation" without the
// backend needing to add that relationship. The designation's NAME is what
// actually gets sent to the staff API as role_name.

import { useCallback, useEffect, useState } from "react";

/** staffId → its department/designation assignment. */
export interface StaffAssignment {
  departmentId: string | null;
  designationId: string | null;
}

const ASSIGN_EVENT = "shivai:staff-assignment-changed";
const keyFor = (tenantId: string) => `shivai_staff_assignments_${tenantId || "me"}`;

function readAssignments(tenantId: string): Record<string, StaffAssignment> {
  try {
    const raw = localStorage.getItem(keyFor(tenantId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writeAssignments(tenantId: string, data: Record<string, StaffAssignment>) {
  try {
    localStorage.setItem(keyFor(tenantId), JSON.stringify(data));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(ASSIGN_EVENT));
}

export function useStaffAssignments(tenantId: string) {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(ASSIGN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ASSIGN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const assignments = readAssignments(tenantId);

  const setAssignment = useCallback(
    (staffId: string, departmentId: string | null, designationId: string | null) => {
      const a = readAssignments(tenantId);
      writeAssignments(tenantId, { ...a, [staffId]: { departmentId, designationId } });
    },
    [tenantId]
  );

  const assignmentFor = useCallback(
    (staffId: string): StaffAssignment =>
      readAssignments(tenantId)[staffId] || { departmentId: null, designationId: null },
    [tenantId]
  );

  const clearAssignment = useCallback(
    (staffId: string) => {
      const a = readAssignments(tenantId);
      delete a[staffId];
      writeAssignments(tenantId, a);
    },
    [tenantId]
  );

  return { assignments, setAssignment, assignmentFor, clearAssignment };
}
