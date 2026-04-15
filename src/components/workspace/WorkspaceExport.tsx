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
import { exportDocx, exportPdf, exportXlsx, formatTestResultsAdaptive, type ExportData } from "@/lib/exportUtils";
import type { StatSoftware } from "@/lib/softwareFormatter";
import { buildChartData, type ChartItem } from "@/lib/chartDataBuilder";
import { renderChartsToImages } from "@/lib/chartImageRenderer";
import {
  BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import type { ProjectContext } from "@/lib/academicFormatter";
import { generateTableTitle, generateTableInterpretation, generateFigureInterpretation } from "@/lib/academicFormatter";
import { getLocalizedProjectContext, formatMetadataLabel } from "@/lib/projectMetadataLabels";

interface WorkspaceExportProps {
  projectTitle: string;
  projectType: string;
  projectDomain: string;
  projectDescription: string;
  level: string;
  projectContext?: ProjectContext;
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

export function WorkspaceExport({ projectTitle, projectType, projectDomain, projectDescription, level, projectContext }: WorkspaceExportProps) {
  const { t, lang } = useLanguage();
  const localizedProjectContext = useMemo(() => getLocalizedProjectContext(projectContext, t), [projectContext, t]);
  const { dataset, analysisResults, interpretationData, cachedCharts, tableOverrides, chartOverrides, chatState } = useDataset();
  const selectedSoftware = chatState?.selectedSoftware || "";
  const { settings: chartSettings } = useChartStyle();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<ContentType | null>(null);

  const chartColors = chartSettings.palette.colors;
  const barRadius: [number, number, number, number] = chartSettings.style === "rounded" ? [3, 3, 0, 0] : chartSettings.style === "sharp" ? [1, 1, 0, 0] : [0, 0, 0, 0];

  const builtCharts = useMemo((): ChartItem[] => {
    if (!dataset) return [];
    return buildChartData(dataset.rawData, dataset.variables, analysisResults, t);
  }, [dataset, analysisResults, t]);

  // Use cached charts as fallback (same pattern as WorkspaceCharts)
  const charts = builtCharts.length > 0 ? builtCharts : (cachedCharts as ChartItem[] || []);

  const buildData = useMemo((): ExportData | null => {
    if (!dataset || analysisResults.length === 0) return null;

    const statsTable: ExportData["statsTable"] = [];

    for (const result of analysisResults) {
      if (result.descriptive) {
        for (const d of result.descriptive) {
          statsTable.push({ variable: d.variable, n: d.n, mean: d.mean, std: d.std, min: d.min, q1: d.q1, median: d.median, q3: d.q3, max: d.max });
        }
      }
    }

    // Use adaptive software formatting for test results
    const sw = (selectedSoftware || "").toLowerCase() as StatSoftware;
    const testResults = formatTestResultsAdaptive(analysisResults, sw);

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
      objective: localizedProjectContext?.objective,
      specificObjectives: localizedProjectContext?.specificObjectives,
      studyType: localizedProjectContext?.studyType,
      studyDesign: localizedProjectContext?.studyDesign,
      population: localizedProjectContext?.population,
      primaryVariable: localizedProjectContext?.primaryVariable,
      hypothesis: localizedProjectContext?.hypothesis,
      advancedHypothesis: localizedProjectContext?.advancedHypothesis,
      independentVars: localizedProjectContext?.independentVars,
      dependentVar: localizedProjectContext?.dependentVar,
      controlVars: localizedProjectContext?.controlVars,
      mediatorVars: localizedProjectContext?.mediatorVars,
      moderatorVars: localizedProjectContext?.moderatorVars,
      conceptualModel: localizedProjectContext?.conceptualModel,
      software: sw,
    };
  }, [dataset, analysisResults, interpretationData, projectTitle, projectType, projectDomain, projectDescription, level, lang, t, selectedSoftware]);

  const handleExport = async (content: ContentType, format: FormatType) => {
    const key = `${content}-${format}`;
    setLoading(key);
    try {
      const data = { ...buildData! };
      data.analysisResults = analysisResults;
      data.academicReport = interpretationData?.academicReport;
      // Generate chart images for Word/PDF with chart metadata
      if (format !== "xlsx" && charts.length > 0) {
        const rendered = renderChartsToImages(charts, chartSettings);
        data.chartImages = rendered.map((img, i) => ({
          ...img,
          chartType: charts[i]?.type,
          chartData: charts[i]?.data as { name?: string; value?: number; x?: number; y?: number }[],
        }));
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
  const localizedType = formatMetadataLabel(data.projectType, "projectType", t) || data.projectType;
  const localizedDomain = formatMetadataLabel(data.projectDomain, "domain", t) || data.projectDomain;

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
              {(["docx", "pdf", ...((content === "full" || content === "results") && !level.includes("license") ? ["xlsx"] : [])] as FormatType[]).map(format => {
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
              <div className="space-y-6 py-2" style={{ fontFamily: "'Times New Roman', Georgia, Garamond, serif", lineHeight: 1.5 }}>
                {/* Title block */}
                <div className="text-center space-y-2 pb-4 border-b border-border">
                  <h1 className="text-xl font-bold text-foreground" style={{ fontSize: "14pt" }}>{data.projectTitle}</h1>
                  <p className="text-sm text-muted-foreground">{lvl} — {localizedDomain}</p>
                </div>

                {/* Project info */}
                {showProjectInfo(previewContent) && (
                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">{t("export.projectInfo") || "Project Information"}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div><span className="font-medium text-foreground">{t("export.projectTitle") || "Title"}:</span> <span className="text-muted-foreground">{data.projectTitle}</span></div>
                      <div><span className="font-medium text-foreground">{t("export.level") || "Level"}:</span> <span className="text-muted-foreground">{lvl}</span></div>
                      <div><span className="font-medium text-foreground">{t("export.type") || "Type"}:</span> <span className="text-muted-foreground">{localizedType || "—"}</span></div>
                      <div><span className="font-medium text-foreground">{t("export.domain") || "Domain"}:</span> <span className="text-muted-foreground">{localizedDomain || "—"}</span></div>
                      {data.studyType && <div><span className="font-medium text-foreground">{t("export.studyType") || "Study Type"}:</span> <span className="text-muted-foreground">{data.studyType}</span></div>}
                      {data.studyDesign && <div><span className="font-medium text-foreground">{t("export.studyDesign") || "Study Design"}:</span> <span className="text-muted-foreground">{data.studyDesign}</span></div>}
                      {data.population && <div className="sm:col-span-2"><span className="font-medium text-foreground">{t("export.population") || "Population"}:</span> <span className="text-muted-foreground">{data.population}</span></div>}
                    </div>
                    {data.projectDescription && <p className="text-sm text-muted-foreground">{data.projectDescription}</p>}
                  </section>
                )}

                {/* Objectives */}
                {showProjectInfo(previewContent) && (data.objective || (data.specificObjectives && data.specificObjectives.length > 0)) && (
                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">{t("export.objectives") || "Study Objectives"}</h2>
                    {data.objective && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">{t("export.generalObjective") || "General Objective"}:</span>{" "}
                        <span className="text-muted-foreground">{data.objective}</span>
                      </div>
                    )}
                    {data.specificObjectives && data.specificObjectives.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">{t("export.specificObjectives") || "Specific Objectives"}:</span>
                        <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-0.5">
                          {data.specificObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                      </div>
                    )}
                  </section>
                )}

                {/* Hypotheses & Variables */}
                {showProjectInfo(previewContent) && (data.hypothesis || data.advancedHypothesis || data.independentVars || data.dependentVar) && (
                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">{t("export.methodology") || "Methodology"}</h2>
                    <div className="grid grid-cols-1 gap-y-1 text-sm">
                      {data.hypothesis && <div><span className="font-medium text-foreground">{t("export.hypothesis") || "Hypothesis"}:</span> <span className="text-muted-foreground">{data.hypothesis}</span></div>}
                      {data.advancedHypothesis && <div><span className="font-medium text-foreground">{t("export.advancedHypothesis") || "Advanced Hypothesis"}:</span> <span className="text-muted-foreground">{data.advancedHypothesis}</span></div>}
                      {data.independentVars && <div><span className="font-medium text-foreground">{t("export.independentVars") || "Independent Variables"}:</span> <span className="text-muted-foreground">{data.independentVars}</span></div>}
                      {data.dependentVar && <div><span className="font-medium text-foreground">{t("export.dependentVar") || "Dependent Variable"}:</span> <span className="text-muted-foreground">{data.dependentVar}</span></div>}
                      {data.controlVars && <div><span className="font-medium text-foreground">{t("export.controlVars") || "Control Variables"}:</span> <span className="text-muted-foreground">{data.controlVars}</span></div>}
                      {data.mediatorVars && <div><span className="font-medium text-foreground">{t("export.mediatorVars") || "Mediator Variables"}:</span> <span className="text-muted-foreground">{data.mediatorVars}</span></div>}
                      {data.moderatorVars && <div><span className="font-medium text-foreground">{t("export.moderatorVars") || "Moderator Variables"}:</span> <span className="text-muted-foreground">{data.moderatorVars}</span></div>}
                      {data.conceptualModel && <div><span className="font-medium text-foreground">{t("export.conceptualModel") || "Conceptual Model"}:</span> <span className="text-muted-foreground">{data.conceptualModel}</span></div>}
                    </div>
                  </section>
                )}

                <Separator />

                {/* Results with academic numbering */}
                {showStats(previewContent) && analysisResults.length > 0 && (() => {
                  let tableNum = 0;
                  const tableLabel = lang === "fr" ? "Tableau" : lang === "es" ? "Tabla" : lang === "de" ? "Tabelle" : lang === "pt" ? "Tabela" : "Table";

                  return (
                    <section className="space-y-4">
                      <h2 className="text-lg font-semibold text-foreground">{t("export.descriptiveStats") || "Results"}</h2>
                      {analysisResults.map((result) => {
                        const ov = tableOverrides[result.id] || {};
                        const title = ov.title || generateTableTitle(result, lang, t, localizedProjectContext);
                        const interpretation = ov.interpretation || generateTableInterpretation(result, lang, level);

                        const blocks: React.ReactNode[] = [];

                        {/* Descriptive stats */}
                        if (result.descriptive && result.descriptive.length > 0) {
                          tableNum++;
                          blocks.push(
                            <div key={`desc-${result.id}`} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : {title}</p>
                              <div className="rounded-md border border-border overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>{t("export.variable") || "Variable"}</TableHead>
                                      <TableHead className="text-right">N</TableHead>
                                      <TableHead className="text-right">{t("export.mean") || "Mean"}</TableHead>
                                      <TableHead className="text-right">{t("export.std") || "Std"}</TableHead>
                                      <TableHead className="text-right">Min</TableHead>
                                      <TableHead className="text-right">Q1</TableHead>
                                      <TableHead className="text-right">{t("export.median") || "Median"}</TableHead>
                                      <TableHead className="text-right">Q3</TableHead>
                                      <TableHead className="text-right">Max</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {result.descriptive.map((row, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-medium">{row.variable}</TableCell>
                                        <TableCell className="text-right">{row.n}</TableCell>
                                        <TableCell className="text-right">{typeof row.mean === "number" ? row.mean.toFixed(3) : row.mean}</TableCell>
                                        <TableCell className="text-right">{typeof row.std === "number" ? row.std.toFixed(3) : row.std}</TableCell>
                                        <TableCell className="text-right">{typeof row.min === "number" ? row.min.toFixed(2) : row.min}</TableCell>
                                        <TableCell className="text-right">{typeof row.q1 === "number" ? row.q1.toFixed(3) : row.q1}</TableCell>
                                        <TableCell className="text-right">{typeof row.median === "number" ? row.median.toFixed(3) : row.median}</TableCell>
                                        <TableCell className="text-right">{typeof row.q3 === "number" ? row.q3.toFixed(3) : row.q3}</TableCell>
                                        <TableCell className="text-right">{typeof row.max === "number" ? row.max.toFixed(2) : row.max}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              {interpretation && <p className="text-xs italic text-muted-foreground leading-relaxed">{interpretation}</p>}
                            </div>
                          );
                        }

                        {/* Frequencies */}
                        if (result.frequencies && result.frequencies.length > 0) {
                          for (const freq of result.frequencies) {
                            tableNum++;
                            blocks.push(
                              <div key={`freq-${freq.variable}`} className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : {freq.variable}</p>
                                <div className="rounded-md border border-border overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>{t("export.variable") || "Category"}</TableHead>
                                        <TableHead className="text-right">N</TableHead>
                                        <TableHead className="text-right">%</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {freq.categories.map(cat => (
                                        <TableRow key={cat.value}>
                                          <TableCell className="font-medium">{cat.value}</TableCell>
                                          <TableCell className="text-right">{cat.count}</TableCell>
                                          <TableCell className="text-right">{cat.pct}%</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            );
                          }
                        }
                        if (result.chiSquares) {
                          for (const chi of result.chiSquares) {
                            tableNum++;
                            blocks.push(
                              <div key={`chi-${chi.var1}-${chi.var2}`} className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Chi² — {chi.var1} × {chi.var2}</p>
                                {chi.contingencyTable && (
                                  <div className="rounded-md border border-border overflow-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead></TableHead>
                                          {chi.contingencyTable.colLabels.map(cl => <TableHead key={cl} className="text-right">{cl}</TableHead>)}
                                          <TableHead className="text-right font-bold">Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {chi.contingencyTable.rowLabels.map((rl, ri) => (
                                          <TableRow key={rl}>
                                            <TableCell className="font-medium">{rl}</TableCell>
                                            {chi.contingencyTable!.observed[ri].map((obs, ci) => (
                                              <TableCell key={ci} className="text-right">
                                                {obs} <span className="text-muted-foreground text-[10px]">({chi.contingencyTable!.expected[ri][ci].toFixed(1)})</span>
                                              </TableCell>
                                            ))}
                                            <TableCell className="text-right font-medium">{chi.contingencyTable!.rowTotals[ri]}</TableCell>
                                          </TableRow>
                                        ))}
                                        <TableRow>
                                          <TableCell className="font-bold">Total</TableCell>
                                          {chi.contingencyTable.colTotals.map((ct, ci) => (
                                            <TableCell key={ci} className="text-right font-medium">{ct}</TableCell>
                                          ))}
                                          <TableCell className="text-right font-bold">{chi.contingencyTable.grandTotal}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                                <p className="text-xs italic text-muted-foreground">
                                  χ²({chi.df}) = {chi.chiSquare.toFixed(3)}, p = {chi.pValue.toFixed(4)}, Cramér's V = {chi.cramersV.toFixed(3)}
                                </p>
                              </div>
                            );
                          }
                        }

                        {/* Correlations */}
                        if (result.correlations && result.correlations.length > 0) {
                          tableNum++;
                          blocks.push(
                            <div key={`corr-${result.id}`} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Correlations</p>
                              <div className="rounded-md border border-border overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Variables</TableHead>
                                      <TableHead className="text-right">r</TableHead>
                                      <TableHead className="text-right">p</TableHead>
                                      <TableHead className="text-right">N</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {result.correlations.map((c, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-medium">{c.var1} × {c.var2}</TableCell>
                                        <TableCell className="text-right">{c.r.toFixed(3)}</TableCell>
                                        <TableCell className="text-right">{c.pValue.toFixed(4)}</TableCell>
                                        <TableCell className="text-right">{c.n}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          );
                        }

                        {/* T-tests */}
                        if (result.tTests && result.tTests.length > 0) {
                          for (const tt of result.tTests) {
                            tableNum++;
                            blocks.push(
                              <div key={`tt-${tt.variable}`} className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : T-test — {tt.variable}</p>
                                <div className="rounded-md border border-border overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Group</TableHead>
                                        <TableHead className="text-right">Mean</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {tt.groups.map((g, i) => (
                                        <TableRow key={g}>
                                          <TableCell className="font-medium">{g}</TableCell>
                                          <TableCell className="text-right">{tt.means[i].toFixed(3)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                <p className="text-xs italic text-muted-foreground">t({tt.df}) = {tt.tStat.toFixed(3)}, p = {tt.pValue.toFixed(4)}</p>
                              </div>
                            );
                          }
                        }

                        {/* ANOVA */}
                        if (result.anovas && result.anovas.length > 0) {
                          for (const a of result.anovas) {
                            tableNum++;
                            blocks.push(
                              <div key={`anova-${a.dependent}-${a.factor}`} className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : ANOVA — {a.dependent} × {a.factor}</p>
                                <div className="rounded-md border border-border overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Group</TableHead>
                                        <TableHead className="text-right">N</TableHead>
                                        <TableHead className="text-right">Mean</TableHead>
                                        <TableHead className="text-right">Std</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {a.groups.map(g => (
                                        <TableRow key={g.name}>
                                          <TableCell className="font-medium">{g.name}</TableCell>
                                          <TableCell className="text-right">{g.n}</TableCell>
                                          <TableCell className="text-right">{g.mean.toFixed(3)}</TableCell>
                                          <TableCell className="text-right">{g.std.toFixed(3)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                <p className="text-xs italic text-muted-foreground">F({a.dfBetween}, {a.dfWithin}) = {a.fStat.toFixed(3)}, p = {a.pValue.toFixed(4)}</p>
                              </div>
                            );
                          }
                        }

                        {/* Regression */}
                        if (result.regressions && result.regressions.length > 0) {
                          for (const reg of result.regressions) {
                            tableNum++;
                            blocks.push(
                              <div key={`reg-${reg.dependent}`} className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Regression — {reg.dependent}</p>
                                <div className="rounded-md border border-border overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Variable</TableHead>
                                        <TableHead className="text-right">B</TableHead>
                                        <TableHead className="text-right">SE</TableHead>
                                        <TableHead className="text-right">t</TableHead>
                                        <TableHead className="text-right">p</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {reg.coefficients.map(c => (
                                        <TableRow key={c.variable}>
                                          <TableCell className="font-medium">{c.variable}</TableCell>
                                          <TableCell className="text-right">{c.b.toFixed(4)}</TableCell>
                                          <TableCell className="text-right">{c.se.toFixed(4)}</TableCell>
                                          <TableCell className="text-right">{c.t.toFixed(3)}</TableCell>
                                          <TableCell className="text-right">{c.p.toFixed(4)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                <p className="text-xs italic text-muted-foreground">R² = {reg.rSquared.toFixed(4)}, R² ajusté = {reg.adjustedR2.toFixed(4)}</p>
                              </div>
                            );
                          }
                        }

                        {/* Spearman Correlations */}
                        if (result.spearmanCorrelations && result.spearmanCorrelations.length > 0) {
                          tableNum++;
                          blocks.push(
                            <div key={`spearman-${result.id}`} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Spearman Correlations</p>
                              <div className="rounded-md border border-border overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Variables</TableHead>
                                      <TableHead className="text-right">ρ</TableHead>
                                      <TableHead className="text-right">p</TableHead>
                                      <TableHead className="text-right">N</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {result.spearmanCorrelations.map((s, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-medium">{s.var1} × {s.var2}</TableCell>
                                        <TableCell className="text-right">{s.rho.toFixed(3)}</TableCell>
                                        <TableCell className="text-right">{s.pValue.toFixed(4)}</TableCell>
                                        <TableCell className="text-right">{s.n}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          );
                        }

                        {/* Kendall Correlations */}
                        if (result.kendallCorrelations && result.kendallCorrelations.length > 0) {
                          tableNum++;
                          blocks.push(
                            <div key={`kendall-${result.id}`} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Kendall Correlations</p>
                              <div className="rounded-md border border-border overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Variables</TableHead>
                                      <TableHead className="text-right">τ</TableHead>
                                      <TableHead className="text-right">p</TableHead>
                                      <TableHead className="text-right">N</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {result.kendallCorrelations.map((k, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-medium">{k.var1} × {k.var2}</TableCell>
                                        <TableCell className="text-right">{k.tau.toFixed(3)}</TableCell>
                                        <TableCell className="text-right">{k.pValue.toFixed(4)}</TableCell>
                                        <TableCell className="text-right">{k.n}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          );
                        }

                        {/* Mann-Whitney */}
                        if (result.mannWhitney && result.mannWhitney.length > 0) {
                          for (const mw of result.mannWhitney) {
                            tableNum++;
                            blocks.push(
                              <div key={`mw-${mw.variable}`} className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Mann-Whitney — {mw.variable}</p>
                                <div className="rounded-md border border-border overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Statistic</TableHead>
                                        <TableHead className="text-right">Value</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow><TableCell className="font-medium">Groups</TableCell><TableCell className="text-right">{mw.groups.join(" vs ")}</TableCell></TableRow>
                                      <TableRow><TableCell className="font-medium">U</TableCell><TableCell className="text-right">{mw.U.toFixed(3)}</TableCell></TableRow>
                                      <TableRow><TableCell className="font-medium">z</TableCell><TableCell className="text-right">{mw.z.toFixed(3)}</TableCell></TableRow>
                                      <TableRow><TableCell className="font-medium">p-value</TableCell><TableCell className="text-right">{mw.pValue.toFixed(4)}</TableCell></TableRow>
                                      <TableRow><TableCell className="font-medium">n₁ / n₂</TableCell><TableCell className="text-right">{mw.n1} / {mw.n2}</TableCell></TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            );
                          }
                        }

                        {/* Wilcoxon */}
                        if (result.wilcoxon && result.wilcoxon.length > 0) {
                          for (const w of result.wilcoxon) {
                            tableNum++;
                            blocks.push(
                              <div key={`wilc-${w.var1}-${w.var2}`} className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Wilcoxon — {w.var1} × {w.var2}</p>
                                <div className="rounded-md border border-border overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Statistic</TableHead>
                                        <TableHead className="text-right">Value</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow><TableCell className="font-medium">W</TableCell><TableCell className="text-right">{w.W.toFixed(3)}</TableCell></TableRow>
                                      <TableRow><TableCell className="font-medium">p-value</TableCell><TableCell className="text-right">{w.pValue.toFixed(4)}</TableCell></TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            );
                          }
                        }

                        {/* Kruskal-Wallis */}
                        if (result.kruskalWallis && result.kruskalWallis.length > 0) {
                          for (const kw of result.kruskalWallis) {
                            tableNum++;
                            blocks.push(
                              <div key={`kw-${kw.dependent}`} className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Kruskal-Wallis — {kw.dependent}</p>
                                <div className="rounded-md border border-border overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Group</TableHead>
                                        <TableHead className="text-right">Mean Rank</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {kw.groups.map(g => (
                                        <TableRow key={g.name}>
                                          <TableCell className="font-medium">{g.name}</TableCell>
                                          <TableCell className="text-right">{g.meanRank.toFixed(2)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                <p className="text-xs italic text-muted-foreground">H({kw.df}) = {kw.H.toFixed(3)}, p = {kw.pValue.toFixed(4)}</p>
                              </div>
                            );
                          }
                        }

                        {/* Shapiro-Wilk */}
                        if (result.shapiroWilk && result.shapiroWilk.length > 0) {
                          tableNum++;
                          blocks.push(
                            <div key={`sw-${result.id}`} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Shapiro-Wilk</p>
                              <div className="rounded-md border border-border overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Variable</TableHead>
                                      <TableHead className="text-right">W</TableHead>
                                      <TableHead className="text-right">p</TableHead>
                                      <TableHead className="text-right">Normal</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {result.shapiroWilk.map((sw, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-medium">{sw.variable}</TableCell>
                                        <TableCell className="text-right">{sw.W.toFixed(4)}</TableCell>
                                        <TableCell className="text-right">{sw.pValue.toFixed(4)}</TableCell>
                                        <TableCell className="text-right">{sw.isNormal ? "✓" : "✗"}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          );
                        }

                        {/* Cronbach Alpha */}
                        if (result.cronbachAlpha) {
                          tableNum++;
                          const ca = result.cronbachAlpha;
                          blocks.push(
                            <div key={`ca-${result.id}`} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Cronbach's Alpha</p>
                              <div className="rounded-md border border-border overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Statistic</TableHead>
                                      <TableHead className="text-right">Value</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow><TableCell className="font-medium">Alpha (α)</TableCell><TableCell className="text-right">{ca.alpha.toFixed(4)}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-medium">Items</TableCell><TableCell className="text-right">{ca.itemCount}</TableCell></TableRow>
                                    {ca.variables && <TableRow><TableCell className="font-medium">Variables</TableCell><TableCell className="text-right">{ca.variables.join(", ")}</TableCell></TableRow>}
                                  </TableBody>
                                </Table>
                              </div>
                              <p className="text-xs italic text-muted-foreground">
                                {ca.alpha >= 0.9 ? "Excellent" : ca.alpha >= 0.8 ? "Good" : ca.alpha >= 0.7 ? "Acceptable" : ca.alpha >= 0.6 ? "Questionable" : "Poor"} reliability
                              </p>
                            </div>
                          );
                        }

                        {/* Paired T-tests */}
                        if (result.pairedTTests && result.pairedTTests.length > 0) {
                          for (const pt of result.pairedTTests) {
                            tableNum++;
                            blocks.push(
                              <div key={`pt-${pt.var1}-${pt.var2}`} className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Paired T-test — {pt.var1} × {pt.var2}</p>
                                <div className="rounded-md border border-border overflow-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Statistic</TableHead>
                                        <TableHead className="text-right">Value</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow><TableCell className="font-medium">Mean Diff</TableCell><TableCell className="text-right">{pt.meanDiff.toFixed(4)}</TableCell></TableRow>
                                      <TableRow><TableCell className="font-medium">t</TableCell><TableCell className="text-right">{pt.tStat.toFixed(3)}</TableCell></TableRow>
                                      <TableRow><TableCell className="font-medium">df</TableCell><TableCell className="text-right">{pt.df}</TableCell></TableRow>
                                      <TableRow><TableCell className="font-medium">p-value</TableCell><TableCell className="text-right">{pt.pValue.toFixed(4)}</TableCell></TableRow>
                                      <TableRow><TableCell className="font-medium">N</TableCell><TableCell className="text-right">{pt.n}</TableCell></TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            );
                          }
                        }

                        {/* PCA */}
                        if (result.pca) {
                          tableNum++;
                          const pca = result.pca;
                          blocks.push(
                            <div key={`pca-${result.id}`} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : PCA — Variance Explained</p>
                              <div className="rounded-md border border-border overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Component</TableHead>
                                      <TableHead className="text-right">Eigenvalue</TableHead>
                                      <TableHead className="text-right">% Variance</TableHead>
                                      <TableHead className="text-right">Cumulative %</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {pca.components.map(c => (
                                      <TableRow key={c.component}>
                                        <TableCell className="font-medium">PC{c.component}</TableCell>
                                        <TableCell className="text-right">{c.eigenvalue.toFixed(4)}</TableCell>
                                        <TableCell className="text-right">{c.varianceExplained.toFixed(2)}%</TableCell>
                                        <TableCell className="text-right">{c.cumulativeVariance.toFixed(2)}%</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              {pca.kmo !== undefined && <p className="text-xs italic text-muted-foreground">KMO = {pca.kmo.toFixed(3)}</p>}
                              {/* Loadings */}
                              {pca.loadings && pca.loadings.length > 0 && (() => {
                                tableNum++;
                                return (
                                  <div className="space-y-2 mt-2">
                                    <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : PCA — Component Loadings</p>
                                    <div className="rounded-md border border-border overflow-auto">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Variable</TableHead>
                                            {pca.components.map(c => <TableHead key={c.component} className="text-right">PC{c.component}</TableHead>)}
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {pca.loadings.map(l => (
                                            <TableRow key={l.variable}>
                                              <TableCell className="font-medium">{l.variable}</TableCell>
                                              {l.components.map((v, i) => <TableCell key={i} className="text-right">{v.toFixed(3)}</TableCell>)}
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        }

                        {/* Factor Analysis */}
                        if (result.factorAnalysis) {
                          tableNum++;
                          const fa = result.factorAnalysis;
                          blocks.push(
                            <div key={`fa-${result.id}`} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Factor Analysis — Variance Explained ({fa.rotation})</p>
                              <div className="rounded-md border border-border overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Factor</TableHead>
                                      <TableHead className="text-right">Eigenvalue</TableHead>
                                      <TableHead className="text-right">% Variance</TableHead>
                                      <TableHead className="text-right">Cumulative %</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {fa.factors.map(f => (
                                      <TableRow key={f.factor}>
                                        <TableCell className="font-medium">F{f.factor}</TableCell>
                                        <TableCell className="text-right">{f.eigenvalue.toFixed(4)}</TableCell>
                                        <TableCell className="text-right">{f.varianceExplained.toFixed(2)}%</TableCell>
                                        <TableCell className="text-right">{f.cumulativeVariance.toFixed(2)}%</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              {/* Rotated Loadings */}
                              {fa.rotatedLoadings && fa.rotatedLoadings.length > 0 && (() => {
                                tableNum++;
                                return (
                                  <div className="space-y-2 mt-2">
                                    <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Rotated Factor Loadings ({fa.rotation})</p>
                                    <div className="rounded-md border border-border overflow-auto">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Variable</TableHead>
                                            {fa.factors.map(f => <TableHead key={f.factor} className="text-right">F{f.factor}</TableHead>)}
                                            <TableHead className="text-right">Communality</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {fa.rotatedLoadings.map((l, li) => (
                                            <TableRow key={l.variable}>
                                              <TableCell className="font-medium">{l.variable}</TableCell>
                                              {l.factors.map((v, i) => <TableCell key={i} className="text-right">{v.toFixed(3)}</TableCell>)}
                                              <TableCell className="text-right">{fa.communalities[li]?.extraction.toFixed(3) ?? "—"}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        }

                        {/* Cluster Analysis */}
                        if (result.clusterAnalysis) {
                          const ca = result.clusterAnalysis;
                          tableNum++;
                          blocks.push(
                            <div key={`ca-${result.id}`} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{tableLabel} {tableNum} : Cluster Analysis — K-Means (k={ca.k})</p>
                              <div className="rounded-md border border-border overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Cluster</TableHead>
                                      <TableHead className="text-right">Size</TableHead>
                                      {ca.clusters[0]?.centroid.map(c => (
                                        <TableHead key={c.variable} className="text-right">{c.variable}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {ca.clusters.map(cl => (
                                      <TableRow key={cl.cluster}>
                                        <TableCell className="font-medium">C{cl.cluster}</TableCell>
                                        <TableCell className="text-right">{cl.size}</TableCell>
                                        {cl.centroid.map(c => (
                                          <TableCell key={c.variable} className="text-right">{c.value.toFixed(3)}</TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Within SS: {ca.withinSS.reduce((a: number, b: number) => a + b, 0).toFixed(2)} | Between SS: {ca.betweenSS.toFixed(2)} | Silhouette: {ca.silhouetteScore.toFixed(4)}
                              </p>
                            </div>
                          );
                        }

                        return blocks.length > 0 ? <div key={result.id} className="space-y-4">{blocks}</div> : null;
                      })}
                    </section>
                  );
                })()}

                {/* Charts with academic numbering */}
                {showCharts(previewContent) && charts.length > 0 && (
                  <section className="space-y-3">
                    <Separator />
                    <h2 className="text-lg font-semibold text-foreground">{t("workspace.graphs") || "Charts"}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {charts.slice(0, 8).map((chart, idx) => {
                        const figNum = idx + 1;
                        const figLabel = lang === "fr" ? "Figure" : lang === "es" ? "Figura" : lang === "de" ? "Abbildung" : lang === "pt" ? "Figura" : "Figure";
                        const ov = chartOverrides[chart.key] || {};
                        const title = ov.title || chart.title;
                        return (
                          <div key={chart.key} className="rounded-md border border-border p-3 bg-card space-y-1">
                            <p className="text-xs font-semibold text-foreground">{figLabel} {figNum} : {title}</p>
                            <MiniChart chart={chart} colors={chartColors} barRadius={barRadius} showGrid={chartSettings.showGrid} showLabels={chartSettings.showLabels} />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                <Separator />

                {/* Academic Report Sections 3.1–3.9 */}
                {(showInterp(previewContent) || showConc(previewContent)) && interpretationData?.academicReport ? (() => {
                  const allSections = interpretationData.academicReport.sections;
                  const lastSection = allSections[allSections.length - 1];
                  const lastNum = lastSection?.number;
                  return (
                  <section className="space-y-4">
                    {allSections
                      .filter(sec => {
                        if (showInterp(previewContent) && showConc(previewContent)) return true;
                        if (showInterp(previewContent)) return sec.number !== lastNum;
                        if (showConc(previewContent)) return sec.number === lastNum;
                        return false;
                      })
                      .map(sec => (
                        <div key={sec.number} className="space-y-2">
                          <h2 className="text-base font-semibold text-foreground">{sec.number} {sec.title}</h2>
                          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{sec.content}</p>
                        </div>
                      ))}
                  </section>
                  );
                })() : (
                  <>
                    {/* Fallback: legacy interpretation */}
                    {showInterp(previewContent) && (
                      <section className="space-y-2">
                        <h2 className="text-lg font-semibold text-foreground">{t("export.interpretation") || "Academic Interpretation"}</h2>
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.interpretation}</p>
                      </section>
                    )}

                    {/* Fallback: legacy conclusion */}
                    {showConc(previewContent) && (
                      <section className="space-y-2">
                        <h2 className="text-lg font-semibold text-foreground">{t("export.conclusion") || "Conclusion"}</h2>
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.conclusion}</p>
                        <h3 className="text-base font-semibold text-foreground mt-4">{t("export.recommendations") || "Recommendations"}</h3>
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.recommendations}</p>
                      </section>
                    )}
                  </>
                )}

                {/* Export buttons */}
                <Separator />
                <div className="flex flex-wrap gap-2 justify-center pb-2">
                  {(["docx", "pdf", ...(previewContent === "full" || previewContent === "results" ? ["xlsx"] : [])] as FormatType[]).map(format => {
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
