/**
 * Convenience hook wrapping the auth store — re-exported so components
 * don't import the store directly (easier to swap implementation later).
 */
import { useAuthStore } from "@/stores/auth.store";

export const useAuth = useAuthStore;
