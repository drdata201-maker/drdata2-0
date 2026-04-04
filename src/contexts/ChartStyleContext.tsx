import { createContext, useContext, useState, ReactNode } from "react";

export interface ChartPalette {
  id: string;
  name: string;
  colors: string[];
}

export const CHART_PALETTES: ChartPalette[] = [
  { id: "default", name: "Dr Data", colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"] },
  { id: "academic", name: "Academic", colors: ["#2563eb", "#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#1e40af", "#1e3a8a", "#dbeafe"] },
  { id: "nature", name: "Nature", colors: ["#059669", "#0d9488", "#65a30d", "#ca8a04", "#d97706", "#16a34a", "#84cc16", "#facc15"] },
  { id: "warm", name: "Warm", colors: ["#dc2626", "#ea580c", "#d97706", "#ca8a04", "#f43f5e", "#e11d48", "#f97316", "#fbbf24"] },
  { id: "cool", name: "Cool", colors: ["#7c3aed", "#2563eb", "#0891b2", "#0d9488", "#6366f1", "#8b5cf6", "#06b6d4", "#14b8a6"] },
  { id: "grayscale", name: "Grayscale", colors: ["#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb", "#f3f4f6"] },
  { id: "pastel", name: "Pastel", colors: ["#93c5fd", "#86efac", "#fde68a", "#fca5a5", "#c4b5fd", "#a5f3fc", "#fdba74", "#f9a8d4"] },
];

export type ChartStyle = "rounded" | "sharp" | "flat";

export interface ChartStyleSettings {
  palette: ChartPalette;
  style: ChartStyle;
  showGrid: boolean;
  showLabels: boolean;
}

interface ChartStyleContextType {
  settings: ChartStyleSettings;
  setPalette: (id: string) => void;
  setStyle: (style: ChartStyle) => void;
  setShowGrid: (v: boolean) => void;
  setShowLabels: (v: boolean) => void;
}

const defaultSettings: ChartStyleSettings = {
  palette: CHART_PALETTES[0],
  style: "rounded",
  showGrid: true,
  showLabels: true,
};

const ChartStyleContext = createContext<ChartStyleContextType | null>(null);

export function useChartStyle() {
  const ctx = useContext(ChartStyleContext);
  if (!ctx) throw new Error("useChartStyle must be used within ChartStyleProvider");
  return ctx;
}

export function ChartStyleProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChartStyleSettings>(defaultSettings);

  const setPalette = (id: string) => {
    const p = CHART_PALETTES.find(p => p.id === id) || CHART_PALETTES[0];
    setSettings(s => ({ ...s, palette: p }));
  };

  const setStyle = (style: ChartStyle) => setSettings(s => ({ ...s, style }));
  const setShowGrid = (showGrid: boolean) => setSettings(s => ({ ...s, showGrid }));
  const setShowLabels = (showLabels: boolean) => setSettings(s => ({ ...s, showLabels }));

  return (
    <ChartStyleContext.Provider value={{ settings, setPalette, setStyle, setShowGrid, setShowLabels }}>
      {children}
    </ChartStyleContext.Provider>
  );
}
