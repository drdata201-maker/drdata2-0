import type { AnalysisResultItem } from "@/lib/statsEngine";
import type { VariableInfo } from "@/contexts/DatasetContext";
import { isIdentifierVariable } from "@/lib/academicFormatter";

export interface ChartItem {
  key: string;
  title: string;
  type: "histogram" | "bar" | "scatter" | "pie" | "scree" | "cluster-scatter" | "grouped-bar" | "residual";
  analysisType?: "descriptive" | "frequency" | "bivariate" | "advanced";
  data: { name?: string; value?: number; x?: number; y?: number; cluster?: number; cumulative?: number; group?: string }[];
}

function getNumericValues(rows: Record<string, unknown>[], col: string): number[] {
  return rows
    .map(r => r[col])
    .filter(v => v != null && v !== "" && !isNaN(Number(v)))
    .map(Number);
}

function buildHistogram(values: number[], bins = 10): { name: string; value: number }[] {
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

export function buildChartData(
  rows: Record<string, unknown>[],
  variables: VariableInfo[],
  analysisResults: AnalysisResultItem[],
  tFn: (key: string) => string,
): ChartItem[] {
  const numVars = variables.filter(v => v.type === "numeric" && !isIdentifierVariable(v.name, rows)).map(v => v.name);
  const catVars = variables.filter(v => (v.type === "categorical" || v.type === "ordinal") && !isIdentifierVariable(v.name, rows)).map(v => v.name);
  const items: ChartItem[] = [];

  for (const result of analysisResults) {
    if (result.descriptive) {
      for (const desc of result.descriptive.filter(d => !isIdentifierVariable(d.variable, rows)).slice(0, 4)) {
        const vals = getNumericValues(rows, desc.variable);
        items.push({
          key: `hist-${desc.variable}`,
          title: `${tFn("charts.histogram")}: ${desc.variable}`,
          type: "histogram",
          analysisType: "descriptive",
          data: buildHistogram(vals),
        });
      }
    }

    if (result.frequencies) {
      for (const freq of result.frequencies.filter(f => !isIdentifierVariable(f.variable, rows)).slice(0, 4)) {
        items.push({
          key: `pie-${freq.variable}`,
          title: `${tFn("charts.pieChart")}: ${freq.variable}`,
          type: "pie",
          analysisType: "frequency",
          data: freq.categories.slice(0, 8).map(c => ({ name: c.value, value: c.count })),
        });
        items.push({
          key: `bar-${freq.variable}`,
          title: `${tFn("charts.barChart")}: ${freq.variable}`,
          type: "bar",
          analysisType: "frequency",
          data: freq.categories.slice(0, 10).map(c => ({ name: c.value, value: c.count })),
        });
      }
    }

    if (result.correlations) {
      for (const corr of result.correlations.slice(0, 4)) {
        const xVals = getNumericValues(rows, corr.var1);
        const yVals = getNumericValues(rows, corr.var2);
        const n = Math.min(xVals.length, yVals.length, 200);
        items.push({
          key: `scatter-${corr.var1}-${corr.var2}`,
          title: `${tFn("charts.scatter")}: ${corr.var1} × ${corr.var2} (r=${corr.r})`,
          type: "scatter",
          analysisType: "bivariate",
          data: Array.from({ length: n }, (_, i) => ({ x: xVals[i], y: yVals[i] })),
        });
      }
    }

    if (result.regressions) {
      for (const reg of result.regressions) {
        if (reg.independents.length === 1) {
          const xVals = getNumericValues(rows, reg.independents[0]);
          const yVals = getNumericValues(rows, reg.dependent);
          const n = Math.min(xVals.length, yVals.length, 200);
          items.push({
            key: `reg-${reg.dependent}`,
            title: `${tFn("charts.regression")}: ${reg.dependent} ~ ${reg.independents[0]} (R²=${reg.rSquared})`,
            type: "scatter",
            analysisType: "bivariate",
            data: Array.from({ length: n }, (_, i) => ({ x: xVals[i], y: yVals[i] })),
          });
          // Residual plot
          const coeffs = reg.coefficients;
          if (coeffs.length >= 2) {
            const intercept = coeffs[0].b;
            const slope = coeffs[1].b;
            items.push({
              key: `residual-${reg.dependent}`,
              title: `${tFn("charts.residualPlot") || "Residuals"}: ${reg.dependent} ~ ${reg.independents[0]}`,
              type: "residual",
              analysisType: "bivariate",
              data: Array.from({ length: n }, (_, i) => {
                const predicted = intercept + slope * xVals[i];
                return { x: predicted, y: yVals[i] - predicted };
              }),
            });
          }
        }
      }
    }

    // Chi-square / Cross-tab grouped bar chart
    if (result.chiSquares) {
      for (const chi of result.chiSquares) {
        if (chi.contingencyTable) {
          const ct = chi.contingencyTable;
          const groupedData: ChartItem["data"] = [];
          for (let ri = 0; ri < ct.rowLabels.length; ri++) {
            for (let ci = 0; ci < ct.colLabels.length; ci++) {
              groupedData.push({
                name: ct.colLabels[ci],
                value: ct.observed[ri][ci],
                group: ct.rowLabels[ri],
              });
            }
          }
          items.push({
            key: `crosstab-${chi.var1}-${chi.var2}`,
            title: `${tFn("charts.groupedBar") || "Cross-tab"}: ${chi.var1} × ${chi.var2}`,
            type: "grouped-bar",
            analysisType: "bivariate",
            data: groupedData,
          });
        }
      }
    }

    if (result.anovas) {
      for (const a of result.anovas) {
        items.push({
          key: `anova-bar-${a.dependent}-${a.factor}`,
          title: `${tFn("charts.boxPlot")}: ${a.dependent} × ${a.factor}`,
          type: "bar",
          analysisType: "bivariate",
          data: a.groups.map(g => ({ name: g.name, value: g.mean })),
        });
      }
    }

    if (result.tTests) {
      for (const tt of result.tTests) {
        items.push({
          key: `ttest-${tt.variable}`,
          title: `T-Test: ${tt.variable}`,
          type: "bar",
          analysisType: "bivariate",
          data: tt.groups.map((g, i) => ({ name: g, value: tt.means[i] })),
        });
      }
    }

    // Scree plot for PCA
    if (result.pca) {
      items.push({
        key: `scree-pca`,
        title: `Scree Plot — ${tFn("charts.varianceExplained") || "Variance expliquée"}`,
        type: "scree",
        data: result.pca.components.map(c => ({
          name: `PC${c.component}`,
          value: c.eigenvalue,
          cumulative: c.cumulativeVariance,
        })),
      });
    }

    // Cluster scatter plot
    if (result.clusterAnalysis && result.clusterAnalysis.assignments) {
      const ca = result.clusterAnalysis;
      const vars = ca.clusters[0]?.centroid.map(c => c.variable) || [];
      if (vars.length >= 2) {
        const xVar = vars[0];
        const yVar = vars[1];
        const validRows = rows
          .map((r, i) => ({ x: Number(r[xVar]), y: Number(r[yVar]), idx: i }))
          .filter(r => !isNaN(r.x) && !isNaN(r.y));
        items.push({
          key: `cluster-scatter`,
          title: `${tFn("charts.clusterScatter") || "Clusters"}: ${xVar} × ${yVar}`,
          type: "cluster-scatter",
          data: validRows.slice(0, 300).map(r => ({
            x: r.x,
            y: r.y,
            cluster: (ca.assignments![r.idx] ?? 0) + 1,
          })),
        });
      }
    }

    // Spearman correlation scatter plots
    if (result.spearmanCorrelations) {
      for (const s of result.spearmanCorrelations.slice(0, 4)) {
        const xVals = getNumericValues(rows, s.var1);
        const yVals = getNumericValues(rows, s.var2);
        const n = Math.min(xVals.length, yVals.length, 200);
        items.push({
          key: `spearman-${s.var1}-${s.var2}`,
          title: `Spearman: ${s.var1} × ${s.var2} (ρ=${s.rho})`,
          type: "scatter",
          analysisType: "bivariate",
          data: Array.from({ length: n }, (_, i) => ({ x: xVals[i], y: yVals[i] })),
        });
      }
    }

    // Paired t-test bar
    if (result.pairedTTests) {
      for (const pt of result.pairedTTests) {
        const v1Vals = getNumericValues(rows, pt.var1);
        const v2Vals = getNumericValues(rows, pt.var2);
        const mean1 = v1Vals.length ? v1Vals.reduce((a, b) => a + b, 0) / v1Vals.length : 0;
        const mean2 = v2Vals.length ? v2Vals.reduce((a, b) => a + b, 0) / v2Vals.length : 0;
        items.push({
          key: `paired-ttest-${pt.var1}-${pt.var2}`,
          title: `${tFn("results.pairedTTest") || "Paired t-Test"}: ${pt.var1} × ${pt.var2}`,
          type: "bar",
          analysisType: "bivariate",
          data: [{ name: pt.var1, value: mean1 }, { name: pt.var2, value: mean2 }],
        });
      }
    }

    // Mann-Whitney bar
    if (result.mannWhitney) {
      for (const mw of result.mannWhitney) {
        items.push({
          key: `mw-${mw.variable}-${mw.groupVar}`,
          title: `Mann-Whitney: ${mw.variable} × ${mw.groupVar}`,
          type: "bar",
          analysisType: "bivariate",
          data: mw.groups.map((g, i) => ({ name: g, value: i === 0 ? mw.n1 : mw.n2 })),
        });
      }
    }

    // Kruskal-Wallis mean rank bar
    if (result.kruskalWallis) {
      for (const kw of result.kruskalWallis) {
        items.push({
          key: `kw-${kw.dependent}-${kw.factor}`,
          title: `Kruskal-Wallis: ${kw.dependent} × ${kw.factor}`,
          type: "bar",
          analysisType: "bivariate",
          data: kw.groups.map(g => ({ name: g.name, value: g.meanRank })),
        });
      }
    }

    // Factor analysis loading bar chart
    if (result.factorAnalysis) {
      const fa = result.factorAnalysis;
      const retainedFactors = fa.factors.filter(f => f.eigenvalue >= 1);
      if (retainedFactors.length > 0) {
        items.push({
          key: `factor-scree`,
          title: `${tFn("charts.varianceExplained") || "Variance"} — Factor Analysis`,
          type: "scree",
          analysisType: "advanced",
          data: fa.factors.map(f => ({
            name: `F${f.factor}`,
            value: f.eigenvalue,
            cumulative: f.cumulativeVariance,
          })),
        });
      }
    }
  }

  // Fallback overview
  if (items.length === 0 && numVars.length > 0) {
    for (const col of numVars.slice(0, 2)) {
      const vals = getNumericValues(rows, col);
      items.push({ key: `overview-hist-${col}`, title: `${tFn("charts.histogram")}: ${col}`, type: "histogram", data: buildHistogram(vals) });
    }
    if (catVars.length > 0) {
      const col = catVars[0];
      const counts: Record<string, number> = {};
      rows.forEach(r => { const v = String(r[col] ?? ""); counts[v] = (counts[v] || 0) + 1; });
      items.push({
        key: `overview-pie-${col}`,
        title: `${tFn("charts.pieChart")}: ${col}`,
        type: "pie",
        data: Object.entries(counts).slice(0, 8).map(([name, value]) => ({ name, value })),
      });
    }
  }

  return items;
}
