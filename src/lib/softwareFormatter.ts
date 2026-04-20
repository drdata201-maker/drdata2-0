/**
 * Adaptive statistical formatting based on selected software
 * Formats statistical values/notation in SPSS, Stata, R, or Python style
 */

export type StatSoftware = "spss" | "stata" | "r" | "python" | "epiinfo" | "jamovi" | "excel" | "";

interface StatFormatOptions {
  software: StatSoftware;
  lang?: string;
}

/** Format a p-value according to software convention */
export function formatPValue(p: number, opts: StatFormatOptions): string {
  const { software } = opts;
  // BLOCK 11 — Academic rule: never display "p = 0" / "p = 0.000".
  // All software branches collapse to the universally accepted "p < 0.001" notation
  // when the value is below the displayable threshold (preserves UI = Document = Export).
  if (p < 0.001) {
    switch (software) {
      case "spss": return "p < .001";
      case "r": return "p < 0.001";
      case "python": return "p < 0.001";
      case "stata": return "p < 0.001";
      default: return "p < 0.001";
    }
  }
  switch (software) {
    case "spss": return `p = .${p.toFixed(3).slice(2)}`;
    case "stata": return `p = ${p.toFixed(3)}`;
    case "r": return `p-value = ${p.toFixed(4)}`;
    case "python": return `pvalue=${p.toFixed(4)}`;
    default: return `p = ${p.toFixed(3)}`;
  }
}

/** Format chi-square result */
export function formatChiSquare(chi2: number, df: number, p: number, opts: StatFormatOptions): string {
  const pStr = formatPValue(p, opts);
  switch (opts.software) {
    case "spss": return `χ²(${df}) = ${chi2.toFixed(3)}, ${pStr}`;
    case "stata": return `Pearson chi2(${df}) = ${chi2.toFixed(4)}, Pr = ${p.toFixed(3)}`;
    case "r": return `X-squared = ${chi2.toFixed(4)}, df = ${df}, ${pStr}`;
    case "python": return `chi2=${chi2.toFixed(4)}, dof=${df}, ${pStr}`;
    default: return `χ²(${df}) = ${chi2.toFixed(3)}, ${pStr}`;
  }
}

/** Format t-test result */
export function formatTTest(t: number, df: number, p: number, opts: StatFormatOptions): string {
  const pStr = formatPValue(p, opts);
  switch (opts.software) {
    case "spss": return `t(${df}) = ${t.toFixed(3)}, ${pStr}`;
    case "stata": return `t = ${t.toFixed(4)}, df = ${df}, Pr(|T| > |t|) = ${p.toFixed(4)}`;
    case "r": return `t = ${t.toFixed(4)}, df = ${df}, ${pStr}`;
    case "python": return `statistic=${t.toFixed(4)}, df=${df}, ${pStr}`;
    default: return `t(${df}) = ${t.toFixed(3)}, ${pStr}`;
  }
}

/** Format ANOVA F result */
export function formatAnova(f: number, dfBetween: number, dfWithin: number, p: number, opts: StatFormatOptions): string {
  const pStr = formatPValue(p, opts);
  switch (opts.software) {
    case "spss": return `F(${dfBetween}, ${dfWithin}) = ${f.toFixed(3)}, ${pStr}`;
    case "stata": return `F(${dfBetween}, ${dfWithin}) = ${f.toFixed(2)}, Prob > F = ${p.toFixed(4)}`;
    case "r": return `F(${dfBetween}, ${dfWithin}) = ${f.toFixed(4)}, ${pStr}`;
    case "python": return `F_statistic=${f.toFixed(4)}, dfn=${dfBetween}, dfd=${dfWithin}, ${pStr}`;
    default: return `F(${dfBetween}, ${dfWithin}) = ${f.toFixed(3)}, ${pStr}`;
  }
}

/** Format correlation result */
export function formatCorrelation(r: number, p: number, n: number, type: "pearson" | "spearman" | "kendall", opts: StatFormatOptions): string {
  const pStr = formatPValue(p, opts);
  const symbol = type === "spearman" ? "ρ" : type === "kendall" ? "τ" : "r";
  switch (opts.software) {
    case "spss": return `${symbol} = .${Math.abs(r).toFixed(3).slice(r < 0 ? 1 : 2)}, ${pStr}, N = ${n}`;
    case "stata": return `${symbol} = ${r.toFixed(4)}, Prob > |${symbol}| = ${p.toFixed(4)}, obs = ${n}`;
    case "r": return `${symbol} = ${r.toFixed(7)}, ${pStr}`;
    case "python": return `statistic=${r.toFixed(4)}, ${pStr}`;
    default: return `${symbol} = ${r.toFixed(3)}, ${pStr}, n = ${n}`;
  }
}

/** Format regression coefficient */
export function formatCoefficient(variable: string, b: number, se: number, t: number, p: number, opts: StatFormatOptions): string {
  const pStr = formatPValue(p, opts);
  switch (opts.software) {
    case "spss": return `B = ${b.toFixed(3)}, SE = ${se.toFixed(3)}, t = ${t.toFixed(3)}, ${pStr}`;
    case "stata": return `Coef. = ${b.toFixed(7)}, Std.Err. = ${se.toFixed(7)}, t = ${t.toFixed(2)}, P>|t| = ${p.toFixed(3)}`;
    case "r": return `Estimate = ${b.toFixed(5)}, Std. Error = ${se.toFixed(5)}, t value = ${t.toFixed(3)}, Pr(>|t|) = ${p.toFixed(4)}`;
    case "python": return `coef=${b.toFixed(4)}, std_err=${se.toFixed(4)}, t=${t.toFixed(3)}, ${pStr}`;
    default: return `b = ${b.toFixed(3)}, SE = ${se.toFixed(3)}, t = ${t.toFixed(3)}, ${pStr}`;
  }
}

/** Format R² value */
export function formatRSquared(r2: number, adjR2: number, opts: StatFormatOptions): string {
  switch (opts.software) {
    case "spss": return `R² = .${r2.toFixed(3).slice(2)}, R² ajusté = .${adjR2.toFixed(3).slice(2)}`;
    case "stata": return `R-squared = ${r2.toFixed(4)}, Adj R-squared = ${adjR2.toFixed(4)}`;
    case "r": return `Multiple R-squared: ${r2.toFixed(4)}, Adjusted R-squared: ${adjR2.toFixed(4)}`;
    case "python": return `r_squared=${r2.toFixed(4)}, adj_r_squared=${adjR2.toFixed(4)}`;
    default: return `R² = ${r2.toFixed(3)}, R² ajusté = ${adjR2.toFixed(3)}`;
  }
}

/** Format descriptive statistics header label */
export function getDescriptiveHeaders(software: StatSoftware): string[] {
  switch (software) {
    case "spss": return ["Variable", "N", "Mean", "Std. Deviation", "Minimum", "Maximum"];
    case "stata": return ["Variable", "Obs", "Mean", "Std. Dev.", "Min", "Max"];
    case "r": return ["Variable", "n", "mean", "sd", "min", "max"];
    case "python": return ["variable", "count", "mean", "std", "min", "max"];
    default: return ["Variable", "N", "Mean", "Std. Dev.", "Min", "Max"];
  }
}

/** Get a single-line summary for a test result row */
export function formatTestResultRow(
  analysisResult: { type: string; [key: string]: unknown },
  opts: StatFormatOptions
): { label: string; value: string }[] {
  return []; // Placeholder — actual formatting done inline during export
}
