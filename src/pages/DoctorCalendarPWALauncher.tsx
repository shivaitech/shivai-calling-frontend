import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import {
  getDoctorCalendarPath,
  getDoctorPWAToken,
} from "../utils/doctorPWA";

/** PWA start_url — restores the doctor's personal calendar (not the main app). */
export default function DoctorCalendarPWALauncher() {
  const token = getDoctorPWAToken();

  useEffect(() => {
    document.title = "My Appointment Calendar";
  }, [token]);

  if (token) {
    return <Navigate to={getDoctorCalendarPath(token)} replace />;
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
