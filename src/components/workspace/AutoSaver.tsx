import { useEffect, useRef } from "react";
import { useDataset } from "@/contexts/DatasetContext";
import { supabase } from "@/integrations/supabase/client";

interface AutoSaverProps {
  projectId: string | null;
}

/**
 * Automatically saves analysis results, dataset summary, interpretation,
 * and updates project status as the user progresses through the workflow.
 */
export function AutoSaver({ projectId }: AutoSaverProps) {
  const { dataset, analysisResults, interpretationData, cachedCharts } = useDataset();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedResultsRef = useRef<string>("");
  const lastSavedDatasetRef = useRef<string>("");

  // Auto-save dataset summary when dataset changes
  useEffect(() => {
    if (!projectId || !dataset) return;

    // Save a lightweight summary (no rawData to avoid large payloads)
    const summary = {
      fileName: dataset.fileName,
      fileSize: dataset.fileSize,
      fileType: dataset.fileType,
      observations: dataset.observations,
      variables: dataset.variables,
      duplicateRows: dataset.duplicateRows,
      totalMissing: dataset.totalMissing,
      totalMissingPct: dataset.totalMissingPct,
    };
    const serialized = JSON.stringify(summary);
    if (serialized === lastSavedDatasetRef.current) return;

    const save = async () => {
      try {
        await (supabase.from("projects") as any)
          .update({
            dataset_summary: summary,
            status: "data_uploaded",
          })
          .eq("id", projectId);
        lastSavedDatasetRef.current = serialized;
      } catch (e) {
        console.error("Failed to save dataset summary:", e);
      }
    };
    save();
  }, [projectId, dataset]);

  // Auto-save analysis results + interpretation with debounce
  useEffect(() => {
    if (!projectId || analysisResults.length === 0) return;

    const payload = {
      analysisResults,
      interpretationData,
      cachedCharts: cachedCharts || [],
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedResultsRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Upsert analysis record
        const { data: existing } = await (supabase.from("analyses") as any)
          .select("id")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          await (supabase.from("analyses") as any)
            .update({ results: payload, status: "completed" })
            .eq("id", existing.id);
        } else {
          await supabase.from("analyses").insert({
            project_id: projectId,
            user_id: user.id,
            title: "Auto-saved Analysis",
            type: analysisResults.map(r => r.type).join(", "),
            user_type: "student",
            results: payload as any,
            status: "completed",
          });
        }

        // Update project status
        await (supabase.from("projects") as any)
          .update({ status: interpretationData ? "completed" : "analysis_running" })
          .eq("id", projectId);

        lastSavedResultsRef.current = serialized;
      } catch (e) {
        console.error("Failed to auto-save results:", e);
      }
    }, 3000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [projectId, analysisResults, interpretationData, cachedCharts]);

  return null;
}
