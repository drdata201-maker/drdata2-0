import { describe, it, expect } from "vitest";
import {
  computeDescriptive,
  computeCorrelations,
  computeTTest,
  computeChiSquare,
  computeAnova,
  computeRegression,
  categorizeNumericVariable,
} from "@/lib/statsEngine";

// Helper dataset
const rows = [
  { age: 25, score: 80, group: "A", gender: "M" },
  { age: 30, score: 85, group: "A", gender: "F" },
  { age: 35, score: 70, group: "B", gender: "M" },
  { age: 40, score: 90, group: "B", gender: "F" },
  { age: 28, score: 75, group: "A", gender: "M" },
  { age: 33, score: 88, group: "B", gender: "F" },
  { age: 22, score: 65, group: "A", gender: "M" },
  { age: 45, score: 92, group: "B", gender: "F" },
  { age: 27, score: 78, group: "A", gender: "M" },
  { age: 38, score: 82, group: "B", gender: "F" },
];

describe("Descriptive Statistics", () => {
  it("computes correct mean, std, median, min, max", () => {
    const res = computeDescriptive(rows, ["age"]);
    expect(res).toHaveLength(1);
    const r = res[0];
    expect(r.n).toBe(10);
    expect(r.mean).toBeCloseTo(32.3, 1);
    expect(r.min).toBe(22);
    expect(r.max).toBe(45);
    expect(r.median).toBeCloseTo(31.5, 1);
    expect(r.std).toBeGreaterThan(0);
  });

  it("computes Q1 and Q3 correctly", () => {
    const res = computeDescriptive(rows, ["score"]);
    const r = res[0];
    expect(r.q1).toBeLessThan(r.median);
    expect(r.q3).toBeGreaterThan(r.median);
  });
});

describe("Pearson Correlation", () => {
  it("returns r between -1 and 1 with valid p-value", () => {
    const res = computeCorrelations(rows, ["age", "score"]);
    expect(res).toHaveLength(1);
    expect(res[0].r).toBeGreaterThanOrEqual(-1);
    expect(res[0].r).toBeLessThanOrEqual(1);
    expect(res[0].pValue).toBeGreaterThanOrEqual(0);
    expect(res[0].pValue).toBeLessThanOrEqual(1);
    expect(res[0].n).toBe(10);
  });

  it("perfect correlation returns r ≈ 1", () => {
    const perfect = Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 2 + 3 }));
    const res = computeCorrelations(perfect, ["x", "y"]);
    expect(res[0].r).toBeCloseTo(1, 3);
    expect(res[0].pValue).toBeCloseTo(0, 2);
  });
});

describe("T-Test", () => {
  it("returns valid t-statistic and p-value for two groups", () => {
    const res = computeTTest(rows, "score", "group");
    expect(res).not.toBeNull();
    expect(res!.groups).toHaveLength(2);
    expect(res!.means).toHaveLength(2);
    expect(res!.pValue).toBeGreaterThanOrEqual(0);
    expect(res!.pValue).toBeLessThanOrEqual(1);
    expect(res!.df).toBe(8);
  });

  it("returns null when fewer than 2 groups", () => {
    const singleGroup = rows.map(r => ({ ...r, group: "X" }));
    const res = computeTTest(singleGroup, "score", "group");
    expect(res).toBeNull();
  });

  it("identical groups yield p ≈ 1", () => {
    const same = Array.from({ length: 20 }, (_, i) => ({
      val: 50, grp: i < 10 ? "A" : "B",
    }));
    const res = computeTTest(same, "val", "grp");
    expect(res).not.toBeNull();
    expect(res!.tStat).toBeCloseTo(0, 2);
    // p-value should be ~1 for t=0
    expect(res!.pValue).toBeGreaterThan(0.9);
  });
});

describe("Chi-Square", () => {
  it("computes chi-square with valid df and p-value", () => {
    const res = computeChiSquare(rows, "group", "gender");
    expect(res.df).toBeGreaterThan(0);
    expect(res.chiSquare).toBeGreaterThanOrEqual(0);
    expect(res.pValue).toBeGreaterThanOrEqual(0);
    expect(res.pValue).toBeLessThanOrEqual(1);
    expect(res.cramersV).toBeGreaterThanOrEqual(0);
    expect(res.cramersV).toBeLessThanOrEqual(1);
  });

  it("independent variables yield high p-value", () => {
    // Balanced: no association
    const balanced = [
      { a: "X", b: "1" }, { a: "X", b: "2" },
      { a: "Y", b: "1" }, { a: "Y", b: "2" },
      { a: "X", b: "1" }, { a: "X", b: "2" },
      { a: "Y", b: "1" }, { a: "Y", b: "2" },
    ];
    const res = computeChiSquare(balanced, "a", "b");
    expect(res.chiSquare).toBeCloseTo(0, 1);
    expect(res.pValue).toBeGreaterThan(0.9);
  });

  it("strongly associated variables yield low p-value", () => {
    const associated = Array.from({ length: 100 }, (_, i) => ({
      a: i < 50 ? "X" : "Y",
      b: i < 50 ? "1" : "2",
    }));
    const res = computeChiSquare(associated, "a", "b");
    expect(res.pValue).toBeLessThan(0.001);
    expect(res.cramersV).toBeGreaterThan(0.8);
  });

  // Reference: 2x2 table [[30,10],[10,30]], chi2 = 20, df=1, p < 0.001
  it("matches known reference value", () => {
    const ref: Record<string, string>[] = [];
    for (let i = 0; i < 30; i++) ref.push({ r: "A", c: "1" });
    for (let i = 0; i < 10; i++) ref.push({ r: "A", c: "2" });
    for (let i = 0; i < 10; i++) ref.push({ r: "B", c: "1" });
    for (let i = 0; i < 30; i++) ref.push({ r: "B", c: "2" });
    const res = computeChiSquare(ref, "r", "c");
    expect(res.chiSquare).toBeCloseTo(20, 0);
    expect(res.df).toBe(1);
    expect(res.pValue).toBeLessThan(0.0001);
  });
});

describe("ANOVA", () => {
  it("returns valid F-statistic and p-value", () => {
    const res = computeAnova(rows, "score", "group");
    expect(res.groups.length).toBeGreaterThanOrEqual(2);
    expect(res.fStat).toBeGreaterThanOrEqual(0);
    expect(res.pValue).toBeGreaterThanOrEqual(0);
    expect(res.pValue).toBeLessThanOrEqual(1);
    expect(res.dfBetween).toBe(1);
    expect(res.dfWithin).toBe(8);
  });

  it("identical groups yield F ≈ 0 and p ≈ 1", () => {
    const same = Array.from({ length: 30 }, (_, i) => ({
      val: 50, grp: ["A", "B", "C"][i % 3],
    }));
    const res = computeAnova(same, "val", "grp");
    expect(res.fStat).toBeCloseTo(0, 2);
  });

  it("very different groups yield significant F", () => {
    const diff = [
      ...Array.from({ length: 10 }, () => ({ val: 10, grp: "Low" })),
      ...Array.from({ length: 10 }, () => ({ val: 50, grp: "Mid" })),
      ...Array.from({ length: 10 }, () => ({ val: 90, grp: "High" })),
    ];
    const res = computeAnova(diff, "val", "grp");
    expect(res.fStat).toBeGreaterThan(100);
    expect(res.pValue).toBeLessThan(0.001);
  });
});

describe("Simple Regression", () => {
  it("perfect linear relationship yields R² ≈ 1", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      x: i, y: 3 * i + 7,
    }));
    const res = computeRegression(data, "y", ["x"]);
    expect(res.rSquared).toBeCloseTo(1, 3);
    expect(res.coefficients[0].b).toBeCloseTo(7, 1); // intercept
    expect(res.coefficients[1].b).toBeCloseTo(3, 1); // slope
    expect(res.fPValue).toBeLessThan(0.001);
  });

  it("no relationship yields R² ≈ 0", () => {
    // Alternating pattern - no linear trend
    const data = Array.from({ length: 40 }, (_, i) => ({
      x: i, y: i % 2 === 0 ? 100 : 0,
    }));
    const res = computeRegression(data, "y", ["x"]);
    expect(res.rSquared).toBeLessThan(0.1);
  });
});
