import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import type { InterpretationData, InterpretationSection } from "@/contexts/DatasetContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, GraduationCap, Target, Lightbulb, Loader2, RefreshCw, AlertCircle, Pencil, Check, X, Copy } from "lucide-react";
import { toast } from "sonner";

interface WorkspaceInterpretationProps {
  level: string;
  projectTitle?: string;
  projectType?: string;
  projectDomain?: string;
}

type EditingField = { section: number; field: "interpretation" | "conclusion" | "recommendations" } | "globalConclusion" | "globalRecommendations" | null;

export function WorkspaceInterpretation({ level, projectTitle, projectType, projectDomain }: WorkspaceInterpretationProps) {
  const { t, lang: language } = useLanguage();
  const { analysisResults, interpretationData, setInterpretationData } = useDataset();
  const data = interpretationData;
  const [loading, setLoading] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState("");

  const getLevelLabel = () => {
    if (level.includes("master")) return t("interpretation.level.master");
    if (level.includes("doctor") || level.includes("doctorat")) return t("interpretation.level.doctorate");
    return t("interpretation.level.bachelor");
  };

  const callInterpret = async (results: typeof analysisResults) => {
    const { data: respData, error: fnError } = await supabase.functions.invoke("joel-interpret", {
      body: {
        analysisResults: results,
        level,
        language,
        projectContext: { title: projectTitle, type: projectType, domain: projectDomain },
      },
    });
    if (fnError) throw fnError;
    if (respData?.error) throw new Error(respData.error);
    return respData as InterpretationData;
  };

  const generateInterpretation = useCallback(async () => {
    if (!analysisResults.length) return;
    setLoading(true);
    setError(null);

    try {
      const respData = await callInterpret(analysisResults);
      setInterpretationData(respData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Interpretation error");
    } finally {
      setLoading(false);
    }
  }, [analysisResults, level, language, projectTitle, projectType, projectDomain]);

  const regenerateSection = useCallback(async (sectionIndex: number) => {
    if (!data || !analysisResults[sectionIndex]) return;
    setRegeneratingSection(sectionIndex);

    try {
      const singleResult = [analysisResults[sectionIndex]];
      const respData = await callInterpret(singleResult);
      if (respData.sections?.[0]) {
        const updated = { ...data, sections: data.sections.map((s, i) => i === sectionIndex ? respData.sections[0] : s) };
        setInterpretationData(updated);
      }
    } catch (err) {
      console.error("Regenerate section error:", err);
    } finally {
      setRegeneratingSection(null);
    }
  }, [data, analysisResults, level, language, projectTitle, projectType, projectDomain]);

  useEffect(() => {
    if (analysisResults.length > 0 && !data && !loading) {
      generateInterpretation();
    }
  }, [analysisResults.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (field: EditingField, currentValue: string) => {
    setEditing(field);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (!data || !editing) return;
    const updated = { ...data, sections: data.sections.map(s => ({ ...s })) };

    if (typeof editing === "string") {
      if (editing === "globalConclusion") updated.globalConclusion = editValue;
      else updated.globalRecommendations = editValue;
    } else {
      const s = updated.sections[editing.section];
      if (editing.field === "interpretation") s.interpretation = editValue;
      else if (editing.field === "conclusion") s.conclusion = editValue;
      else s.recommendations = editValue;
    }

    setInterpretationData(updated);
    setEditing(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const isEditing = (field: EditingField) => {
    if (!editing || !field) return false;
    if (typeof editing === "string" && typeof field === "string") return editing === field;
    if (typeof editing === "object" && typeof field === "object" && editing && field) {
      return editing.section === field.section && editing.field === field.field;
    }
    return false;
  };

  const EditableBlock = ({ value, field, className = "" }: { value: string; field: EditingField; className?: string }) => {
    if (isEditing(field)) {
      return (
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className="min-h-[120px] text-sm leading-relaxed resize-y"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={saveEdit}>
              <Check className="mr-1 h-3 w-3" />
              {t("interpretation.save") || "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="mr-1 h-3 w-3" />
              {t("interpretation.cancel") || "Cancel"}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="group relative">
        <p className={`text-sm leading-relaxed text-foreground whitespace-pre-line ${className}`}>{value}</p>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => startEdit(field, value)}
          title={t("interpretation.edit") || "Edit"}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  if (!analysisResults.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <BookOpen className="h-10 w-10" />
        <p className="text-sm">{t("interpretation.noResults") || "Run analyses first to generate interpretations."}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("interpretation.generating") || "Generating academic interpretation..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={generateInterpretation}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("interpretation.retry") || "Retry"}
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Level indicator */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">{t("interpretation.levelLabel")}</span>
          <Badge variant="secondary">{getLevelLabel()}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            <Pencil className="mr-1 h-3 w-3" />
            {t("interpretation.editable") || "Editable"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={generateInterpretation} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("interpretation.regenerate") || "Regenerate"}
          </Button>
        </div>
      </div>

      {/* Per-analysis interpretations */}
      {data.sections.map((section, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" />
                {t("interpretation.title")} — {section.analysisType}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                disabled={regeneratingSection !== null || loading}
                onClick={() => regenerateSection(i)}
              >
                {regeneratingSection === i ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-3 w-3" />
                )}
                {t("interpretation.regenerateSection") || "Regenerate"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <EditableBlock value={section.interpretation} field={{ section: i, field: "interpretation" }} />
            {section.conclusion && (
              <div className="border-t border-border pt-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  {t("interpretation.conclusionTitle")}
                </h4>
                <EditableBlock value={section.conclusion} field={{ section: i, field: "conclusion" }} />
              </div>
            )}
            {section.recommendations && (
              <div className="border-t border-border pt-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  {t("interpretation.recommendationsTitle")}
                </h4>
                <EditableBlock value={section.recommendations} field={{ section: i, field: "recommendations" }} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Global conclusion */}
      {data.globalConclusion && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              {t("interpretation.globalConclusion") || "Overall Conclusion"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableBlock value={data.globalConclusion} field="globalConclusion" />
          </CardContent>
        </Card>
      )}

      {/* Global recommendations */}
      {data.globalRecommendations && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" />
              {t("interpretation.globalRecommendations") || "Overall Recommendations"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableBlock value={data.globalRecommendations} field="globalRecommendations" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
