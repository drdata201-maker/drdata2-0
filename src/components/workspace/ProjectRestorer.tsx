import { useEffect, useState, useRef } from "react";
import { useDataset } from "@/contexts/DatasetContext";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResultItem, InterpretationData, ChatState, CachedChart } from "@/contexts/DatasetContext";

interface ProjectRestorerProps {
  projectId: string | null;
  onRestored: (hasResults: boolean) => void;
}

export function ProjectRestorer({ projectId, onRestored }: ProjectRestorerProps) {
  const { restoreState, restoreDatasetSummary, analysisResults, chatState, setChatState, setCachedCharts } = useDataset();
  const [restored, setRestored] = useState(false);

  // Restore chat + analysis + dataset state on mount
  useEffect(() => {
    if (!projectId || restored || analysisResults.length > 0) return;
    setRestored(true);

    (async () => {
      try {
        // Fetch project data including dataset_summary and chat_state
        const { data: projectData } = await (supabase.from("projects") as any)
          .select("chat_state, dataset_summary")
          .eq("id", projectId)
          .maybeSingle();

        if (projectData?.chat_state) {
          const saved = typeof projectData.chat_state === "string"
            ? JSON.parse(projectData.chat_state)
            : projectData.chat_state;
          if (saved.messages && saved.messages.length > 0) {
            setChatState({
              messages: saved.messages || [],
              phase: saved.phase || "confirm",
              chatHistory: saved.chatHistory || [],
              greetingSent: saved.greetingSent ?? true,
              selectedSoftware: saved.selectedSoftware || "",
              selectedAnalyses: saved.selectedAnalyses || [],
              analyticalGraphMode: saved.analyticalGraphMode || "standard",
              file: saved.file || null,
            });
          }
        }

        // Restore dataset summary if available
        if (projectData?.dataset_summary) {
          const ds = typeof projectData.dataset_summary === "string"
            ? JSON.parse(projectData.dataset_summary)
            : projectData.dataset_summary;
          if (ds.fileName && ds.variables) {
            restoreDatasetSummary({
              ...ds,
              rawData: ds.rawData || [],
            });
          }
        }

        // Fetch analysis results
        const { data } = await (supabase.from("analyses") as any)
          .select("results")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.results) {
          const saved = typeof data.results === "string" ? JSON.parse(data.results) : data.results;
          const results: AnalysisResultItem[] = saved.analysisResults || [];
          const interpretation: InterpretationData | null = saved.interpretationData || null;
          const charts: CachedChart[] | null = saved.cachedCharts || null;

          if (results.length > 0) {
            restoreState(results, interpretation);
            if (charts && charts.length > 0) {
              setCachedCharts(charts);
            }
            onRestored(true);
            return;
          }
        }
        onRestored(false);
      } catch (e) {
        console.error("Failed to restore project state:", e);
        onRestored(false);
      }
    })();
  }, [projectId, restored, restoreState, restoreDatasetSummary, onRestored, analysisResults.length, setChatState, setCachedCharts]);

  // Auto-save chat state to DB with debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!projectId || !chatState.greetingSent) return;

    const toSave: ChatState = {
      ...chatState,
      messages: chatState.messages.map(m => ({ role: m.role, content: m.content })),
    };
    const serialized = JSON.stringify(toSave);
    if (serialized === lastSavedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await (supabase.from("projects") as any)
          .update({ chat_state: toSave })
          .eq("id", projectId);
        lastSavedRef.current = serialized;
      } catch (e) {
        console.error("Failed to save chat state:", e);
      }
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [projectId, chatState]);

  return null;
}
