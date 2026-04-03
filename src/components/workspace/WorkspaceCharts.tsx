import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, Upload } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Build histogram bins from numeric values
function buildHistogram(values: number[], bins = 10) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / bins;
  const counts = new Array(bins).fill(0);
  values.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    counts[idx]++;
  });
  return counts.map((count, i) => ({
    name: `${(min + i * binWidth).toFixed(1)}`,
    value: count,
  }));
}

// Build box plot data from numeric values
function buildBoxData(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number) => {
    const pos = (sorted.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined
      ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
      : sorted[base];
  };
  return {
    min: sorted[0],
    q1: q(0.25),
    median: q(0.5),
    q3: q(0.75),
    max: sorted[sorted.length - 1],
  };
}

function getNumericValues(rows: Record<string, unknown>[], col: string): number[] {
  return rows
    .map(r => r[col])
    .filter(v => v != null && v !== "" && !isNaN(Number(v)))
    .map(Number);
}

export function WorkspaceCharts() {
  const { t } = useLanguage();
  const { dataset, analysisResults } = useDataset();

  const charts = useMemo(() => {
    if (!dataset) return [];
    const rows = dataset.rawData;
    const numVars = dataset.variables.filter(v => v.type === "numeric").map(v => v.name);
    const catVars = dataset.variables.filter(v => v.type === "categorical" || v.type === "ordinal").map(v => v.name);
    const items: { key: string; title: string; type: string; data: unknown; extra?: unknown }[] = [];

    // Auto-generate charts based on analysis results
    for (const result of analysisResults) {
      // Descriptive → Histograms for each numeric variable
      if (result.descriptive) {
        for (const desc of result.descriptive.slice(0, 4)) {
          const vals = getNumericValues(rows, desc.variable);
          items.push({
            key: `hist-${desc.variable}`,
            title: `${t("charts.histogram")}: ${desc.variable}`,
            type: "histogram",
            data: buildHistogram(vals),
          });
        }
      }

      // Frequencies → Pie/Bar charts
      if (result.frequencies) {
        for (const freq of result.frequencies.slice(0, 4)) {
          items.push({
            key: `pie-${freq.variable}`,
            title: `${t("charts.pieChart")}: ${freq.variable}`,
            type: "pie",
            data: freq.categories.slice(0, 8).map(c => ({ name: c.value, value: c.count })),
          });
          items.push({
            key: `bar-${freq.variable}`,
            title: `${t("charts.barChart")}: ${freq.variable}`,
            type: "bar",
            data: freq.categories.slice(0, 10).map(c => ({ name: c.value, value: c.count })),
          });
        }
      }

      // Correlations → Scatter plots
      if (result.correlations) {
        for (const corr of result.correlations.slice(0, 4)) {
          const xVals = getNumericValues(rows, corr.var1);
          const yVals = getNumericValues(rows, corr.var2);
          const n = Math.min(xVals.length, yVals.length, 200);
          const scatterData = Array.from({ length: n }, (_, i) => ({
            x: xVals[i], y: yVals[i],
          }));
          items.push({
            key: `scatter-${corr.var1}-${corr.var2}`,
            title: `${t("charts.scatter")}: ${corr.var1} × ${corr.var2} (r=${corr.r})`,
            type: "scatter",
            data: scatterData,
          });
        }
      }

      // Regression → Scatter + trend
      if (result.regressions) {
        for (const reg of result.regressions) {
          if (reg.independents.length === 1) {
            const xVals = getNumericValues(rows, reg.independents[0]);
            const yVals = getNumericValues(rows, reg.dependent);
            const n = Math.min(xVals.length, yVals.length, 200);
            const scatterData = Array.from({ length: n }, (_, i) => ({
              x: xVals[i], y: yVals[i],
            }));
            items.push({
              key: `reg-${reg.dependent}`,
              title: `${t("charts.regression")}: ${reg.dependent} ~ ${reg.independents[0]} (R²=${reg.rSquared})`,
              type: "scatter",
              data: scatterData,
            });
          }
        }
      }

      // ANOVA → Box plot approximation as grouped bar
      if (result.anovas) {
        for (const a of result.anovas) {
          items.push({
            key: `anova-bar-${a.dependent}-${a.factor}`,
            title: `${t("charts.boxPlot")}: ${a.dependent} × ${a.factor}`,
            type: "bar",
            data: a.groups.map(g => ({ name: g.name, value: g.mean, std: g.std })),
          });
        }
      }

      // T-Test → Comparison bar
      if (result.tTests) {
        for (const tt of result.tTests) {
          items.push({
            key: `ttest-${tt.variable}`,
            title: `T-Test: ${tt.variable}`,
            type: "bar",
            data: tt.groups.map((g, i) => ({ name: g, value: tt.means[i] })),
          });
        }
      }
    }

    // If no analyses yet but dataset loaded, show basic overview charts
    if (items.length === 0 && numVars.length > 0) {
      for (const col of numVars.slice(0, 2)) {
        const vals = getNumericValues(rows, col);
        items.push({
          key: `overview-hist-${col}`,
          title: `${t("charts.histogram")}: ${col}`,
          type: "histogram",
          data: buildHistogram(vals),
        });
      }
      if (catVars.length > 0) {
        const col = catVars[0];
        const counts: Record<string, number> = {};
        rows.forEach(r => {
          const v = String(r[col] ?? "");
          counts[v] = (counts[v] || 0) + 1;
        });
        items.push({
          key: `overview-pie-${col}`,
          title: `${t("charts.pieChart")}: ${col}`,
          type: "pie",
          data: Object.entries(counts).slice(0, 8).map(([name, value]) => ({ name, value })),
        });
      }
    }

    return items;
  }, [dataset, analysisResults, t]);

  if (!dataset) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Upload className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("charts.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  if (charts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("charts.noCharts")}</p>
          <p className="text-xs text-muted-foreground">{t("charts.runAnalysis")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {charts.map(chart => (
        <Card key={chart.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm truncate">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {chart.type === "histogram" || chart.type === "bar" ? (
                <BarChart data={chart.data as { name: string; value: number }[]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chart.type === "scatter" ? (
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="x" type="number" className="text-xs" />
                  <YAxis dataKey="y" type="number" className="text-xs" />
                  <Tooltip />
                  <Scatter data={chart.data as { x: number; y: number }[]} fill="hsl(var(--primary))" />
                </ScatterChart>
              ) : chart.type === "pie" ? (
                <PieChart>
                  <Pie
                    data={chart.data as { name: string; value: number }[]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(chart.data as { name: string }[]).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <BarChart data={chart.data as { name: string; value: number }[]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
