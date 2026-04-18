import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import { isIdentifierVariable } from "@/lib/academicFormatter";
import { VariableStudio } from "@/components/workspace/VariableStudio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, AlertTriangle, CheckCircle, Sparkles, ArrowRight, Settings2, Upload, Loader2, FileSpreadsheet, ShieldOff, Layers } from "lucide-react";

export function WorkspaceDataPrep() {
  const { t } = useLanguage();
  const { dataset, prepStatus, prepError, runCleaning } = useDataset();

  const excludedVars = useMemo(
    () => dataset ? dataset.variables.filter(v => isIdentifierVariable(v.name, dataset.rawData)) : [],
    [dataset]
  );

  // No dataset yet
  if (!dataset && prepStatus === "idle") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Upload className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("dataPrep.noData")}</p>
          <p className="text-xs text-muted-foreground">{t("dataPrep.uploadFirst")}</p>
        </CardContent>
      </Card>
    );
  }

  // Loading states
  if (prepStatus === "uploading" || prepStatus === "reading" || prepStatus === "cleaning") {
    const steps = [
      { key: "uploading", label: t("dataPrep.stepUploading") },
      { key: "reading", label: t("dataPrep.stepReading") },
      { key: "cleaning", label: t("dataPrep.stepCleaning") },
    ];
    const currentIdx = steps.findIndex(s => s.key === prepStatus);
    const pct = Math.round(((currentIdx + 1) / steps.length) * 100);

    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">{steps[currentIdx]?.label}</p>
          <Progress value={pct} className="h-2 w-48" />
          <div className="flex gap-2 text-xs text-muted-foreground">
            {steps.map((s, i) => (
              <span key={s.key} className={i <= currentIdx ? "text-primary font-medium" : ""}>
                {i + 1}. {s.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (prepStatus === "error") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-sm font-medium text-destructive">{t("dataPrep.error")}</p>
          <p className="text-xs text-muted-foreground">{prepError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!dataset) return null;

  const rows = dataset.rawData;
  const analyticalVars = dataset.variables.length - excludedVars.length;
  const numericCount = dataset.variables.filter(v => v.type === "numeric" && !isIdentifierVariable(v.name, rows)).length;
  const catCount = dataset.variables.filter(v => (v.type === "categorical" || v.type === "ordinal") && !isIdentifierVariable(v.name, rows)).length;
  const dateCount = dataset.variables.filter(v => v.type === "date").length;
  const hasMissing = dataset.totalMissing > 0;
  const hasOutliers = dataset.variables.some(v => v.outliers > 0);
  const totalOutliers = dataset.variables.reduce((s, v) => s + v.outliers, 0);

  return (
    <div className="space-y-4">
      {/* File Info */}
      <Card>
        <CardContent className="flex items-center gap-3 py-3">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{dataset.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {dataset.fileType} · {(dataset.fileSize / 1024).toFixed(1)} KB
            </p>
          </div>
          <Badge variant="outline">{dataset.observations} obs</Badge>
        </CardContent>
      </Card>

      {/* Dataset Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            {t("dataPrep.overview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{dataset.observations}</p>
              <p className="text-xs text-muted-foreground">{t("dataPrep.observations")}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{dataset.variables.length}</p>
              <p className="text-xs text-muted-foreground">{t("dataPrep.variables")}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{numericCount}</p>
              <p className="text-xs text-muted-foreground">{t("dataPrep.numeric")}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{catCount}</p>
              <p className="text-xs text-muted-foreground">{t("dataPrep.categorical")}</p>
            </div>
          </div>

          {/* Excluded identifier variables indicator */}
          {excludedVars.length > 0 && (
            <div className="mt-4 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldOff className="h-4 w-4 text-destructive/70" />
                <span className="text-sm font-medium text-destructive/80">
                  {excludedVars.length} variable{excludedVars.length > 1 ? "s" : ""} {t("dataPrep.excludedIdentifiers") || "exclue(s) automatiquement (identifiants techniques)"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {excludedVars.map(v => (
                  <Badge key={v.name} variant="outline" className="text-xs border-destructive/30 text-destructive/70 line-through">
                    {v.name}
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {t("dataPrep.excludedDesc") || "Ces variables ne seront pas incluses dans les analyses, graphiques ni interprétations."}
              </p>
            </div>
          )}

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-foreground">{t("dataPrep.variableList")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Variable Studio (Preparation V2) — collapsible per-variable diagnostics + actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-primary" />
            {t("varStudio.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">{t("varStudio.subtitle")}</p>
          {dataset.variables.map(v => (
            <VariableStudio key={v.name} variable={v} />
          ))}
        </CardContent>
      </Card>

      {/* Data Quality */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t("dataPrep.qualityDiagnostics")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("dataPrep.missingValues")}</span>
              <span className="font-medium text-foreground">{dataset.totalMissing} ({dataset.totalMissingPct}%)</span>
            </div>
            <Progress value={100 - dataset.totalMissingPct} className="h-2" />
          </div>

          {hasOutliers && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("dataPrep.outliers")}</span>
                <span className="font-medium text-foreground">{totalOutliers}</span>
              </div>
              <Progress value={100 - (totalOutliers / dataset.observations) * 100} className="h-2" />
            </div>
          )}

          {dataset.duplicateRows > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-400">
                {dataset.duplicateRows} {t("dataPrep.duplicates")}
              </span>
            </div>
          )}

          {/* Per-variable table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">{t("dataPrep.variable")}</th>
                  <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">{t("dataPrep.type_col")}</th>
                  <th className="px-2 py-1.5 text-right text-muted-foreground font-medium">{t("dataPrep.missingPct")}</th>
                  <th className="px-2 py-1.5 text-right text-muted-foreground font-medium">{t("dataPrep.outliers")}</th>
                </tr>
              </thead>
              <tbody>
                {dataset.variables.map(v => (
                  <tr key={v.name} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{v.name}</td>
                    <td className="px-2 py-1.5"><Badge variant="outline" className="text-xs">{t(`dataPrep.type.${v.type}`)}</Badge></td>
                    <td className={`px-2 py-1.5 text-right ${v.missingPct > 0 ? "text-amber-600" : "text-green-600"}`}>{v.missingPct}%</td>
                    <td className={`px-2 py-1.5 text-right ${v.outliers > 0 ? "text-amber-600" : "text-green-600"}`}>{v.outliers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!hasMissing && !hasOutliers && dataset.duplicateRows === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 px-3 py-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700 dark:text-green-400">{t("dataPrep.consistency")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleaning Actions */}
      {(hasMissing || hasOutliers || dataset.duplicateRows > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-primary" />
              {t("dataPrep.cleaningTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={runCleaning} className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                {t("dataPrep.autoClean")}
              </Button>
              <Button variant="outline" className="gap-1.5">
                <ArrowRight className="h-4 w-4" />
                {t("dataPrep.continueWithout")}
              </Button>
              <Button variant="secondary" className="gap-1.5">
                <Settings2 className="h-4 w-4" />
                {t("dataPrep.customClean")}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("dataPrep.cleaningDesc")}</p>
          </CardContent>
        </Card>
      )}

      {/* Clean data indicator */}
      {!hasMissing && !hasOutliers && dataset.duplicateRows === 0 && (
        <Card>
          <CardContent className="flex items-center gap-2 py-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700 dark:text-green-400">{t("dataPrep.cleaningDone")}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
