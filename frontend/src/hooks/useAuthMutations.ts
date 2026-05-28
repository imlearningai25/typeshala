/**
 * React Query mutations for login, register, and logout.
 * On success, they update the auth store and redirect via React Router.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { CURRENT_USER_QUERY_KEY } from "@/hooks/useCurrentUser";
import type { LoginCredentials, RegisterData } from "@/types";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.detail ?? fallback;
  }
  return fallback;
}

export function useLogin() {
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: ({ user, tokens }) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      setUser(user);
      qc.setQueryData(CURRENT_USER_QUERY_KEY, user);
      toast.success(`Welcome back, ${user.username}!`);
      navigate("/practice");
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Login failed. Check your credentials."));
    },
  });
}

export function useRegister() {
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: ({ user, tokens }) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      setUser(user);
      qc.setQueryData(CURRENT_USER_QUERY_KEY, user);
      toast.success("Account created! Welcome to Typeshala 🎉");
      navigate("/practice");
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Registration failed. Please try again."));
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      // Always clear local state, even if the server call fails
      logout();
      qc.clear();
      toast.success("Logged out successfully");
      navigate("/");
    },
  });
}
