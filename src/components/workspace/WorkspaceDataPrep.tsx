import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, AlertTriangle, CheckCircle, Sparkles, ArrowRight, Settings2 } from "lucide-react";

interface VariableInfo {
  name: string;
  type: "numeric" | "categorical" | "ordinal";
  missing: number;
  missingPct: number;
  outliers: number;
}

const mockVariables: VariableInfo[] = [
  { name: "Age", type: "numeric", missing: 3, missingPct: 2.0, outliers: 2 },
  { name: "Genre", type: "categorical", missing: 0, missingPct: 0, outliers: 0 },
  { name: "Revenu", type: "numeric", missing: 5, missingPct: 3.3, outliers: 4 },
  { name: "Niveau_etude", type: "ordinal", missing: 1, missingPct: 0.7, outliers: 0 },
  { name: "Performance", type: "numeric", missing: 2, missingPct: 1.3, outliers: 1 },
];

const MOCK_OBS = 150;

export function WorkspaceDataPrep() {
  const { t } = useLanguage();
  const [cleaningStatus, setCleaningStatus] = useState<"idle" | "cleaning" | "done">("idle");

  const totalMissing = mockVariables.reduce((s, v) => s + v.missing, 0);
  const totalOutliers = mockVariables.reduce((s, v) => s + v.outliers, 0);
  const overallMissingPct = ((totalMissing / (MOCK_OBS * mockVariables.length)) * 100).toFixed(1);

  const numericCount = mockVariables.filter(v => v.type === "numeric").length;
  const catCount = mockVariables.filter(v => v.type === "categorical").length;
  const ordCount = mockVariables.filter(v => v.type === "ordinal").length;

  const handleAutoClean = () => {
    setCleaningStatus("cleaning");
    setTimeout(() => setCleaningStatus("done"), 2000);
  };

  return (
    <div className="space-y-4">
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
              <p className="text-2xl font-bold text-foreground">{MOCK_OBS}</p>
              <p className="text-xs text-muted-foreground">{t("dataPrep.observations")}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{mockVariables.length}</p>
              <p className="text-xs text-muted-foreground">{t("dataPrep.variables")}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{numericCount}</p>
              <p className="text-xs text-muted-foreground">{t("dataPrep.numeric")}</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{catCount + ordCount}</p>
              <p className="text-xs text-muted-foreground">{t("dataPrep.categorical")}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-foreground">{t("dataPrep.variableList")}</p>
            <div className="space-y-1.5">
              {mockVariables.map(v => (
                <div key={v.name} className="flex items-center justify-between rounded border border-border/50 px-3 py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{v.name}</span>
                    <Badge variant="outline" className="text-xs">{t(`dataPrep.type.${v.type}`)}</Badge>
                  </div>
                  {v.missing > 0 && (
                    <span className="text-xs text-amber-600">{v.missingPct}% {t("dataPrep.missing")}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Diagnostics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t("dataPrep.qualityDiagnostics")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Missing Values */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("dataPrep.missingValues")}</span>
              <span className="font-medium text-foreground">{totalMissing} ({overallMissingPct}%)</span>
            </div>
            <Progress value={100 - parseFloat(overallMissingPct)} className="h-2" />
          </div>

          {/* Outliers */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("dataPrep.outliers")}</span>
              <span className="font-medium text-foreground">{totalOutliers}</span>
            </div>
            <Progress value={100 - (totalOutliers / MOCK_OBS) * 100} className="h-2" />
          </div>

          {/* Per-variable missing */}
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
                {mockVariables.map(v => (
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

          {/* Data consistency */}
          <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 px-3 py-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-700 dark:text-green-400">{t("dataPrep.consistency")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Cleaning Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-primary" />
            {t("dataPrep.cleaningTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cleaningStatus === "done" ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 px-4 py-3 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-400">{t("dataPrep.cleaningDone")}</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleAutoClean}
                disabled={cleaningStatus === "cleaning"}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                {cleaningStatus === "cleaning" ? t("dataPrep.cleaningInProgress") : t("dataPrep.autoClean")}
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
          )}
          <p className="mt-3 text-xs text-muted-foreground">{t("dataPrep.cleaningDesc")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
