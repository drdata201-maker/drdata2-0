import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import { useChartStyle } from "@/contexts/ChartStyleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Table2, MessageSquare, BookOpen, Download, Loader2, Upload, Eye } from "lucide-react";
import { exportDocx, exportPdf, exportXlsx, type ExportData } from "@/lib/exportUtils";
import { buildChartData, type ChartItem } from "@/lib/chartDataBuilder";
import { renderChartsToImages } from "@/lib/chartImageRenderer";
import {
  BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface WorkspaceExportProps {
  projectTitle: string;
  projectType: string;
  projectDomain: string;
  projectDescription: string;
  level: string;
}

type ContentType = "full" | "results" | "interpretation" | "conclusion";
type FormatType = "docx" | "pdf" | "xlsx";

const levelLabels: Record<string, Record<string, string>> = {
  fr: { student_license: "Licence", student_master: "Master", student_doctorat: "Doctorat" },
  en: { student_license: "Bachelor", student_master: "Master", student_doctorat: "Doctorate" },
  es: { student_license: "Licenciatura", student_master: "Máster", student_doctorat: "Doctorado" },
  de: { student_license: "Bachelor", student_master: "Master", student_doctorat: "Doktorat" },
  pt: { student_license: "Licenciatura", student_master: "Mestrado", student_doctorat: "Doutorado" },
};

function MiniChart({ chart, colors, barRadius, showGrid, showLabels }: { chart: ChartItem; colors: string[]; barRadius: [number,number,number,number]; showGrid: boolean; showLabels: boolean }) {
  const data = chart.data;
  return (
    <div className="w-full">
      <p className="text-xs font-medium text-muted-foreground mb-1 truncate">{chart.title}</p>
      <ResponsiveContainer width="100%" height={180}>
        {chart.type === "pie" ? (
          <PieChart>
            <Pie data={data as { name: string; value: number }[]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}
              label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}>
              {(data as { name: string }[]).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : chart.type === "scatter" ? (
          <ScatterChart>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
            <XAxis dataKey="x" type="number" tick={{ fontSize: 9 }} />
            <YAxis dataKey="y" type="number" tick={{ fontSize: 9 }} />
            <Tooltip />
            <Scatter data={data as { x: number; y: number }[]} fill={colors[0]} />
          </ScatterChart>
        ) : (
          <BarChart data={data as { name: string; value: number }[]}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
            <XAxis dataKey="name" tick={showLabels ? { fontSize: 9 } : false} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="value" fill={colors[0]} radius={barRadius} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function WorkspaceExport({ projectTitle, projectType, projectDomain, projectDescription, level }: WorkspaceExportProps) {
  const { t, lang } = useLanguage();
  const { dataset, analysisResults, interpretationData } = useDataset();
  const { settings: chartSettings } = useChartStyle();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<ContentType | null>(null);

  const chartColors = chartSettings.palette.colors;
  const barRadius: [number, number, number, number] = chartSettings.style === "rounded" ? [3, 3, 0, 0] : chartSettings.style === "sharp" ? [1, 1, 0, 0] : [0, 0, 0, 0];

  const charts = useMemo((): ChartItem[] => {
    if (!dataset) return [];
    return buildChartData(dataset.rawData, dataset.variables, analysisResults, t);
  }, [dataset, analysisResults, t]);

  const buildData = useMemo((): ExportData | null => {
    if (!dataset || analysisResults.length === 0) return null;

    const statsTable: ExportData["statsTable"] = [];
    const testResults: ExportData["testResults"] = [];

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

    let interpretation = "";
    let conclusion = "";
    let recommendations = "";

    if (interpretationData) {
      interpretation = interpretationData.sections
        .map(s => `${s.analysisType}\n\n${s.interpretation}`)
        .join("\n\n---\n\n");
      const sectionConclusions = interpretationData.sections.filter(s => s.conclusion).map(s => s.conclusion);
      if (interpretationData.globalConclusion) sectionConclusions.push(interpretationData.globalConclusion);
      conclusion = sectionConclusions.join("\n\n");
      const sectionRecs = interpretationData.sections.filter(s => s.recommendations).map(s => s.recommendations);
      if (interpretationData.globalRecommendations) sectionRecs.push(interpretationData.globalRecommendations);
      recommendations = sectionRecs.join("\n\n");
    }

    if (!interpretation) interpretation = t("export.sampleInterpretation");
    if (!conclusion) conclusion = t("export.sampleConclusion");
    if (!recommendations) recommendations = t("export.sampleRecommendations");

    return {
      projectTitle: projectTitle || "Untitled Project",
      projectType, projectDomain, projectDescription, level, lang,
      statsTable, testResults, interpretation, conclusion, recommendations,
    };
  }, [dataset, analysisResults, interpretationData, projectTitle, projectType, projectDomain, projectDescription, level, lang, t]);

  const handleExport = async (content: ContentType, format: FormatType) => {
    const key = `${content}-${format}`;
    setLoading(key);
    try {
      const data = { ...buildData! };
      // Generate chart images for Word/PDF
      if (format !== "xlsx" && charts.length > 0) {
        data.chartImages = renderChartsToImages(charts);
      }
      if (format === "docx") await exportDocx(data, content);
      else if (format === "pdf") exportPdf(data, content);
      else exportXlsx(data, content);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setLoading(null);
    }
  };

  if (!dataset || analysisResults.length === 0 || !buildData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Upload className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("export.noData") || "Run analyses first to export results."}</p>
        </CardContent>
      </Card>
    );
  }

  const data = buildData;
  const lvl = (levelLabels[lang] || levelLabels.en)[level] || level;

  const exportOptions: { content: ContentType; icon: typeof FileText; labelKey: string }[] = [
    { content: "full", icon: FileText, labelKey: "export.fullReport" },
    { content: "results", icon: Table2, labelKey: "export.resultsOnly" },
    { content: "interpretation", icon: MessageSquare, labelKey: "export.interpretationOnly" },
    { content: "conclusion", icon: BookOpen, labelKey: "export.conclusionOnly" },
  ];

  const showProjectInfo = (ct: ContentType) => ct === "full" || ct === "results";
  const showStats = (ct: ContentType) => ct === "full" || ct === "results";
  const showCharts = (ct: ContentType) => ct === "full" || ct === "results";
  const showInterp = (ct: ContentType) => ct === "full" || ct === "interpretation";
  const showConc = (ct: ContentType) => ct === "full" || ct === "conclusion";

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
            {analysisResults.length} {t("dashboard.stats.analyses").toLowerCase()} · {dataset.observations} obs · {charts.length} {t("workspace.graphs").toLowerCase()}
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
              <Button variant="secondary" size="sm" onClick={() => setPreviewContent(content)} className="min-w-[100px]">
                <Eye className="mr-1 h-3 w-3" />
                {t("export.preview") || "Preview"}
              </Button>
              {(["docx", "pdf", "xlsx"] as FormatType[]).map(format => {
                const key = `${content}-${format}`;
                const isLoading = loading === key;
                return (
                  <Button key={format} variant="outline" size="sm" disabled={!!loading} onClick={() => handleExport(content, format)} className="min-w-[100px]">
                    {isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    {format === "docx" ? "Word (.docx)" : format === "pdf" ? "PDF (.pdf)" : "Excel (.xlsx)"}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Preview Dialog */}
      <Dialog open={!!previewContent} onOpenChange={open => !open && setPreviewContent(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {t("export.previewTitle") || "Report Preview"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 pb-6">
            {previewContent && (
              <div className="space-y-6 py-2">
                {/* Title block */}
                <div className="text-center space-y-1 pb-4 border-b border-border">
                  <h1 className="text-xl font-bold text-foreground">{data.projectTitle}</h1>
                  <p className="text-xs text-muted-foreground italic">
                    {t("export.generatedBy") || "Generated by Dr Data 2.0 — Assistant Joël"}
                  </p>
                </div>

                {/* Project info */}
                {showProjectInfo(previewContent) && (
                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">{t("export.projectInfo") || "Project Information"}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div><span className="font-medium text-foreground">{t("export.projectTitle") || "Title"}:</span> <span className="text-muted-foreground">{data.projectTitle}</span></div>
                      <div><span className="font-medium text-foreground">{t("export.level") || "Level"}:</span> <span className="text-muted-foreground">{lvl}</span></div>
                      <div><span className="font-medium text-foreground">{t("export.type") || "Type"}:</span> <span className="text-muted-foreground">{data.projectType || "—"}</span></div>
                      <div><span className="font-medium text-foreground">{t("export.domain") || "Domain"}:</span> <span className="text-muted-foreground">{data.projectDomain || "—"}</span></div>
                    </div>
                    {data.projectDescription && <p className="text-sm text-muted-foreground">{data.projectDescription}</p>}
                  </section>
                )}

                {/* Stats tables */}
                {showStats(previewContent) && data.statsTable.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground">{t("export.descriptiveStats") || "Descriptive Statistics"}</h2>
                    <div className="rounded-md border border-border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("export.variable") || "Variable"}</TableHead>
                            <TableHead className="text-right">N</TableHead>
                            <TableHead className="text-right">{t("export.mean") || "Mean"}</TableHead>
                            <TableHead className="text-right">{t("export.std") || "Std"}</TableHead>
                            <TableHead className="text-right">Min</TableHead>
                            <TableHead className="text-right">Max</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.statsTable.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{row.variable}</TableCell>
                              <TableCell className="text-right">{row.n}</TableCell>
                              <TableCell className="text-right">{typeof row.mean === "number" ? row.mean.toFixed(3) : row.mean}</TableCell>
                              <TableCell className="text-right">{typeof row.std === "number" ? row.std.toFixed(3) : row.std}</TableCell>
                              <TableCell className="text-right">{typeof row.min === "number" ? row.min.toFixed(2) : row.min}</TableCell>
                              <TableCell className="text-right">{typeof row.max === "number" ? row.max.toFixed(2) : row.max}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </section>
                )}

                {showStats(previewContent) && data.testResults.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground">{t("export.testResults") || "Test Results"}</h2>
                    <div className="rounded-md border border-border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("export.test") || "Test"}</TableHead>
                            <TableHead className="text-right">{t("export.value") || "Value"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.testResults.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{row.label}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{row.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </section>
                )}

                {/* Charts in preview */}
                {showCharts(previewContent) && charts.length > 0 && (
                  <section className="space-y-3">
                    <Separator />
                    <h2 className="text-lg font-semibold text-foreground">{t("workspace.graphs") || "Charts"}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {charts.slice(0, 8).map(chart => (
                        <div key={chart.key} className="rounded-md border border-border p-3 bg-card">
                          <MiniChart chart={chart} colors={chartColors} barRadius={barRadius} showGrid={chartSettings.showGrid} showLabels={chartSettings.showLabels} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <Separator />

                {/* Interpretation */}
                {showInterp(previewContent) && (
                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">{t("export.interpretation") || "Academic Interpretation"}</h2>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.interpretation}</p>
                  </section>
                )}

                {/* Conclusion */}
                {showConc(previewContent) && (
                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">{t("export.conclusion") || "Conclusion"}</h2>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.conclusion}</p>
                    <h3 className="text-base font-semibold text-foreground mt-4">{t("export.recommendations") || "Recommendations"}</h3>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.recommendations}</p>
                  </section>
                )}

                {/* Export buttons */}
                <Separator />
                <div className="flex flex-wrap gap-2 justify-center pb-2">
                  {(["docx", "pdf", "xlsx"] as FormatType[]).map(format => {
                    const key = `${previewContent}-${format}`;
                    const isLoading = loading === key;
                    return (
                      <Button key={format} variant="default" size="sm" disabled={!!loading} onClick={() => handleExport(previewContent!, format)}>
                        {isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
                        {format === "docx" ? "Word (.docx)" : format === "pdf" ? "PDF (.pdf)" : "Excel (.xlsx)"}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
