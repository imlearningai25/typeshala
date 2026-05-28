import { Outlet, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Navbar } from "./Navbar";
import { Keyboard } from "lucide-react";

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
              <Keyboard className="size-4" />
              Typeshala
            </Link>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} Typeshala. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <Link to="/terms"   className="hover:text-brand-500 transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-brand-500 transition-colors">Privacy Policy</Link>
              <a href="mailto:typeshala@aipioneerlab.com" className="hover:text-brand-500 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "dark:bg-gray-800 dark:text-gray-100",
          duration: 4000,
        }}
      />
    </div>
  );
}
