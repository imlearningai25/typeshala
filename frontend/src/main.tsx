import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initSentry } from "./lib/sentry";

// Initialise Sentry before anything renders (no-op if DSN is missing)
initSentry();

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found in the DOM");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
