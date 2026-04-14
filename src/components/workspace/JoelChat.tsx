import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Upload, Sparkles, Bot, Loader2, CheckCircle, Edit3, RotateCcw, CheckCheck, Variable, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  validateTTest,
  validateAnova,
  validateCorrelation,
  validateRegression,
  validateChiSquare,
  validatePCA,
  type ValidationResult,
} from "@/lib/assumptionValidator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import joelLicence from "@/assets/assistant_joel_license.png";
import joelMaster from "@/assets/assistant_joel_master.png";
import joelPhd from "@/assets/assistant_joel_phd.png";

const JOEL_AVATARS: Record<string, string> = {
  student_license: joelLicence,
  student_master: joelMaster,
  student_doctorate: joelPhd,
};
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { stripLatex } from "@/lib/latexSanitizer";
import { formatMetadataLabel, getLocalizedProjectContext } from "@/lib/projectMetadataLabels";
import { toast } from "sonner";

const ACCEPTED_FORMATS = ".xlsx,.xls,.csv,.sav,.dta";

interface AnalysisCategory {
  key: string;
  analyses: string[];
}

interface AnalysisCategoryGroup {
  groupKey?: "recommended" | "advanced_optional";
  categories: AnalysisCategory[];
}

const ANALYSIS_GROUPS_BY_LEVEL: Record<string, AnalysisCategoryGroup[]> = {
  student_license: [
    {
      groupKey: "recommended",
      categories: [
        { key: "descriptive_analysis", analyses: ["descriptive_full"] },
        { key: "analytical_analysis", analyses: ["crosstab", "chi_square"] },
      ],
    },
    {
      groupKey: "advanced_optional",
      categories: [
        { key: "comparative", analyses: ["t_test", "anova_basic"] },
        { key: "relationship", analyses: ["correlation"] },
        { key: "custom_analysis", analyses: [] },
      ],
    },
  ],
  student_master: [
    {
      categories: [
        { key: "descriptive_analysis", analyses: ["descriptive_full"] },
        { key: "analytical_analysis", analyses: ["crosstab", "chi_square"] },
        { key: "comparative", analyses: ["t_test", "anova", "nonparametric"] },
        { key: "relationship", analyses: ["correlation", "simple_regression", "multiple_regression"] },
        { key: "predictive", analyses: ["logistic_regression", "factor_analysis"] },
        { key: "reliability", analyses: ["cronbach_alpha", "pca"] },
      ],
    },
  ],
  student_doctorate: [
    {
      categories: [
        { key: "descriptive_analysis", analyses: ["descriptive_full"] },
        { key: "analytical_analysis", analyses: ["crosstab", "chi_square"] },
        { key: "comparative", analyses: ["t_test", "anova", "nonparametric"] },
        { key: "relationship", analyses: ["correlation", "simple_regression", "multiple_regression"] },
        { key: "predictive", analyses: ["logistic_regression", "factor_analysis", "sem"] },
        { key: "advanced", analyses: ["pca", "cluster_analysis", "panel_data", "time_series", "survival_analysis", "multilevel_modeling", "multivariate"] },
      ],
    },
  ],
};

// Analyses that require variable selection — ALL bivariate/multivariate analyses need dep/ind
const VARIABLE_REQUIRING: Record<string, { dependent?: boolean; independent?: boolean; variables?: number }> = {
  correlation: { variables: 2 },
  simple_regression: { dependent: true, independent: true },
  multiple_regression: { dependent: true, independent: true },
  logistic_regression: { dependent: true, independent: true },
  t_test: { dependent: true, independent: true },
  anova: { dependent: true, independent: true },
  anova_basic: { dependent: true, independent: true },
  chi_square: { dependent: true, independent: true },
  crosstab: { dependent: true, independent: true },
  pca: { variables: 2 },
  factor_analysis: { variables: 2 },
  cluster_analysis: { variables: 2 },
};

// "descriptive_full" is a meta-key that expands into descriptive_stats + frequencies
const expandAnalysisKeys = (keys: string[]): string[] => {
  const expanded: string[] = [];
  for (const k of keys) {
    if (k === "descriptive_full") {
      expanded.push("descriptive_stats", "frequencies");
    } else {
      expanded.push(k);
    }
  }
  return expanded;
};

type Msg = { role: "assistant" | "user"; content: string; type?: string };

interface JoelChatProps {
  projectId: string | null;
  projectTitle: string;
  projectType: string;
  projectDomain: string;
  projectDescription?: string;
  projectObjective?: string;
  level: string;
  onAnalysisComplete?: () => void;
  projectMetadata?: {
    specificObjectives?: string[];
    studyType?: string;
    studyDesign?: string;
    population?: string;
    primaryVariable?: string;
    hypothesis?: string;
    advancedHypothesis?: string;
    independentVars?: string;
    dependentVar?: string;
    controlVars?: string;
    mediatorVars?: string;
    moderatorVars?: string;
    conceptualModel?: string;
  };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/joel-chat`;

async function streamChat({
  messages,
  projectContext,
  language,
  onDelta,
  onDone,
  onError,
}: {
  messages: { role: string; content: string }[];
  projectContext: Record<string, unknown>;
  language: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, projectContext, language }),
    });

    if (resp.status === 429) { onError("rate_limit"); return; }
    if (resp.status === 402) { onError("credits"); return; }
    if (!resp.ok || !resp.body) { onError("generic"); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          buf = line + "\n" + buf;
          break;
        }
      }
    }

    if (buf.trim()) {
      for (let raw of buf.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (!raw.startsWith("data: ")) continue;
        const json = raw.slice(6).trim();
        if (json === "[DONE]") continue;
        try {
          const p = JSON.parse(json);
          const c = p.choices?.[0]?.delta?.content;
          if (c) onDelta(c);
        } catch { /* ignore */ }
      }
    }
    onDone();
  } catch {
    onError("generic");
  }
}

export function JoelChat({ projectId, projectTitle, projectType, projectDomain, projectDescription, projectObjective, level, onAnalysisComplete, projectMetadata }: JoelChatProps) {
  const { t, lang } = useLanguage();
  const { processFile, dataset, runAnalyses, analysisResults, chatState, setChatState, interpretationData, setInterpretationData } = useDataset();

  // Destructure persisted state
  const messages = chatState.messages;
  const phase = chatState.phase;
  const greetingSent = chatState.greetingSent;

  // Local-only UI state (doesn't need persistence)
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [customSoftware, setCustomSoftware] = useState("");
  const [customAnalysis, setCustomAnalysis] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedDepVar, setSelectedDepVar] = useState("");
  const [selectedIndVars, setSelectedIndVars] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const analyticalGraphMode = chatState.analyticalGraphMode;
  const setAnalyticalGraphMode = useCallback((v: "standard" | "advanced" | "presentation") => {
    setChatState(prev => ({ ...prev, analyticalGraphMode: v }));
  }, [setChatState]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<{ role: string; content: string }[]>(chatState.chatHistory);

  // Helpers to update persisted state
  const setMessages = useCallback((updater: Msg[] | ((prev: Msg[]) => Msg[])) => {
    setChatState(prev => ({
      ...prev,
      messages: typeof updater === "function" ? updater(prev.messages) : updater,
    }));
  }, [setChatState]);

  const setPhase = useCallback((p: typeof phase) => {
    setChatState(prev => ({ ...prev, phase: p }));
  }, [setChatState]);

  const setGreetingSent = useCallback((v: boolean) => {
    setChatState(prev => ({ ...prev, greetingSent: v }));
  }, [setChatState]);

  const selectedAnalyses = chatState.selectedAnalyses;
  const setSelectedAnalyses = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    setChatState(prev => ({
      ...prev,
      selectedAnalyses: typeof updater === "function" ? updater(prev.selectedAnalyses) : updater,
    }));
  }, [setChatState]);

  const selectedSoftware = chatState.selectedSoftware;
  const setSelectedSoftware = useCallback((v: string) => {
    setChatState(prev => ({ ...prev, selectedSoftware: v }));
  }, [setChatState]);

  // Sync chatHistoryRef back to context on every AI message
  const syncChatHistory = useCallback(() => {
    setChatState(prev => ({ ...prev, chatHistory: [...chatHistoryRef.current] }));
  }, [setChatState]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  const getLevelLabel = () => {
    if (level.includes("master")) return t("auth.level.master");
    if (level.includes("doctor") || level.includes("doctorat")) return t("auth.level.doctorat");
    return t("auth.level.licence");
  };

  const localizedProjectContext = useMemo(() => getLocalizedProjectContext({
    title: projectTitle,
    type: projectType,
    domain: projectDomain,
    description: projectDescription || "",
    objective: projectObjective || "",
    level: getLevelLabel(),
    specificObjectives: projectMetadata?.specificObjectives || [],
    studyType: projectMetadata?.studyType || "",
    studyDesign: projectMetadata?.studyDesign || "",
    population: projectMetadata?.population || "",
    primaryVariable: projectMetadata?.primaryVariable || "",
    hypothesis: projectMetadata?.hypothesis || "",
    advancedHypothesis: projectMetadata?.advancedHypothesis || "",
    independentVars: projectMetadata?.independentVars || "",
    dependentVar: projectMetadata?.dependentVar || "",
    controlVars: projectMetadata?.controlVars || "",
    mediatorVars: projectMetadata?.mediatorVars || "",
    moderatorVars: projectMetadata?.moderatorVars || "",
    conceptualModel: projectMetadata?.conceptualModel || "",
  }, t), [projectTitle, projectType, projectDomain, projectDescription, projectObjective, projectMetadata, t]);
  // Scroll to bottom on mount (when returning to tab)
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Build structured static greeting on first mount only — no AI call, no duplicates
  useEffect(() => {
    if (greetingSent) return;
    setGreetingSent(true);

    const h = new Date().getHours();
    const greeting = h < 12 ? t("joel.greeting.morning") : h < 18 ? t("joel.greeting.afternoon") : t("joel.greeting.evening");

    const domainLabel = formatMetadataLabel(projectDomain, "domain", t) || projectDomain;

    // Auto-correct common grammar issues
    const cleanObjective = (projectObjective || "")
      .replace(/habitudes de vies/gi, "habitudes de vie")
      .replace(/etudes/gi, "études");

    const parts: string[] = [];
    if (projectTitle) parts.push(`**${t("joel.summary.title")}** : ${projectTitle}`);
    if (projectType) parts.push(`**${t("joel.summary.type")}** : ${formatMetadataLabel(projectType, "projectType", t)}`);
    if (domainLabel) parts.push(`**${t("joel.summary.domain")}** : ${domainLabel}`);
    parts.push(`**${t("joel.summary.level")}** : ${getLevelLabel()}`);
    if (localizedProjectContext?.studyType) {
      parts.push(`**${t("joel.summary.studyType")}** : ${localizedProjectContext.studyType}`);
    }
    if (localizedProjectContext?.studyDesign) {
      parts.push(`**${t("joel.summary.studyDesign")}** : ${localizedProjectContext.studyDesign}`);
    }
    if (cleanObjective) parts.push(`**${t("joel.summary.objective")}** : ${cleanObjective}`);
    if (projectMetadata?.specificObjectives?.length) {
      const objList = projectMetadata.specificObjectives.map((o, i) => `${i + 1}. ${o}`).join("\n");
      parts.push(`**${t("joel.summary.specificObjectives")}** :\n${objList}`);
    }
    if (projectMetadata?.hypothesis) parts.push(`**${t("joel.summary.hypothesis")}** : ${projectMetadata.hypothesis}`);
    if (projectMetadata?.population) parts.push(`**${t("joel.summary.population")}** : ${projectMetadata.population}`);
    if (projectMetadata?.independentVars) parts.push(`**${t("joel.summary.independentVars")}** : ${projectMetadata.independentVars}`);
    if (projectMetadata?.dependentVar) parts.push(`**${t("joel.summary.dependentVar")}** : ${projectMetadata.dependentVar}`);
    if (projectMetadata?.advancedHypothesis) parts.push(`**${t("joel.summary.advancedHypothesis")}** : ${projectMetadata.advancedHypothesis}`);
    if (projectMetadata?.conceptualModel) parts.push(`**${t("joel.summary.conceptualModel")}** : ${projectMetadata.conceptualModel}`);
    const content = `${greeting}\n\n**${t("joel.projectSummary")} :**\n\n${parts.join("\n\n")}\n\n${t("joel.confirmQuestion")}`;

    setMessages([{ role: "assistant", content, type: "greeting" }]);

    // Seed chat history for future AI context
    chatHistoryRef.current = [{ role: "assistant", content }];
    syncChatHistory();
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendToAI = useCallback(async (userContent: string) => {
    chatHistoryRef.current.push({ role: "user", content: userContent });
    setIsStreaming(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.type === "ai-stream") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar, type: "ai-stream" }];
      });
      scrollToBottom();
    };

    await streamChat({
      messages: chatHistoryRef.current,
      projectContext: localizedProjectContext || {},
      language: lang,
      onDelta: upsertAssistant,
      onDone: () => {
        chatHistoryRef.current.push({ role: "assistant", content: assistantSoFar });
        syncChatHistory();
        setIsStreaming(false);
      },
      onError: (err) => {
        const errMsg = err === "rate_limit" ? t("joel.errorRateLimit")
          : err === "credits" ? t("joel.errorCredits")
          : t("joel.errorGeneric");
        setMessages(prev => [...prev, { role: "assistant", content: errMsg, type: "error" }]);
        setIsStreaming(false);
      },
    });
  }, [lang, localizedProjectContext, scrollToBottom, t, syncChatHistory, setMessages]);

  const handleConfirm = () => {
    setMessages(prev => [...prev, { role: "user", content: t("joel.confirmContinue") }]);
    setPhase("upload");
    scrollToBottom();
    sendToAI(t("joel.confirmContinue") + ". Now ask me to upload my dataset file for analysis.");
  };

  const handleModify = () => {
    setMessages(prev => [...prev, { role: "user", content: t("joel.confirmModify") }]);
    scrollToBottom();
    sendToAI(t("joel.confirmModify") + ". The student wants to modify their project details. Ask them what they'd like to change.");
  };

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    const fileMsg = `📎 ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`;
    setMessages(prev => [...prev, { role: "user", content: fileMsg }]);
    scrollToBottom();

    try {
      const summary = await processFile(uploadedFile);

      const prompt = `File uploaded and parsed: "${uploadedFile.name}" (${(uploadedFile.size / 1024).toFixed(1)} KB).
Real dataset stats:
- ${summary.observations} observations
- ${summary.variables.length} variables (${summary.variables.filter(v => v.type === "numeric").length} numeric, ${summary.variables.filter(v => v.type === "categorical").length} categorical)
- ${summary.totalMissingPct}% missing values
- ${summary.duplicateRows} duplicate rows

Respond concisely:
- Acknowledge file receipt with real numbers above
- Direct to **Data Preparation** tab for details
- Ask if they want automatic cleaning or to continue
Keep under 80 words.`;

      sendToAI(prompt);
      setPhase("software");
    } catch {
      sendToAI(`File upload failed for "${uploadedFile.name}". The file may be corrupted or unsupported. Ask the user to try another file. Keep under 50 words.`);
    }
  };

  const SOFTWARE_OPTIONS = ["SPSS", "Stata", "R", "Epi Info", "Jamovi", "Excel", "Python"];

  const handleSoftwareSelect = (sw: string) => {
    const name = sw === "other" ? customSoftware || "Other" : sw;
    setSelectedSoftware(name);
    setMessages(prev => [...prev, { role: "user", content: `🖥️ ${t("joel.selectedSoftware")}: ${name}` }]);
    setPhase("analysis");
    scrollToBottom();
    sendToAI(`Student selected "${name}" as statistical software. Acknowledge briefly. Then ask them to select analyses. Keep under 50 words.`);
  };

  const toggleAnalysis = (key: string) => {
    setSelectedAnalyses(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  // Check if any selected analysis needs variable selection
  const needsVariableSelection = useMemo(() => {
    const expanded = expandAnalysisKeys(selectedAnalyses);
    return expanded.some(a => VARIABLE_REQUIRING[a]);
  }, [selectedAnalyses]);

  const numericVars = useMemo(() =>
    dataset?.variables.filter(v => v.type === "numeric").map(v => v.name) || [],
    [dataset]
  );

  const categoricalVars = useMemo(() =>
    dataset?.variables.filter(v => v.type === "categorical" || v.type === "ordinal").map(v => v.name) || [],
    [dataset]
  );

  const allVarNames = useMemo(() =>
    dataset?.variables.map(v => v.name) || [],
    [dataset]
  );

  const toggleIndVar = (varName: string) => {
    setSelectedIndVars(prev =>
      prev.includes(varName) ? prev.filter(v => v !== varName) : [...prev, varName]
    );
  };

  const handleConfirmAnalysesStep = () => {
    if (needsVariableSelection) {
      const selected = selectedAnalyses.map(a =>
        a.startsWith("custom:") ? a.slice(7) : formatMetadataLabel(a, "analysis", t)
      ).join(", ");
      setMessages(prev => [
        ...prev,
        { role: "user", content: `${t("joel.selectedAnalyses")}: ${selected}` },
      ]);
      setPhase("variables");
      setSelectedDepVar("");
      setSelectedIndVars([]);
      scrollToBottom();
      sendToAI(`Selected analyses: ${selected}. Now ask the student to select the variables for their analysis. Keep under 40 words.`);
    } else {
      executeAnalyses();
    }
  };

  const confirmVariablesAndRun = () => {
    const varInfo = selectedDepVar
      ? `${t("joel.varDependent")}: ${selectedDepVar}, ${t("joel.varIndependent")}: ${selectedIndVars.join(", ")}`
      : `${t("joel.varSelected")}: ${selectedIndVars.join(", ")}`;
    setMessages(prev => [...prev, { role: "user", content: `📊 ${varInfo}` }]);
    scrollToBottom();

    // Run assumption validation before executing
    if (dataset?.rawData) {
      const results: ValidationResult[] = [];
      const expanded = expandAnalysisKeys(selectedAnalyses);

      for (const analysis of expanded) {
        try {
          if ((analysis === "t_test") && selectedDepVar && selectedIndVars.length > 0) {
            results.push(validateTTest(dataset.rawData as Record<string, unknown>[], selectedDepVar, selectedIndVars[0]));
          } else if ((analysis === "anova" || analysis === "anova_basic") && selectedDepVar && selectedIndVars.length > 0) {
            results.push(validateAnova(dataset.rawData as Record<string, unknown>[], selectedDepVar, selectedIndVars[0]));
          } else if (analysis === "correlation" && selectedIndVars.length >= 2) {
            results.push(validateCorrelation(dataset.rawData as Record<string, unknown>[], selectedIndVars[0], selectedIndVars[1]));
          } else if ((analysis === "simple_regression" || analysis === "multiple_regression" || analysis === "logistic_regression") && selectedDepVar) {
            results.push(validateRegression(dataset.rawData as Record<string, unknown>[], selectedDepVar, selectedIndVars));
          } else if ((analysis === "chi_square" || analysis === "crosstab") && selectedDepVar && selectedIndVars.length > 0) {
            results.push(validateChiSquare(dataset.rawData as Record<string, unknown>[], selectedDepVar, selectedIndVars[0]));
          } else if ((analysis === "pca" || analysis === "factor_analysis") && selectedIndVars.length >= 2) {
            results.push(validatePCA(dataset.rawData as Record<string, unknown>[], selectedIndVars));
          }
        } catch { /* validation failed silently — proceed anyway */ }
      }

      const hasWarnings = results.some(r => !r.valid);
      setValidationResults(results);

      if (hasWarnings) {
        setPhase("validation");
        // Build validation message for AI
        const warnings = results
          .filter(r => !r.valid)
          .map(r => `${r.analysisType}: ${r.checks.filter(c => !c.passed).map(c => c.detail).join("; ")}${r.alternativeSuggestion ? ` → ${r.alternativeSuggestion}` : ""}`)
          .join("\n");
        sendToAI(`Assumption validation detected issues:\n${warnings}\n\nAcknowledge the warnings briefly. Tell the student they can proceed anyway or choose the suggested alternative. Keep under 60 words. Use academic tone.`);
        return;
      }
    }

    executeAnalyses();
  };

  const executeAnalyses = async () => {
    const selected = selectedAnalyses.map(a =>
      a.startsWith("custom:") ? a.slice(7) : formatMetadataLabel(a, "analysis", t)
    ).join(", ");

    setPhase("ready");

    // Expand meta-keys before running
    const expandedKeys = expandAnalysisKeys(selectedAnalyses);
    runAnalyses(expandedKeys, selectedSoftware, selectedDepVar || undefined, selectedIndVars.length > 0 ? selectedIndVars : undefined);

    // Notify parent to switch to Results tab
    onAnalysisComplete?.();

    // Auto-save analysis to database
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("analyses").insert({
          user_id: session.user.id,
          project_id: projectId || undefined,
          title: `${selected} — ${projectTitle || "Analysis"}`,
          type: selectedAnalyses.join(","),
          status: "completed",
          user_type: level.includes("master") ? "student_master" : level.includes("doctor") ? "student_doctorate" : "student_license",
          results: { analyses: selectedAnalyses, software: selectedSoftware, dataset: file?.name, depVar: selectedDepVar, indVars: selectedIndVars } as any,
        } as any);

        if (projectId) {
          await supabase.from("projects").update({ status: "active" } as any).eq("id", projectId);
        }
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
    }

    const variableInfo = dataset
      ? `Available variables: ${dataset.variables.map(v => `${v.name} (${v.type})`).join(", ")}.`
      : "";

    const prompt = `Selected analyses: ${selected}. Software: ${selectedSoftware}. Dataset: ${file?.name || "uploaded dataset"}.
${selectedDepVar ? `Dependent variable: ${selectedDepVar}. Independent: ${selectedIndVars.join(", ")}.` : ""}
${variableInfo}

Respond concisely:
- Confirm analyses are running using ${selectedSoftware}-style output
- Direct to **Results** tab for statistical tables
- Direct to **Graphs** tab for visualizations
- Direct to **Interpretation** tab for academic interpretation
- Mention **Export** tab for downloading reports
- Ask if they want to run another analysis on the same dataset
Keep under 80 words. Do NOT display tables or results in chat.`;

    sendToAI(prompt);
  };

  const handleNewAnalysis = () => {
    setSelectedAnalyses([]);
    setExpandedCategory(null);
    setCustomAnalysis("");
    setSelectedDepVar("");
    setSelectedIndVars([]);
    setPhase("analysis");
    setMessages(prev => [...prev, { role: "user", content: t("joel.newAnalysis") }]);
    scrollToBottom();
    sendToAI("The student wants to run another analysis on the same dataset. Acknowledge briefly and ask them to select their next analysis. Keep under 40 words.");
  };

  const handleFinishProject = async () => {
    setMessages(prev => [...prev, { role: "user", content: t("joel.finishProject") }]);
    scrollToBottom();

    // Update project status to completed
    if (projectId) {
      try {
        await supabase.from("projects").update({ status: "completed" } as any).eq("id", projectId);
        toast.success(t("joel.projectSaved"));
      } catch { /* ignore */ }
    }

    // Generate academic report structure (sections 3.1–3.9) for Licence level
    if (level === "student_license" || level === "student_master" || level === "student_doctorat") {
      const { generateAcademicReport } = await import("@/lib/academicFormatter");
      const existingInterp = interpretationData;
      const academicReport = generateAcademicReport(
        analysisResults,
        lang,
        level,
        projectContext,
        existingInterp?.sections.map(s => s.interpretation).join("\n\n"),
        existingInterp?.globalConclusion,
        existingInterp?.globalRecommendations,
      );

      // Build interpretation data with academic report attached
      const interpSections = academicReport.sections
        .filter(s => s.number !== "3.8" && s.number !== "3.9")
        .map(s => ({
          analysisType: `${s.number} ${s.title}`,
          interpretation: s.content,
          conclusion: "",
          recommendations: "",
        }));

      const sec38 = academicReport.sections.find(s => s.number === "3.8");
      const sec39 = academicReport.sections.find(s => s.number === "3.9");

      setInterpretationData({
        sections: interpSections,
        globalConclusion: sec38?.content || existingInterp?.globalConclusion || "",
        globalRecommendations: sec39?.content || existingInterp?.globalRecommendations || "",
        academicReport,
      });
    }

    // Build a summary of all analyses for the AI to generate global interpretation
    const analysisSummary = analysisResults.map((r, i) => `Analysis ${i + 1}: ${r.type}`).join(", ");
    const significantResults = analysisResults
      .flatMap(r => (r.chiSquares || []).map(c => ({ var1: c.var1, var2: c.var2, p: c.pValue, sig: c.pValue < 0.05 })))
      .filter(r => r.sig)
      .map(r => `${r.var1} × ${r.var2} (p=${r.p.toFixed(3)})`)
      .join(", ");

    sendToAI(`The student has finished all analyses. Analyses performed: ${analysisSummary}. ${significantResults ? `Significant associations found: ${significantResults}.` : "No significant associations found."}

Generate a brief academic summary that includes:
1. A global analytical interpretation summarizing significant and non-significant associations
2. A scientific conclusion listing associated and non-associated factors
3. Research recommendations based on findings

Then remind the student to check the **Export** tab for their professional report with the complete academic structure (sections 3.1 to 3.9).
Keep under 120 words. Use academic language.`);
  };

  const sendMessage = () => {
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    scrollToBottom();
    sendToAI(text);
  };

  const requestInterpretation = () => {
    setMessages(prev => [...prev, { role: "user", content: t("joel.requestInterpretation") }]);
    scrollToBottom();
    sendToAI(t("joel.aiInterpretationPrompt"));
  };

  const requestConclusion = () => {
    setMessages(prev => [...prev, { role: "user", content: t("joel.requestConclusion") }]);
    scrollToBottom();
    sendToAI(t("joel.aiConclusionPrompt"));
  };

  const requestRecommendations = () => {
    setMessages(prev => [...prev, { role: "user", content: t("joel.requestRecommendations") }]);
    scrollToBottom();
    sendToAI(t("joel.aiRecommendationsPrompt"));
  };

  const requestCharts = () => {
    setMessages(prev => [...prev, { role: "user", content: t("joel.requestCharts") }]);
    scrollToBottom();
    sendToAI(`Based on the analysis results, recommend and describe the most appropriate charts and visualizations for this research. Include: which chart type for each variable/relationship, what it would show, and how to interpret it academically. Suggest: histogram, bar chart, scatter plot, box plot, heatmap, pie chart, or correlation matrix as appropriate.`);
  };

  const analysisGroups = ANALYSIS_GROUPS_BY_LEVEL[level] || ANALYSIS_GROUPS_BY_LEVEL.student_license;
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-primary/5">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={JOEL_AVATARS[level] || joelLicence} alt="Assistant Joël" />
            <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
          </Avatar>
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-foreground">Assistant Joël</p>
          <p className="text-xs text-muted-foreground">{t("joel.subtitle")}</p>
        </div>
        {isStreaming && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start items-start gap-2"}`}>
            {msg.role === "assistant" && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={JOEL_AVATARS[level] || joelLicence} alt="Joël" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs"><Bot className="h-3 w-3" /></AvatarFallback>
                </Avatar>
              </motion.div>
            )}
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : msg.type === "error"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-muted text-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1 [&>table]:text-xs [&>table]:w-full [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                  <ReactMarkdown>{stripLatex(msg.content)}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-line">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isStreaming && (
          <div className="flex items-start gap-2">
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarImage src={JOEL_AVATARS[level] || joelLicence} alt="Joël" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs"><Bot className="h-3 w-3" /></AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1.5">
              <motion.span className="block h-2 w-2 rounded-full bg-muted-foreground/50" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
              <motion.span className="block h-2 w-2 rounded-full bg-muted-foreground/50" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
              <motion.span className="block h-2 w-2 rounded-full bg-muted-foreground/50" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
            </div>
          </div>
        )}

        {phase === "confirm" && !isStreaming && messages.length > 0 && (
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={handleConfirm} className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              {t("joel.confirmContinue")}
            </Button>
            <Button size="sm" variant="outline" onClick={handleModify} className="gap-1.5">
              <Edit3 className="h-3.5 w-3.5" />
              {t("joel.confirmModify")}
            </Button>
          </div>
        )}

        {/* Upload zone */}
        {phase === "upload" && !isStreaming && (
          <div className="mt-2">
            <div
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-primary/40 p-4 text-center cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => document.getElementById("joel-file-upload")?.click()}
            >
              <Upload className="h-8 w-8 text-primary/60" />
              <p className="text-sm font-medium text-foreground">{t("joel.dropFile")}</p>
              <div className="flex flex-wrap gap-1">
                {["xlsx", "csv", "sav", "dta"].map(fmt => (
                  <Badge key={fmt} variant="outline" className="text-xs">.{fmt}</Badge>
                ))}
              </div>
              <input
                id="joel-file-upload"
                type="file"
                accept={ACCEPTED_FORMATS}
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
            </div>
          </div>
        )}

        {/* Software selection */}
        {phase === "software" && !isStreaming && (
          <div className="mt-2 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">{t("joel.selectSoftware")}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {SOFTWARE_OPTIONS.map(sw => (
                <Button
                  key={sw}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 text-xs font-medium"
                  onClick={() => handleSoftwareSelect(sw)}
                >
                  {sw}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-2 text-xs font-medium"
                onClick={() => {
                  if (customSoftware.trim()) handleSoftwareSelect("other");
                }}
              >
                {t("joel.otherSoftware")}
              </Button>
            </div>
            <Input
              value={customSoftware}
              onChange={e => setCustomSoftware(e.target.value)}
              placeholder={t("joel.specifySoftware")}
              className="text-xs"
              onKeyDown={e => {
                if (e.key === "Enter" && customSoftware.trim()) handleSoftwareSelect("other");
              }}
            />
          </div>
        )}

        {/* Analysis selection - categorized with recommended/advanced groups */}
        {phase === "analysis" && !isStreaming && (
          <div className="mt-2 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">{t("joel.askAnalysis")}</p>

            {/* Smart recommendation message for Licence */}
            {level === "student_license" && projectDomain && (
              <div className="rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-foreground">
                💡 {t("joel.smartRecommendation").replace(
                  "{domain}",
                  formatMetadataLabel(projectDomain, "domain", t) || projectDomain
                )}
              </div>
            )}

            {analysisGroups.map((group, gi) => (
              <div key={gi} className="space-y-2">
                {/* Group header for recommended / advanced */}
                {group.groupKey && (
                  <div className="flex items-center gap-2">
                    {group.groupKey === "recommended" ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t("joel.group.recommended")}
                      </div>
                    ) : (
                      <button
                        onClick={() => setAdvancedExpanded(!advancedExpanded)}
                        className="flex w-full items-center justify-between rounded-md bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        {t("joel.group.advanced_optional")}
                        <span>{advancedExpanded ? "−" : "+"}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Hide advanced categories if collapsed */}
                {(!group.groupKey || group.groupKey === "recommended" || advancedExpanded) && (
                  <>
                    {group.categories.map(cat => (
                      <div key={cat.key} className="space-y-1.5">
                        <button
                          onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                            group.groupKey === "recommended"
                              ? "bg-primary/10 text-primary hover:bg-primary/15"
                              : "bg-muted/50 text-foreground hover:bg-muted"
                          }`}
                        >
                          {t(`joel.category.${cat.key}`)}
                          <span className="text-muted-foreground">{expandedCategory === cat.key ? "−" : "+"}</span>
                        </button>
                        {(expandedCategory === cat.key || (group.groupKey === "recommended" && expandedCategory === null)) && (
                          <div className="grid grid-cols-2 gap-1 pl-1">
                            {cat.analyses.map(key => (
                              <Button
                                key={key}
                                variant={selectedAnalyses.includes(key) ? "default" : "outline"}
                                size="sm"
                                className="h-auto py-1.5 text-xs justify-start"
                                onClick={() => toggleAnalysis(key)}
                              >
                                {formatMetadataLabel(key, "analysis", t)}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}

            {/* Analytical graphs toggle */}
            {selectedAnalyses.some(a => ["crosstab", "chi_square", "t_test", "anova_basic", "anova", "correlation"].includes(a)) && (
              <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3">
                <label className="text-xs font-semibold text-foreground">📊 {t("joel.analyticalGraphs")}</label>
                <Select value={analyticalGraphMode} onValueChange={(v) => setAnalyticalGraphMode(v as "standard" | "advanced" | "presentation")}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard" className="text-xs">{t("joel.graphMode.standard")}</SelectItem>
                    <SelectItem value="advanced" className="text-xs">{t("joel.graphMode.advanced")}</SelectItem>
                    <SelectItem value="presentation" className="text-xs">{t("joel.graphMode.presentation")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">{t(`joel.graphMode.${analyticalGraphMode}Desc`)}</p>
              </div>
            )}

            {/* Other analysis */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t("joel.otherAnalysis")}</p>
              <Input
                value={customAnalysis}
                onChange={e => setCustomAnalysis(e.target.value)}
                placeholder={t("joel.specifyAnalysis")}
                className="text-xs"
                onKeyDown={e => {
                  if (e.key === "Enter" && customAnalysis.trim()) {
                    setSelectedAnalyses(prev => [...prev, `custom:${customAnalysis.trim()}`]);
                    setCustomAnalysis("");
                  }
                }}
              />
            </div>

            {selectedAnalyses.length > 0 && (
              <Button size="sm" className="w-full" onClick={handleConfirmAnalysesStep}>
                <Sparkles className="mr-1 h-3 w-3" />
                {t("joel.startAnalysis")} ({selectedAnalyses.length})
              </Button>
            )}
          </div>
        )}

        {/* Variable selection — improved academic interface */}
        {phase === "variables" && !isStreaming && dataset && (
          <div className="mt-2 space-y-4">
            <div className="flex items-center gap-2">
              <Variable className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">
                {t("joel.selectVariables")}
              </p>
            </div>

            {/* Smart suggestion based on project metadata */}
            {(() => {
              const suggestedDep = projectMetadata?.primaryVariable
                || projectMetadata?.dependentVar
                || "";
              const matchingVar = suggestedDep
                ? allVarNames.find(v => v.toLowerCase().includes(suggestedDep.toLowerCase()) || suggestedDep.toLowerCase().includes(v.toLowerCase()))
                : null;
              if (matchingVar && !selectedDepVar) {
                return (
                  <div className="rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-foreground flex items-center justify-between gap-2">
                    <span>💡 <strong>{t("joel.varSuggestion")}</strong> : {matchingVar}</span>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setSelectedDepVar(matchingVar)}>
                      {t("joel.confirmContinue")}
                    </Button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Dependent variable selector — for dep/ind analyses */}
            {selectedAnalyses.some(a => VARIABLE_REQUIRING[a]?.dependent) && (
              <div className="space-y-1.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  🎯 {t("joel.varDependent")}
                </label>
                <p className="text-[10px] text-muted-foreground mb-1.5">{t("joel.varDepHint")}</p>
                <Select value={selectedDepVar} onValueChange={setSelectedDepVar}>
                  <SelectTrigger className="text-xs h-9 bg-background">
                    <SelectValue placeholder={t("joel.varSelectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {allVarNames.map(v => {
                      const varInfo = dataset.variables.find(dv => dv.name === v);
                      const isNum = varInfo?.type === "numeric";
                      return (
                        <SelectItem key={v} value={v} className="text-xs">
                          <span className="flex items-center gap-2">
                            {v}
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              {isNum ? t("joel.varNumeric") : t("joel.varCategorical")}
                            </Badge>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Independent variable(s) — for dep/ind analyses */}
            {selectedAnalyses.some(a => VARIABLE_REQUIRING[a]?.independent) && (
              <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  📊 {t("joel.varIndependent")}
                </label>
                <p className="text-[10px] text-muted-foreground mb-1.5">{t("joel.varIndHint")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {allVarNames.filter(v => v !== selectedDepVar).map(v => {
                    const varInfo = dataset.variables.find(dv => dv.name === v);
                    const isNum = varInfo?.type === "numeric";
                    const isSelected = selectedIndVars.includes(v);
                    return (
                      <Button
                        key={v}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="h-auto py-1.5 px-2.5 text-xs gap-1.5"
                        onClick={() => toggleIndVar(v)}
                      >
                        {v}
                        <Badge
                          variant={isSelected ? "secondary" : "outline"}
                          className="text-[9px] px-1 py-0 h-4"
                        >
                          {isNum ? "N" : "C"}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
                {selectedIndVars.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {selectedIndVars.length} {t("joel.varSelected").toLowerCase()}
                  </p>
                )}
              </div>
            )}

            {/* For correlation/PCA/factor/cluster: pick multiple variables */}
            {selectedAnalyses.some(a => VARIABLE_REQUIRING[a]?.variables) && !selectedAnalyses.some(a => VARIABLE_REQUIRING[a]?.dependent) && (
              <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  📊 {t("joel.varSelect2")}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allVarNames.map(v => {
                    const varInfo = dataset.variables.find(dv => dv.name === v);
                    const isNum = varInfo?.type === "numeric";
                    const isSelected = selectedIndVars.includes(v);
                    return (
                      <Button
                        key={v}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="h-auto py-1.5 px-2.5 text-xs gap-1.5"
                        onClick={() => toggleIndVar(v)}
                      >
                        {v}
                        <Badge
                          variant={isSelected ? "secondary" : "outline"}
                          className="text-[9px] px-1 py-0 h-4"
                        >
                          {isNum ? "N" : "C"}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirm variables */}
            {(selectedDepVar || selectedIndVars.length >= 2 || (selectedAnalyses.some(a => VARIABLE_REQUIRING[a]?.independent) && selectedIndVars.length >= 1)) && (
              <Button size="sm" className="w-full gap-1.5" onClick={confirmVariablesAndRun}>
                <Sparkles className="h-3.5 w-3.5" />
                {t("joel.runWithVariables")}
                {selectedDepVar && (
                  <span className="text-[10px] opacity-80">
                    ({selectedDepVar} → {selectedIndVars.join(", ")})
                  </span>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Validation warnings */}
        {phase === "validation" && !isStreaming && validationResults.length > 0 && (
          <div className="mt-2 space-y-3">
            {validationResults.map((vr, vi) => (
              <div key={vi} className={`rounded-lg border p-3 space-y-2 ${vr.valid ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"}`}>
                <div className="flex items-center gap-2">
                  {vr.valid
                    ? <ShieldCheck className="h-4 w-4 text-green-600" />
                    : <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  }
                  <span className="text-xs font-semibold text-foreground">{vr.analysisType}</span>
                  <Badge variant={vr.valid ? "default" : "outline"} className={`text-[9px] ${vr.valid ? "bg-green-600" : "border-yellow-500 text-yellow-700"}`}>
                    {vr.valid ? t("joel.validation.passed") : t("joel.validation.warning")}
                  </Badge>
                </div>
                {vr.checks.filter(c => !c.passed).map((check, ci) => (
                  <div key={ci} className="text-xs text-muted-foreground pl-6 space-y-0.5">
                    <p>⚠ <strong>{check.assumption}</strong>: {check.detail}</p>
                    {check.suggestion && <p className="text-yellow-700 dark:text-yellow-400 italic">{check.suggestion}</p>}
                  </div>
                ))}
                {vr.alternativeSuggestion && !vr.valid && (
                  <p className="text-xs text-primary pl-6 font-medium">💡 {vr.alternativeSuggestion}</p>
                )}
                {vr.valid && (
                  <p className="text-xs text-green-700 dark:text-green-400 pl-6">{t("joel.validation.allPassed")}</p>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => executeAnalyses()} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {t("joel.validation.proceedAnyway")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setPhase("analysis"); setValidationResults([]); }} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                {t("joel.validation.changeAnalysis")}
              </Button>
            </div>
          </div>
        )}

        {/* Quick action buttons after analysis */}
        {phase === "ready" && !isStreaming && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={requestInterpretation}>
                📝 {t("joel.requestInterpretation")}
              </Button>
              <Button size="sm" variant="outline" onClick={requestCharts}>
                📊 {t("joel.requestCharts")}
              </Button>
              <Button size="sm" variant="outline" onClick={requestConclusion}>
                🎯 {t("joel.requestConclusion")}
              </Button>
              <Button size="sm" variant="outline" onClick={requestRecommendations}>
                💡 {t("joel.requestRecommendations")}
              </Button>
            </div>
            <div className="flex gap-2 border-t border-border pt-2">
              <Button size="sm" variant="default" onClick={handleNewAnalysis} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                {t("joel.newAnalysis")}
              </Button>
              <Button size="sm" variant="secondary" onClick={handleFinishProject} className="gap-1.5">
                <CheckCheck className="h-3.5 w-3.5" />
                {t("joel.finishProject")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t("joel.askQuestion")}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={isStreaming}
        />
        <Button size="icon" onClick={sendMessage} disabled={isStreaming || !input.trim()}>
          {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </>
  );
}
