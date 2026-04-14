/**
 * Statistical assumption validation engine for Dr Data 2.0
 * Checks prerequisites before running statistical tests
 */

import { computeShapiroWilk } from "./statsEngine";

// Internal helper to run Shapiro-Wilk on raw values
function shapiroWilkRaw(values: number[]): { W: number; pValue: number } {
  // Create fake rows for the engine function
  const fakeVar = "__sw_check__";
  const fakeRows = values.map(v => ({ [fakeVar]: v }));
  const result = computeShapiroWilk(fakeRows, fakeVar);
  return { W: result.W, pValue: result.pValue };
}

export interface AssumptionCheck {
  test: string;
  assumption: string;
  passed: boolean;
  detail: string;
  suggestion?: string;
}

export interface ValidationResult {
  analysisType: string;
  valid: boolean;
  checks: AssumptionCheck[];
  alternativeSuggestion?: string;
}

function getNumericValues(rows: Record<string, unknown>[], col: string): number[] {
  return rows
    .map(r => r[col])
    .filter(v => v != null && v !== "" && !isNaN(Number(v)))
    .map(Number);
}

function getGroups(rows: Record<string, unknown>[], numVar: string, catVar: string): Record<string, number[]> {
  const groups: Record<string, number[]> = {};
  rows.forEach(r => {
    const g = String(r[catVar] ?? "");
    const v = Number(r[numVar]);
    if (!isNaN(v) && g) {
      if (!groups[g]) groups[g] = [];
      groups[g].push(v);
    }
  });
  return groups;
}

/** Check sample size minimum */
function checkSampleSize(n: number, minRequired: number, testName: string): AssumptionCheck {
  return {
    test: testName,
    assumption: "sample_size",
    passed: n >= minRequired,
    detail: `n=${n}, minimum=${minRequired}`,
    suggestion: n < minRequired ? `Sample too small (n=${n}). Consider non-parametric alternative or collect more data.` : undefined,
  };
}

/** Check normality using Shapiro-Wilk */
function checkNormality(values: number[], varName: string, alpha = 0.05): AssumptionCheck {
  if (values.length < 3 || values.length > 5000) {
    return {
      test: "Shapiro-Wilk",
      assumption: "normality",
      passed: values.length > 5000, // large samples are approximately normal by CLT
      detail: values.length < 3 ? `Too few values (n=${values.length})` : `Large sample (n=${values.length}), CLT applies`,
    };
  }
  const sw = shapiroWilkRaw(values);
  return {
    test: "Shapiro-Wilk",
    assumption: "normality",
    passed: sw.pValue > alpha,
    detail: `W=${sw.W}, p=${sw.pValue} for ${varName}`,
    suggestion: sw.pValue <= alpha ? `${varName} is not normally distributed (p=${sw.pValue}). Consider a non-parametric test.` : undefined,
  };
}

/** Check homogeneity of variances (Levene-like ratio check) */
function checkHomogeneity(groups: Record<string, number[]>): AssumptionCheck {
  const variances = Object.values(groups).filter(g => g.length > 1).map(g => {
    const m = g.reduce((s, v) => s + v, 0) / g.length;
    return g.reduce((s, v) => s + (v - m) ** 2, 0) / (g.length - 1);
  });
  if (variances.length < 2) {
    return { test: "Variance ratio", assumption: "homogeneity", passed: true, detail: "Insufficient groups" };
  }
  const maxVar = Math.max(...variances);
  const minVar = Math.min(...variances);
  const ratio = minVar > 0 ? maxVar / minVar : Infinity;
  const passed = ratio < 4; // Rule of thumb: ratio < 4 is acceptable
  return {
    test: "Variance ratio",
    assumption: "homogeneity",
    passed,
    detail: `Max/Min variance ratio = ${ratio.toFixed(2)}`,
    suggestion: !passed ? "Variances are heterogeneous. Consider Welch's correction or a non-parametric test." : undefined,
  };
}

/** Validate assumptions for t-test */
export function validateTTest(
  rows: Record<string, unknown>[],
  numVar: string,
  groupVar: string,
): ValidationResult {
  const groups = getGroups(rows, numVar, groupVar);
  const groupNames = Object.keys(groups);
  const checks: AssumptionCheck[] = [];

  // Must have exactly 2 groups
  checks.push({
    test: "Group count",
    assumption: "two_groups",
    passed: groupNames.length === 2,
    detail: `Found ${groupNames.length} groups`,
    suggestion: groupNames.length !== 2 ? "T-test requires exactly 2 groups. Use ANOVA for 3+ groups." : undefined,
  });

  // Sample size
  const totalN = Object.values(groups).reduce((s, g) => s + g.length, 0);
  checks.push(checkSampleSize(totalN, 10, "t-test"));

  // Normality per group
  for (const [name, vals] of Object.entries(groups)) {
    checks.push(checkNormality(vals, `${numVar} (${name})`));
  }

  // Homogeneity
  checks.push(checkHomogeneity(groups));

  const valid = checks.every(c => c.passed);
  return {
    analysisType: "t-test",
    valid,
    checks,
    alternativeSuggestion: !valid ? "Consider Mann-Whitney U test as a non-parametric alternative." : undefined,
  };
}

/** Validate assumptions for ANOVA */
export function validateAnova(
  rows: Record<string, unknown>[],
  numVar: string,
  factor: string,
): ValidationResult {
  const groups = getGroups(rows, numVar, factor);
  const checks: AssumptionCheck[] = [];

  checks.push({
    test: "Group count",
    assumption: "multiple_groups",
    passed: Object.keys(groups).length >= 2,
    detail: `Found ${Object.keys(groups).length} groups`,
    suggestion: Object.keys(groups).length < 2 ? "ANOVA requires at least 2 groups." : undefined,
  });

  const totalN = Object.values(groups).reduce((s, g) => s + g.length, 0);
  checks.push(checkSampleSize(totalN, 20, "ANOVA"));

  // Normality per group
  for (const [name, vals] of Object.entries(groups)) {
    checks.push(checkNormality(vals, `${numVar} (${name})`));
  }

  checks.push(checkHomogeneity(groups));

  const valid = checks.every(c => c.passed);
  return {
    analysisType: "ANOVA",
    valid,
    checks,
    alternativeSuggestion: !valid ? "Consider Kruskal-Wallis test as a non-parametric alternative." : undefined,
  };
}

/** Validate assumptions for correlation */
export function validateCorrelation(
  rows: Record<string, unknown>[],
  var1: string,
  var2: string,
): ValidationResult {
  const v1 = getNumericValues(rows, var1);
  const v2 = getNumericValues(rows, var2);
  const n = Math.min(v1.length, v2.length);
  const checks: AssumptionCheck[] = [];

  checks.push(checkSampleSize(n, 10, "Correlation"));
  checks.push(checkNormality(v1, var1));
  checks.push(checkNormality(v2, var2));

  const valid = checks.every(c => c.passed);
  return {
    analysisType: "Pearson Correlation",
    valid,
    checks,
    alternativeSuggestion: !valid ? "Consider Spearman rank correlation for non-normal data." : undefined,
  };
}

/** Validate assumptions for regression */
export function validateRegression(
  rows: Record<string, unknown>[],
  dependent: string,
  independents: string[],
): ValidationResult {
  const checks: AssumptionCheck[] = [];
  const depVals = getNumericValues(rows, dependent);
  
  checks.push(checkSampleSize(depVals.length, Math.max(20, 10 * independents.length), "Regression"));
  checks.push(checkNormality(depVals, dependent));

  // Check for multicollinearity (simple pairwise check)
  if (independents.length >= 2) {
    for (let i = 0; i < independents.length; i++) {
      for (let j = i + 1; j < independents.length; j++) {
        const v1 = getNumericValues(rows, independents[i]);
        const v2 = getNumericValues(rows, independents[j]);
        const n = Math.min(v1.length, v2.length);
        if (n > 2) {
          const m1 = v1.slice(0, n).reduce((s, v) => s + v, 0) / n;
          const m2 = v2.slice(0, n).reduce((s, v) => s + v, 0) / n;
          let num = 0, d1 = 0, d2 = 0;
          for (let k = 0; k < n; k++) {
            num += (v1[k] - m1) * (v2[k] - m2);
            d1 += (v1[k] - m1) ** 2;
            d2 += (v2[k] - m2) ** 2;
          }
          const r = d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
          const highCorr = Math.abs(r) > 0.9;
          checks.push({
            test: "Multicollinearity",
            assumption: "no_multicollinearity",
            passed: !highCorr,
            detail: `r(${independents[i]}, ${independents[j]}) = ${r.toFixed(3)}`,
            suggestion: highCorr ? `High correlation (r=${r.toFixed(3)}) between ${independents[i]} and ${independents[j]}. Consider removing one.` : undefined,
          });
        }
      }
    }
  }

  const valid = checks.every(c => c.passed);
  return {
    analysisType: "Regression",
    valid,
    checks,
    alternativeSuggestion: !valid ? "Check sample size and variable distributions before proceeding." : undefined,
  };
}

/** Validate assumptions for chi-square */
export function validateChiSquare(
  rows: Record<string, unknown>[],
  var1: string,
  var2: string,
): ValidationResult {
  const checks: AssumptionCheck[] = [];

  checks.push(checkSampleSize(rows.length, 20, "Chi-square"));

  // Check expected frequencies >= 5
  const contingency: Record<string, Record<string, number>> = {};
  rows.forEach(r => {
    const a = String(r[var1] ?? "");
    const b = String(r[var2] ?? "");
    if (!a || !b) return;
    if (!contingency[a]) contingency[a] = {};
    contingency[a][b] = (contingency[a][b] || 0) + 1;
  });

  const rowLabels = Object.keys(contingency);
  const colLabels = [...new Set(rowLabels.flatMap(rk => Object.keys(contingency[rk])))];
  const n = rows.length;
  let lowExpected = 0;
  let totalCells = 0;

  for (const rl of rowLabels) {
    const rowTotal = colLabels.reduce((s, cl) => s + (contingency[rl]?.[cl] || 0), 0);
    for (const cl of colLabels) {
      const colTotal = rowLabels.reduce((s, r) => s + (contingency[r]?.[cl] || 0), 0);
      const expected = (rowTotal * colTotal) / n;
      if (expected < 5) lowExpected++;
      totalCells++;
    }
  }

  const pctLow = totalCells > 0 ? (lowExpected / totalCells) * 100 : 0;
  checks.push({
    test: "Expected frequencies",
    assumption: "min_expected_5",
    passed: pctLow <= 20,
    detail: `${lowExpected}/${totalCells} cells (${pctLow.toFixed(0)}%) have expected count < 5`,
    suggestion: pctLow > 20 ? "More than 20% of cells have expected count < 5. Consider Fisher's exact test or merging categories." : undefined,
  });

  const valid = checks.every(c => c.passed);
  return {
    analysisType: "Chi-square",
    valid,
    checks,
    alternativeSuggestion: !valid ? "Consider Fisher's exact test or merge rare categories." : undefined,
  };
}

/** Validate PCA assumptions */
export function validatePCA(
  rows: Record<string, unknown>[],
  variables: string[],
): ValidationResult {
  const checks: AssumptionCheck[] = [];
  const n = rows.filter(r => variables.every(v => r[v] != null && r[v] !== "" && !isNaN(Number(r[v])))).length;

  checks.push(checkSampleSize(n, Math.max(50, 5 * variables.length), "PCA"));

  checks.push({
    test: "Variable count",
    assumption: "min_variables",
    passed: variables.length >= 3,
    detail: `${variables.length} variables selected`,
    suggestion: variables.length < 3 ? "PCA requires at least 3 variables." : undefined,
  });

  const valid = checks.every(c => c.passed);
  return {
    analysisType: "PCA",
    valid,
    checks,
    alternativeSuggestion: !valid ? "Ensure sufficient sample size and variable count before PCA." : undefined,
  };
}
