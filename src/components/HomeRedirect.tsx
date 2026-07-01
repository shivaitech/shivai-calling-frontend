import { Navigate } from "react-router-dom";
import { getHomeRoute } from "../utils/homeRoute";

/** Sends authenticated users to the dashboard (or last in-app page). Marketplace apps are not auto-opened. */
const HomeRedirect = () => <Navigate to={getHomeRoute()} replace />;

export default HomeRedirect;
