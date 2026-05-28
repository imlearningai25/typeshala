/**
 * Route guard — redirects unauthenticated users to /login.
 * Preserves the intended destination in location state so after
 * login they're redirected back automatically.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface ProtectedRouteProps {
  /** Require a specific role. Defaults to any authenticated user. */
  requiredRole?: "admin" | "moderator";
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { isLoading } = useCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4 py-12">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
