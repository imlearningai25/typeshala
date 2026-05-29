import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    allowedHosts: ["typeshala.aipioneerlab.com"],
    proxy: {
      "/api": {
        target: "http://localhost:5102",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          motion: ["framer-motion"],
          charts: ["recharts"],
        },
      },
    },
  },
});
