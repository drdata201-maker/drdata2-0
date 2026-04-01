import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Upload, Sparkles, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const ACCEPTED_FORMATS = ".xlsx,.xls,.csv,.sav,.dta";

const ANALYSIS_OPTIONS_BY_LEVEL: Record<string, string[]> = {
  student_license: ["descriptive_stats", "frequencies", "correlation", "t_test", "chi_square", "crosstab"],
  student_master: ["descriptive_stats", "correlation", "simple_regression", "multiple_regression", "anova", "chi_square", "factor_analysis", "pca", "cronbach_alpha"],
  student_doctorate: ["multiple_regression", "panel_data", "time_series", "sem", "advanced_factor_analysis", "logistic_regression", "survival_analysis", "multilevel_modeling"],
};

type Msg = { role: "assistant" | "user"; content: string; type?: string };

interface JoelChatProps {
  projectId: string | null;
  projectTitle: string;
  projectType: string;
  projectDomain: string;
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

export function JoelChat({ projectId, projectTitle, projectType, projectDomain, level }: JoelChatProps) {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"greeting" | "upload" | "analysis" | "ready">("greeting");
  const [file, setFile] = useState<File | null>(null);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("joel.greeting.morning");
    if (h < 18) return t("joel.greeting.afternoon");
    return t("joel.greeting.evening");
  };

  const projectContext = {
    title: projectTitle,
    type: projectType,
    domain: projectDomain,
    level: getLevelLabel(),
  };

  useEffect(() => {
    const greeting = getGreeting();
    const parts = [];
    if (projectTitle) parts.push(`📋 ${t("joel.summary.title")}: **${projectTitle}**`);
    if (projectType) parts.push(`📁 ${t("joel.summary.type")}: ${t(`student.type.${projectType}`)}`);
    if (projectDomain) parts.push(`🔬 ${t("joel.summary.domain")}: ${projectDomain}`);
    parts.push(`🎓 ${t("joel.summary.level")}: ${getLevelLabel()}`);

    setMessages([
      { role: "assistant", content: `${greeting}\n\n${t("joel.intro")}`, type: "greeting" },
      { role: "assistant", content: `${t("joel.projectSummary")}:\n\n${parts.join("\n")}`, type: "summary" },
      { role: "assistant", content: t("joel.askUpload"), type: "upload" },
    ]);
    setPhase("upload");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

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

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    const fileMsg = `📎 ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`;
    setMessages(prev => [
      ...prev,
      { role: "user", content: fileMsg },
      { role: "assistant", content: t("joel.fileReceived"), type: "text" },
      { role: "assistant", content: t("joel.askAnalysis"), type: "analysis" },
    ]);
    setPhase("analysis");
    scrollToBottom();
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

    // Send to AI for analysis
    const prompt = t("joel.aiAnalysisPrompt")
      .replace("{analyses}", selected)
      .replace("{file}", file?.name || "dataset");
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
    const prompt = t("joel.aiInterpretationPrompt");
    setMessages(prev => [...prev, { role: "user", content: t("joel.requestInterpretation") }]);
    scrollToBottom();
    sendToAI(prompt);
  };

  const requestConclusion = () => {
    const prompt = t("joel.aiConclusionPrompt");
    setMessages(prev => [...prev, { role: "user", content: t("joel.requestConclusion") }]);
    scrollToBottom();
    sendToAI(prompt);
  };

  const requestRecommendations = () => {
    const prompt = t("joel.aiRecommendationsPrompt");
    setMessages(prev => [...prev, { role: "user", content: t("joel.requestRecommendations") }]);
    scrollToBottom();
    sendToAI(prompt);
  };

  const analyses = ANALYSIS_OPTIONS_BY_LEVEL[level] || ANALYSIS_OPTIONS_BY_LEVEL.student_license;

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
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-line">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {/* Upload zone */}
        {phase === "upload" && (
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

        {/* Analysis selection */}
        {phase === "analysis" && (
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-2 gap-1.5">
              {analyses.map(key => (
                <Button
                  key={key}
                  variant={selectedAnalyses.includes(key) ? "default" : "outline"}
                  size="sm"
                  className="h-auto py-1.5 text-xs"
                  onClick={() => toggleAnalysis(key)}
                >
                  {t(`student.analysis.${key}`)}
                </Button>
              ))}
            </div>
            {selectedAnalyses.length > 0 && (
              <Button size="sm" className="w-full" onClick={confirmAnalyses} disabled={isStreaming}>
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
