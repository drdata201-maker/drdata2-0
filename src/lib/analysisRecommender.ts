/**
 * Smart analysis recommendation engine for Licence level.
 *
 * Pure function: given variable types, returns a recommended bivariate
 * analysis with a short, multilingual-friendly reason key.
 *
 * Returns i18n keys (not literal text) so the UI can localize them.
 */

export type SimpleVarType = "numeric" | "categorical";

export interface VarRef {
  name: string;
  type: SimpleVarType;
}

export type RecommendedAnalysis =
  | "chi_square"
  | "fisher_exact"
  | "t_test"
  | "anova_basic"
  | "correlation"
  | "descriptive_full"
  | null;

export interface RecommendationResult {
  analysis: RecommendedAnalysis;
  /** i18n key for the human-readable analysis name */
  analysisLabelKey: string;
  /** i18n key explaining why this analysis fits */
  reasonKey: string;
  /** True when the variable combination is unsuitable for any standard test */
  invalid?: boolean;
  /** When invalid, an i18n key suggesting a fallback */
  alternativeKey?: string;
  /** Optional secondary advisory note (e.g., "prefer Fisher's exact when cells are sparse") */
  noteKey?: string;
}

/**
 * Count distinct categories of a categorical variable in a row sample.
 * Used to choose between t-test (2 groups) and ANOVA (>2 groups).
 */
export function countCategories(
  rows: Record<string, unknown>[],
  varName: string,
): number {
  const set = new Set<string>();
  for (const r of rows) {
    const v = r[varName];
    if (v == null || v === "") continue;
    set.add(String(v));
    if (set.size > 50) break; // safety cap
  }
  return set.size;
}

/**
 * Recommend an analysis based on a list of selected variables and their types.
 *
 * Rules (Licence scope):
 *  - 1 variable                  → descriptive_full
 *  - 2 categorical               → chi_square (fisher_exact suggested by validator if cells are sparse)
 *  - 2 numeric                   → correlation (Pearson)
 *  - 1 numeric + 1 categorical   → t_test (2 groups) or anova_basic (>2 groups)
 *  - other                       → invalid
 */
export function recommendAnalysis(
  variables: VarRef[],
  rows: Record<string, unknown>[] = [],
): RecommendationResult {
  const usable = variables.filter(Boolean);

  if (usable.length === 0) {
    return {
      analysis: null,
      analysisLabelKey: "joel.reco.none",
      reasonKey: "joel.reco.reason.none",
    };
  }

  if (usable.length === 1) {
    return {
      analysis: "descriptive_full",
      analysisLabelKey: "student.analysis.descriptive_full",
      reasonKey: "joel.reco.reason.descriptive",
    };
  }

  // For Licence we focus on the bivariate case (first two variables).
  const a = usable[0];
  const b = usable[1];

  const numCount = usable.filter(v => v.type === "numeric").length;
  const catCount = usable.filter(v => v.type === "categorical").length;

  // 2 categorical
  if (catCount === 2 && numCount === 0) {
    return {
      analysis: "chi_square",
      analysisLabelKey: "student.analysis.chi_square",
      reasonKey: "joel.reco.reason.chi_square",
    };
  }

  // 2 numeric (or more) → correlation
  if (numCount >= 2 && catCount === 0) {
    return {
      analysis: "correlation",
      analysisLabelKey: "student.analysis.correlation",
      reasonKey: "joel.reco.reason.correlation",
    };
  }

  // 1 numeric + 1 categorical
  if (numCount === 1 && catCount === 1) {
    const catVar = a.type === "categorical" ? a : b;
    const groups = countCategories(rows, catVar.name);
    if (groups <= 1) {
      return {
        analysis: null,
        analysisLabelKey: "joel.reco.none",
        reasonKey: "joel.reco.reason.singleGroup",
        invalid: true,
        alternativeKey: "joel.reco.alt.singleGroup",
      };
    }
    if (groups === 2) {
      return {
        analysis: "t_test",
        analysisLabelKey: "student.analysis.t_test",
        reasonKey: "joel.reco.reason.t_test",
      };
    }
    return {
      analysis: "anova_basic",
      analysisLabelKey: "student.analysis.anova_basic",
      reasonKey: "joel.reco.reason.anova",
    };
  }

  // Mixed but more than 2 vars (e.g. 2 num + 1 cat) — out of Licence simple scope.
  return {
    analysis: null,
    analysisLabelKey: "joel.reco.none",
    reasonKey: "joel.reco.reason.invalid",
    invalid: true,
    alternativeKey: "joel.reco.alt.invalid",
  };
}
