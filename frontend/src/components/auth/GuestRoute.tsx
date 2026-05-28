/**
 * Guest-only route — redirects authenticated users away from login/register.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export function GuestRoute() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    // Redirect to the page they came from, or /practice as default
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/practice";
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
