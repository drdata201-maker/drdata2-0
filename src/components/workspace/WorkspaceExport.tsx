import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Table2, MessageSquare, BookOpen, Download, Loader2, Upload } from "lucide-react";
import { exportDocx, exportPdf, exportXlsx, type ExportData } from "@/lib/exportUtils";

interface WorkspaceExportProps {
  projectTitle: string;
  projectType: string;
  projectDomain: string;
  projectDescription: string;
  level: string;
}

type ContentType = "full" | "results" | "interpretation" | "conclusion";
type FormatType = "docx" | "pdf" | "xlsx";

export function WorkspaceExport({ projectTitle, projectType, projectDomain, projectDescription, level }: WorkspaceExportProps) {
  const { t, lang } = useLanguage();
  const { dataset, analysisResults } = useDataset();
  const [loading, setLoading] = useState<string | null>(null);

  const buildData = (): ExportData => {
    // Build stats table from real analysis results
    const statsTable: ExportData["statsTable"] = [];
    const testResults: ExportData["testResults"] = [];
    let interpretation = "";
    let conclusion = "";
    let recommendations = "";

    for (const result of analysisResults) {
      if (result.descriptive) {
        for (const d of result.descriptive) {
          statsTable.push({ variable: d.variable, n: d.n, mean: d.mean, std: d.std, min: d.min, max: d.max });
        }
      }
      if (result.correlations) {
        for (const c of result.correlations) {
          testResults.push({ label: `r(${c.var1}, ${c.var2})`, value: String(c.r) });
          testResults.push({ label: `p-value (${c.var1}, ${c.var2})`, value: String(c.pValue) });
        }
      }
      if (result.regressions) {
        for (const reg of result.regressions) {
          testResults.push({ label: `R² (${reg.dependent})`, value: String(reg.rSquared) });
          testResults.push({ label: `Adj. R² (${reg.dependent})`, value: String(reg.adjustedR2) });
          testResults.push({ label: `F (${reg.dependent})`, value: String(reg.fStat) });
        }
      }
      if (result.tTests) {
        for (const tt of result.tTests) {
          testResults.push({ label: `t(${tt.df})`, value: String(tt.tStat) });
          testResults.push({ label: `p-value (${tt.variable})`, value: String(tt.pValue) });
        }
      }
      if (result.anovas) {
        for (const a of result.anovas) {
          testResults.push({ label: `F(${a.dfBetween},${a.dfWithin})`, value: String(a.fStat) });
          testResults.push({ label: `p-value (${a.dependent})`, value: String(a.pValue) });
        }
      }
      if (result.chiSquares) {
        for (const c of result.chiSquares) {
          testResults.push({ label: `χ² (${c.var1}×${c.var2})`, value: String(c.chiSquare) });
          testResults.push({ label: `p-value (${c.var1}×${c.var2})`, value: String(c.pValue) });
          testResults.push({ label: `Cramér's V`, value: String(c.cramersV) });
        }
      }
    }

    // Fallback texts
    if (statsTable.length === 0) {
      interpretation = t("export.sampleInterpretation");
      conclusion = t("export.sampleConclusion");
      recommendations = t("export.sampleRecommendations");
    }

    return {
      projectTitle: projectTitle || "Untitled Project",
      projectType,
      projectDomain,
      projectDescription,
      level,
      lang,
      statsTable,
      testResults,
      interpretation: interpretation || t("export.sampleInterpretation"),
      conclusion: conclusion || t("export.sampleConclusion"),
      recommendations: recommendations || t("export.sampleRecommendations"),
    };
  };

  const handleExport = async (content: ContentType, format: FormatType) => {
    const key = `${content}-${format}`;
    setLoading(key);
    try {
      const data = buildData();
      if (format === "docx") await exportDocx(data, content);
      else if (format === "pdf") exportPdf(data, content);
      else exportXlsx(data, content);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setLoading(null);
    }
  };

  if (!dataset || analysisResults.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Upload className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("export.noData") || "Run analyses first to export results."}</p>
        </CardContent>
      </Card>
    );
  }

  const exportOptions: { content: ContentType; icon: typeof FileText; labelKey: string }[] = [
    { content: "full", icon: FileText, labelKey: "export.fullReport" },
    { content: "results", icon: Table2, labelKey: "export.resultsOnly" },
    { content: "interpretation", icon: MessageSquare, labelKey: "export.interpretationOnly" },
    { content: "conclusion", icon: BookOpen, labelKey: "export.conclusionOnly" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {t("workspace.exportResults")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{projectTitle || "—"}</Badge>
            <Badge variant="outline">{projectType || "—"}</Badge>
            <Badge variant="outline">{projectDomain || "—"}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {analysisResults.length} {t("dashboard.stats.analyses").toLowerCase()} · {dataset.observations} obs
          </p>
        </CardContent>
      </Card>

      {exportOptions.map(({ content, icon: Icon, labelKey }) => (
        <Card key={content}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-4 w-4 text-primary" />
              {t(labelKey)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(["docx", "pdf", "xlsx"] as FormatType[]).map(format => {
                const key = `${content}-${format}`;
                const isLoading = loading === key;
                return (
                  <Button
                    key={format}
                    variant="outline"
                    size="sm"
                    disabled={!!loading}
                    onClick={() => handleExport(content, format)}
                    className="min-w-[100px]"
                  >
                    {isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    {format === "docx" ? "Word (.docx)" : format === "pdf" ? "PDF (.pdf)" : "Excel (.xlsx)"}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
