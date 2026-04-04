import { useEffect, useState } from "react";
import { useDataset } from "@/contexts/DatasetContext";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResultItem, InterpretationData } from "@/contexts/DatasetContext";

interface ProjectRestorerProps {
  projectId: string | null;
  onRestored: (hasResults: boolean) => void;
}

export function ProjectRestorer({ projectId, onRestored }: ProjectRestorerProps) {
  const { restoreState, analysisResults } = useDataset();
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (!projectId || restored || analysisResults.length > 0) return;
    setRestored(true);

    (async () => {
      try {
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

          if (results.length > 0) {
            restoreState(results, interpretation);
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
  }, [projectId, restored, restoreState, onRestored, analysisResults.length]);

  return null;
}
