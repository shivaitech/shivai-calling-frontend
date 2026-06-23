import { useEffect } from "react";
import CalendarView from "./CalendarView";
import { readBranches, useActiveBranch } from "./branchesStore";
import { getStaffById } from "./staffStore";
import { useEnsureOrgSeeded } from "./orgSeed";

interface Props {
  staffId: string;
}

/** Doctor personal calendar — single staff column with live clinic data. */
const DoctorLiveCalendar = ({ staffId }: Props) => {
  const branches = readBranches();
  useEnsureOrgSeeded(branches);
  const { setActiveBranch } = useActiveBranch();
  const staff = getStaffById(staffId);

  useEffect(() => {
    if (staff?.branchId) setActiveBranch(staff.branchId);
  }, [staff?.branchId, setActiveBranch]);

  if (!staff) return null;

  return <CalendarView lockedStaffId={staffId} readOnly />;
};

export default DoctorLiveCalendar;
