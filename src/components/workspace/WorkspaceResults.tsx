import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import type { AnalysisResultItem } from "@/contexts/DatasetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table2, TrendingUp, BarChart3, Upload, Layers, GitBranch, CircleDot, Pencil, Check, X } from "lucide-react";
import { generateTableTitle, generateTableInterpretation, getTableLabel, getSource } from "@/lib/academicFormatter";

function SignificanceBadge({ p }: { p: number }) {
  if (p < 0.001) return <Badge className="bg-green-600 text-white">p &lt; 0.001 ***</Badge>;
  if (p < 0.01) return <Badge className="bg-green-500 text-white">p &lt; 0.01 **</Badge>;
  if (p < 0.05) return <Badge className="bg-primary text-primary-foreground">p &lt; 0.05 *</Badge>;
  return <Badge variant="outline">p = {p}</Badge>;
}

type StudyLevel = "student_license" | "student_master" | "student_doctorate" | string;

/** Determine what statistical detail to show based on academic level */
function getLevelConfig(level: StudyLevel) {
  if (level.includes("doctor") || level.includes("doctorat")) {
    return { showCramersV: true, showEffectSize: true, showAdvancedMetrics: true, showAdjR2: true, showKMO: true, showCommunalities: true, showSilhouette: true, detailLevel: "doctorate" as const };
  }
  if (level.includes("master")) {
    return { showCramersV: true, showEffectSize: true, showAdvancedMetrics: false, showAdjR2: true, showKMO: true, showCommunalities: false, showSilhouette: true, detailLevel: "master" as const };
  }
  return { showCramersV: false, showEffectSize: false, showAdvancedMetrics: false, showAdjR2: false, showKMO: false, showCommunalities: false, showSilhouette: false, detailLevel: "licence" as const };
}

function DescriptiveTable({ data }: { data: NonNullable<AnalysisResultItem["descriptive"]> }) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-academic">
          <Table2 className="h-4 w-4 text-primary" />
          {t("results.descriptiveStats")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-academic">
            <thead>
              <tr className="border-b border-border">
                {["Variable", "N", "M", "SD", "Min", "Q1", "Mdn", "Q3", "Max"].map(h => (
                  <th key={h} className={`px-2 py-1.5 text-left font-medium text-muted-foreground text-xs ${["M", "SD", "N", "Mdn"].includes(h) ? "stat-notation" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.variable} className="border-b border-border/50">
                  <td className="px-2 py-1.5 font-medium text-foreground">{row.variable}</td>
                  <td className="px-2 py-1.5 text-foreground">{row.n}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.mean}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.std}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.min}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.q1}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.median}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.q3}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function FrequencyTable({ data }: { data: NonNullable<AnalysisResultItem["frequencies"]> }) {
  const { t } = useLanguage();
  return (
    <>
      {data.map(freq => (
        <Card key={freq.variable}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("results.frequency")}: {freq.variable}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.value")}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.count")}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">%</th>
                </tr>
              </thead>
              <tbody>
                {freq.categories.map(cat => (
                  <tr key={cat.value} className="border-b border-border/50">
                    <td className="px-2 py-1.5 text-foreground">{cat.value}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{cat.count}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{cat.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function CorrelationTable({ data }: { data: NonNullable<AnalysisResultItem["correlations"]> }) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-academic">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("results.correlations")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm font-academic">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Var 1</th>
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Var 2</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">r</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">p</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">N</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">Sig.</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-2 py-1.5 text-foreground">{c.var1}</td>
                <td className="px-2 py-1.5 text-foreground">{c.var2}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.r}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.pValue}</td>
                <td className="px-2 py-1.5 text-right text-foreground">{c.n}</td>
                <td className="px-2 py-1.5 text-right"><SignificanceBadge p={c.pValue} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function RegressionTable({ data, level }: { data: NonNullable<AnalysisResultItem["regressions"]>; level: StudyLevel }) {
  const { t } = useLanguage();
  const cfg = getLevelConfig(level);
  return (
    <>
      {data.map((reg, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">{t("results.regression")}: {reg.dependent}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="outline"><span className="stat-notation">R²</span> = {reg.rSquared}</Badge>
              {cfg.showAdjR2 && <Badge variant="outline">Adj. <span className="stat-notation">R²</span> = {reg.adjustedR2}</Badge>}
              <Badge variant="outline"><span className="stat-notation">F</span> = {reg.fStat}</Badge>
              <Badge variant="outline"><span className="stat-notation">N</span> = {reg.n}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm font-academic">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">B</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">SE</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">t</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">Sig.</th>
                </tr>
              </thead>
              <tbody>
                {reg.coefficients.map(c => (
                  <tr key={c.variable} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{c.variable}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.b}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.se}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.t}</td>
                    <td className="px-2 py-1.5 text-right"><SignificanceBadge p={c.p} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function AnovaTable({ data }: { data: NonNullable<AnalysisResultItem["anovas"]> }) {
  const { t } = useLanguage();
  return (
    <>
      {data.map((a, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">ANOVA : {a.dependent} × {a.factor}</CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline"><span className="stat-notation">F</span>({a.dfBetween},{a.dfWithin}) = {a.fStat}</Badge>
              <SignificanceBadge p={a.pValue} />
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm font-academic">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.group")}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">N</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">M</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">SD</th>
                </tr>
              </thead>
              <tbody>
                {a.groups.map(g => (
                  <tr key={g.name} className="border-b border-border/50">
                    <td className="px-2 py-1.5 text-foreground">{g.name}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{g.n}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{g.mean}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{g.std}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function ChiSquareTable({ data, level }: { data: NonNullable<AnalysisResultItem["chiSquares"]>; level: StudyLevel }) {
  const { t } = useLanguage();
  const cfg = getLevelConfig(level);
  return (
    <>
      {data.map((c, i) => (
        <div key={i} className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-academic">
                <span className="stat-notation">χ²</span> : {c.var1} × {c.var2}
              </CardTitle>
              {c.categorized && (c.categorized.var1Auto || c.categorized.var2Auto) && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  {t("results.autoCategorized") || "Variables numériques auto-catégorisées (Low/Medium/High)"}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-academic">
              <div className="flex justify-between">
                <span className="text-muted-foreground stat-notation">χ²({c.df})</span>
                <span className="font-mono text-foreground">= {c.chiSquare}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground stat-notation">p</span><span className="font-mono text-foreground">= {c.pValue}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sig.</span><SignificanceBadge p={c.pValue} /></div>
              {cfg.showCramersV && (
                <div className="flex justify-between"><span className="text-muted-foreground stat-notation">V</span><span className="font-mono text-foreground">= {c.cramersV}</span></div>
              )}
              {cfg.showEffectSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("results.effectSize") || "Taille d'effet"}</span>
                  <Badge variant="outline" className="text-xs">
                    {c.cramersV < 0.1 ? (t("results.negligible") || "Négligeable") :
                     c.cramersV < 0.3 ? (t("results.weak") || "Faible") :
                     c.cramersV < 0.5 ? (t("results.moderate") || "Modéré") :
                     (t("results.strong") || "Fort")}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contingency table */}
          {c.contingencyTable && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("results.contingencyTable") || "Tableau de contingence"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{c.var1} \ {c.var2}</th>
                        {c.contingencyTable.colLabels.map(cl => (
                          <th key={cl} className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{cl}</th>
                        ))}
                        <th className="px-2 py-1.5 text-right font-medium text-primary text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.contingencyTable.rowLabels.map((rl, ri) => (
                        <tr key={rl} className="border-b border-border/50">
                          <td className="px-2 py-1.5 font-medium text-foreground">{rl}</td>
                          {c.contingencyTable!.observed[ri].map((obs, ci) => (
                            <td key={ci} className="px-2 py-1.5 text-right font-mono text-foreground">
                              {obs}
                              {cfg.detailLevel !== "licence" && (
                                <span className="text-muted-foreground text-[10px] block">({c.contingencyTable!.expected[ri][ci]})</span>
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-1.5 text-right font-mono font-bold text-primary">{c.contingencyTable!.rowTotals[ri]}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-primary/20">
                        <td className="px-2 py-1.5 font-bold text-primary">Total</td>
                        {c.contingencyTable.colTotals.map((ct, ci) => (
                          <td key={ci} className="px-2 py-1.5 text-right font-mono font-bold text-primary">{ct}</td>
                        ))}
                        <td className="px-2 py-1.5 text-right font-mono font-bold text-primary">{c.contingencyTable.grandTotal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {cfg.detailLevel !== "licence" && (
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    {t("results.expectedInParens") || "Les valeurs attendues sont indiquées entre parenthèses"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </>
  );
}

function TTestTable({ data }: { data: NonNullable<AnalysisResultItem["tTests"]> }) {
  const { t } = useLanguage();
  return (
    <>
      {data.map((tt, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">
              <span className="stat-notation">t</span>-Test : {tt.variable} × {tt.groupVar}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-academic">
            <div className="flex justify-between"><span className="text-muted-foreground">{tt.groups[0]} (<span className="stat-notation">M</span>)</span><span className="font-mono text-foreground">= {tt.means[0]}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{tt.groups[1]} (<span className="stat-notation">M</span>)</span><span className="font-mono text-foreground">= {tt.means[1]}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">t({tt.df})</span><span className="font-mono text-foreground">= {tt.tStat}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">p</span><SignificanceBadge p={tt.pValue} /></div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function PCATable({ data, level }: { data: NonNullable<AnalysisResultItem["pca"]>; level: StudyLevel }) {
  const { t } = useLanguage();
  const cfg = getLevelConfig(level);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-academic">
            <Layers className="h-4 w-4 text-primary" />
            {t("results.pcaVariance")}
          </CardTitle>
          <div className="flex gap-2 mt-1">
            {cfg.showKMO && <Badge variant="outline">KMO = {data.kmo}</Badge>}
            <Badge variant="outline">{t("results.totalVariance")}: {data.totalVarianceExplained}%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.component")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.eigenvalue")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.varianceExplained")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.cumulativeVariance")}</th>
              </tr>
            </thead>
            <tbody>
              {data.components.map(c => (
                <tr key={c.component} className={`border-b border-border/50 ${c.eigenvalue >= 1 ? "bg-primary/5" : ""}`}>
                  <td className="px-2 py-1.5 font-medium text-foreground">PC{c.component}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.eigenvalue}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.varianceExplained}%</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.cumulativeVariance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("results.componentLoadings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
                  {data.components.filter(c => c.eigenvalue >= 1).map(c => (
                    <th key={c.component} className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">PC{c.component}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.loadings.map(l => (
                  <tr key={l.variable} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{l.variable}</td>
                    {l.components.slice(0, data.components.filter(c => c.eigenvalue >= 1).length).map((v, i) => (
                      <td key={i} className={`px-2 py-1.5 text-right font-mono ${Math.abs(v) >= 0.5 ? "text-primary font-bold" : "text-foreground"}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FactorAnalysisTable({ data, level }: { data: NonNullable<AnalysisResultItem["factorAnalysis"]>; level: StudyLevel }) {
  const { t } = useLanguage();
  const cfg = getLevelConfig(level);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-academic">
            <GitBranch className="h-4 w-4 text-primary" />
            {t("results.factorAnalysisTitle")}
          </CardTitle>
          <Badge variant="outline" className="mt-1 w-fit">{t("results.rotation")}: {data.rotation}</Badge>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.factor")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.eigenvalue")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.varianceExplained")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.cumulativeVariance")}</th>
              </tr>
            </thead>
            <tbody>
              {data.factors.map(f => (
                <tr key={f.factor} className="border-b border-border/50">
                  <td className="px-2 py-1.5 font-medium text-foreground">F{f.factor}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{f.eigenvalue}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{f.varianceExplained}%</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{f.cumulativeVariance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("results.rotatedLoadings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
                   {data.factors.map(f => (
                    <th key={f.factor} className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">F{f.factor}</th>
                  ))}
                  {cfg.showCommunalities && <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.communality")}</th>}
                </tr>
              </thead>
              <tbody>
                {data.rotatedLoadings.map((l, li) => (
                  <tr key={l.variable} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{l.variable}</td>
                    {l.factors.map((v, i) => (
                      <td key={i} className={`px-2 py-1.5 text-right font-mono ${Math.abs(v) >= 0.5 ? "text-primary font-bold" : "text-foreground"}`}>{v}</td>
                    ))}
                    {cfg.showCommunalities && <td className="px-2 py-1.5 text-right font-mono text-foreground">{data.communalities[li]?.extraction}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClusterAnalysisTable({ data, level }: { data: NonNullable<AnalysisResultItem["clusterAnalysis"]>; level: StudyLevel }) {
  const { t } = useLanguage();
  const cfg = getLevelConfig(level);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-academic">
            <CircleDot className="h-4 w-4 text-primary" />
            {t("results.clusterAnalysisTitle")}
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="outline">K = {data.k}</Badge>
            {cfg.showSilhouette && <Badge variant="outline">{t("results.silhouette")}: {data.silhouetteScore}</Badge>}
            {cfg.showAdvancedMetrics && <Badge variant="outline">BSS/TSS = {data.totalSS > 0 ? ((data.betweenSS / data.totalSS) * 100).toFixed(1) : 0}%</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.cluster")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.size")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.withinSS")}</th>
              </tr>
            </thead>
            <tbody>
              {data.clusters.map((c, i) => (
                <tr key={c.cluster} className="border-b border-border/50">
                  <td className="px-2 py-1.5 font-medium text-foreground">{t("results.cluster")} {c.cluster}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.size}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{data.withinSS[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("results.clusterCentroids")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
                  {data.clusters.map(c => (
                    <th key={c.cluster} className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.cluster")} {c.cluster}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.clusters[0]?.centroid.map((cv, vi) => (
                  <tr key={cv.variable} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{cv.variable}</td>
                    {data.clusters.map(c => (
                      <td key={c.cluster} className="px-2 py-1.5 text-right font-mono text-foreground">{c.centroid[vi]?.value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Editable text block for titles, interpretations, and source
function EditableText({ value, onChange, variant = "text" }: { value: string; onChange: (v: string) => void; variant?: "title" | "text" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-start gap-2">
        {variant === "title" ? (
          <Input value={draft} onChange={e => setDraft(e.target.value)} className="text-sm font-semibold" autoFocus />
        ) : (
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="text-xs min-h-[60px] resize-y" autoFocus />
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { onChange(draft); setEditing(false); }}>
          <Check className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setDraft(value); setEditing(false); }}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group relative inline-flex items-start gap-1">
      {variant === "title" ? (
        <span className="font-semibold text-sm text-foreground">{value}</span>
      ) : (
        <span className="text-xs text-muted-foreground italic leading-relaxed">{value}</span>
      )}
      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={() => { setDraft(value); setEditing(true); }}>
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function WorkspaceResults({ level = "student_license" }: { level?: string }) {
  const { t, lang } = useLanguage();
  const { analysisResults, dataset } = useDataset();

  // Track editable overrides for titles, interpretations, sources
  const [overrides, setOverrides] = useState<Record<string, { title?: string; interpretation?: string; source?: string }>>({});

  const updateOverride = (id: string, field: "title" | "interpretation" | "source", value: string) => {
    setOverrides(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  if (!dataset) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Upload className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("results.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  if (analysisResults.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("results.noResults")}</p>
          <p className="text-xs text-muted-foreground">{t("results.selectAnalysis")}</p>
        </CardContent>
      </Card>
    );
  }

  const tableLabel = getTableLabel(lang);
  const defaultSource = getSource(lang);

  return (
    <div className="space-y-8">
      {analysisResults.map((result, idx) => {
        const tableNum = idx + 1;
        const autoTitle = generateTableTitle(result, lang, t);
        const autoInterp = generateTableInterpretation(result, lang, "");
        const ov = overrides[result.id] || {};
        const title = ov.title || autoTitle;
        const interpretation = ov.interpretation || autoInterp;
        const source = ov.source || defaultSource;

        return (
          <div key={result.id} className="space-y-3">
            {/* Academic header: Table N: Title */}
            <div className="border-b-2 border-primary/20 pb-2">
              <div className="flex items-baseline gap-2">
                <Badge variant="secondary" className="text-xs font-bold shrink-0">
                  {tableLabel} {tableNum}
                </Badge>
                <EditableText value={title} onChange={v => updateOverride(result.id, "title", v)} variant="title" />
              </div>
            </div>

            {/* Table content */}
            {result.descriptive && <DescriptiveTable data={result.descriptive} />}
            {result.frequencies && <FrequencyTable data={result.frequencies} />}
            {result.correlations && <CorrelationTable data={result.correlations} />}
            {result.regressions && <RegressionTable data={result.regressions} />}
            {result.tTests && <TTestTable data={result.tTests} />}
            {result.anovas && <AnovaTable data={result.anovas} />}
            {result.chiSquares && <ChiSquareTable data={result.chiSquares} />}
            {result.pca && <PCATable data={result.pca} />}
            {result.factorAnalysis && <FactorAnalysisTable data={result.factorAnalysis} />}
            {result.clusterAnalysis && <ClusterAnalysisTable data={result.clusterAnalysis} />}

            {/* Source */}
            <div className="pl-1">
              <EditableText value={source} onChange={v => updateOverride(result.id, "source", v)} />
            </div>

            {/* Inline interpretation */}
            {interpretation && (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{t("results.interpretation") || "Interpretation"}</Badge>
                    <span className="text-xs text-muted-foreground italic leading-relaxed font-academic" style={{ textAlign: "justify" }}>{interpretation}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
