import { useEffect } from "react";
import CalendarView from "./CalendarView";
import { useActiveBranch } from "./branchesStore";
import { getStaffById } from "./staffStore";

interface Props {
  staffId: string;
}

/** Doctor personal calendar — single staff column with live clinic data,
 * hydrated by staffCalendarLoader before this component ever mounts. */
const DoctorLiveCalendar = ({ staffId }: Props) => {
  const { setActiveBranch } = useActiveBranch();
  const staff = getStaffById(staffId);

  useEffect(() => {
    if (staff?.branchId) setActiveBranch(staff.branchId);
  }, [staff?.branchId, setActiveBranch]);

  if (!staff) return null;

  return <CalendarView lockedStaffId={staffId} readOnly />;
};

export default DoctorLiveCalendar;
