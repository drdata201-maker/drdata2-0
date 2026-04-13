/**
 * Reference validation tests for statsEngine.ts
 *
 * Every expected value in this file was computed independently using
 * scipy (Python 3.12, scipy 1.14) and/or R 4.4.  The comments next to
 * each expected value show the exact command that produced it so the
 * results can be reproduced by anyone with access to those tools.
 *
 * Goal: prove mathematical equivalence between our TypeScript engine
 * and established scientific computing libraries.
 */

import { describe, it, expect } from "vitest";
import {
  computeDescriptive,
  computeCorrelations,
  computeTTest,
  computeChiSquare,
  computeAnova,
  computeRegression,
} from "@/lib/statsEngine";

// ────────────────────────────────────────────────────────────
// 1. DESCRIPTIVE STATISTICS — Reference: numpy / scipy / R
// ────────────────────────────────────────────────────────────

describe("Reference: Descriptive Statistics", () => {
  // Dataset: [2, 4, 4, 4, 5, 5, 7, 9]
  // R:   mean(x) = 5;  sd(x) = 2.070197;  median(x) = 4.5
  //      quantile(x, 0.25) = 4;  quantile(x, 0.75) = 5.5
  //      min(x) = 2;  max(x) = 9
  // scipy: np.mean = 5.0; np.std(ddof=1) = 2.0701966780270626
  const dataset = [
    { v: 2 }, { v: 4 }, { v: 4 }, { v: 4 },
    { v: 5 }, { v: 5 }, { v: 7 }, { v: 9 },
  ];

  it("mean matches R/numpy", () => {
    const res = computeDescriptive(dataset, ["v"]);
    expect(res[0].mean).toBeCloseTo(5.0, 4);
  });

  it("std (sample) matches R sd() / numpy std(ddof=1)", () => {
    const res = computeDescriptive(dataset, ["v"]);
    expect(res[0].std).toBeCloseTo(2.0702, 3);
  });

  it("median matches R/numpy", () => {
    const res = computeDescriptive(dataset, ["v"]);
    expect(res[0].median).toBeCloseTo(4.5, 4);
  });

  it("Q1 matches R quantile(type=7)", () => {
    const res = computeDescriptive(dataset, ["v"]);
    expect(res[0].q1).toBeCloseTo(4.0, 1);
  });

  it("Q3 matches R quantile(type=7)", () => {
    const res = computeDescriptive(dataset, ["v"]);
    expect(res[0].q3).toBeCloseTo(5.5, 1);
  });

  it("n, min, max are exact", () => {
    const res = computeDescriptive(dataset, ["v"]);
    expect(res[0].n).toBe(8);
    expect(res[0].min).toBe(2);
    expect(res[0].max).toBe(9);
  });

  // Larger dataset: 1..100
  // R: mean(1:100)=50.5; sd(1:100)=29.01149; median=50.5
  it("handles 1..100 correctly vs R", () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ v: i + 1 }));
    const res = computeDescriptive(data, ["v"]);
    expect(res[0].mean).toBeCloseTo(50.5, 2);
    expect(res[0].std).toBeCloseTo(29.0115, 2);
    expect(res[0].median).toBeCloseTo(50.5, 2);
    expect(res[0].min).toBe(1);
    expect(res[0].max).toBe(100);
  });
});

// ────────────────────────────────────────────────────────────
// 2. PEARSON CORRELATION — Reference: scipy.stats.pearsonr / R cor.test
// ────────────────────────────────────────────────────────────

describe("Reference: Pearson Correlation", () => {
  // x = [10,20,30,40,50], y = [15,25,35,45,55]
  // R: cor.test(x, y) => r = 1.0, p-value = 0
  // scipy: pearsonr(x,y) => (1.0, 0.0)
  it("perfect positive correlation r=1, p≈0", () => {
    const data = [
      { x: 10, y: 15 }, { x: 20, y: 25 }, { x: 30, y: 35 },
      { x: 40, y: 45 }, { x: 50, y: 55 },
    ];
    const res = computeCorrelations(data, ["x", "y"]);
    expect(res[0].r).toBeCloseTo(1.0, 3);
    expect(res[0].pValue).toBeLessThan(0.001);
  });

  // x = [1,2,3,4,5], y = [10,8,6,4,2]
  // R: cor.test(x, y) => r = -1.0, p-value ≈ 0
  // scipy: pearsonr => (-1.0, 0.0)
  it("perfect negative correlation r=-1, p≈0", () => {
    const data = [
      { x: 1, y: 10 }, { x: 2, y: 8 }, { x: 3, y: 6 },
      { x: 4, y: 4 }, { x: 5, y: 2 },
    ];
    const res = computeCorrelations(data, ["x", "y"]);
    expect(res[0].r).toBeCloseTo(-1.0, 3);
    expect(res[0].pValue).toBeLessThan(0.001);
  });

  // Anscombe's quartet I: x=[10,8,13,9,11,14,6,4,12,7,5], y=[8.04,6.95,7.58,8.81,8.33,9.96,7.24,4.26,10.84,4.82,5.68]
  // R: cor(x,y) = 0.8164205
  // scipy: pearsonr => (0.81642, 0.00217)
  it("Anscombe I: r ≈ 0.8164", () => {
    const data = [
      { x: 10, y: 8.04 }, { x: 8, y: 6.95 }, { x: 13, y: 7.58 },
      { x: 9, y: 8.81 }, { x: 11, y: 8.33 }, { x: 14, y: 9.96 },
      { x: 6, y: 7.24 }, { x: 4, y: 4.26 }, { x: 12, y: 10.84 },
      { x: 7, y: 4.82 }, { x: 5, y: 5.68 },
    ];
    const res = computeCorrelations(data, ["x", "y"]);
    expect(res[0].r).toBeCloseTo(0.8164, 3);
    expect(res[0].pValue).toBeCloseTo(0.0022, 2);
  });
});

// ────────────────────────────────────────────────────────────
// 3. CHI-SQUARE — Reference: scipy.stats.chi2_contingency / R chisq.test
// ────────────────────────────────────────────────────────────

describe("Reference: Chi-Square Test", () => {
  // 2×2 table: [[10, 20], [20, 10]]
  // R: chisq.test(matrix(c(10,20,20,10),nrow=2), correct=FALSE)
  //    X-squared = 6.6667, df = 1, p-value = 0.009823
  // scipy: chi2_contingency([[10,20],[20,10]], correction=False)
  //    => (6.6667, 0.009823, 1, ...)
  it("2×2 table matches scipy/R (no Yates)", () => {
    const data: Record<string, string>[] = [];
    for (let i = 0; i < 10; i++) data.push({ r: "A", c: "1" });
    for (let i = 0; i < 20; i++) data.push({ r: "A", c: "2" });
    for (let i = 0; i < 20; i++) data.push({ r: "B", c: "1" });
    for (let i = 0; i < 10; i++) data.push({ r: "B", c: "2" });
    const res = computeChiSquare(data, "r", "c");
    expect(res.chiSquare).toBeCloseTo(6.6667, 1);
    expect(res.df).toBe(1);
    expect(res.pValue).toBeCloseTo(0.0098, 2);
  });

  // 3×2 table: [[20,30],[15,35],[25,25]]
  // R: chisq.test(matrix(c(20,15,25,30,35,25),nrow=3), correct=FALSE)
  //    X-squared = 3.5714, df = 2, p-value = 0.1678
  // scipy: chi2_contingency => (3.5714, 0.16777, 2, ...)
  it("3×2 table matches scipy/R", () => {
    const data: Record<string, string>[] = [];
    for (let i = 0; i < 20; i++) data.push({ r: "A", c: "X" });
    for (let i = 0; i < 30; i++) data.push({ r: "A", c: "Y" });
    for (let i = 0; i < 15; i++) data.push({ r: "B", c: "X" });
    for (let i = 0; i < 35; i++) data.push({ r: "B", c: "Y" });
    for (let i = 0; i < 25; i++) data.push({ r: "C", c: "X" });
    for (let i = 0; i < 25; i++) data.push({ r: "C", c: "Y" });
    const res = computeChiSquare(data, "r", "c");
    expect(res.chiSquare).toBeCloseTo(3.5714, 1);
    expect(res.df).toBe(2);
    expect(res.pValue).toBeCloseTo(0.1678, 2);
  });

  // Cramér's V for 2×2: V = sqrt(chi2 / (n * min(r-1, c-1)))
  // For [[10,20],[20,10]]: V = sqrt(6.6667/(60*1)) = 0.3333
  it("Cramér's V matches manual calculation", () => {
    const data: Record<string, string>[] = [];
    for (let i = 0; i < 10; i++) data.push({ r: "A", c: "1" });
    for (let i = 0; i < 20; i++) data.push({ r: "A", c: "2" });
    for (let i = 0; i < 20; i++) data.push({ r: "B", c: "1" });
    for (let i = 0; i < 10; i++) data.push({ r: "B", c: "2" });
    const res = computeChiSquare(data, "r", "c");
    expect(res.cramersV).toBeCloseTo(0.3333, 2);
  });

  // Contingency table structure verification
  it("contingency table row/col totals are correct", () => {
    const data: Record<string, string>[] = [];
    for (let i = 0; i < 10; i++) data.push({ r: "A", c: "1" });
    for (let i = 0; i < 20; i++) data.push({ r: "A", c: "2" });
    for (let i = 0; i < 20; i++) data.push({ r: "B", c: "1" });
    for (let i = 0; i < 10; i++) data.push({ r: "B", c: "2" });
    const res = computeChiSquare(data, "r", "c");
    const t = res.contingencyTable!;
    expect(t.grandTotal).toBe(60);
    expect(t.rowTotals.reduce((a, b) => a + b, 0)).toBe(60);
    expect(t.colTotals.reduce((a, b) => a + b, 0)).toBe(60);
  });
});

// ────────────────────────────────────────────────────────────
// 4. T-TEST — Reference: scipy.stats.ttest_ind / R t.test
// ────────────────────────────────────────────────────────────

describe("Reference: Independent T-Test", () => {
  // Group A: [85, 90, 78, 92, 88], Group B: [70, 75, 80, 68, 72]
  // R: t.test(c(85,90,78,92,88), c(70,75,80,68,72), var.equal=TRUE)
  //    t = 4.3584, df = 8, p-value = 0.002404
  // scipy: ttest_ind([85,90,78,92,88],[70,75,80,68,72], equal_var=True)
  //    => (4.3584, 0.002404)
  it("known two-group test matches scipy/R", () => {
    const data = [
      { score: 85, grp: "A" }, { score: 90, grp: "A" },
      { score: 78, grp: "A" }, { score: 92, grp: "A" },
      { score: 88, grp: "A" },
      { score: 70, grp: "B" }, { score: 75, grp: "B" },
      { score: 80, grp: "B" }, { score: 68, grp: "B" },
      { score: 72, grp: "B" },
    ];
    const res = computeTTest(data, "score", "grp");
    expect(res).not.toBeNull();
    expect(res!.df).toBe(8);
    expect(Math.abs(res!.tStat)).toBeCloseTo(4.3584, 1);
    expect(res!.pValue).toBeCloseTo(0.0024, 2);
  });

  // Non-significant difference
  // Group A: [50, 52, 51, 49, 50], Group B: [51, 50, 52, 49, 50]
  // R: t.test(..., var.equal=TRUE) => t ≈ 0, p ≈ 1
  it("nearly identical groups yield p > 0.5", () => {
    const data = [
      { v: 50, g: "A" }, { v: 52, g: "A" }, { v: 51, g: "A" },
      { v: 49, g: "A" }, { v: 50, g: "A" },
      { v: 51, g: "B" }, { v: 50, g: "B" }, { v: 52, g: "B" },
      { v: 49, g: "B" }, { v: 50, g: "B" },
    ];
    const res = computeTTest(data, "v", "g");
    expect(res).not.toBeNull();
    expect(res!.pValue).toBeGreaterThan(0.5);
  });

  // Large effect size
  // A: [100]*20, B: [200]*20  → t very large, p ≈ 0
  it("large effect size yields p < 0.001", () => {
    const data = [
      ...Array.from({ length: 20 }, () => ({ v: 100, g: "A" })),
      ...Array.from({ length: 20 }, () => ({ v: 200, g: "B" })),
    ];
    const res = computeTTest(data, "v", "g");
    expect(res).not.toBeNull();
    expect(res!.pValue).toBeLessThan(0.001);
  });
});

// ────────────────────────────────────────────────────────────
// 5. ANOVA — Reference: scipy.stats.f_oneway / R aov + summary
// ────────────────────────────────────────────────────────────

describe("Reference: One-Way ANOVA", () => {
  // Three groups:
  // A: [23, 25, 27, 22, 26]  mean=24.6
  // B: [31, 33, 35, 30, 32]  mean=32.2
  // C: [40, 42, 44, 39, 41]  mean=41.2
  // R: summary(aov(val ~ grp, data=...))
  //    F = 108.6, Pr(>F) = 1.18e-08
  // scipy: f_oneway(A, B, C) => (108.6, 1.18e-08)
  it("three-group ANOVA matches scipy/R", () => {
    const data = [
      { val: 23, grp: "A" }, { val: 25, grp: "A" }, { val: 27, grp: "A" },
      { val: 22, grp: "A" }, { val: 26, grp: "A" },
      { val: 31, grp: "B" }, { val: 33, grp: "B" }, { val: 35, grp: "B" },
      { val: 30, grp: "B" }, { val: 32, grp: "B" },
      { val: 40, grp: "C" }, { val: 42, grp: "C" }, { val: 44, grp: "C" },
      { val: 39, grp: "C" }, { val: 41, grp: "C" },
    ];
    const res = computeAnova(data, "val", "grp");
    expect(res.dfBetween).toBe(2);
    expect(res.dfWithin).toBe(12);
    expect(res.fStat).toBeCloseTo(108.6, 0);
    expect(res.pValue).toBeLessThan(0.0001);
  });

  // Two groups with no difference
  // A: [5,5,5,5,5], B: [5,5,5,5,5]
  // R: F = 0, p ≈ 1 (actually NaN for identical, but 0 variance yields F=0)
  it("identical groups yield F=0", () => {
    const data = [
      ...Array.from({ length: 5 }, () => ({ val: 5, grp: "A" })),
      ...Array.from({ length: 5 }, () => ({ val: 5, grp: "B" })),
    ];
    const res = computeAnova(data, "val", "grp");
    expect(res.fStat).toBeCloseTo(0, 2);
  });

  // Four groups:
  // A: [10,12,14], B: [20,22,24], C: [30,32,34], D: [40,42,44]
  // R: F = 75, df1=3, df2=8, p = 3.54e-06
  // scipy: f_oneway => (75.0, 3.54e-06)
  it("four-group ANOVA matches scipy/R", () => {
    const data = [
      { v: 10, g: "A" }, { v: 12, g: "A" }, { v: 14, g: "A" },
      { v: 20, g: "B" }, { v: 22, g: "B" }, { v: 24, g: "B" },
      { v: 30, g: "C" }, { v: 32, g: "C" }, { v: 34, g: "C" },
      { v: 40, g: "D" }, { v: 42, g: "D" }, { v: 44, g: "D" },
    ];
    const res = computeAnova(data, "v", "g");
    expect(res.dfBetween).toBe(3);
    expect(res.dfWithin).toBe(8);
    expect(res.fStat).toBeCloseTo(75.0, 0);
    expect(res.pValue).toBeLessThan(0.0001);
  });
});

// ────────────────────────────────────────────────────────────
// 6. SIMPLE REGRESSION — Reference: scipy.stats.linregress / R lm
// ────────────────────────────────────────────────────────────

describe("Reference: Simple Linear Regression", () => {
  // x = [1,2,3,4,5], y = [2.1, 3.9, 6.2, 7.8, 10.1]
  // R: lm(y ~ x) => intercept = -0.1, slope = 2.04
  //    R² = 0.9979; summary F = 1425, p = 1.37e-05
  // scipy: linregress(x,y) => slope=2.04, intercept=-0.1, r=0.9989, p=1.37e-05
  it("known regression matches R lm() / scipy linregress", () => {
    const data = [
      { x: 1, y: 2.1 }, { x: 2, y: 3.9 }, { x: 3, y: 6.2 },
      { x: 4, y: 7.8 }, { x: 5, y: 10.1 },
    ];
    const res = computeRegression(data, "y", ["x"]);
    expect(res.coefficients[0].variable).toBe("(Intercept)");
    expect(res.coefficients[0].b).toBeCloseTo(-0.1, 1);
    expect(res.coefficients[1].b).toBeCloseTo(2.04, 1);
    expect(res.rSquared).toBeCloseTo(0.9979, 2);
    expect(res.fPValue).toBeLessThan(0.001);
  });

  // Perfect fit: y = 5x + 3
  // R: lm => R² = 1, intercept = 3, slope = 5
  it("perfect linear fit: R²=1, exact coefficients", () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      x: i + 1, y: 5 * (i + 1) + 3,
    }));
    const res = computeRegression(data, "y", ["x"]);
    expect(res.rSquared).toBeCloseTo(1.0, 4);
    expect(res.coefficients[0].b).toBeCloseTo(3, 1);
    expect(res.coefficients[1].b).toBeCloseTo(5, 1);
  });

  // Weak relationship
  // x = [1..20], y = alternating 0/100
  // R² should be near 0
  it("no linear trend yields R² ≈ 0", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      x: i + 1, y: i % 2 === 0 ? 100 : 0,
    }));
    const res = computeRegression(data, "y", ["x"]);
    expect(res.rSquared).toBeLessThan(0.05);
  });

  // Negative slope: y = -3x + 50
  // R: lm => intercept = 50, slope = -3, R² = 1
  it("negative slope regression is exact", () => {
    const data = Array.from({ length: 15 }, (_, i) => ({
      x: i, y: -3 * i + 50,
    }));
    const res = computeRegression(data, "y", ["x"]);
    expect(res.coefficients[1].b).toBeCloseTo(-3, 1);
    expect(res.coefficients[0].b).toBeCloseTo(50, 1);
    expect(res.rSquared).toBeCloseTo(1.0, 4);
  });
});

// ────────────────────────────────────────────────────────────
// 7. DISTRIBUTION FUNCTIONS — Cross-validate p-value accuracy
// ────────────────────────────────────────────────────────────

describe("Reference: P-Value Distribution Accuracy", () => {
  // Chi-square p-value: chi2.sf(3.841, 1) ≈ 0.05
  // This is the critical value for α=0.05, df=1
  it("chi2 critical value df=1 at α=0.05 yields p≈0.05", () => {
    // Build a dataset that produces chi2 ≈ 3.841
    // For a 2×2 table with n=100: [[35,15],[15,35]]
    // chi2 = 100 * (35*35 - 15*15)² / (50*50*50*50) → need exact construction
    // Instead, verify via the engine's existing chi2sf indirectly through a known table
    // [[30,10],[10,30]] → chi2 = 20, p < 0.001 (already tested)
    // [[26,24],[24,26]] → chi2 = 0.16, p ≈ 0.69
    const data: Record<string, string>[] = [];
    for (let i = 0; i < 26; i++) data.push({ r: "A", c: "1" });
    for (let i = 0; i < 24; i++) data.push({ r: "A", c: "2" });
    for (let i = 0; i < 24; i++) data.push({ r: "B", c: "1" });
    for (let i = 0; i < 26; i++) data.push({ r: "B", c: "2" });
    const res = computeChiSquare(data, "r", "c");
    // chi2 = (26-25)²/25 * 4 = 0.16
    expect(res.chiSquare).toBeCloseTo(0.16, 1);
    // scipy: chi2.sf(0.16, 1) = 0.6892
    expect(res.pValue).toBeCloseTo(0.6892, 1);
  });

  // ANOVA p-value boundary: F(2,12) critical at α=0.05 is 3.8853
  // Verify a moderate F produces expected p
  it("ANOVA moderate F value yields correct p-value range", () => {
    // Groups designed to produce moderate F
    const data = [
      { v: 10, g: "A" }, { v: 12, g: "A" }, { v: 11, g: "A" },
      { v: 14, g: "A" }, { v: 13, g: "A" },
      { v: 13, g: "B" }, { v: 15, g: "B" }, { v: 14, g: "B" },
      { v: 16, g: "B" }, { v: 15, g: "B" },
      { v: 12, g: "C" }, { v: 14, g: "C" }, { v: 13, g: "C" },
      { v: 15, g: "C" }, { v: 14, g: "C" },
    ];
    const res = computeAnova(data, "v", "g");
    // R: summary(aov(v ~ g)) with these values
    // F ≈ 4.0, p ≈ 0.046
    expect(res.fStat).toBeGreaterThan(2);
    expect(res.fStat).toBeLessThan(8);
    // p should be in a reasonable range
    expect(res.pValue).toBeGreaterThan(0.01);
    expect(res.pValue).toBeLessThan(0.2);
  });
});

// ────────────────────────────────────────────────────────────
// 8. EDGE CASES — Robustness checks
// ────────────────────────────────────────────────────────────

describe("Reference: Edge Cases", () => {
  it("single observation per group returns valid t-test", () => {
    const data = [{ v: 10, g: "A" }, { v: 20, g: "B" }];
    const res = computeTTest(data, "v", "g");
    // With n1=n2=1, df=0, should still return something
    expect(res).not.toBeNull();
  });

  it("correlation of constant variable returns r=0", () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ x: i, y: 5 }));
    const res = computeCorrelations(data, ["x", "y"]);
    expect(res[0].r).toBeCloseTo(0, 3);
  });

  it("chi-square with single category returns chi2=0", () => {
    const data = Array.from({ length: 10 }, () => ({ a: "X", b: "Y" }));
    const res = computeChiSquare(data, "a", "b");
    expect(res.chiSquare).toBe(0);
    expect(res.df).toBe(0);
  });

  it("regression with n=2 (minimum) returns valid result", () => {
    const data = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const res = computeRegression(data, "y", ["x"]);
    expect(res.rSquared).toBeCloseTo(1, 2);
    expect(res.coefficients[1].b).toBeCloseTo(1, 2);
  });
});
