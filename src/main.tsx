import { createRoot } from "react-dom/client";
import { LanguageProvider } from "./contexts/LanguageContext";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
