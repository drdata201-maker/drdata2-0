/**
 * Methodology label helpers for grouped/derived variables.
 *
 * Used by:
 *  - WorkspaceResults (UI badge under each grouped frequency table)
 *  - exportUtils (DOCX/PDF caption under the grouped frequency table)
 *
 * Pure UI helper — does NOT touch the statistical engine.
 */
import type { PreparedVariableSpec } from "@/lib/varDiagnostics";

export interface GroupingMethodologyLabel {
  /** Localized human label (e.g. "Equal width, k=4"). */
  label: string;
  /** Short i18n method tag for traceability ("equal_width" | "quantile" | "manual" | "categorize" | "merge_rare" | "recode"). */
  methodKey: string;
  /** Number of resulting classes when applicable. */
  bins?: number;
}

/**
 * Resolve the source variable name for a given derived/grouped column.
 * Conventions used by varDiagnostics: <name>_grouped, <name>_level, <name>_merged, <name>_recoded, <name>_t.
 */
export function resolveSourceFromDerived(
  derivedName: string,
  transforms: Record<string, PreparedVariableSpec>,
): { source: string; spec: PreparedVariableSpec } | null {
  // Direct lookup by newName
  for (const spec of Object.values(transforms)) {
    if (spec.newName === derivedName) {
      return { source: spec.sourceName, spec };
    }
  }
  // Suffix-based fallback (covers cases where the column was derived but not via VariableStudio)
  const m = derivedName.match(/^(.*)_(grouped|level|merged|recoded|t)$/i);
  if (m) {
    const source = m[1];
    if (transforms[source]) return { source, spec: transforms[source] };
  }
  return null;
}

export function buildMethodologyLabel(
  spec: PreparedVariableSpec,
  t: (key: string) => string,
): GroupingMethodologyLabel | null {
  const tr = spec.transformation;
  switch (tr.kind) {
    case "group_intervals": {
      const modeKey =
        tr.mode === "equal_width"
          ? "methodology.equalWidth"
          : tr.mode === "quantile"
          ? "methodology.quantile"
          : "methodology.manual";
      const bins = tr.mode === "manual"
        ? (tr.thresholds ? tr.thresholds.length + 1 : tr.bins)
        : tr.bins;
      return {
        label: `${t("methodology.label")}: ${t(modeKey)}, k=${bins}`,
        methodKey: tr.mode,
        bins,
      };
    }
    case "categorize_score": {
      const k = tr.labels?.length || (tr.thresholds.length + 1);
      return {
        label: `${t("methodology.label")}: ${t("methodology.categorize")}, k=${k}`,
        methodKey: "categorize",
        bins: k,
      };
    }
    case "merge_rare":
      return {
        label: `${t("methodology.label")}: ${t("methodology.mergeRare")} (< ${(tr.minPct * 100).toFixed(0)}%)`,
        methodKey: "merge_rare",
      };
    case "recode":
      return {
        label: `${t("methodology.label")}: ${t("methodology.recode")}`,
        methodKey: "recode",
      };
    default:
      return null;
  }
}

/**
 * Convenience: get the methodology label for a column name as it appears in the
 * frequency table. Returns null if no transformation was applied.
 */
export function getMethodologyForColumn(
  columnName: string,
  transforms: Record<string, PreparedVariableSpec>,
  t: (key: string) => string,
): GroupingMethodologyLabel | null {
  const found = resolveSourceFromDerived(columnName, transforms);
  if (!found) return null;
  return buildMethodologyLabel(found.spec, t);
}
