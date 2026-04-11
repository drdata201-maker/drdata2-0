import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { isIdentifierVariable } from "@/lib/academicFormatter";
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
export type ChatPhase = "confirm" | "upload" | "software" | "analysis" | "variables" | "ready";

export interface ChatState {
  messages: ChatMessage[];
  phase: ChatPhase;
  chatHistory: { role: string; content: string }[];
  greetingSent: boolean;
  selectedSoftware: string;
  selectedAnalyses: string[];
  file: { name: string; size: number } | null;
}

interface DatasetContextType {
  dataset: DatasetSummary | null;
  prepStatus: PrepStatus;
  prepError: string | null;
  cleanedData: Record<string, unknown>[] | null;
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
  file: null,
};

export function DatasetProvider({ children }: { children: ReactNode }) {
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
      // Simulate cleaning: remove duplicates, fill missing with defaults
      const seen = new Set<string>();
      const cleaned = dataset.rawData.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map(row => {
        const cleaned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          if (v == null || v === "") {
            const varInfo = dataset.variables.find(vi => vi.name === k);
            cleaned[k] = varInfo?.type === "numeric" ? 0 : "N/A";
          } else {
            cleaned[k] = v;
          }
        }
        return cleaned;
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

  const runAnalyses = useCallback((analysisKeys: string[], software: string, depVar?: string, indVars?: string[]) => {
    if (!dataset) return;
    const rows = cleanedData || dataset.rawData;
    // Filter out identifier/technical variables before any analysis
    const numVars = dataset.variables
      .filter(v => v.type === "numeric" && !isIdentifierVariable(v.name, rows))
      .map(v => v.name);
    const catVars = dataset.variables
      .filter(v => (v.type === "categorical" || v.type === "ordinal") && !isIdentifierVariable(v.name, rows))
      .map(v => v.name);
    const newResults: AnalysisResultItem[] = [];
    const ts = new Date().toISOString();

    // Use user-selected variables if provided, otherwise fall back to auto-detection
    const effectiveDepVar = depVar || numVars[0];
    const effectiveIndVars = indVars && indVars.length > 0 ? indVars : numVars.slice(1);

    for (const key of analysisKeys) {
      const analysisName = key.startsWith("custom:") ? key.slice(7) : key;
      const result: AnalysisResultItem = { id: crypto.randomUUID(), type: analysisName, title: analysisName, timestamp: ts };

      if (key === "descriptive_stats" || key === "frequencies" || key.startsWith("custom:")) {
        if (numVars.length) result.descriptive = computeDescriptive(rows, numVars);
        if (catVars.length) result.frequencies = computeFrequencies(rows, catVars);
      }
      if (key === "frequencies") {
        result.frequencies = computeFrequencies(rows, catVars.length ? catVars : numVars.slice(0, 3));
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
      if (key === "chi_square") {
        const v1 = indVars?.[0] || catVars[0];
        const v2 = indVars?.[1] || catVars[1];
        if (v1 && v2) result.chiSquares = [computeChiSquare(rows, v1, v2)];
      }
      if (key === "crosstab") {
        const v1 = indVars?.[0] || catVars[0];
        const v2 = indVars?.[1] || catVars[1];
        if (v1 && v2) result.chiSquares = [computeChiSquare(rows, v1, v2)];
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
        if (numVars.length) result.descriptive = computeDescriptive(rows, numVars);
        if (numVars.length >= 2) result.correlations = computeCorrelations(rows, numVars);
      }

      // Only keep results that have actual data
      const hasData = (r: AnalysisResultItem) =>
        r.descriptive || r.frequencies || r.correlations || r.tTests || r.chiSquares ||
        r.anovas || r.regressions || r.pca || r.factorAnalysis || r.clusterAnalysis;

      if (hasData(result)) {
        newResults.push(result);
      }
    }

    setAnalysisResults(prev => [...prev, ...newResults]);

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
  }, [dataset, cleanedData]);

  const reset = useCallback(() => {
    setDataset(null);
    setPrepStatus("idle");
    setPrepError(null);
    setCleanedData(null);
    setAnalysisResults([]);
    setInterpretationData(null);
    setCachedCharts(null);
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
    <DatasetContext.Provider value={{ dataset, prepStatus, prepError, cleanedData, analysisResults, interpretationData, setInterpretationData, cachedCharts, setCachedCharts, tableOverrides, chartOverrides, updateTableOverride, updateChartOverride, processFile, runCleaning, runAnalyses, reset, restoreState, restoreDatasetSummary, chatState, setChatState }}>
      {children}
    </DatasetContext.Provider>
  );
}
