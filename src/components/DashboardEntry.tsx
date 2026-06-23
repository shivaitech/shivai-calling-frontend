import { Navigate } from "react-router-dom";
import Overview from "../ClientDashboard/Dashboard/Overview";
import { readInstalledAppIds } from "../marketplace/useInstalledApps";
import { APPOINTMENT_CALENDAR_ROUTE } from "../utils/homeRoute";

/** Shows main dashboard, or calendar when Appointment CRM is installed. */
const DashboardEntry = () => {
  if (readInstalledAppIds().includes("appointment-crm")) {
    return <Navigate to={APPOINTMENT_CALENDAR_ROUTE} replace />;
  }
  return <Overview />;
};

export default DashboardEntry;
