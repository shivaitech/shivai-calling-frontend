// Unified staff directory for the agent-assignment picker — merges the two
// separate staff records this CRM has:
//   - Branch-scoped StaffMember (staffStore.ts): used for Calendar/Bookings,
//     has a real branchId/departmentId and a free-text role (e.g. "Senior
//     Physician"), but no link to the global Designation catalog.
//   - Global tenant StaffMember (staffAPI.ts): the org-wide staff/access
//     roster (Main Tenant Staff tab), linked to the global Department/
//     Designation catalog via staffOrgStore's local assignment map.
// Which one a business actually books appointments against is up to them —
// some route through the branch roster (doctors, engineers on a schedule),
// others manage everything from the tenant-wide roster (a CEO/CTO with no
// branch calendar). So the picker shows BOTH, clearly labeled, rather than
// picking one.

import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { staffAPI, type StaffMember as GlobalStaffMember } from "../../../services/staffAPI";
import { useStaffAssignments } from "../../../services/staffOrgStore";
import { departmentsAPI, designationsAPI, type Department as GlobalDepartment, type Designation as GlobalDesignation } from "../../../services/departmentsAPI";
import { useStaff, staffDisplayName, type StaffMember as BranchStaffMember } from "./staffStore";
import { useActiveBranch } from "./branchesStore";
import { useDepartments } from "./departmentsStore";

export interface CombinedStaffRow {
  /** Prefixed so branch-staff and global-staff ids never collide in the assignment map. */
  id: string;
  source: "branch" | "tenant";
  name: string;
  designation: string; // role/title shown to the user
  branchName?: string;
  departmentName?: string;
  hue: number;
}

const branchStaffRowId = (id: string) => `branch:${id}`;
const tenantStaffRowId = (id: string) => `tenant:${id}`;

export function useCombinedStaffDirectory() {
  const { user } = useAuth();
  const tenantId = String(user?.tenantId || user?.id || "me");

  const { branches } = useActiveBranch();
  const { departments } = useDepartments();
  const { staff: branchStaff } = useStaff();

  const assignments = useStaffAssignments(tenantId);
  const [globalStaff, setGlobalStaff] = useState<GlobalStaffMember[]>([]);
  const [globalDepartments, setGlobalDepartments] = useState<GlobalDepartment[]>([]);
  const [globalDesignations, setGlobalDesignations] = useState<GlobalDesignation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      staffAPI.list(tenantId),
      departmentsAPI.list({ limit: 100 }),
      designationsAPI.list({ limit: 100 }),
    ])
      .then(([staffList, deptRes, desigRes]) => {
        setGlobalStaff(staffList);
        setGlobalDepartments(deptRes.departments);
        setGlobalDesignations(desigRes.designations);
      })
      .catch(() => {
        setGlobalStaff([]);
        setGlobalDepartments([]);
        setGlobalDesignations([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name;
  const deptName = (id: string) => departments.find((d) => d.id === id)?.name;
  const globalDeptName = (id: string | null) => (id ? globalDepartments.find((d) => d.id === id)?.name : undefined);
  const globalDesigName = (id: string | null) => (id ? globalDesignations.find((d) => d.id === id)?.name : undefined);

  const rows: CombinedStaffRow[] = [
    ...branchStaff
      .filter((s) => s.active)
      .map((s: BranchStaffMember): CombinedStaffRow => ({
        id: branchStaffRowId(s.id),
        source: "branch",
        name: staffDisplayName(s),
        designation: s.specialization ? `${s.role} · ${s.specialization}` : s.role,
        branchName: branchName(s.branchId),
        departmentName: deptName(s.departmentId),
        hue: s.hue,
      })),
    ...globalStaff
      .filter((s) => s.status !== "suspended")
      .map((s, i): CombinedStaffRow => {
        const a = assignments.assignmentFor(s.id);
        return {
          id: tenantStaffRowId(s.id),
          source: "tenant",
          name: s.name,
          designation: globalDesigName(a.designationId) ?? s.roleName ?? "Staff",
          departmentName: globalDeptName(a.departmentId),
          hue: [220, 280, 160, 40, 310, 180, 100, 250][i % 8],
        };
      }),
  ];

  return { rows, loading };
}
