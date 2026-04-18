// Variable diagnostics + transformation engine for Preparation V2.
// Pure, side-effect-free utilities. UI consumes diagnostics keys; i18n handles labels.

import { isIdentifierVariable } from "@/lib/academicFormatter";

export type VarSubType =
  | "identifier"
  | "binary"
  | "categorical_nominal"
  | "categorical_inconsistent"
  | "ordinal_score"
  | "numeric_continuous"
  | "numeric_discrete"
  | "date"
  | "text";

export interface VarDiagnostic {
  /** i18n key for the suggestion message. */
  key: string;
  severity: "info" | "warn" | "critical";
}

export interface VarMeta {
  name: string;
  baseType: "numeric" | "categorical" | "ordinal" | "date" | "text";
  subType: VarSubType;
  uniqueCount: number;
  missingCount: number;
  missingPct: number;
  min?: number;
  max?: number;
  isLikelyScore: boolean;
  /** True if numeric and >15 unique values (good candidate for grouping). */
  manyUnique: boolean;
  /** Categorical modalities sorted by frequency (top 10). */
  topModalities: { value: string; count: number; pct: number }[];
  /** True if categorical has inconsistent labels (case/whitespace duplicates). */
  hasInconsistentLabels: boolean;
  /** True if some modalities appear in <2% of rows -> rare cats. */
  hasRareCategories: boolean;
  diagnostics: VarDiagnostic[];
}

export type Transformation =
  | { kind: "exclude" }
  | { kind: "keep" }
  | { kind: "group_intervals"; mode: "equal_width" | "quantile" | "manual"; bins: number; thresholds?: number[] }
  | { kind: "categorize_score"; thresholds: number[]; labels: string[] }
  | { kind: "recode"; mapping: Record<string, string> }
  | { kind: "merge_rare"; minPct: number; mergedLabel: string };

export interface PreparedVariableSpec {
  /** New variable name to introduce (e.g. age_grouped). Same as source if in-place transform. */
  newName: string;
  sourceName: string;
  transformation: Transformation;
}

// ---------- Detection ----------

export function buildVarMeta(
  name: string,
  baseType: VarMeta["baseType"],
  rows: Record<string, unknown>[],
): VarMeta {
  const values = rows.map(r => r[name]);
  const nonNull = values.filter(v => v != null && v !== "");
  const missingCount = values.length - nonNull.length;
  const missingPct = values.length ? Math.round((missingCount / values.length) * 1000) / 10 : 0;
  const uniqStrings = new Set(nonNull.map(v => String(v).trim()));
  const uniqueCount = uniqStrings.size;

  let min: number | undefined, max: number | undefined;
  let isLikelyScore = false;
  let manyUnique = false;

  if (baseType === "numeric") {
    const nums = nonNull.map(Number).filter(n => !isNaN(n));
    if (nums.length) {
      min = Math.min(...nums);
      max = Math.max(...nums);
      // Score-like: small integer range (e.g. 1-5, 0-10, 1-7) with many repeats
      const allInt = nums.every(n => Number.isInteger(n));
      const range = max - min;
      isLikelyScore = allInt && range > 0 && range <= 10 && uniqueCount <= 11 && nums.length / Math.max(uniqueCount, 1) >= 5;
      manyUnique = uniqueCount > 15 && !isLikelyScore;
    }
  }

  // Modalities (categorical only — but compute lightly for any non-numeric)
  const freq = new Map<string, number>();
  if (baseType !== "numeric") {
    for (const v of nonNull) {
      const norm = String(v).trim();
      if (!norm) continue;
      freq.set(norm, (freq.get(norm) || 0) + 1);
    }
  }
  const total = nonNull.length || 1;
  const topModalities = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({ value, count, pct: Math.round((count / total) * 1000) / 10 }));

  // Inconsistent label detection: same string under case/whitespace yields fewer entries
  const normalizedSet = new Set(Array.from(freq.keys()).map(k => k.toLowerCase().replace(/\s+/g, " ").trim()));
  const hasInconsistentLabels = baseType !== "numeric" && normalizedSet.size < freq.size;

  // Rare categories: any modality at < 2% of total occurrences AND > 6 distinct categories
  const hasRareCategories = baseType !== "numeric" && freq.size > 6 &&
    Array.from(freq.values()).some(c => c / total < 0.02);

  // Determine subtype
  let subType: VarSubType = "text";
  if (isIdentifierVariable(name, rows) || (baseType === "numeric" && uniqueCount === values.length && values.length > 10)) {
    subType = "identifier";
  } else if (baseType === "date") {
    subType = "date";
  } else if (uniqueCount === 2) {
    subType = "binary";
  } else if (baseType === "numeric" && isLikelyScore) {
    subType = "ordinal_score";
  } else if (baseType === "numeric") {
    const nums = nonNull.map(Number).filter(n => !isNaN(n));
    const allInt = nums.every(n => Number.isInteger(n));
    subType = allInt && uniqueCount <= 30 ? "numeric_discrete" : "numeric_continuous";
  } else if (baseType === "categorical" || baseType === "ordinal") {
    subType = hasInconsistentLabels ? "categorical_inconsistent" : "categorical_nominal";
  }

  // Build diagnostics
  const diagnostics: VarDiagnostic[] = [];
  if (subType === "identifier") {
    diagnostics.push({ key: "varDiag.identifier", severity: "warn" });
  }
  if (missingPct >= 20) {
    diagnostics.push({ key: "varDiag.highMissing", severity: "warn" });
  } else if (missingPct > 0) {
    diagnostics.push({ key: "varDiag.someMissing", severity: "info" });
  }
  if (subType === "numeric_continuous" && manyUnique) {
    diagnostics.push({ key: "varDiag.manyUniqueNumeric", severity: "info" });
  }
  if (subType === "ordinal_score") {
    diagnostics.push({ key: "varDiag.likelyScore", severity: "info" });
  }
  if (subType === "categorical_inconsistent") {
    diagnostics.push({ key: "varDiag.inconsistentLabels", severity: "warn" });
  }
  if (hasRareCategories) {
    diagnostics.push({ key: "varDiag.rareCategories", severity: "info" });
  }
  if (subType === "binary") {
    diagnostics.push({ key: "varDiag.binary", severity: "info" });
  }

  return {
    name,
    baseType,
    subType,
    uniqueCount,
    missingCount,
    missingPct,
    min,
    max,
    isLikelyScore,
    manyUnique,
    topModalities,
    hasInconsistentLabels,
    hasRareCategories,
    diagnostics,
  };
}

// ---------- Transformations (return new column, do not mutate rows) ----------

/** Equal-width binning. */
export function groupEqualWidth(values: number[], bins: number): { labels: string[]; assign: (v: number) => string } {
  const valid = values.filter(v => typeof v === "number" && !isNaN(v));
  if (!valid.length) return { labels: [], assign: () => "N/A" };
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const step = (max - min) / Math.max(bins, 1);
  const labels: string[] = [];
  const edges: number[] = [];
  for (let i = 0; i < bins; i++) {
    const lo = min + i * step;
    const hi = i === bins - 1 ? max : min + (i + 1) * step;
    edges.push(hi);
    labels.push(`[${formatNum(lo)} - ${formatNum(hi)}${i === bins - 1 ? "]" : "["}`);
  }
  const assign = (v: number) => {
    if (v == null || isNaN(v)) return "N/A";
    for (let i = 0; i < edges.length; i++) if (v <= edges[i]) return labels[i];
    return labels[labels.length - 1];
  };
  return { labels, assign };
}

/** Quantile binning (equal frequency). */
export function groupQuantile(values: number[], bins: number): { labels: string[]; assign: (v: number) => string } {
  const valid = values.filter(v => typeof v === "number" && !isNaN(v)).sort((a, b) => a - b);
  if (!valid.length) return { labels: [], assign: () => "N/A" };
  const edges: number[] = [];
  for (let i = 1; i < bins; i++) {
    const idx = Math.floor((valid.length * i) / bins);
    edges.push(valid[Math.min(idx, valid.length - 1)]);
  }
  edges.push(valid[valid.length - 1]);
  const labels: string[] = [];
  let prev = valid[0];
  for (let i = 0; i < edges.length; i++) {
    labels.push(`[${formatNum(prev)} - ${formatNum(edges[i])}]`);
    prev = edges[i];
  }
  const assign = (v: number) => {
    if (v == null || isNaN(v)) return "N/A";
    for (let i = 0; i < edges.length; i++) if (v <= edges[i]) return labels[i];
    return labels[labels.length - 1];
  };
  return { labels, assign };
}

/** Score categorization with explicit thresholds. */
export function categorizeScore(thresholds: number[], labels: string[]): (v: number) => string {
  return (v: number) => {
    if (v == null || isNaN(v)) return "N/A";
    for (let i = 0; i < thresholds.length; i++) if (v <= thresholds[i]) return labels[i];
    return labels[labels.length - 1];
  };
}

/** Apply a transformation to a row column. Returns the new column name and the transformed values. */
export function applyTransformation(
  spec: PreparedVariableSpec,
  rows: Record<string, unknown>[],
): { name: string; values: (string | number | null)[] } {
  const { sourceName, transformation, newName } = spec;
  const colVals = rows.map(r => r[sourceName]);

  switch (transformation.kind) {
    case "exclude":
    case "keep":
      return { name: newName, values: colVals as (string | number | null)[] };

    case "group_intervals": {
      const nums = colVals.map(v => Number(v)).filter(n => !isNaN(n));
      const fn = transformation.mode === "quantile"
        ? groupQuantile(nums, transformation.bins).assign
        : groupEqualWidth(nums, transformation.bins).assign;
      return { name: newName, values: colVals.map(v => v == null || v === "" ? null : fn(Number(v))) };
    }

    case "categorize_score": {
      const fn = categorizeScore(transformation.thresholds, transformation.labels);
      return { name: newName, values: colVals.map(v => v == null || v === "" ? null : fn(Number(v))) };
    }

    case "recode": {
      return {
        name: newName,
        values: colVals.map(v => {
          if (v == null || v === "") return null;
          const k = String(v).trim();
          return transformation.mapping[k] ?? k;
        }),
      };
    }

    case "merge_rare": {
      const total = colVals.filter(v => v != null && v !== "").length || 1;
      const counts = new Map<string, number>();
      for (const v of colVals) {
        if (v == null || v === "") continue;
        const k = String(v).trim();
        counts.set(k, (counts.get(k) || 0) + 1);
      }
      const rare = new Set<string>();
      for (const [k, c] of counts) if (c / total < transformation.minPct) rare.add(k);
      return {
        name: newName,
        values: colVals.map(v => {
          if (v == null || v === "") return null;
          const k = String(v).trim();
          return rare.has(k) ? transformation.mergedLabel : k;
        }),
      };
    }
  }
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

/** Validation before allowing analysis to continue. */
export function validatePreparedDataset(
  rows: Record<string, unknown>[],
  excluded: Set<string>,
): { valid: boolean; reasonKey?: string } {
  if (!rows.length) return { valid: false, reasonKey: "prepValidation.empty" };
  const cols = Object.keys(rows[0]).filter(c => !excluded.has(c));
  if (!cols.length) return { valid: false, reasonKey: "prepValidation.noVariables" };
  return { valid: true };
}
