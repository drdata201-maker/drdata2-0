import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Upload, Sparkles, Bot, Loader2, CheckCircle, Edit3 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const ACCEPTED_FORMATS = ".xlsx,.xls,.csv,.sav,.dta";

interface AnalysisCategory {
  key: string;
  analyses: string[];
}

const ANALYSIS_CATEGORIES_BY_LEVEL: Record<string, AnalysisCategory[]> = {
  student_license: [
    { key: "descriptive", analyses: ["descriptive_stats", "frequencies", "crosstab"] },
    { key: "comparative", analyses: ["t_test", "chi_square", "anova_basic"] },
    { key: "relationship", analyses: ["correlation"] },
  ],
  student_master: [
    { key: "descriptive", analyses: ["descriptive_stats", "frequencies", "crosstab"] },
    { key: "comparative", analyses: ["t_test", "chi_square", "anova", "nonparametric"] },
    { key: "relationship", analyses: ["correlation", "simple_regression", "multiple_regression"] },
    { key: "predictive", analyses: ["logistic_regression", "factor_analysis"] },
    { key: "reliability", analyses: ["cronbach_alpha", "pca"] },
  ],
  student_doctorate: [
    { key: "descriptive", analyses: ["descriptive_stats", "frequencies", "crosstab"] },
    { key: "comparative", analyses: ["t_test", "chi_square", "anova", "nonparametric"] },
    { key: "relationship", analyses: ["correlation", "simple_regression", "multiple_regression"] },
    { key: "predictive", analyses: ["logistic_regression", "factor_analysis", "sem"] },
    { key: "advanced", analyses: ["pca", "cluster_analysis", "panel_data", "time_series", "survival_analysis", "multilevel_modeling", "multivariate"] },
  ],
};

// Analyses that require variable selection
const VARIABLE_REQUIRING: Record<string, { dependent?: boolean; independent?: boolean; variables?: number }> = {
  correlation: { variables: 2 },
  simple_regression: { dependent: true, independent: true },
  multiple_regression: { dependent: true, independent: true },
  logistic_regression: { dependent: true, independent: true },
  t_test: { dependent: true, independent: true },
  anova: { dependent: true, independent: true },
  anova_basic: { dependent: true, independent: true },
  chi_square: { variables: 2 },
  crosstab: { variables: 2 },
};

type Msg = { role: "assistant" | "user"; content: string; type?: string };

interface JoelChatProps {
  projectId: string | null;
  projectTitle: string;
  projectType: string;
  projectDomain: string;
  projectDescription?: string;
  level: string;
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
  projectContext: Record<string, string>;
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

export function JoelChat({ projectId, projectTitle, projectType, projectDomain, projectDescription, level }: JoelChatProps) {
  const { t, lang } = useLanguage();
  const { processFile, dataset } = useDataset();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"confirm" | "upload" | "software" | "analysis" | "variables" | "ready">("confirm");
  const [file, setFile] = useState<File | null>(null);
  const [selectedSoftware, setSelectedSoftware] = useState<string>("");
  const [customSoftware, setCustomSoftware] = useState("");
  const [customAnalysis, setCustomAnalysis] = useState("");
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [greetingSent, setGreetingSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<{ role: string; content: string }[]>([]);

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

  const projectContext = {
    title: projectTitle,
    type: projectType,
    domain: projectDomain,
    description: projectDescription || "",
    level: getLevelLabel(),
  };

  // Send AI-powered smart greeting on mount
  useEffect(() => {
    if (greetingSent) return;
    setGreetingSent(true);

    const h = new Date().getHours();
    const timeOfDay = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";

    const greetingPrompt = `The student just opened the workspace. Time: ${timeOfDay}. 
Greet briefly as Joël. Acknowledge: project "${projectTitle}", type "${projectType}", domain "${projectDomain}", level "${getLevelLabel()}".
Present a short project summary (bullet points). Ask if they want to continue or modify.
Keep it under 100 words. No long paragraphs.`;

    setIsStreaming(true);
    let assistantSoFar = "";

    streamChat({
      messages: [{ role: "user", content: greetingPrompt }],
      projectContext,
      language: lang,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.type === "ai-stream") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar, type: "ai-stream" }];
        });
        scrollToBottom();
      },
      onDone: () => {
        chatHistoryRef.current.push(
          { role: "user", content: greetingPrompt },
          { role: "assistant", content: assistantSoFar }
        );
        setIsStreaming(false);
      },
      onError: (err) => {
        // Fallback to static greeting if AI fails
        const greeting = h < 12 ? t("joel.greeting.morning") : h < 18 ? t("joel.greeting.afternoon") : t("joel.greeting.evening");
        const parts = [];
        if (projectTitle) parts.push(`📋 **${t("joel.summary.title")}:** ${projectTitle}`);
        if (projectType) parts.push(`📁 **${t("joel.summary.type")}:** ${t(`student.type.${projectType}`)}`);
        if (projectDomain) parts.push(`🔬 **${t("joel.summary.domain")}:** ${projectDomain}`);
        parts.push(`🎓 **${t("joel.summary.level")}:** ${getLevelLabel()}`);

        setMessages([
          { role: "assistant", content: `${greeting}\n\n${t("joel.intro")}\n\n**${t("joel.projectSummary")}:**\n\n${parts.join("\n\n")}\n\n${t("joel.confirmQuestion")}`, type: "greeting" },
        ]);
        setIsStreaming(false);
      },
    });
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
      projectContext,
      language: lang,
      onDelta: upsertAssistant,
      onDone: () => {
        chatHistoryRef.current.push({ role: "assistant", content: assistantSoFar });
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
  }, [lang, projectContext, scrollToBottom, t]);

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

  const confirmAnalyses = () => {
    const selected = selectedAnalyses.map(a => t(`student.analysis.${a}`)).join(", ");
    setMessages(prev => [
      ...prev,
      { role: "user", content: `${t("joel.selectedAnalyses")}: ${selected}` },
    ]);
    setPhase("ready");
    scrollToBottom();

    const prompt = `Selected analyses: ${selected}. Software: ${selectedSoftware}. Dataset: ${file?.name || "uploaded dataset"}.

Respond concisely:
- Confirm analyses are running using ${selectedSoftware}-style output
- Direct to **Results** tab for statistical tables
- Direct to **Graphs** tab for visualizations
- Direct to **Interpretation** tab for academic interpretation
- Mention **Export** tab for downloading reports
Keep under 80 words. Do NOT display tables or results in chat.`;

    sendToAI(prompt);
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

  const categories = ANALYSIS_CATEGORIES_BY_LEVEL[level] || ANALYSIS_CATEGORIES_BY_LEVEL.student_license;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-primary/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Assistant Joël</p>
          <p className="text-xs text-muted-foreground">{t("joel.subtitle")}</p>
        </div>
        {isStreaming && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : msg.type === "error"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-muted text-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1 [&>table]:text-xs [&>table]:w-full [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-line">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {/* Confirm/Modify buttons */}
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

        {/* Analysis selection - categorized */}
        {phase === "analysis" && !isStreaming && (
          <div className="mt-2 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">{t("joel.askAnalysis")}</p>
            {categories.map(cat => (
              <div key={cat.key} className="space-y-1.5">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
                  className="flex w-full items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {t(`joel.category.${cat.key}`)}
                  <span className="text-muted-foreground">{expandedCategory === cat.key ? "−" : "+"}</span>
                </button>
                {(expandedCategory === cat.key || expandedCategory === null) && (
                  <div className="grid grid-cols-2 gap-1 pl-1">
                    {cat.analyses.map(key => (
                      <Button
                        key={key}
                        variant={selectedAnalyses.includes(key) ? "default" : "outline"}
                        size="sm"
                        className="h-auto py-1.5 text-xs justify-start"
                        onClick={() => toggleAnalysis(key)}
                      >
                        {t(`student.analysis.${key}`)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

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
              <Button size="sm" className="w-full" onClick={confirmAnalyses}>
                <Sparkles className="mr-1 h-3 w-3" />
                {t("joel.startAnalysis")} ({selectedAnalyses.length})
              </Button>
            )}
          </div>
        )}

        {/* Quick action buttons after analysis */}
        {phase === "ready" && !isStreaming && (
          <div className="mt-3 flex flex-wrap gap-2">
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
