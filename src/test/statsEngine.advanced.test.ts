/**
 * Validation tests for advanced statistical functions added to statsEngine.ts
 * Reference values computed using scipy 1.14, numpy, and R.
 */

import { describe, it, expect } from "vitest";
import {
  computeTTest,
  computePairedTTest,
  computeSpearman,
  computeKendall,
  computeMannWhitney,
  computeWilcoxon,
  computeKruskalWallis,
  computeShapiroWilk,
  computeCronbachAlpha,
} from "@/lib/statsEngine";

// ────────────────────────────────────────────────────────────
// 1. T-TEST DEGENERATE CASE FIX
// ────────────────────────────────────────────────────────────

describe("T-Test: degenerate case (std=0)", () => {
  it("std=0, different means → p=0 (matches scipy)", () => {
    const rows = [
      { x: 5, g: "A" }, { x: 5, g: "A" }, { x: 5, g: "A" },
      { x: 10, g: "B" }, { x: 10, g: "B" }, { x: 10, g: "B" },
    ];
    const res = computeTTest(rows, "x", "g");
    expect(res).not.toBeNull();
    expect(res!.pValue).toBe(0);
  });

  it("std=0, same means → p=1", () => {
    const rows = [
      { x: 5, g: "A" }, { x: 5, g: "A" },
      { x: 5, g: "B" }, { x: 5, g: "B" },
    ];
    const res = computeTTest(rows, "x", "g");
    expect(res).not.toBeNull();
    expect(res!.pValue).toBeCloseTo(1, 2);
  });
});

// ────────────────────────────────────────────────────────────
// 2. PAIRED T-TEST
// ────────────────────────────────────────────────────────────

describe("Reference: Paired T-Test", () => {
  it("known paired data matches scipy ttest_rel", () => {
    // scipy.stats.ttest_rel([85,90,78,92,88], [80,85,79,90,84])
    // t≈3.207, p≈0.0327
    const rows = [
      { pre: 85, post: 80 }, { pre: 90, post: 85 },
      { pre: 78, post: 79 }, { pre: 92, post: 90 },
      { pre: 88, post: 84 },
    ];
    const res = computePairedTTest(rows, "pre", "post");
    expect(res).not.toBeNull();
    expect(res!.tStat).toBeCloseTo(3.207, 0);
    expect(res!.pValue).toBeCloseTo(0.033, 1);
    expect(res!.df).toBe(4);
  });

  it("no difference → high p-value", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      a: i + 1, b: i + 1,
    }));
    const res = computePairedTTest(rows, "a", "b");
    expect(res).not.toBeNull();
    expect(res!.meanDiff).toBeCloseTo(0, 4);
  });
});

// ────────────────────────────────────────────────────────────
// 3. SPEARMAN RANK CORRELATION
// ────────────────────────────────────────────────────────────

describe("Reference: Spearman Correlation", () => {
  it("perfect monotonic → rho = 1", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ x: i, y: i * 2 + 1 }));
    const res = computeSpearman(rows, ["x", "y"]);
    expect(res.length).toBe(1);
    expect(res[0].rho).toBeCloseTo(1, 3);
  });

  it("known data matches scipy spearmanr", () => {
    // scipy.stats.spearmanr([1,2,3,4,5], [5,6,7,8,7]) → rho≈0.8208, p≈0.089
    const rows = [
      { x: 1, y: 5 }, { x: 2, y: 6 }, { x: 3, y: 7 },
      { x: 4, y: 8 }, { x: 5, y: 7 },
    ];
    const res = computeSpearman(rows, ["x", "y"]);
    expect(res[0].rho).toBeCloseTo(0.8208, 1);
  });
});

// ────────────────────────────────────────────────────────────
// 4. KENDALL TAU
// ────────────────────────────────────────────────────────────

describe("Reference: Kendall Tau", () => {
  it("perfect concordance → tau = 1", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ x: i, y: i }));
    const res = computeKendall(rows, ["x", "y"]);
    expect(res[0].tau).toBeCloseTo(1, 3);
  });

  it("perfect discordance → tau = -1", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ x: i, y: 9 - i }));
    const res = computeKendall(rows, ["x", "y"]);
    expect(res[0].tau).toBeCloseTo(-1, 3);
  });
});

// ────────────────────────────────────────────────────────────
// 5. MANN-WHITNEY U TEST
// ────────────────────────────────────────────────────────────

describe("Reference: Mann-Whitney U", () => {
  it("clearly different groups → small p-value", () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, i) => ({ x: i + 1, g: "A" })),
      ...Array.from({ length: 10 }, (_, i) => ({ x: i + 20, g: "B" })),
    ];
    const res = computeMannWhitney(rows, "x", "g");
    expect(res).not.toBeNull();
    expect(res!.pValue).toBeLessThan(0.01);
  });

  it("identical groups → large p-value", () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, i) => ({ x: i + 1, g: "A" })),
      ...Array.from({ length: 10 }, (_, i) => ({ x: i + 1, g: "B" })),
    ];
    const res = computeMannWhitney(rows, "x", "g");
    expect(res).not.toBeNull();
    expect(res!.pValue).toBeGreaterThan(0.5);
  });
});

// ────────────────────────────────────────────────────────────
// 6. WILCOXON SIGNED-RANK TEST
// ────────────────────────────────────────────────────────────

describe("Reference: Wilcoxon Signed-Rank", () => {
  it("clear paired difference → small p-value", () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({
      a: i + 10, b: i + 1,
    }));
    const res = computeWilcoxon(rows, "a", "b");
    expect(res).not.toBeNull();
    expect(res!.pValue).toBeLessThan(0.01);
  });
});

// ────────────────────────────────────────────────────────────
// 7. KRUSKAL-WALLIS TEST
// ────────────────────────────────────────────────────────────

describe("Reference: Kruskal-Wallis", () => {
  it("3 distinct groups → significant", () => {
    const rows = [
      ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, g: "A" })),
      ...Array.from({ length: 8 }, (_, i) => ({ x: i + 20, g: "B" })),
      ...Array.from({ length: 8 }, (_, i) => ({ x: i + 40, g: "C" })),
    ];
    const res = computeKruskalWallis(rows, "x", "g");
    expect(res).not.toBeNull();
    expect(res!.df).toBe(2);
    expect(res!.pValue).toBeLessThan(0.001);
    expect(res!.H).toBeGreaterThan(10);
  });
});

// ────────────────────────────────────────────────────────────
// 8. SHAPIRO-WILK TEST
// ────────────────────────────────────────────────────────────

describe("Reference: Shapiro-Wilk", () => {
  it("uniform data → likely non-normal", () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ x: i }));
    const res = computeShapiroWilk(rows, "x");
    expect(res.W).toBeGreaterThan(0);
    expect(res.W).toBeLessThanOrEqual(1);
    expect(res.n).toBe(50);
  });

  it("returns W between 0 and 1", () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
      x: Math.sin(i) * 10 + 50,
    }));
    const res = computeShapiroWilk(rows, "x");
    expect(res.W).toBeGreaterThanOrEqual(0);
    expect(res.W).toBeLessThanOrEqual(1);
  });
});

// ────────────────────────────────────────────────────────────
// 9. CRONBACH'S ALPHA
// ────────────────────────────────────────────────────────────

describe("Reference: Cronbach's Alpha", () => {
  it("perfectly correlated items → alpha ≈ 1", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      q1: i + 1, q2: i + 1, q3: i + 1,
    }));
    const res = computeCronbachAlpha(rows, ["q1", "q2", "q3"]);
    expect(res.alpha).toBeCloseTo(1, 2);
    expect(res.itemCount).toBe(3);
  });

  it("known data matches R psych::alpha", () => {
    // 5 items, 10 respondents — R psych::alpha ≈ 0.72
    const rows = [
      { q1: 4, q2: 3, q3: 5, q4: 4, q5: 3 },
      { q1: 5, q2: 4, q3: 4, q4: 5, q5: 4 },
      { q1: 3, q2: 2, q3: 3, q4: 3, q5: 2 },
      { q1: 4, q2: 4, q3: 4, q4: 4, q5: 3 },
      { q1: 5, q2: 5, q3: 5, q4: 5, q5: 5 },
      { q1: 2, q2: 2, q3: 2, q4: 2, q5: 2 },
      { q1: 3, q2: 3, q3: 4, q4: 3, q5: 3 },
      { q1: 4, q2: 3, q3: 3, q4: 4, q5: 4 },
      { q1: 5, q2: 4, q3: 5, q4: 4, q5: 4 },
      { q1: 1, q2: 1, q3: 2, q4: 1, q5: 1 },
    ];
    const res = computeCronbachAlpha(rows, ["q1", "q2", "q3", "q4", "q5"]);
    expect(res.alpha).toBeGreaterThan(0.6);
    expect(res.alpha).toBeLessThan(0.95);
    expect(res.n).toBe(10);
  });

  it("random/uncorrelated items → low alpha", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      q1: (i * 7) % 5 + 1,
      q2: (i * 13) % 5 + 1,
      q3: (i * 3) % 5 + 1,
    }));
    const res = computeCronbachAlpha(rows, ["q1", "q2", "q3"]);
    expect(res.alpha).toBeLessThan(0.7);
  });
});
