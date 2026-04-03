import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import type { AnalysisResultItem } from "@/contexts/DatasetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table2, TrendingUp, BarChart3, Upload } from "lucide-react";

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
        </div>
      ))}
    </div>
  );
}
