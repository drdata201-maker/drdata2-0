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

function DescriptiveTable({ data }: { data: NonNullable<AnalysisResultItem["descriptive"]> }) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Table2 className="h-4 w-4 text-primary" />
          {t("results.descriptiveStats")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Variable", "N", t("workspace.mean"), t("workspace.std"), "Min", "Q1", "Median", "Q3", "Max"].map(h => (
                  <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{h}</th>
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
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("results.correlations")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Var 1</th>
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Var 2</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">r</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">p-value</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">N</th>
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

function RegressionTable({ data }: { data: NonNullable<AnalysisResultItem["regressions"]> }) {
  const { t } = useLanguage();
  return (
    <>
      {data.map((reg, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("results.regression")}: {reg.dependent}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="outline">R² = {reg.rSquared}</Badge>
              <Badge variant="outline">Adj. R² = {reg.adjustedR2}</Badge>
              <Badge variant="outline">F = {reg.fStat}</Badge>
              <Badge variant="outline">N = {reg.n}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">B</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">SE</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">t</th>
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
            <CardTitle className="text-sm">ANOVA: {a.dependent} × {a.factor}</CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">F({a.dfBetween},{a.dfWithin}) = {a.fStat}</Badge>
              <SignificanceBadge p={a.pValue} />
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.group")}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">N</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("workspace.mean")}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("workspace.std")}</th>
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

function ChiSquareTable({ data }: { data: NonNullable<AnalysisResultItem["chiSquares"]> }) {
  return (
    <>
      {data.map((c, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chi-Square: {c.var1} × {c.var2}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">χ²</span><span className="font-mono text-foreground">{c.chiSquare}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">df</span><span className="font-mono text-foreground">{c.df}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">p-value</span><SignificanceBadge p={c.pValue} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cramér's V</span><span className="font-mono text-foreground">{c.cramersV}</span></div>
          </CardContent>
        </Card>
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
            <CardTitle className="text-sm">T-Test: {tt.variable} × {tt.groupVar}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{tt.groups[0]} ({t("workspace.mean")})</span><span className="font-mono text-foreground">{tt.means[0]}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{tt.groups[1]} ({t("workspace.mean")})</span><span className="font-mono text-foreground">{tt.means[1]}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">t({tt.df})</span><span className="font-mono text-foreground">{tt.tStat}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">p-value</span><SignificanceBadge p={tt.pValue} /></div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function PCATable({ data }: { data: NonNullable<AnalysisResultItem["pca"]> }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-primary" />
            {t("results.pcaVariance")}
          </CardTitle>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">KMO = {data.kmo}</Badge>
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

function FactorAnalysisTable({ data }: { data: NonNullable<AnalysisResultItem["factorAnalysis"]> }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
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
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.communality")}</th>
                </tr>
              </thead>
              <tbody>
                {data.rotatedLoadings.map((l, li) => (
                  <tr key={l.variable} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{l.variable}</td>
                    {l.factors.map((v, i) => (
                      <td key={i} className={`px-2 py-1.5 text-right font-mono ${Math.abs(v) >= 0.5 ? "text-primary font-bold" : "text-foreground"}`}>{v}</td>
                    ))}
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{data.communalities[li]?.extraction}</td>
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

function ClusterAnalysisTable({ data }: { data: NonNullable<AnalysisResultItem["clusterAnalysis"]> }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CircleDot className="h-4 w-4 text-primary" />
            {t("results.clusterAnalysisTitle")}
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="outline">K = {data.k}</Badge>
            <Badge variant="outline">{t("results.silhouette")}: {data.silhouetteScore}</Badge>
            <Badge variant="outline">BSS/TSS = {data.totalSS > 0 ? ((data.betweenSS / data.totalSS) * 100).toFixed(1) : 0}%</Badge>
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

export function WorkspaceResults() {
  const { t } = useLanguage();
  const { analysisResults, dataset } = useDataset();

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

  return (
    <div className="space-y-6">
      {analysisResults.map(result => (
        <div key={result.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{t(`student.analysis.${result.type}`) || result.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {new Date(result.timestamp).toLocaleTimeString()}
            </Badge>
          </div>

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
        </div>
      ))}
    </div>
  );
}
