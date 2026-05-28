import { Link, NavLink } from "react-router-dom";
import { Moon, Sun, Keyboard, Trophy, BarChart2, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import { useLogout } from "@/hooks/useAuthMutations";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const NAV_LINKS = [
  { to: "/lessons", label: "Lessons", icon: Keyboard },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/dashboard", label: "Dashboard", icon: BarChart2 },
];

export function Navbar() {
  const { isAuthenticated } = useAuthStore();
  const { resolvedTheme, setTheme } = useThemeStore();
  const logoutMutation = useLogout();
  const { data: user } = useCurrentUser();

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-400"
        >
          <Keyboard className="size-6" />
          <span className="hidden sm:block">Typeshala</span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-gray-700 dark:text-gray-300">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="size-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                      {user.username[0].toUpperCase()}
                    </span>
                  )}
                  <span className="hidden sm:block font-medium">{user.username}</span>
                  <span className="hidden sm:block text-xs text-brand-500">
                    Lv.{user.level}
                  </span>
                </div>
              )}
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                aria-label="Log out"
                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 disabled:opacity-50"
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
