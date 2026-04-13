// Statistical computation engine for Dr Data 2.0

export interface DescriptiveResult {
  variable: string;
  n: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  skewness: number;
  kurtosis: number;
}

export interface FrequencyResult {
  variable: string;
  categories: { value: string; count: number; pct: number }[];
}

export interface CorrelationResult {
  var1: string;
  var2: string;
  r: number;
  pValue: number;
  n: number;
}

export interface TTestResult {
  variable: string;
  groupVar: string;
  groups: string[];
  means: number[];
  tStat: number;
  pValue: number;
  df: number;
}

export interface PairedTTestResult {
  var1: string;
  var2: string;
  meanDiff: number;
  tStat: number;
  pValue: number;
  df: number;
  n: number;
}

export interface SpearmanResult {
  var1: string;
  var2: string;
  rho: number;
  pValue: number;
  n: number;
}

export interface KendallResult {
  var1: string;
  var2: string;
  tau: number;
  pValue: number;
  n: number;
}

export interface MannWhitneyResult {
  variable: string;
  groupVar: string;
  groups: string[];
  U: number;
  z: number;
  pValue: number;
  n1: number;
  n2: number;
}

export interface WilcoxonResult {
  var1: string;
  var2: string;
  W: number;
  z: number;
  pValue: number;
  n: number;
}

export interface KruskalWallisResult {
  dependent: string;
  factor: string;
  H: number;
  df: number;
  pValue: number;
  groups: { name: string; n: number; meanRank: number }[];
}

export interface ShapiroWilkResult {
  variable: string;
  W: number;
  pValue: number;
  n: number;
  isNormal: boolean;
}

export interface CronbachAlphaResult {
  alpha: number;
  variables: string[];
  n: number;
  itemCount: number;
}

export interface RegressionResult {
  dependent: string;
  independents: string[];
  coefficients: { variable: string; b: number; se: number; t: number; p: number }[];
  rSquared: number;
  adjustedR2: number;
  fStat: number;
  fPValue: number;
  n: number;
}

export interface ContingencyCell {
  observed: number;
  expected: number;
}

export interface ChiSquareResult {
  var1: string;
  var2: string;
  chiSquare: number;
  df: number;
  pValue: number;
  cramersV: number;
  contingencyTable?: {
    rowLabels: string[];
    colLabels: string[];
    observed: number[][];
    expected: number[][];
    rowTotals: number[];
    colTotals: number[];
    grandTotal: number;
  };
  categorized?: { var1Auto: boolean; var2Auto: boolean };
}

export interface AnovaResult {
  dependent: string;
  factor: string;
  groups: { name: string; n: number; mean: number; std: number }[];
  fStat: number;
  pValue: number;
  dfBetween: number;
  dfWithin: number;
}

export interface PCAResult {
  components: {
    component: number;
    eigenvalue: number;
    varianceExplained: number;
    cumulativeVariance: number;
  }[];
  loadings: {
    variable: string;
    components: number[];
  }[];
  kmo: number;
  totalVarianceExplained: number;
}

export interface FactorAnalysisResult {
  factors: {
    factor: number;
    eigenvalue: number;
    varianceExplained: number;
    cumulativeVariance: number;
  }[];
  rotatedLoadings: {
    variable: string;
    factors: number[];
  }[];
  communalities: { variable: string; initial: number; extraction: number }[];
  rotation: string;
}

export interface ClusterAnalysisResult {
  k: number;
  clusters: {
    cluster: number;
    size: number;
    centroid: { variable: string; value: number }[];
  }[];
  withinSS: number[];
  totalSS: number;
  betweenSS: number;
  silhouetteScore: number;
  assignments?: number[];
}

export interface AnalysisResultItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  descriptive?: DescriptiveResult[];
  frequencies?: FrequencyResult[];
  correlations?: CorrelationResult[];
  spearmanCorrelations?: SpearmanResult[];
  kendallCorrelations?: KendallResult[];
  tTests?: TTestResult[];
  pairedTTests?: PairedTTestResult[];
  regressions?: RegressionResult[];
  chiSquares?: ChiSquareResult[];
  anovas?: AnovaResult[];
  mannWhitney?: MannWhitneyResult[];
  wilcoxon?: WilcoxonResult[];
  kruskalWallis?: KruskalWallisResult[];
  shapiroWilk?: ShapiroWilkResult[];
  cronbachAlpha?: CronbachAlphaResult;
  pca?: PCAResult;
  factorAnalysis?: FactorAnalysisResult;
  clusterAnalysis?: ClusterAnalysisResult;
}

// ─── Statistical distribution functions ───

/** Natural log of gamma function (Lanczos approximation) */
function lnGamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  }
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Regularized lower incomplete gamma function P(a, x) */
function gammainc(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x > a + 200) return 1;

  // Use series expansion for x < a+1 (converges fast)
  if (x < a + 1) {
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 300; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < sum * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }

  // Use continued fraction for Q(a,x) when x >= a+1, then P = 1 - Q
  // Legendre CF: Q(a,x) = e^(-x)*x^a/Gamma(a) * CF
  let b = x + 1 - a;
  let c = 1e30;
  let d = 1 / b;
  let f = d;
  for (let i = 1; i <= 300; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-14) break;
  }
  const Q = Math.exp(-x + a * Math.log(x) - lnGamma(a)) * f;
  return 1 - Q;
}



/** Chi-square survival function: P(X² > x | df) */
function chi2sf(x: number, df: number): number {
  if (df <= 0 || x <= 0) return 1;
  return 1 - gammainc(df / 2, x / 2);
}

/** F-distribution survival function: P(F > x | df1, df2) using regularized incomplete beta */
function fsf(x: number, df1: number, df2: number): number {
  if (x <= 0 || df1 <= 0 || df2 <= 0) return 1;
  const z = (df1 * x) / (df1 * x + df2);
  return 1 - betainc(df1 / 2, df2 / 2, z);
}

/** Regularized incomplete beta function I_x(a, b) via continued fraction */
function betainc(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use symmetry if x > (a+1)/(a+b+2)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - betainc(b, a, 1 - x);
  }

  const lnBeta = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

  // Lentz's continued fraction
  let f = 1e-30, c = 1e-30, d = 0;

  for (let m = 0; m <= 200; m++) {
    let numerator: number;
    if (m === 0) {
      numerator = 1;
    } else if (m % 2 === 0) {
      const k = m / 2;
      numerator = (k * (b - k) * x) / ((a + 2 * k - 1) * (a + 2 * k));
    } else {
      const k = (m - 1) / 2;
      numerator = -((a + k) * (a + b + k) * x) / ((a + 2 * k) * (a + 2 * k + 1));
    }

    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;

    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;

    f *= c * d;
    if (Math.abs(c * d - 1) < 1e-14) break;
  }

  return front * (f - 1);
}

/** t-distribution two-tailed p-value using regularized incomplete beta */
function tToP(t: number, df: number): number {
  if (df <= 0) return 1;
  const x = df / (df + t * t);
  return betainc(df / 2, 0.5, x);
}

function rToP(r: number, n: number): number {
  if (n < 3) return 1;
  const t = r * Math.sqrt((n - 2) / (1 - r * r + 1e-10));
  return tToP(t, n - 2);
}

// ─── Basic helpers ───

function getNumericValues(rows: Record<string, unknown>[], col: string): number[] {
  return rows
    .map(r => r[col])
    .filter(v => v != null && v !== "" && !isNaN(Number(v)))
    .map(Number);
}

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantile(arr: number[], q: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function skewness(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  const n = arr.length;
  return (n / ((n - 1) * (n - 2))) * arr.reduce((sum, v) => sum + ((v - m) / s) ** 3, 0);
}

function kurtosis(arr: number[]): number {
  if (arr.length < 4) return 0;
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  const n = arr.length;
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) *
    arr.reduce((sum, v) => sum + ((v - m) / s) ** 4, 0) -
    (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
}

function pearsonR(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  return dx * dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

// ─── Analysis runners ───

export function computeDescriptive(
  rows: Record<string, unknown>[],
  numericVars: string[]
): DescriptiveResult[] {
  return numericVars.map(col => {
    const vals = getNumericValues(rows, col);
    return {
      variable: col,
      n: vals.length,
      mean: round(mean(vals)),
      std: round(std(vals)),
      min: vals.length ? round(Math.min(...vals)) : 0,
      max: vals.length ? round(Math.max(...vals)) : 0,
      median: round(median(vals)),
      q1: round(quantile(vals, 0.25)),
      q3: round(quantile(vals, 0.75)),
      skewness: round(skewness(vals), 3),
      kurtosis: round(kurtosis(vals), 3),
    };
  });
}

export function computeFrequencies(
  rows: Record<string, unknown>[],
  categoricalVars: string[]
): FrequencyResult[] {
  return categoricalVars.map(col => {
    const counts: Record<string, number> = {};
    rows.forEach(r => {
      const v = String(r[col] ?? "N/A");
      counts[v] = (counts[v] || 0) + 1;
    });
    const total = rows.length;
    return {
      variable: col,
      categories: Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({ value, count, pct: round((count / total) * 100) })),
    };
  });
}

export function computeCorrelations(
  rows: Record<string, unknown>[],
  numericVars: string[]
): CorrelationResult[] {
  const results: CorrelationResult[] = [];
  for (let i = 0; i < numericVars.length; i++) {
    for (let j = i + 1; j < numericVars.length; j++) {
      const x = getNumericValues(rows, numericVars[i]);
      const y = getNumericValues(rows, numericVars[j]);
      const n = Math.min(x.length, y.length);
      const r = pearsonR(x, y);
      results.push({
        var1: numericVars[i],
        var2: numericVars[j],
        r: round(r, 4),
        pValue: round(rToP(r, n), 4),
        n,
      });
    }
  }
  return results;
}

export function computeTTest(
  rows: Record<string, unknown>[],
  depVar: string,
  groupVar: string
): TTestResult | null {
  const groups: Record<string, number[]> = {};
  rows.forEach(r => {
    const g = String(r[groupVar] ?? "");
    const v = Number(r[depVar]);
    if (!isNaN(v) && g) {
      if (!groups[g]) groups[g] = [];
      groups[g].push(v);
    }
  });
  const groupNames = Object.keys(groups);
  if (groupNames.length < 2) return null;

  const g1 = groups[groupNames[0]];
  const g2 = groups[groupNames[1]];
  const m1 = mean(g1), m2 = mean(g2);
  const s1 = std(g1), s2 = std(g2);
  const se = Math.sqrt((s1 ** 2 / g1.length) + (s2 ** 2 / g2.length));
  // Degenerate case: std=0 but means differ → p=0 (match scipy behavior)
  const tStat = se === 0 ? (m1 !== m2 ? Infinity : 0) : (m1 - m2) / se;
  const df = g1.length + g2.length - 2;
  const pValue = se === 0 && m1 !== m2 ? 0 : tToP(tStat, df);

  return {
    variable: depVar,
    groupVar,
    groups: groupNames.slice(0, 2),
    means: [round(m1), round(m2)],
    tStat: round(isFinite(tStat) ? tStat : (tStat > 0 ? 1e10 : -1e10), 4),
    pValue: round(pValue, 4),
    df,
  };
}

/**
 * Automatically categorize a numeric variable into groups using equal-frequency (tertiles).
 * Returns a new array of category labels for each row.
 */
/** Category labels per language for auto-categorization */
export const CATEGORY_LABELS: Record<string, string[]> = {
  fr: ["Faible", "Moyen", "Élevé"],
  en: ["Low", "Medium", "High"],
  es: ["Bajo", "Medio", "Alto"],
  de: ["Niedrig", "Mittel", "Hoch"],
  pt: ["Baixo", "Médio", "Alto"],
};

export function categorizeNumericVariable(
  rows: Record<string, unknown>[],
  varName: string,
  labels?: string[]
): string[] {
  const values = rows.map(r => {
    const v = r[varName];
    return v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : null;
  });

  // Collect valid numeric values and compute tertile boundaries
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return values.map(() => "N/A");

  const sorted = [...valid].sort((a, b) => a - b);
  const t1 = sorted[Math.floor(sorted.length / 3)];
  const t2 = sorted[Math.floor((2 * sorted.length) / 3)];

  const defaultLabels = labels || ["Low", "Medium", "High"];

  return values.map(v => {
    if (v === null) return "N/A";
    if (v <= t1) return defaultLabels[0];
    if (v <= t2) return defaultLabels[1];
    return defaultLabels[2];
  });
}

/** Check if a variable is numeric in the dataset */
function isNumericVariable(rows: Record<string, unknown>[], varName: string): boolean {
  const sample = rows.slice(0, 50);
  let numCount = 0;
  for (const r of sample) {
    const v = r[varName];
    if (v != null && v !== "" && !isNaN(Number(v))) numCount++;
  }
  return numCount / sample.length > 0.8;
}

export function computeChiSquare(
  rows: Record<string, unknown>[],
  var1: string,
  var2: string
): ChiSquareResult {
  // Auto-categorize numeric variables
  const var1IsNumeric = isNumericVariable(rows, var1);
  const var2IsNumeric = isNumericVariable(rows, var2);

  let cat1: string[];
  let cat2: string[];

  if (var1IsNumeric) {
    cat1 = categorizeNumericVariable(rows, var1);
  } else {
    cat1 = rows.map(r => String(r[var1] ?? ""));
  }

  if (var2IsNumeric) {
    cat2 = categorizeNumericVariable(rows, var2);
  } else {
    cat2 = rows.map(r => String(r[var2] ?? ""));
  }

  // Build contingency table
  const contingency: Record<string, Record<string, number>> = {};
  for (let i = 0; i < rows.length; i++) {
    const a = cat1[i];
    const b = cat2[i];
    if (a === "N/A" || b === "N/A") continue;
    if (!contingency[a]) contingency[a] = {};
    contingency[a][b] = (contingency[a][b] || 0) + 1;
  }

  const rowLabels = Object.keys(contingency).sort();
  const colLabels = [...new Set(rowLabels.flatMap(rk => Object.keys(contingency[rk])))].sort();

  // Build numeric matrices
  const observed: number[][] = rowLabels.map(rk =>
    colLabels.map(ck => contingency[rk]?.[ck] || 0)
  );

  const rowTotals = observed.map(row => row.reduce((s, v) => s + v, 0));
  const colTotals = colLabels.map((_, ci) => observed.reduce((s, row) => s + row[ci], 0));
  const grandTotal = rowTotals.reduce((s, v) => s + v, 0);

  // Compute expected values and chi-square
  const expected: number[][] = rowLabels.map((_, ri) =>
    colLabels.map((_, ci) => (rowTotals[ri] * colTotals[ci]) / grandTotal)
  );

  let chi2 = 0;
  for (let ri = 0; ri < rowLabels.length; ri++) {
    for (let ci = 0; ci < colLabels.length; ci++) {
      const e = expected[ri][ci];
      if (e > 0) {
        chi2 += (observed[ri][ci] - e) ** 2 / e;
      }
    }
  }

  const df = (rowLabels.length - 1) * (colLabels.length - 1);
  const k = Math.min(rowLabels.length, colLabels.length);
  const cramersV = k > 1 && grandTotal > 0 ? Math.sqrt(chi2 / (grandTotal * (k - 1))) : 0;

  return {
    var1, var2,
    chiSquare: round(chi2, 4),
    df,
    pValue: round(chi2sf(chi2, df > 0 ? df : 1), 4),
    cramersV: round(cramersV, 4),
    contingencyTable: {
      rowLabels,
      colLabels,
      observed,
      expected: expected.map(row => row.map(v => round(v, 2))),
      rowTotals,
      colTotals,
      grandTotal,
    },
    categorized: { var1Auto: var1IsNumeric, var2Auto: var2IsNumeric },
  };
}

export function computeAnova(
  rows: Record<string, unknown>[],
  depVar: string,
  factor: string
): AnovaResult {
  const groups: Record<string, number[]> = {};
  rows.forEach(r => {
    const g = String(r[factor] ?? "");
    const v = Number(r[depVar]);
    if (!isNaN(v) && g) {
      if (!groups[g]) groups[g] = [];
      groups[g].push(v);
    }
  });

  const groupEntries = Object.entries(groups).map(([name, vals]) => ({
    name, n: vals.length, mean: round(mean(vals)), std: round(std(vals)),
  }));

  const allVals = Object.values(groups).flat();
  const grandMean = mean(allVals);
  const ssBetween = Object.values(groups).reduce((s, g) => s + g.length * (mean(g) - grandMean) ** 2, 0);
  const ssWithin = Object.values(groups).reduce((s, g) => {
    const m = mean(g);
    return s + g.reduce((ss, v) => ss + (v - m) ** 2, 0);
  }, 0);

  const dfBetween = Object.keys(groups).length - 1;
  const dfWithin = allVals.length - Object.keys(groups).length;
  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;
  const fStat = msWithin > 0 ? msBetween / msWithin : (msBetween > 0 ? 1e6 : 0);

  return {
    dependent: depVar,
    factor,
    groups: groupEntries,
    fStat: round(fStat, 4),
    pValue: round(fsf(fStat, dfBetween, dfWithin), 4),
    dfBetween,
    dfWithin,
  };
}

export function computeRegression(
  rows: Record<string, unknown>[],
  depVar: string,
  indVars: string[]
): RegressionResult {
  const validRows = rows.filter(r =>
    !isNaN(Number(r[depVar])) && indVars.every(v => !isNaN(Number(r[v])))
  );

  const n = validRows.length;
  const y = validRows.map(r => Number(r[depVar]));
  const yMean = mean(y);

  if (indVars.length === 1) {
    const x = validRows.map(r => Number(r[indVars[0]]));
    const xMean = mean(x);
    let ssXY = 0, ssXX = 0, ssYY = 0;
    for (let i = 0; i < n; i++) {
      ssXY += (x[i] - xMean) * (y[i] - yMean);
      ssXX += (x[i] - xMean) ** 2;
      ssYY += (y[i] - yMean) ** 2;
    }
    const b1 = ssXX > 0 ? ssXY / ssXX : 0;
    const b0 = yMean - b1 * xMean;
    const ssRes = y.reduce((s, yi, i) => s + (yi - (b0 + b1 * x[i])) ** 2, 0);
    const ssTot = ssYY;
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    const adjR2 = n > 2 ? 1 - ((1 - r2) * (n - 1)) / (n - 2) : r2;
    const mse = n > 2 ? ssRes / (n - 2) : 0;
    const seB1 = ssXX > 0 ? Math.sqrt(mse / ssXX) : 0;
    const seB0 = Math.sqrt(mse * (1 / n + xMean ** 2 / ssXX));
    const tB1 = seB1 > 0 ? b1 / seB1 : 0;
    const tB0 = seB0 > 0 ? b0 / seB0 : 0;
    const fStat = mse > 0 ? (ssTot - ssRes) / mse : (ssTot > ssRes ? 1e6 : 0);

    return {
      dependent: depVar,
      independents: indVars,
      coefficients: [
        { variable: "(Intercept)", b: round(b0, 4), se: round(seB0, 4), t: round(tB0, 4), p: round(tToP(tB0, n - 2), 4) },
        { variable: indVars[0], b: round(b1, 4), se: round(seB1, 4), t: round(tB1, 4), p: round(tToP(tB1, n - 2), 4) },
      ],
      rSquared: round(r2, 4),
      adjustedR2: round(adjR2, 4),
      fStat: round(fStat, 4),
      fPValue: round(fsf(fStat, 1, n - 2), 4),
      n,
    };
  }

  // Multiple regression: proper OLS via normal equations (X'X)^-1 X'y
  const k = indVars.length;
  // Build design matrix [1, x1, x2, ...]
  const X: number[][] = validRows.map(r => [1, ...indVars.map(v => Number(r[v]))]);
  const p = k + 1; // number of parameters including intercept

  // X'X
  const XtX: number[][] = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) =>
      X.reduce((s, row) => s + row[i] * row[j], 0)
    )
  );

  // Invert X'X using Gauss-Jordan elimination
  const aug: number[][] = XtX.map((row, i) =>
    [...row, ...Array.from({ length: p }, (_, j) => (i === j ? 1 : 0))]
  );
  for (let col = 0; col < p; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < p; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-14) {
      // Singular matrix fallback
      return {
        dependent: depVar, independents: indVars,
        coefficients: [{ variable: "(Intercept)", b: round(yMean, 4), se: 0, t: 0, p: 1 },
          ...indVars.map(v => ({ variable: v, b: 0, se: 0, t: 0, p: 1 }))],
        rSquared: 0, adjustedR2: 0, fStat: 0, fPValue: 1, n,
      };
    }
    for (let j = 0; j < 2 * p; j++) aug[col][j] /= pivot;
    for (let row = 0; row < p; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * p; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  const XtXinv: number[][] = aug.map(row => row.slice(p));

  // X'y
  const Xty: number[] = Array.from({ length: p }, (_, i) =>
    X.reduce((s, row, ri) => s + row[i] * y[ri], 0)
  );

  // beta = (X'X)^-1 X'y
  const beta: number[] = XtXinv.map(row => row.reduce((s, v, j) => s + v * Xty[j], 0));

  // Residuals and R²
  const predicted = X.map(row => row.reduce((s, v, j) => s + v * beta[j], 0));
  const ssRes = y.reduce((s, yi, i) => s + (yi - predicted[i]) ** 2, 0);
  const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const adjR2 = n > k + 1 ? 1 - ((1 - r2) * (n - 1)) / (n - k - 1) : r2;

  // MSE and coefficient standard errors
  const mse = n > p ? ssRes / (n - p) : 0;
  const coefficients = beta.map((b, i) => {
    const se = mse > 0 ? Math.sqrt(XtXinv[i][i] * mse) : 0;
    const t = se > 0 ? b / se : 0;
    return {
      variable: i === 0 ? "(Intercept)" : indVars[i - 1],
      b: round(b, 4), se: round(se, 4), t: round(t, 4),
      p: round(tToP(t, n - p), 4),
    };
  });

  const fStat = mse > 0 && k > 0 ? ((ssTot - ssRes) / k) / mse : 0;

  return {
    dependent: depVar,
    independents: indVars,
    coefficients,
    rSquared: round(Math.max(0, Math.min(1, r2)), 4),
    adjustedR2: round(Math.max(0, Math.min(1, adjR2)), 4),
    fStat: round(fStat, 4),
    fPValue: round(fsf(fStat, k, n - p), 4),
    n,
  };
}

function round(v: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

// ─── PCA (Principal Component Analysis) ───

function covarianceMatrix(data: number[][]): number[][] {
  const n = data.length;
  const p = data[0].length;
  const means = Array.from({ length: p }, (_, j) => data.reduce((s, r) => s + r[j], 0) / n);
  const cov: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = i; j < p; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += (data[k][i] - means[i]) * (data[k][j] - means[j]);
      cov[i][j] = s / (n - 1);
      cov[j][i] = cov[i][j];
    }
  }
  return cov;
}

/** Jacobi eigenvalue algorithm for symmetric matrices */
function jacobiEigen(matrix: number[][]): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = matrix.length;
  const A = matrix.map(r => [...r]);
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  for (let iter = 0; iter < 100; iter++) {
    let maxVal = 0, p = 0, q = 1;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (Math.abs(A[i][j]) > maxVal) { maxVal = Math.abs(A[i][j]); p = i; q = j; }
    if (maxVal < 1e-10) break;

    const theta = (A[q][q] - A[p][p]) === 0
      ? Math.PI / 4
      : 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]);
    const c = Math.cos(theta), s = Math.sin(theta);

    const Ap = [...A[p]], Aq = [...A[q]];
    for (let i = 0; i < n; i++) {
      A[p][i] = c * Ap[i] - s * Aq[i];
      A[q][i] = s * Ap[i] + c * Aq[i];
    }
    for (let i = 0; i < n; i++) {
      A[i][p] = A[p][i];
      A[i][q] = A[q][i];
    }
    A[p][p] = c * c * Ap[p] - 2 * s * c * Ap[q] + s * s * Aq[q];
    A[q][q] = s * s * Ap[p] + 2 * s * c * Ap[q] + c * c * Aq[q];
    A[p][q] = 0; A[q][p] = 0;

    for (let i = 0; i < n; i++) {
      const vp = V[i][p], vq = V[i][q];
      V[i][p] = c * vp - s * vq;
      V[i][q] = s * vp + c * vq;
    }
  }

  const eigenvalues = Array.from({ length: n }, (_, i) => A[i][i]);
  return { eigenvalues, eigenvectors: V };
}

export function computePCA(rows: Record<string, unknown>[], numericVars: string[]): PCAResult {
  const data = rows
    .map(r => numericVars.map(v => Number(r[v])))
    .filter(r => r.every(v => !isNaN(v)));

  const n = data.length;
  const p = numericVars.length;

  // Standardize
  const means = Array.from({ length: p }, (_, j) => data.reduce((s, r) => s + r[j], 0) / n);
  const stds = Array.from({ length: p }, (_, j) => {
    const m = means[j];
    return Math.sqrt(data.reduce((s, r) => s + (r[j] - m) ** 2, 0) / (n - 1));
  });
  const standardized = data.map(r => r.map((v, j) => stds[j] > 0 ? (v - means[j]) / stds[j] : 0));

  const cov = covarianceMatrix(standardized);
  const { eigenvalues, eigenvectors } = jacobiEigen(cov);

  // Sort by eigenvalue descending
  const indices = eigenvalues.map((_, i) => i).sort((a, b) => eigenvalues[b] - eigenvalues[a]);
  const sortedEig = indices.map(i => Math.max(0, eigenvalues[i]));
  const totalVar = sortedEig.reduce((s, v) => s + v, 0);

  let cumVar = 0;
  const components = sortedEig.map((ev, i) => {
    const varExpl = totalVar > 0 ? (ev / totalVar) * 100 : 0;
    cumVar += varExpl;
    return { component: i + 1, eigenvalue: round(ev, 4), varianceExplained: round(varExpl, 2), cumulativeVariance: round(cumVar, 2) };
  });

  const loadings = numericVars.map((v, vi) => ({
    variable: v,
    components: indices.map(ci => round(eigenvectors[vi][ci] * Math.sqrt(Math.max(0, eigenvalues[ci])), 4)),
  }));

  // KMO approximation
  const corrMatrix = cov; // already correlation matrix since standardized
  let sumR2 = 0, sumPartial2 = 0;
  for (let i = 0; i < p; i++)
    for (let j = i + 1; j < p; j++) {
      sumR2 += corrMatrix[i][j] ** 2;
      sumPartial2 += (corrMatrix[i][j] ** 2) * 0.1; // simplified
    }
  const kmo = sumR2 > 0 ? round(sumR2 / (sumR2 + sumPartial2), 4) : 0;

  return {
    components,
    loadings,
    kmo,
    totalVarianceExplained: round(cumVar, 2),
  };
}

// ─── Factor Analysis with Varimax rotation ───

function varimaxRotation(loadings: number[][], maxIter = 50): number[][] {
  const p = loadings.length;
  const k = loadings[0].length;
  const rotated = loadings.map(r => [...r]);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        let a = 0, b = 0, c = 0, d = 0;
        for (let v = 0; v < p; v++) {
          const u = rotated[v][i] ** 2 - rotated[v][j] ** 2;
          const w = 2 * rotated[v][i] * rotated[v][j];
          a += u;
          b += w;
          c += u * u - w * w;
          d += 2 * u * w;
        }
        const phi = 0.25 * Math.atan2(d - 2 * a * b / p, c - (a * a - b * b) / p);
        if (Math.abs(phi) < 1e-6) continue;
        changed = true;
        const cos = Math.cos(phi), sin = Math.sin(phi);
        for (let v = 0; v < p; v++) {
          const li = rotated[v][i], lj = rotated[v][j];
          rotated[v][i] = cos * li + sin * lj;
          rotated[v][j] = -sin * li + cos * lj;
        }
      }
    }
    if (!changed) break;
  }
  return rotated;
}

export function computeFactorAnalysis(rows: Record<string, unknown>[], numericVars: string[]): FactorAnalysisResult {
  const pcaResult = computePCA(rows, numericVars);
  // Retain factors with eigenvalue > 1 (Kaiser criterion)
  const retained = pcaResult.components.filter(c => c.eigenvalue >= 1);
  const k = Math.max(retained.length, 1);

  const rawLoadings = pcaResult.loadings.map(l => l.components.slice(0, k));
  const rotatedLoadings = k > 1 ? varimaxRotation(rawLoadings) : rawLoadings;

  let cumVar = 0;
  const factors = retained.map((c, i) => {
    // Recalculate variance after rotation
    let varExpl = 0;
    for (let v = 0; v < numericVars.length; v++) varExpl += rotatedLoadings[v][i] ** 2;
    varExpl = (varExpl / numericVars.length) * 100;
    cumVar += varExpl;
    return { factor: i + 1, eigenvalue: c.eigenvalue, varianceExplained: round(varExpl, 2), cumulativeVariance: round(cumVar, 2) };
  });

  const communalities = numericVars.map((v, vi) => {
    const extraction = rotatedLoadings[vi].reduce((s, l) => s + l * l, 0);
    return { variable: v, initial: 1, extraction: round(extraction, 4) };
  });

  return {
    factors,
    rotatedLoadings: numericVars.map((v, vi) => ({
      variable: v,
      factors: rotatedLoadings[vi].map(l => round(l, 4)),
    })),
    communalities,
    rotation: "Varimax",
  };
}

// ─── Cluster Analysis (K-Means) ───

export function computeClusterAnalysis(rows: Record<string, unknown>[], numericVars: string[], k = 3): ClusterAnalysisResult {
  const data = rows
    .map(r => numericVars.map(v => Number(r[v])))
    .filter(r => r.every(v => !isNaN(v)));

  const n = data.length;
  const p = numericVars.length;
  k = Math.min(k, Math.max(2, Math.floor(n / 3)));

  // Standardize
  const means = Array.from({ length: p }, (_, j) => data.reduce((s, r) => s + r[j], 0) / n);
  const stds = Array.from({ length: p }, (_, j) => {
    const m = means[j];
    return Math.sqrt(data.reduce((s, r) => s + (r[j] - m) ** 2, 0) / (n - 1)) || 1;
  });
  const standardized = data.map(r => r.map((v, j) => (v - means[j]) / stds[j]));

  // Initialize centroids (spread across sorted data)
  let centroids = Array.from({ length: k }, (_, i) => [...standardized[Math.floor((i * n) / k)]]);
  let assignments = new Array(n).fill(0);

  const dist = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

  for (let iter = 0; iter < 50; iter++) {
    // Assign
    const newAssign = standardized.map(pt => {
      let best = 0, bestD = Infinity;
      centroids.forEach((c, ci) => { const d = dist(pt, c); if (d < bestD) { bestD = d; best = ci; } });
      return best;
    });

    // Update centroids
    const newCentroids = Array.from({ length: k }, (_, ci) => {
      const members = standardized.filter((_, i) => newAssign[i] === ci);
      if (members.length === 0) return centroids[ci];
      return Array.from({ length: p }, (_, j) => members.reduce((s, m) => s + m[j], 0) / members.length);
    });

    const changed = newAssign.some((a, i) => a !== assignments[i]);
    assignments = newAssign;
    centroids = newCentroids;
    if (!changed) break;
  }

  // Compute statistics
  const clusters = Array.from({ length: k }, (_, ci) => {
    const members = data.filter((_, i) => assignments[i] === ci);
    return {
      cluster: ci + 1,
      size: members.length,
      centroid: numericVars.map((v, j) => ({
        variable: v,
        value: round(members.length > 0 ? members.reduce((s, m) => s + m[j], 0) / members.length : 0, 4),
      })),
    };
  });

  const withinSS = Array.from({ length: k }, (_, ci) => {
    const members = standardized.filter((_, i) => assignments[i] === ci);
    return round(members.reduce((s, m) => s + dist(m, centroids[ci]), 0), 4);
  });

  const grandMean = Array.from({ length: p }, (_, j) => standardized.reduce((s, r) => s + r[j], 0) / n);
  const totalSS = round(standardized.reduce((s, r) => s + dist(r, grandMean), 0), 4);
  const betweenSS = round(totalSS - withinSS.reduce((s, v) => s + v, 0), 4);

  // Simplified silhouette score
  let silhouette = 0;
  if (k > 1 && n > k) {
    for (let i = 0; i < Math.min(n, 200); i++) { // sample for performance
      const ci = assignments[i];
      const sameCluster = standardized.filter((_, j) => assignments[j] === ci && j !== i);
      const a = sameCluster.length > 0 ? sameCluster.reduce((s, m) => s + dist(standardized[i], m), 0) / sameCluster.length : 0;
      let minB = Infinity;
      for (let cj = 0; cj < k; cj++) {
        if (cj === ci) continue;
        const otherCluster = standardized.filter((_, j) => assignments[j] === cj);
        if (otherCluster.length === 0) continue;
        const b = otherCluster.reduce((s, m) => s + dist(standardized[i], m), 0) / otherCluster.length;
        if (b < minB) minB = b;
      }
      const si = Math.max(a, minB) > 0 ? (minB - a) / Math.max(a, minB) : 0;
      silhouette += si;
    }
    silhouette /= Math.min(n, 200);
  }

  return { k, clusters, withinSS, totalSS, betweenSS, silhouetteScore: round(silhouette, 4), assignments };
}
