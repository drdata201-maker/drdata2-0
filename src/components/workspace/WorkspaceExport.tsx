import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Table2, BarChart3, MessageSquare, BookOpen, Download, Loader2 } from "lucide-react";
import { exportDocx, exportPdf, exportXlsx, type ExportData } from "@/lib/exportUtils";

interface WorkspaceExportProps {
  projectTitle: string;
  projectType: string;
  projectDomain: string;
  projectDescription: string;
  level: string;
}

const mockStats = [
  { variable: "Age", n: 150, mean: 28.4, std: 5.2, min: 18, max: 45 },
  { variable: "Score", n: 150, mean: 72.1, std: 12.8, min: 35, max: 98 },
  { variable: "Revenue", n: 150, mean: 45200, std: 15800, min: 12000, max: 95000 },
];

const mockTestResults = [
  { label: "p-value", value: "0.003" },
  { label: "t-statistic", value: "3.12" },
  { label: "R²", value: "0.78" },
  { label: "Coefficient", value: "0.45" },
];

type ContentType = "full" | "results" | "graphs" | "interpretation" | "conclusion";
type FormatType = "docx" | "pdf" | "xlsx";

export function WorkspaceExport({ projectTitle, projectType, projectDomain, projectDescription, level }: WorkspaceExportProps) {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);

  const buildData = (): ExportData => ({
    projectTitle: projectTitle || "Untitled Project",
    projectType,
    projectDomain,
    projectDescription,
    level,
    lang,
    statsTable: mockStats,
    testResults: mockTestResults,
    interpretation: t("export.sampleInterpretation"),
    conclusion: t("export.sampleConclusion"),
    recommendations: t("export.sampleRecommendations"),
  });

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
