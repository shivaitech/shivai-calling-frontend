import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { getDoctorPWAStaffId, getStaffCalendarPath } from "../utils/doctorPWA";
import { getShareByToken } from "../ClientDashboard/apps/AppointmentCRM/doctorCalendarShareStore";

/** PWA start_url — restores the staff personal calendar. */
export default function DoctorCalendarPWALauncher() {
  const staffId = getDoctorPWAStaffId();

  useEffect(() => {
    document.title = "My Appointment Calendar";
  }, [staffId]);

  if (staffId) {
    return <Navigate to={getStaffCalendarPath(staffId)} replace />;
  }

  // Legacy: old installs may only have a share token saved
  const legacyToken = localStorage.getItem("shivai_doctor_pwa_token");
  if (legacyToken) {
    const share = getShareByToken(legacyToken);
    if (share?.staffId) {
      return <Navigate to={getStaffCalendarPath(share.staffId)} replace />;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-violet-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-6 h-6 text-violet-600" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Doctor calendar app</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Open the personal calendar link from your clinic invite, sign in once, then install this app from
          your browser menu.
        </p>
      </div>
    </div>
  );
}
