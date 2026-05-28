import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
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
