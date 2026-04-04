import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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

function serializeSettings(s: ChartStyleSettings) {
  return { paletteId: s.palette.id, style: s.style, showGrid: s.showGrid, showLabels: s.showLabels };
}

function deserializeSettings(raw: unknown): ChartStyleSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const palette = CHART_PALETTES.find(p => p.id === obj.paletteId) || CHART_PALETTES[0];
  return {
    palette,
    style: (["rounded", "sharp", "flat"].includes(obj.style as string) ? obj.style : "rounded") as ChartStyle,
    showGrid: typeof obj.showGrid === "boolean" ? obj.showGrid : true,
    showLabels: typeof obj.showLabels === "boolean" ? obj.showLabels : true,
  };
}

export function ChartStyleProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChartStyleSettings>(defaultSettings);
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load user and preferences
  useEffect(() => {
    const loadPrefs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("chart_preferences")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.chart_preferences) {
        const parsed = deserializeSettings(data.chart_preferences);
        if (parsed) setSettings(parsed);
      }
      setLoaded(true);
    };
    loadPrefs();
  }, []);

  // Save to DB (debounced)
  const saveToDb = useCallback(async (newSettings: ChartStyleSettings) => {
    if (!userId) return;
    const serialized = serializeSettings(newSettings);
    await supabase
      .from("profiles")
      .upsert(
        { user_id: userId, chart_preferences: serialized as unknown as Record<string, unknown> },
        { onConflict: "user_id" }
      );
  }, [userId]);

  const updateSettings = useCallback((updater: (s: ChartStyleSettings) => ChartStyleSettings) => {
    setSettings(prev => {
      const next = updater(prev);
      saveToDb(next);
      return next;
    });
  }, [saveToDb]);

  const setPalette = (id: string) => {
    const p = CHART_PALETTES.find(p => p.id === id) || CHART_PALETTES[0];
    updateSettings(s => ({ ...s, palette: p }));
  };
  const setStyle = (style: ChartStyle) => updateSettings(s => ({ ...s, style }));
  const setShowGrid = (showGrid: boolean) => updateSettings(s => ({ ...s, showGrid }));
  const setShowLabels = (showLabels: boolean) => updateSettings(s => ({ ...s, showLabels }));

  if (!loaded) return null;

  return (
    <ChartStyleContext.Provider value={{ settings, setPalette, setStyle, setShowGrid, setShowLabels }}>
      {children}
    </ChartStyleContext.Provider>
  );
}
