/**
 * Fetch and cache the authenticated user's profile.
 * Automatically populates the auth store when data arrives.
 */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

export const CURRENT_USER_QUERY_KEY = ["currentUser"] as const;

export function useCurrentUser() {
  const { isAuthenticated, setUser } = useAuthStore();

  const query = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => authService.getMe(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,  // 5 minutes
    retry: 1,
  });

  // Sync fetched user into the auth store
  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}
