/**
 * BLOCK 11 — Localized p-value display rule.
 *
 * Rules:
 *   - Never display p = 0
 *   - If p < 0.001 → t("p.less_than_001")  (e.g. "p < 0.001")
 *   - Otherwise   → "p = X.XXXX" with 4 decimals (truncated trailing zeros kept for academic precision)
 *
 * Pure UI helper — does NOT modify any computed value.
 */
export function formatPDisplay(
  p: number | null | undefined,
  t: (key: string) => string,
): string {
  if (p == null || isNaN(p as number)) return t("p.unavailable") || "p = n/a";
  const pn = Number(p);
  if (pn < 0.001) return t("p.less_than_001") || "p < 0.001";
  // 4 decimals — academic standard, never "p = 0"
  const fixed = pn.toFixed(4);
  return `${t("p.equals") || "p ="} ${fixed}`;
}

/**
 * Numeric-only formatter for table cells (no "p =" prefix).
 * Used inside compact tables that already have a "p" column header.
 */
export function formatPCell(
  p: number | null | undefined,
  t: (key: string) => string,
): string {
  if (p == null || isNaN(p as number)) return "—";
  const pn = Number(p);
  if (pn < 0.001) return t("p.less_than_001_short") || "< 0.001";
  return pn.toFixed(4);
}
