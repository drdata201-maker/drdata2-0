import { createRoot } from "react-dom/client";
import { LanguageProvider } from "./contexts/LanguageContext";
import App from "./App";
import "./index.css";

// Apply saved theme on load
const savedTheme = localStorage.getItem("dr-data-theme") || "light";
document.documentElement.classList.add(`theme-${savedTheme}`);

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
