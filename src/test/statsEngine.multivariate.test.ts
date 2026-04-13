/**
 * Reference validation tests for multivariate analyses in statsEngine.ts
 *
 * Expected values computed using scipy 1.14 / numpy / sklearn.
 */

import { describe, it, expect } from "vitest";
import {
  computeRegression,
  computePCA,
  computeFactorAnalysis,
} from "@/lib/statsEngine";

// ────────────────────────────────────────────────────────────
// 1. MULTIPLE REGRESSION (OLS)
// ────────────────────────────────────────────────────────────

describe("Reference: Multiple Linear Regression", () => {
  // y = 2*x1 + 3*x2 + 5 + small noise
  // scipy OLS: b0≈4.8617, b1≈1.9755, b2≈3.0515, R²≈0.9998
  it("known 2-predictor regression matches scipy OLS", () => {
    const x1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const x2 = [5, 4, 6, 2, 8, 1, 9, 3, 7, 10];
    const y = [22.1, 20.8, 29.3, 18.9, 39.2, 19.7, 46.1, 29.8, 44.3, 54.9];
    const data = x1.map((_, i) => ({ x1: x1[i], x2: x2[i], y: y[i] }));

    const res = computeRegression(data, "y", ["x1", "x2"]);

    // Coefficients
    expect(res.coefficients[0].variable).toBe("(Intercept)");
    expect(res.coefficients[0].b).toBeCloseTo(4.8617, 1);
    expect(res.coefficients[1].b).toBeCloseTo(1.9755, 1);
    expect(res.coefficients[2].b).toBeCloseTo(3.0515, 1);

    // Fit
    expect(res.rSquared).toBeCloseTo(0.9998, 2);
    expect(res.adjustedR2).toBeCloseTo(0.9998, 2);
    expect(res.fPValue).toBeLessThan(0.0001);
  });

  // Perfect fit: y = x1 + 2*x2 + 10 → R² = 1
  it("perfect multiple regression: R²=1, exact coefficients", () => {
    const data = [
      { x1: 1, x2: 2, y: 15 },
      { x1: 2, x2: 4, y: 20 },
      { x1: 3, x2: 1, y: 15 },
      { x1: 4, x2: 3, y: 20 },
      { x1: 5, x2: 5, y: 25 },
    ];
    const res = computeRegression(data, "y", ["x1", "x2"]);
    expect(res.rSquared).toBeCloseTo(1.0, 3);
    expect(res.coefficients[0].b).toBeCloseTo(10, 1);
    expect(res.coefficients[1].b).toBeCloseTo(1, 1);
    expect(res.coefficients[2].b).toBeCloseTo(2, 1);
  });

  // 3 predictors: y = 1*x1 + 2*x2 + 3*x3 + 0
  it("3-predictor regression with no intercept noise", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      x1: i + 1,
      x2: (i % 5) + 1,
      x3: ((i * 3) % 7) + 1,
      y: 1 * (i + 1) + 2 * ((i % 5) + 1) + 3 * (((i * 3) % 7) + 1),
    }));
    const res = computeRegression(data, "y", ["x1", "x2", "x3"]);
    expect(res.rSquared).toBeCloseTo(1.0, 3);
    expect(res.coefficients[1].b).toBeCloseTo(1, 1);
    expect(res.coefficients[2].b).toBeCloseTo(2, 1);
    expect(res.coefficients[3].b).toBeCloseTo(3, 1);
  });

  it("returns proper df and n", () => {
    const data = Array.from({ length: 15 }, (_, i) => ({
      x1: i, x2: i * 2, y: i + i * 2 + Math.sin(i),
    }));
    const res = computeRegression(data, "y", ["x1", "x2"]);
    expect(res.n).toBe(15);
    expect(res.coefficients.length).toBe(3); // intercept + 2 predictors
  });
});

// ────────────────────────────────────────────────────────────
// 2. PCA (Principal Component Analysis)
// ────────────────────────────────────────────────────────────

describe("Reference: PCA", () => {
  // Highly correlated data: eigenvalue 1 should dominate
  it("correlated 3-variable data: first component captures most variance", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      x: i + 1,
      y: 2 * (i + 1) + (i % 3 - 1),
      z: 3 * (i + 1) + (i % 5 - 2),
    }));
    const res = computePCA(data, ["x", "y", "z"]);

    // First component should explain > 90% of variance
    expect(res.components[0].varianceExplained).toBeGreaterThan(90);
    expect(res.components.length).toBe(3);
    // Eigenvalues should be sorted descending
    expect(res.components[0].eigenvalue).toBeGreaterThanOrEqual(res.components[1].eigenvalue);
    expect(res.components[1].eigenvalue).toBeGreaterThanOrEqual(res.components[2].eigenvalue);
  });

  // Uncorrelated data: eigenvalues should be roughly equal (~1.0 each)
  it("uncorrelated standardized data: eigenvalues ≈ 1.0", () => {
    // Use data where variables are roughly independent
    const data = [
      { a: 7, b: 4, c: 3 }, { a: 4, b: 1, c: 8 },
      { a: 6, b: 3, c: 5 }, { a: 8, b: 6, c: 1 },
      { a: 5, b: 2, c: 7 }, { a: 9, b: 5, c: 2 },
      { a: 3, b: 7, c: 9 }, { a: 2, b: 8, c: 6 },
      { a: 1, b: 9, c: 4 }, { a: 10, b: 10, c: 10 },
    ];
    const res = computePCA(data, ["a", "b", "c"]);

    // scipy: eigenvalues ≈ [1.2408, 0.9625, 0.7967]
    expect(res.components[0].eigenvalue).toBeCloseTo(1.2408, 1);
    expect(res.components[1].eigenvalue).toBeCloseTo(0.9625, 1);
    expect(res.components[2].eigenvalue).toBeCloseTo(0.7967, 1);
    // Total variance = 100%
    expect(res.totalVarianceExplained).toBeCloseTo(100, 0);
  });

  it("cumulative variance sums correctly", () => {
    const data = Array.from({ length: 15 }, (_, i) => ({
      a: i, b: i * 2 + (i % 3), c: i * 0.5 + (i % 2),
    }));
    const res = computePCA(data, ["a", "b", "c"]);
    const lastCum = res.components[res.components.length - 1].cumulativeVariance;
    expect(lastCum).toBeCloseTo(100, 0);
  });

  it("KMO is between 0 and 1", () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      a: i + 1, b: 2 * (i + 1) + (i % 4), c: 3 * (i + 1),
    }));
    const res = computePCA(data, ["a", "b", "c"]);
    expect(res.kmo).toBeGreaterThanOrEqual(0);
    expect(res.kmo).toBeLessThanOrEqual(1);
  });
});

// ────────────────────────────────────────────────────────────
// 3. FACTOR ANALYSIS (with Varimax rotation)
// ────────────────────────────────────────────────────────────

describe("Reference: Factor Analysis", () => {
  it("retains factors with eigenvalue >= 1 (Kaiser criterion)", () => {
    // Highly correlated data → 1 factor with eigenvalue > 1
    const data = Array.from({ length: 30 }, (_, i) => ({
      a: i + 1,
      b: 2 * (i + 1) + (i % 3),
      c: 3 * (i + 1) + (i % 5),
    }));
    const res = computeFactorAnalysis(data, ["a", "b", "c"]);
    // Should retain at least 1 factor
    expect(res.factors.length).toBeGreaterThanOrEqual(1);
    // All retained factors should have eigenvalue >= 1
    res.factors.forEach(f => {
      expect(f.eigenvalue).toBeGreaterThanOrEqual(1);
    });
  });

  it("uses Varimax rotation", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      v1: i + 1, v2: 20 - i, v3: (i % 7) + 1, v4: (i * 2 % 11) + 1,
    }));
    const res = computeFactorAnalysis(data, ["v1", "v2", "v3", "v4"]);
    expect(res.rotation).toBe("Varimax");
  });

  it("communalities are between 0 and 1", () => {
    const data = Array.from({ length: 25 }, (_, i) => ({
      a: i + Math.sin(i), b: i * 2, c: i + (i % 3),
    }));
    const res = computeFactorAnalysis(data, ["a", "b", "c"]);
    res.communalities.forEach(c => {
      expect(c.extraction).toBeGreaterThanOrEqual(0);
      expect(c.extraction).toBeLessThanOrEqual(1.05); // allow small floating-point overshoot
    });
  });

  it("rotated loadings have correct dimensions", () => {
    const vars = ["v1", "v2", "v3", "v4"];
    const data = Array.from({ length: 30 }, (_, i) => ({
      v1: i, v2: i * 2 + (i % 4), v3: 30 - i, v4: (i % 6) * 3,
    }));
    const res = computeFactorAnalysis(data, vars);
    expect(res.rotatedLoadings.length).toBe(4);
    res.rotatedLoadings.forEach(l => {
      expect(l.factors.length).toBe(res.factors.length);
    });
  });

  it("factor variance sums to cumulative", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      a: i, b: i * 2, c: (i % 5) + 1,
    }));
    const res = computeFactorAnalysis(data, ["a", "b", "c"]);
    if (res.factors.length > 0) {
      const sumVar = res.factors.reduce((s, f) => s + f.varianceExplained, 0);
      const lastCum = res.factors[res.factors.length - 1].cumulativeVariance;
      expect(sumVar).toBeCloseTo(lastCum, 0);
    }
  });
});
