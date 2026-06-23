import { Navigate } from "react-router-dom";
import { getHomeRoute } from "../utils/homeRoute";

/** Sends authenticated users to calendar (or last workspace), not the main dashboard. */
const HomeRedirect = () => <Navigate to={getHomeRoute()} replace />;

export default HomeRedirect;
