---
name: Data Preparation
description: Smart preparation engine V2 — diagnostics, suggestions, and reversible transformations applied non-destructively in the analysis layer
type: feature
---

The Preparation module operates in two layers:

1. **Auto-cleaning (`runCleaning` in DatasetContext)** — median imputation for numeric, mode for categorical, normalization (trim, collapse whitespace), invalid value rejection (negative ages, percentages outside 0–100), and duplicate row removal. Identifier variables are auto-detected via regex and excluded from analyses.

2. **Variable Studio (`src/components/workspace/VariableStudio.tsx`)** — collapsible per-variable cards rendered inside `WorkspaceDataPrep.tsx`. Each card shows:
   - Sub-type detection (identifier, binary, ordinal score, numeric continuous/discrete, categorical nominal/inconsistent, date) via `src/lib/varDiagnostics.ts → buildVarMeta`.
   - Diagnostics (high missing, many unique, likely score, inconsistent labels, rare categories) — i18n keys, never hardcoded.
   - Reversible actions: Group into intervals (equal-width OR quantile, user-selectable bins), Categorize score (Low/Medium/High with manual thresholds), Merge rare categories, Exclude/Include.

Transformations are stored in `variableTransforms: Record<sourceName, PreparedVariableSpec>` and excluded variables in `excludedVariables: string[]`. The derived `preparedData` is recomputed on the fly: cleaned rows minus excluded columns, plus appended derived columns (e.g. `age_grouped`). The original `rawData` is never mutated.

When a transformation is applied, the source variable is auto-excluded (UX choice: "add as new + mark original as excluded by default") — the user can re-include it from the studio. `runAnalyses` and `replaceAnalysis` use `preparedData` and re-detect numeric/categorical types from the actual rows so derived columns are picked up correctly.

All state changes invalidate `cachedCharts` and `interpretationData` for real-time sync. All UI strings are in 5 locales under the `varStudio.*`, `varDiag.*`, and `prepValidation.*` namespaces.
