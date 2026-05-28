import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestRoute } from "@/components/auth/GuestRoute";
import { Skeleton } from "@/components/ui/Skeleton";
import { useThemeStore } from "@/stores/theme.store";
import { Sentry } from "@/lib/sentry";

// ── Lazy-loaded pages ──────────────────────────────────────────────────────────
const HomePage = lazy(() =>
  import("@/features/home/HomePage").then((m) => ({ default: m.HomePage }))
);
const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("@/features/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const LessonsPage = lazy(() => import("@/features/lessons/LessonsPage"));
const PracticePage = lazy(() => import("@/features/practice/PracticePage"));
const LeaderboardPage = lazy(() => import("@/features/leaderboard/LeaderboardPage"));
const AdminPage = lazy(() => import("@/features/admin/AdminPage"));
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const RamayanaGame = lazy(() => import("@/features/game/RamayanaGame"));

// ── React Query ────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="space-y-4 py-12">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function ThemeInitializer() {
  const { theme, setTheme } = useThemeStore();
  useEffect(() => {
    // Re-apply theme on mount (handles server-side hydration edge cases)
    setTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Wrap with Sentry ErrorBoundary — falls back to a plain error UI on crash
const SentryErrorBoundary = Sentry.ErrorBoundary;

export default function App() {
  return (
    <SentryErrorBoundary fallback={<p className="p-8 text-red-500">Something went wrong. Please refresh the page.</p>}>
      <QueryClientProvider client={queryClient}>
        <ThemeInitializer />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              {/* Public routes */}
              <Route index element={<HomePage />} />

              {/* Guest-only (redirect if already logged in) */}
              <Route element={<GuestRoute />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>

              {/* Public routes */}
              <Route path="lessons" element={<LessonsPage />} />
              <Route path="practice/:lessonId" element={<PracticePage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />

              {/* Protected routes (require authentication) */}
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="admin" element={<AdminPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            {/* Full-screen game — outside Layout so it has its own header */}
            <Route path="game" element={<RamayanaGame />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SentryErrorBoundary>
  );
}
