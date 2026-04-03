import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import type { InterpretationData } from "@/contexts/DatasetContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Target, Lightbulb, Loader2, RefreshCw, AlertCircle } from "lucide-react";

// Types are now imported from DatasetContext

interface WorkspaceInterpretationProps {
  level: string;
  projectTitle?: string;
  projectType?: string;
  projectDomain?: string;
}

export function WorkspaceInterpretation({ level, projectTitle, projectType, projectDomain }: WorkspaceInterpretationProps) {
  const { t, lang: language } = useLanguage();
  const { analysisResults, interpretationData, setInterpretationData } = useDataset();
  const data = interpretationData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLevelLabel = () => {
    if (level.includes("master")) return t("interpretation.level.master");
    if (level.includes("doctor") || level.includes("doctorat")) return t("interpretation.level.doctorate");
    return t("interpretation.level.bachelor");
  };

  const generateInterpretation = useCallback(async () => {
    if (!analysisResults.length) return;
    setLoading(true);
    setError(null);

    try {
      const { data: respData, error: fnError } = await supabase.functions.invoke("joel-interpret", {
        body: {
          analysisResults,
          level,
          language,
          projectContext: { title: projectTitle, type: projectType, domain: projectDomain },
        },
      });

      if (fnError) throw fnError;
      if (respData?.error) throw new Error(respData.error);
      setInterpretationData(respData as InterpretationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Interpretation error");
    } finally {
      setLoading(false);
    }
  }, [analysisResults, level, language, projectTitle, projectType, projectDomain]);

  // Auto-generate when results are available
  useEffect(() => {
    if (analysisResults.length > 0 && !data && !loading) {
      generateInterpretation();
    }
  }, [analysisResults.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">{t("interpretation.levelLabel")}</span>
          <Badge variant="secondary">{getLevelLabel()}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={generateInterpretation} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("interpretation.regenerate") || "Regenerate"}
        </Button>
      </div>

      {/* Per-analysis interpretations */}
      {data.sections.map((section, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              {t("interpretation.title")} — {section.analysisType}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.interpretation}</p>
            {section.conclusion && (
              <div className="border-t border-border pt-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  {t("interpretation.conclusionTitle")}
                </h4>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.conclusion}</p>
              </div>
            )}
            {section.recommendations && (
              <div className="border-t border-border pt-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  {t("interpretation.recommendationsTitle")}
                </h4>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.recommendations}</p>
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
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.globalConclusion}</p>
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
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.globalRecommendations}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
