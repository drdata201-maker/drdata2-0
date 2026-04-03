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

export interface ChiSquareResult {
  var1: string;
  var2: string;
  chiSquare: number;
  df: number;
  pValue: number;
  cramersV: number;
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

export interface AnalysisResultItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  descriptive?: DescriptiveResult[];
  frequencies?: FrequencyResult[];
  correlations?: CorrelationResult[];
  tTests?: TTestResult[];
  regressions?: RegressionResult[];
  chiSquares?: ChiSquareResult[];
  anovas?: AnovaResult[];
}

// --- Computation helpers ---

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

// Approximate p-value from t-statistic using normal approximation
function tToP(t: number, df: number): number {
  const x = df / (df + t * t);
  if (df <= 0) return 1;
  // Simple approximation
  const absT = Math.abs(t);
  const p = Math.exp(-0.717 * absT - 0.416 * absT * absT);
  return Math.min(1, Math.max(0, p * 2));
}

function rToP(r: number, n: number): number {
  if (n < 3) return 1;
  const t = r * Math.sqrt((n - 2) / (1 - r * r + 1e-10));
  return tToP(t, n - 2);
}

// --- Analysis runners ---

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
  const tStat = se === 0 ? 0 : (m1 - m2) / se;
  const df = g1.length + g2.length - 2;

  return {
    variable: depVar,
    groupVar,
    groups: groupNames.slice(0, 2),
    means: [round(m1), round(m2)],
    tStat: round(tStat, 4),
    pValue: round(tToP(tStat, df), 4),
    df,
  };
}

export function computeChiSquare(
  rows: Record<string, unknown>[],
  var1: string,
  var2: string
): ChiSquareResult {
  const contingency: Record<string, Record<string, number>> = {};
  rows.forEach(r => {
    const a = String(r[var1] ?? "");
    const b = String(r[var2] ?? "");
    if (!contingency[a]) contingency[a] = {};
    contingency[a][b] = (contingency[a][b] || 0) + 1;
  });

  const rowKeys = Object.keys(contingency);
  const colKeys = [...new Set(rowKeys.flatMap(rk => Object.keys(contingency[rk])))];
  const n = rows.length;

  let chi2 = 0;
  for (const rk of rowKeys) {
    const rowTotal = colKeys.reduce((s, ck) => s + (contingency[rk][ck] || 0), 0);
    for (const ck of colKeys) {
      const colTotal = rowKeys.reduce((s, rk2) => s + (contingency[rk2]?.[ck] || 0), 0);
      const expected = (rowTotal * colTotal) / n;
      const observed = contingency[rk][ck] || 0;
      if (expected > 0) chi2 += (observed - expected) ** 2 / expected;
    }
  }

  const df = (rowKeys.length - 1) * (colKeys.length - 1);
  const k = Math.min(rowKeys.length, colKeys.length);
  const cramersV = k > 1 ? Math.sqrt(chi2 / (n * (k - 1))) : 0;

  return {
    var1, var2,
    chiSquare: round(chi2, 4),
    df,
    pValue: round(Math.exp(-chi2 / 2), 4), // approximation
    cramersV: round(cramersV, 4),
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
  const fStat = msWithin > 0 ? msBetween / msWithin : 0;

  return {
    dependent: depVar,
    factor,
    groups: groupEntries,
    fStat: round(fStat, 4),
    pValue: round(Math.exp(-fStat / 2), 4),
    dfBetween,
    dfWithin,
  };
}

export function computeRegression(
  rows: Record<string, unknown>[],
  depVar: string,
  indVars: string[]
): RegressionResult {
  // Simple/multiple regression using least squares (simplified)
  const validRows = rows.filter(r =>
    !isNaN(Number(r[depVar])) && indVars.every(v => !isNaN(Number(r[v])))
  );

  const n = validRows.length;
  const y = validRows.map(r => Number(r[depVar]));
  const yMean = mean(y);

  // For simple regression (1 independent variable)
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
    const fStat = mse > 0 ? (ssTot - ssRes) / mse : 0;

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
      fPValue: round(tToP(Math.sqrt(fStat), n - 2), 4),
      n,
    };
  }

  // Multiple regression: simplified approximation using pairwise correlations
  const coefficients = indVars.map(iv => {
    const x = validRows.map(r => Number(r[iv]));
    const r = pearsonR(x, y);
    const sx = std(x);
    const sy = std(y);
    const b = sy > 0 && sx > 0 ? r * (sy / sx) : 0;
    const se = n > 2 ? Math.sqrt((1 - r * r) / (n - 2)) * (sy / sx) : 0;
    const t = se > 0 ? b / se : 0;
    return { variable: iv, b: round(b, 4), se: round(se, 4), t: round(t, 4), p: round(tToP(t, n - indVars.length - 1), 4) };
  });

  const predicted = validRows.map(r =>
    coefficients.reduce((s, c) => s + c.b * Number(r[c.variable]), 0)
  );
  const ssRes = y.reduce((s, yi, i) => s + (yi - predicted[i]) ** 2, 0);
  const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const k = indVars.length;
  const adjR2 = n > k + 1 ? 1 - ((1 - r2) * (n - 1)) / (n - k - 1) : r2;

  return {
    dependent: depVar,
    independents: indVars,
    coefficients: [
      { variable: "(Intercept)", b: round(yMean - coefficients.reduce((s, c) => s + c.b * mean(validRows.map(r => Number(r[c.variable]))), 0), 4), se: 0, t: 0, p: 0 },
      ...coefficients,
    ],
    rSquared: round(Math.max(0, Math.min(1, r2)), 4),
    adjustedR2: round(Math.max(0, Math.min(1, adjR2)), 4),
    fStat: round(r2 / (1 - r2 + 1e-10) * ((n - k - 1) / k), 4),
    fPValue: 0,
    n,
  };
}

function round(v: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}
