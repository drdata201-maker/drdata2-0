import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { isIdentifierVariable } from "@/lib/academicFormatter";
import { applyTransformation as applyVarTransformation, type PreparedVariableSpec, type Transformation } from "@/lib/varDiagnostics";
import {
  AnalysisResultItem,
  computeDescriptive,
  computeFrequencies,
  computeCorrelations,
  computeTTest,
  computeChiSquare,
  computeAnova,
  computeRegression,
  computePCA,
  computeFactorAnalysis,
  computeClusterAnalysis,
  computePairedTTest,
  computeSpearman,
  computeKendall,
  computeMannWhitney,
  computeWilcoxon,
  computeKruskalWallis,
  computeShapiroWilk,
  computeCronbachAlpha,
} from "@/lib/statsEngine";

export type { AnalysisResultItem };

export interface VariableInfo {
  name: string;
  type: "numeric" | "categorical" | "ordinal" | "date" | "text";
  missing: number;
  missingPct: number;
  outliers: number;
  uniqueValues: number;
  sample: (string | number | null)[];
}

export interface DatasetSummary {
  fileName: string;
  fileSize: number;
  fileType: string;
  observations: number;
  variables: VariableInfo[];
  duplicateRows: number;
  totalMissing: number;
  totalMissingPct: number;
  rawData: Record<string, unknown>[];
}

type PrepStatus = "idle" | "uploading" | "reading" | "cleaning" | "ready" | "error";

export interface InterpretationSection {
  analysisType: string;
  interpretation: string;
  conclusion: string;
  recommendations: string;
}

export interface InterpretationData {
  sections: InterpretationSection[];
  globalConclusion: string;
  globalRecommendations: string;
  /** BLOCK 12 — true when the user manually edited the global conclusion;
   *  prevents AI re-runs from overwriting personal edits. */
  userEditedGlobalConclusion?: boolean;
  /** Same flag for global recommendations. */
  userEditedGlobalRecommendations?: boolean;
  academicReport?: import("@/lib/academicFormatter").AcademicReport;
}

export interface CachedChart {
  key: string;
  title: string;
  type: string;
  data: Record<string, unknown>[];
}

export type ContentOverride = { title?: string; interpretation?: string };
export type ContentOverrides = Record<string, ContentOverride>;

export type ChatMessage = { role: "assistant" | "user"; content: string; type?: string };
export type ChatPhase = "confirm" | "upload" | "software" | "analysis" | "variables" | "validation" | "ready";

export type AnalyticalGraphMode = "standard" | "advanced" | "presentation";

export interface ChatState {
  messages: ChatMessage[];
  phase: ChatPhase;
  chatHistory: { role: string; content: string }[];
  greetingSent: boolean;
  selectedSoftware: string;
  selectedAnalyses: string[];
  analyticalGraphMode: AnalyticalGraphMode;
  file: { name: string; size: number } | null;
}

interface DatasetContextType {
  dataset: DatasetSummary | null;
  prepStatus: PrepStatus;
  prepError: string | null;
  cleanedData: Record<string, unknown>[] | null;
  /** Map of variableName -> transformation spec applied in the analysis layer. */
  variableTransforms: Record<string, PreparedVariableSpec>;
  /** Set of variable names excluded from analyses. */
  excludedVariables: string[];
  /** Apply (or update) a transformation for a source variable; creates a derived column. */
  setVariableTransform: (sourceName: string, transformation: Transformation, newName?: string) => void;
  /** Remove a previously applied transformation. */
  clearVariableTransform: (sourceName: string) => void;
  /** Toggle exclude/include for analysis. */
  setVariableExcluded: (variableName: string, excluded: boolean) => void;
  /** The dataset rows actually used by analyses (cleaned + transformed columns appended, excluded removed). */
  preparedData: Record<string, unknown>[] | null;
  /** Variables exposed to selection UIs (Joel, Charts, Edit). Hides raw variables that have a derived version, hides excluded ones, and adds derived columns as new entries. */
  activeVariables: VariableInfo[];
  /** Returns a localized human label for a variable name (e.g. "age (grouped)"). Falls back to the raw name. */
  getDisplayLabel: (name: string) => string;
  /** If the user picked a raw variable that has a transform, returns the derived column name; otherwise returns the input unchanged. */
  resolveAnalysisVar: (name: string) => string;
  analysisResults: AnalysisResultItem[];
  interpretationData: InterpretationData | null;
  setInterpretationData: (data: InterpretationData | null) => void;
  cachedCharts: CachedChart[] | null;
  setCachedCharts: (charts: CachedChart[] | null) => void;
  tableOverrides: ContentOverrides;
  chartOverrides: ContentOverrides;
  updateTableOverride: (id: string, field: "title" | "interpretation", value: string) => void;
  updateChartOverride: (key: string, field: "title" | "interpretation", value: string) => void;
  processFile: (file: File) => Promise<DatasetSummary>;
  runCleaning: () => void;
  runAnalyses: (analysisKeys: string[], software: string, depVar?: string, indVars?: string[]) => void;
  deleteAnalysis: (id: string) => void;
  replaceAnalysis: (id: string, analysisKey: string, software: string, depVar?: string, indVars?: string[]) => void;
  reset: () => void;
  restoreState: (results: AnalysisResultItem[], interpretation: InterpretationData | null) => void;
  restoreDatasetSummary: (summary: DatasetSummary) => void;
  chatState: ChatState;
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
}

const DatasetContext = createContext<DatasetContextType | null>(null);

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error("useDataset must be used within DatasetProvider");
  return ctx;
}

function detectType(values: unknown[]): VariableInfo["type"] {
  const nonNull = values.filter(v => v != null && v !== "");
  if (nonNull.length === 0) return "text";

  let numCount = 0;
  let dateCount = 0;

  for (const v of nonNull.slice(0, 100)) {
    if (typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "")) {
      numCount++;
    } else if (v instanceof Date || (!isNaN(Date.parse(String(v))) && String(v).length > 6)) {
      dateCount++;
    }
  }

  const sample = nonNull.slice(0, 100).length;
  if (numCount / sample > 0.8) return "numeric";
  if (dateCount / sample > 0.8) return "date";

  const unique = new Set(nonNull.map(String)).size;
  if (unique <= 10 && nonNull.length > 20) return "categorical";
  if (unique <= 20 && nonNull.length > 50) return "ordinal";

  return "text";
}

function detectOutliers(values: unknown[]): number {
  const nums = values.filter(v => typeof v === "number" || (!isNaN(Number(v)) && v != null && v !== "")).map(Number);
  if (nums.length < 10) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return nums.filter(n => n < lower || n > upper).length;
}

function analyzeDataset(rows: Record<string, unknown>[], fileName: string, fileSize: number): DatasetSummary {
  if (rows.length === 0) throw new Error("Empty dataset");

  const columns = Object.keys(rows[0]);
  const variables: VariableInfo[] = columns.map(col => {
    const values = rows.map(r => r[col]);
    const missing = values.filter(v => v == null || v === "" || (typeof v === "number" && isNaN(v))).length;
    const nonNull = values.filter(v => v != null && v !== "");
    const type = detectType(values);

    return {
      name: col,
      type,
      missing,
      missingPct: Math.round((missing / rows.length) * 1000) / 10,
      outliers: type === "numeric" ? detectOutliers(values) : 0,
      uniqueValues: new Set(nonNull.map(String)).size,
      sample: nonNull.slice(0, 5).map(v => v as string | number | null),
    };
  });

  const totalMissing = variables.reduce((s, v) => s + v.missing, 0);
  const totalCells = rows.length * columns.length;

  // Detect duplicates
  const rowStrings = rows.map(r => JSON.stringify(r));
  const duplicateRows = rowStrings.length - new Set(rowStrings).size;

  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const typeMap: Record<string, string> = { xlsx: "Excel", xls: "Excel", csv: "CSV", sav: "SPSS", dta: "Stata", json: "JSON" };

  return {
    fileName,
    fileSize,
    fileType: typeMap[ext] || ext.toUpperCase(),
    observations: rows.length,
    variables,
    duplicateRows,
    totalMissing,
    totalMissingPct: Math.round((totalMissing / totalCells) * 1000) / 10,
    rawData: rows,
  };
}

async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = new TextDecoder().decode(buffer);
    const wb = XLSX.read(text, { type: "string" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: null });
  }

  // .sav (SPSS) and .dta (Stata) — xlsx library does not support these natively.
  // Attempt to parse as generic binary; if it fails, provide a clear error.
  if (ext === "sav" || ext === "dta") {
    try {
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
      if (rows.length > 0) return rows;
    } catch {
      // Fall through to error
    }
    throw new Error(
      ext === "sav"
        ? "SPSS (.sav) file detected. Please export your data as .xlsx or .csv from SPSS (File → Save As → Excel/CSV) and re-upload."
        : "Stata (.dta) file detected. Please export your data as .xlsx or .csv from Stata (export delimited / export excel) and re-upload."
    );
  }

  // xlsx, xls, and other formats supported by xlsx library
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

const DEFAULT_CHAT_STATE: ChatState = {
  messages: [],
  phase: "confirm",
  chatHistory: [],
  greetingSent: false,
  selectedSoftware: "",
  selectedAnalyses: [],
  analyticalGraphMode: "standard",
  file: null,
};

export function DatasetProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  const [prepStatus, setPrepStatus] = useState<PrepStatus>("idle");
  const [prepError, setPrepError] = useState<string | null>(null);
  const [cleanedData, setCleanedData] = useState<Record<string, unknown>[] | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultItem[]>([]);
  const [interpretationData, setInterpretationData] = useState<InterpretationData | null>(null);
  const [cachedCharts, setCachedCharts] = useState<CachedChart[] | null>(null);
  const [chatState, setChatState] = useState<ChatState>(DEFAULT_CHAT_STATE);
  const [tableOverrides, setTableOverrides] = useState<ContentOverrides>({});
  const [chartOverrides, setChartOverrides] = useState<ContentOverrides>({});
  // BLOCK 5/6/10 — Preparation V2: per-variable transformations and exclusions.
  const [variableTransforms, setVariableTransforms] = useState<Record<string, PreparedVariableSpec>>({});
  const [excludedVariables, setExcludedVariables] = useState<string[]>([]);

  // Helper: invalidate AI-generated sections but preserve user-edited global texts.
  const invalidateInterpretationPreservingEdits = useCallback(() => {
    setInterpretationData(prev => {
      if (!prev) return null;
      const keepConclusion = prev.userEditedGlobalConclusion;
      const keepRecs = prev.userEditedGlobalRecommendations;
      if (!keepConclusion && !keepRecs) return null;
      return {
        sections: [],
        globalConclusion: keepConclusion ? prev.globalConclusion : "",
        globalRecommendations: keepRecs ? prev.globalRecommendations : "",
        userEditedGlobalConclusion: keepConclusion,
        userEditedGlobalRecommendations: keepRecs,
      };
    });
  }, []);

  const setVariableTransform = useCallback((sourceName: string, transformation: Transformation, newName?: string) => {
    setVariableTransforms(prev => ({
      ...prev,
      [sourceName]: { sourceName, newName: newName || `${sourceName}_t`, transformation },
    }));
    setCachedCharts(null);
    invalidateInterpretationPreservingEdits();
  }, [invalidateInterpretationPreservingEdits]);

  const clearVariableTransform = useCallback((sourceName: string) => {
    setVariableTransforms(prev => { const n = { ...prev }; delete n[sourceName]; return n; });
    setCachedCharts(null);
    invalidateInterpretationPreservingEdits();
  }, [invalidateInterpretationPreservingEdits]);

  const setVariableExcluded = useCallback((variableName: string, excluded: boolean) => {
    setExcludedVariables(prev => {
      if (excluded) return prev.includes(variableName) ? prev : [...prev, variableName];
      return prev.filter(v => v !== variableName);
    });
    setCachedCharts(null);
    invalidateInterpretationPreservingEdits();
  }, [invalidateInterpretationPreservingEdits]);

  // BLOCK 10 — Derived prepared dataset (cleaned + transformed + excluded). Originals untouched.
  const preparedData = (() => {
    const base = cleanedData || dataset?.rawData || null;
    if (!base) return null;
    const excludedSet = new Set(excludedVariables);
    const specs = Object.values(variableTransforms);
    if (specs.length === 0 && excludedSet.size === 0) return base;
    const derivedCols = specs
      .filter(s => s.transformation.kind !== "exclude" && s.transformation.kind !== "keep")
      .map(s => applyVarTransformation(s, base));
    return base.map((row, i) => {
      const next: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (!excludedSet.has(k)) next[k] = v;
      }
      for (const dc of derivedCols) next[dc.name] = dc.values[i];
      return next;
    });
  })();

  // BLOCK 2/3 — Variable resolution & visibility.
  // Map raw variable name -> derived variable name (when a transform exists and produced a new column).
  const transformByOriginal = useMemo(() => {
    const map: Record<string, string> = {};
    for (const spec of Object.values(variableTransforms)) {
      if (spec.transformation.kind !== "exclude" && spec.transformation.kind !== "keep" && spec.newName !== spec.sourceName) {
        map[spec.sourceName] = spec.newName;
      }
    }
    return map;
  }, [variableTransforms]);

  const resolveAnalysisVar = useCallback(
    (name: string) => transformByOriginal[name] || name,
    [transformByOriginal],
  );

  // Localized suffix derived from the transform kind / newName convention.
  const labelForDerived = useCallback((derivedName: string): string => {
    if (derivedName.endsWith("_grouped")) return `${derivedName.slice(0, -8)} (${t("varStudio.label.grouped")})`;
    if (derivedName.endsWith("_level")) return `${derivedName.slice(0, -6)} (${t("varStudio.label.categorized")})`;
    if (derivedName.endsWith("_merged")) return `${derivedName.slice(0, -7)} (${t("varStudio.label.merged")})`;
    if (derivedName.endsWith("_recoded")) return `${derivedName.slice(0, -8)} (${t("varStudio.label.recoded")})`;
    if (derivedName.endsWith("_t")) return `${derivedName.slice(0, -2)} (${t("varStudio.label.transformed")})`;
    return derivedName;
  }, [t]);

  const getDisplayLabel = useCallback((name: string): string => {
    const target = transformByOriginal[name] || name;
    if (target !== name) return labelForDerived(target);
    if (/(_grouped|_level|_merged|_recoded|_t)$/.test(target)) return labelForDerived(target);
    return name;
  }, [transformByOriginal, labelForDerived]);

  // BLOCK 3 — activeVariables: hides raw variables whose transform produced a derived column,
  // hides excluded ones, and appends derived columns as new VariableInfo entries.
  const activeVariables = useMemo<VariableInfo[]>(() => {
    if (!dataset) return [];
    const excludedSet = new Set(excludedVariables);
    const replacedRaw = new Set(Object.keys(transformByOriginal));
    const rows = preparedData || dataset.rawData;

    const baseVars: VariableInfo[] = dataset.variables
      .filter(v => !excludedSet.has(v.name) && !replacedRaw.has(v.name))
      .map(v => ({ ...v }));

    const known = new Set(baseVars.map(v => v.name));
    for (const spec of Object.values(variableTransforms)) {
      if (spec.transformation.kind === "exclude" || spec.transformation.kind === "keep") continue;
      if (known.has(spec.newName)) continue;
      const colVals = rows.map(r => r[spec.newName]);
      const nonNull = colVals.filter(v => v != null && v !== "");
      const type: VariableInfo["type"] =
        spec.transformation.kind === "group_intervals" || spec.transformation.kind === "categorize_score" || spec.transformation.kind === "merge_rare" || spec.transformation.kind === "recode"
          ? "categorical"
          : detectType(colVals);
      baseVars.push({
        name: spec.newName,
        type,
        missing: colVals.length - nonNull.length,
        missingPct: colVals.length ? Math.round(((colVals.length - nonNull.length) / colVals.length) * 1000) / 10 : 0,
        outliers: 0,
        uniqueValues: new Set(nonNull.map(String)).size,
        sample: nonNull.slice(0, 5).map(v => v as string | number | null),
      });
      known.add(spec.newName);
    }
    return baseVars;
  }, [dataset, preparedData, variableTransforms, excludedVariables, transformByOriginal]);

  const updateTableOverride = useCallback((id: string, field: "title" | "interpretation", value: string) => {
    setTableOverrides(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }, []);

  const updateChartOverride = useCallback((key: string, field: "title" | "interpretation", value: string) => {
    setChartOverrides(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }, []);

  const processFile = useCallback(async (file: File): Promise<DatasetSummary> => {
    setPrepStatus("uploading");
    setPrepError(null);

    try {
      await new Promise(r => setTimeout(r, 500)); // brief upload simulation
      setPrepStatus("reading");

      const rows = await parseFile(file);
      if (rows.length === 0) throw new Error("Empty dataset");

      const summary = analyzeDataset(rows, file.name, file.size);
      setDataset(summary);
      setPrepStatus("ready");
      return summary;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setPrepError(msg);
      setPrepStatus("error");
      throw err;
    }
  }, []);

  const runCleaning = useCallback(() => {
    if (!dataset) return;
    setPrepStatus("cleaning");

    setTimeout(() => {
      // BLOCK 1 — Real cleaning engine (operates on a COPY, original rawData preserved in memory until replaced)
      // 1) Remove duplicate rows
      const seen = new Set<string>();
      const deduped = dataset.rawData.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // 2) Pre-compute median (numeric) and mode (categorical) for imputation,
      //    and detect invalid numeric values (e.g., negative age, percentages > 100).
      const isAgeLike = (name: string) => /\b(age|âge|years?|annees?|années?)\b/i.test(name);
      const isPctLike = (name: string) => /\b(pct|percent|pourcent|%|rate|taux)\b/i.test(name);

      const stats: Record<string, { median?: number; mode?: string; type: string }> = {};
      for (const v of dataset.variables) {
        const vals = deduped.map(r => r[v.name]).filter(x => x != null && x !== "");
        if (v.type === "numeric") {
          const nums = vals
            .map(Number)
            .filter(n => !isNaN(n))
            .filter(n => !(isAgeLike(v.name) && n < 0))
            .filter(n => !(isPctLike(v.name) && (n < 0 || n > 100)));
          const sorted = [...nums].sort((a, b) => a - b);
          const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
          stats[v.name] = { median, type: "numeric" };
        } else {
          // mode = most frequent normalized string
          const freq = new Map<string, number>();
          for (const x of vals) {
            const norm = String(x).trim();
            if (!norm) continue;
            freq.set(norm, (freq.get(norm) || 0) + 1);
          }
          let mode = "N/A"; let best = 0;
          for (const [k, c] of freq) if (c > best) { best = c; mode = k; }
          stats[v.name] = { mode, type: v.type };
        }
      }

      // 3) Apply cleaning rules per cell
      const cleaned = deduped.map(row => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          const info = stats[k];
          if (!info) { out[k] = v; continue; }
          if (info.type === "numeric") {
            const n = Number(v);
            const invalid = v == null || v === "" || isNaN(n)
              || (isAgeLike(k) && n < 0)
              || (isPctLike(k) && (n < 0 || n > 100));
            out[k] = invalid ? (info.median ?? 0) : n;
          } else {
            // Normalize categorical: trim + collapse whitespace + Title Case for short tokens
            if (v == null || v === "") { out[k] = info.mode ?? "N/A"; continue; }
            const norm = String(v).trim().replace(/\s+/g, " ");
            out[k] = norm || (info.mode ?? "N/A");
          }
        }
        return out;
      });

      setCleanedData(cleaned);

      // Update dataset summary after cleaning
      const updatedVars = dataset.variables.map(v => ({ ...v, missing: 0, missingPct: 0 }));
      setDataset(prev => prev ? {
        ...prev,
        observations: cleaned.length,
        duplicateRows: 0,
        totalMissing: 0,
        totalMissingPct: 0,
        variables: updatedVars,
        rawData: cleaned,
      } : null);

      setPrepStatus("ready");
    }, 2000);
  }, [dataset]);

  const runAnalyses = useCallback((analysisKeys: string[], software: string, depVarRaw?: string, indVarsRaw?: string[]) => {
    if (!dataset) return;
    // BLOCK 2 — Auto-resolve raw variable names to their derived/transformed versions.
    const depVar = depVarRaw ? (transformByOriginal[depVarRaw] || depVarRaw) : depVarRaw;
    const indVars = indVarsRaw ? indVarsRaw.map(v => transformByOriginal[v] || v) : indVarsRaw;
    // BLOCK 14 — analyses use the prepared dataset (cleaned + transformed + non-excluded).
    const rows = preparedData || cleanedData || dataset.rawData;
    const excludedSet = new Set(excludedVariables);
    // Detect var types from the actual prepared rows (so transformed columns are picked up correctly).
    const sampleRow = rows[0] || {};
    const allCols = Object.keys(sampleRow);
    const isNumericCol = (c: string) => {
      const sample = rows.slice(0, 50).map(r => r[c]).filter(v => v != null && v !== "");
      if (!sample.length) return false;
      return sample.filter(v => typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "")).length / sample.length > 0.8;
    };
    const numVars = allCols.filter(c => !excludedSet.has(c) && !isIdentifierVariable(c, rows) && isNumericCol(c));
    const catVars = allCols.filter(c => !excludedSet.has(c) && !isIdentifierVariable(c, rows) && !isNumericCol(c));
    const newResults: AnalysisResultItem[] = [];
    const ts = new Date().toISOString();

    // Use user-selected variables if provided, otherwise fall back to auto-detection
    const effectiveDepVar = depVar || numVars[0];
    const effectiveIndVars = indVars && indVars.length > 0 ? indVars : numVars.slice(1);

    for (const key of analysisKeys) {
      const analysisName = key.startsWith("custom:") ? key.slice(7) : key;
      const result: AnalysisResultItem = {
        id: crypto.randomUUID(),
        type: analysisName,
        title: analysisName,
        timestamp: ts,
        depVar: depVar,
        indVars: indVars ? [...indVars] : undefined,
      };

      if (key === "descriptive_stats" || key === "frequencies" || key.startsWith("custom:")) {
        // BLOCK 3/4 — Honor user-selected variables when provided; partition by detected type
        const userVars = (indVars && indVars.length > 0) ? indVars : null;
        const numForDesc = userVars ? userVars.filter(v => numVars.includes(v)) : numVars;
        const catForDesc = userVars ? userVars.filter(v => catVars.includes(v)) : catVars;
        if (numForDesc.length) result.descriptive = computeDescriptive(rows, numForDesc);
        if (catForDesc.length) result.frequencies = computeFrequencies(rows, catForDesc);
      }
      if (key === "frequencies") {
        const userVars = (indVars && indVars.length > 0) ? indVars : null;
        const catForFreq = userVars ? userVars.filter(v => catVars.includes(v) || numVars.includes(v)) : (catVars.length ? catVars : numVars.slice(0, 3));
        result.frequencies = computeFrequencies(rows, catForFreq);
      }
      if (key === "correlation") {
        const corrVars = indVars && indVars.length >= 2 ? indVars.filter(v => numVars.includes(v)) : numVars;
        result.correlations = computeCorrelations(rows, corrVars);
      }
      if (key === "t_test" && effectiveDepVar) {
        const groupVar = indVars?.[0] || catVars[0];
        if (groupVar) {
          const t = computeTTest(rows, effectiveDepVar, groupVar);
          if (t) result.tTests = [t];
        }
      }
      if (key === "chi_square" || key === "crosstab") {
        // Use dependent variable as var1 and first independent as var2
        const v1 = depVar || indVars?.[0] || catVars[0];
        const v2 = depVar ? (indVars?.[0] || catVars[0]) : (indVars?.[1] || catVars[1]);
        if (v1 && v2 && v1 !== v2) result.chiSquares = [computeChiSquare(rows, v1, v2)];
      }
      if ((key === "anova" || key === "anova_basic") && effectiveDepVar) {
        const factorVar = indVars?.[0] || catVars[0];
        if (factorVar) result.anovas = [computeAnova(rows, effectiveDepVar, factorVar)];
      }
      if ((key === "simple_regression" || key === "multiple_regression" || key === "logistic_regression") && effectiveDepVar) {
        const regInd = effectiveIndVars.filter(v => v !== effectiveDepVar && numVars.includes(v));
        const ind = key === "simple_regression" ? regInd.slice(0, 1) : regInd;
        if (ind.length > 0) result.regressions = [computeRegression(rows, effectiveDepVar, ind)];
      }
      if (key === "pca") {
        if (numVars.length >= 2) result.pca = computePCA(rows, numVars);
      }
      if (key === "factor_analysis") {
        if (numVars.length >= 2) result.factorAnalysis = computeFactorAnalysis(rows, numVars);
      }
      if (key === "cluster_analysis") {
        if (numVars.length >= 2) result.clusterAnalysis = computeClusterAnalysis(rows, numVars);
      }
      if (key === "cronbach_alpha") {
        if (numVars.length >= 2) result.cronbachAlpha = computeCronbachAlpha(rows, numVars);
      }
      if (key === "paired_t_test") {
        const v1 = depVar || numVars[0];
        const v2 = indVars?.[0] || numVars[1];
        if (v1 && v2 && v1 !== v2) result.pairedTTests = [computePairedTTest(rows, v1, v2)];
      }
      if (key === "spearman") {
        const corrVars = indVars && indVars.length >= 2 ? indVars.filter(v => numVars.includes(v)) : numVars;
        if (corrVars.length >= 2) result.spearmanCorrelations = computeSpearman(rows, corrVars);
      }
      if (key === "kendall") {
        const corrVars = indVars && indVars.length >= 2 ? indVars.filter(v => numVars.includes(v)) : numVars;
        if (corrVars.length >= 2) result.kendallCorrelations = computeKendall(rows, corrVars);
      }
      if (key === "mann_whitney" && effectiveDepVar) {
        const groupVar = indVars?.[0] || catVars[0];
        if (groupVar) {
          const mw = computeMannWhitney(rows, effectiveDepVar, groupVar);
          if (mw) result.mannWhitney = [mw];
        }
      }
      if (key === "wilcoxon") {
        const v1 = depVar || numVars[0];
        const v2 = indVars?.[0] || numVars[1];
        if (v1 && v2 && v1 !== v2) result.wilcoxon = [computeWilcoxon(rows, v1, v2)];
      }
      if (key === "kruskal_wallis" && effectiveDepVar) {
        const factorVar = indVars?.[0] || catVars[0];
        if (factorVar) result.kruskalWallis = [computeKruskalWallis(rows, effectiveDepVar, factorVar)];
      }
      if (key === "shapiro_wilk") {
        const testVars = indVars && indVars.length > 0 ? indVars.filter(v => numVars.includes(v)) : numVars.slice(0, 5);
        result.shapiroWilk = testVars.map(v => computeShapiroWilk(rows, v));
      }

      // Only keep results that have actual data
      const hasData = (r: AnalysisResultItem) =>
        r.descriptive || r.frequencies || r.correlations || r.tTests || r.chiSquares ||
        r.anovas || r.regressions || r.pca || r.factorAnalysis || r.clusterAnalysis ||
        r.pairedTTests || r.spearmanCorrelations || r.kendallCorrelations ||
        r.mannWhitney || r.wilcoxon || r.kruskalWallis || r.shapiroWilk || r.cronbachAlpha;

      if (hasData(result)) {
        newResults.push(result);
      }
    }

    // BLOCK 1 — Replace-on-match dedup: if a previous analysis has the same signature
    // (type + dep + sorted inds), replace it in place to preserve user execution order.
    // Otherwise, append. This avoids stale duplicates and reflects re-runs immediately.
    const sigOf = (r: AnalysisResultItem) =>
      `${r.type}::${r.depVar || ""}::${(r.indVars || []).slice().sort().join("|")}`;
    setAnalysisResults(prev => {
      const next = [...prev];
      for (const fresh of newResults) {
        const sig = sigOf(fresh);
        const idx = next.findIndex(r => sigOf(r) === sig);
        if (idx >= 0) {
          // Preserve original id so cached overrides (titles/charts) stay attached
          next[idx] = { ...fresh, id: next[idx].id };
        } else {
          next.push(fresh);
        }
      }
      return next;
    });

    // BLOCK 2 — Real-time sync: invalidate derived state so charts & document
    // regenerate from the latest results without requiring a manual refresh.
    if (newResults.length > 0) {
      setCachedCharts(null);
      setInterpretationData(null);
    }

    // Create notification for completed analysis
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("notifications").insert({
            user_id: user.id,
            title: `Analyse terminée`,
            message: `${newResults.length} analyse(s) complétée(s) : ${analysisKeys.join(", ")}`,
            type: "analysis_complete",
          });
        }
      } catch (_) { /* silent */ }
    })();
  }, [dataset, cleanedData, preparedData, excludedVariables, transformByOriginal]);

  const deleteAnalysis = useCallback((id: string) => {
    setAnalysisResults(prev => {
      const remaining = prev.filter(r => r.id !== id);
      // Clear interpretation if no results left
      if (remaining.length === 0) setInterpretationData(null);
      return remaining;
    });
    setTableOverrides(prev => { const n = { ...prev }; delete n[id]; return n; });
    setChartOverrides(prev => { const n = { ...prev }; delete n[id]; return n; });
    // Invalidate cached charts so they regenerate
    setCachedCharts(null);
  }, []);

  const replaceAnalysis = useCallback((id: string, analysisKey: string, software: string, depVarRaw?: string, indVarsRaw?: string[]) => {
    if (!dataset) return;
    const depVar = depVarRaw ? (transformByOriginal[depVarRaw] || depVarRaw) : depVarRaw;
    const indVars = indVarsRaw ? indVarsRaw.map(v => transformByOriginal[v] || v) : indVarsRaw;
    const rows = preparedData || cleanedData || dataset.rawData;
    const excludedSet = new Set(excludedVariables);
    const allCols = Object.keys(rows[0] || {});
    const isNumericCol = (c: string) => {
      const sample = rows.slice(0, 50).map(r => r[c]).filter(v => v != null && v !== "");
      if (!sample.length) return false;
      return sample.filter(v => typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "")).length / sample.length > 0.8;
    };
    const numVars = allCols.filter(c => !excludedSet.has(c) && !isIdentifierVariable(c, rows) && isNumericCol(c));
    const catVars = allCols.filter(c => !excludedSet.has(c) && !isIdentifierVariable(c, rows) && !isNumericCol(c));
    const effectiveDepVar = depVar || numVars[0];
    const effectiveIndVars = indVars && indVars.length > 0 ? indVars : numVars.slice(1);
    const analysisName = analysisKey.startsWith("custom:") ? analysisKey.slice(7) : analysisKey;
    const result: AnalysisResultItem = {
      id,
      type: analysisName,
      title: analysisName,
      timestamp: new Date().toISOString(),
      depVar,
      indVars: indVars ? [...indVars] : undefined,
    };

    // Reuse the same analysis logic from runAnalyses for a single key
    if (analysisKey === "descriptive_stats" || analysisKey === "frequencies" || analysisKey.startsWith("custom:")) {
      if (numVars.length) result.descriptive = computeDescriptive(rows, numVars);
      if (catVars.length) result.frequencies = computeFrequencies(rows, catVars);
    }
    if (analysisKey === "frequencies") result.frequencies = computeFrequencies(rows, catVars.length ? catVars : numVars.slice(0, 3));
    if (analysisKey === "correlation") {
      const corrVars = indVars && indVars.length >= 2 ? indVars.filter(v => numVars.includes(v)) : numVars;
      result.correlations = computeCorrelations(rows, corrVars);
    }
    if (analysisKey === "t_test" && effectiveDepVar) {
      const groupVar = indVars?.[0] || catVars[0];
      if (groupVar) { const t = computeTTest(rows, effectiveDepVar, groupVar); if (t) result.tTests = [t]; }
    }
    if (analysisKey === "chi_square" || analysisKey === "crosstab") {
      const v1 = depVar || indVars?.[0] || catVars[0];
      const v2 = depVar ? (indVars?.[0] || catVars[0]) : (indVars?.[1] || catVars[1]);
      if (v1 && v2 && v1 !== v2) result.chiSquares = [computeChiSquare(rows, v1, v2)];
    }
    if ((analysisKey === "anova" || analysisKey === "anova_basic") && effectiveDepVar) {
      const factorVar = indVars?.[0] || catVars[0];
      if (factorVar) result.anovas = [computeAnova(rows, effectiveDepVar, factorVar)];
    }
    if ((analysisKey === "simple_regression" || analysisKey === "multiple_regression" || analysisKey === "logistic_regression") && effectiveDepVar) {
      const regInd = effectiveIndVars.filter(v => v !== effectiveDepVar && numVars.includes(v));
      const ind = analysisKey === "simple_regression" ? regInd.slice(0, 1) : regInd;
      if (ind.length > 0) result.regressions = [computeRegression(rows, effectiveDepVar, ind)];
    }
    if (analysisKey === "pca" && numVars.length >= 2) result.pca = computePCA(rows, numVars);
    if (analysisKey === "factor_analysis" && numVars.length >= 2) result.factorAnalysis = computeFactorAnalysis(rows, numVars);
    if (analysisKey === "cluster_analysis" && numVars.length >= 2) result.clusterAnalysis = computeClusterAnalysis(rows, numVars);
    if (analysisKey === "cronbach_alpha" && numVars.length >= 2) {
      result.cronbachAlpha = computeCronbachAlpha(rows, numVars);
    }
    if (analysisKey === "paired_t_test") {
      const v1 = depVar || numVars[0];
      const v2 = indVars?.[0] || numVars[1];
      if (v1 && v2 && v1 !== v2) result.pairedTTests = [computePairedTTest(rows, v1, v2)];
    }
    if (analysisKey === "spearman") {
      const corrVars = indVars && indVars.length >= 2 ? indVars.filter(v => numVars.includes(v)) : numVars;
      if (corrVars.length >= 2) result.spearmanCorrelations = computeSpearman(rows, corrVars);
    }
    if (analysisKey === "kendall") {
      const corrVars = indVars && indVars.length >= 2 ? indVars.filter(v => numVars.includes(v)) : numVars;
      if (corrVars.length >= 2) result.kendallCorrelations = computeKendall(rows, corrVars);
    }
    if (analysisKey === "mann_whitney" && effectiveDepVar) {
      const groupVar = indVars?.[0] || catVars[0];
      if (groupVar) { const mw = computeMannWhitney(rows, effectiveDepVar, groupVar); if (mw) result.mannWhitney = [mw]; }
    }
    if (analysisKey === "wilcoxon") {
      const v1 = depVar || numVars[0];
      const v2 = indVars?.[0] || numVars[1];
      if (v1 && v2 && v1 !== v2) result.wilcoxon = [computeWilcoxon(rows, v1, v2)];
    }
    if (analysisKey === "kruskal_wallis" && effectiveDepVar) {
      const factorVar = indVars?.[0] || catVars[0];
      if (factorVar) result.kruskalWallis = [computeKruskalWallis(rows, effectiveDepVar, factorVar)];
    }
    if (analysisKey === "shapiro_wilk") {
      const testVars = indVars && indVars.length > 0 ? indVars.filter(v => numVars.includes(v)) : numVars.slice(0, 5);
      result.shapiroWilk = testVars.map(v => computeShapiroWilk(rows, v));
    }

    setAnalysisResults(prev => prev.map(r => r.id === id ? result : r));
    // Clear overrides for this analysis so auto-generated titles/interps refresh
    setTableOverrides(prev => { const n = { ...prev }; delete n[id]; return n; });
    setChartOverrides(prev => { const n = { ...prev }; delete n[id]; return n; });
    // Invalidate cached charts and interpretation so they regenerate
    setCachedCharts(null);
    setInterpretationData(null);
  }, [dataset, cleanedData, preparedData, excludedVariables, transformByOriginal]);

  const reset = useCallback(() => {
    setDataset(null);
    setPrepStatus("idle");
    setPrepError(null);
    setCleanedData(null);
    setAnalysisResults([]);
    setInterpretationData(null);
    setCachedCharts(null);
    setVariableTransforms({});
    setExcludedVariables([]);
  }, []);

  const restoreState = useCallback((results: AnalysisResultItem[], interpretation: InterpretationData | null) => {
    setAnalysisResults(results);
    setInterpretationData(interpretation);
  }, []);

  const restoreDatasetSummary = useCallback((summary: DatasetSummary) => {
    setDataset(summary);
    setPrepStatus("ready");
  }, []);

  return (
    <DatasetContext.Provider value={{ dataset, prepStatus, prepError, cleanedData, variableTransforms, excludedVariables, setVariableTransform, clearVariableTransform, setVariableExcluded, preparedData, activeVariables, getDisplayLabel, resolveAnalysisVar, analysisResults, interpretationData, setInterpretationData, cachedCharts, setCachedCharts, tableOverrides, chartOverrides, updateTableOverride, updateChartOverride, processFile, runCleaning, runAnalyses, deleteAnalysis, replaceAnalysis, reset, restoreState, restoreDatasetSummary, chatState, setChatState }}>
      {children}
    </DatasetContext.Provider>
  );
}
