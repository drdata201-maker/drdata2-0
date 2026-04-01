import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Upload, Sparkles, Bot } from "lucide-react";

const ACCEPTED_FORMATS = ".xlsx,.xls,.csv,.sav,.dta";

const ANALYSIS_OPTIONS_BY_LEVEL: Record<string, string[]> = {
  student_license: ["descriptive_stats", "frequencies", "correlation", "t_test", "chi_square", "crosstab"],
  student_master: ["descriptive_stats", "correlation", "simple_regression", "multiple_regression", "anova", "chi_square", "factor_analysis", "pca", "cronbach_alpha"],
  student_doctorate: ["multiple_regression", "panel_data", "time_series", "sem", "advanced_factor_analysis", "logistic_regression", "survival_analysis", "multilevel_modeling"],
};

type Msg = { role: "assistant" | "user"; content: string; type?: "greeting" | "summary" | "upload" | "analysis" | "text" };

interface JoelChatProps {
  projectId: string | null;
  projectTitle: string;
  projectType: string;
  projectDomain: string;
  level: string;
}

export function JoelChat({ projectId, projectTitle, projectType, projectDomain, level }: JoelChatProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"greeting" | "upload" | "analysis" | "ready">("greeting");
  const [file, setFile] = useState<File | null>(null);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);

  const getLevelLabel = () => {
    if (level.includes("master")) return t("auth.level.master");
    if (level.includes("doctor") || level.includes("doctorat")) return t("auth.level.doctorat");
    return t("auth.level.licence");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = t("joel.greeting.morning");
    if (hour >= 12 && hour < 18) timeGreeting = t("joel.greeting.afternoon");
    if (hour >= 18) timeGreeting = t("joel.greeting.evening");
    return timeGreeting;
  };

  useEffect(() => {
    const greeting = getGreeting();
    const summaryParts = [];
    if (projectTitle) summaryParts.push(`📋 ${t("joel.summary.title")}: **${projectTitle}**`);
    if (projectType) summaryParts.push(`📁 ${t("joel.summary.type")}: ${t(`student.type.${projectType}`)}`);
    if (projectDomain) summaryParts.push(`🔬 ${t("joel.summary.domain")}: ${projectDomain}`);
    summaryParts.push(`🎓 ${t("joel.summary.level")}: ${getLevelLabel()}`);

    setMessages([
      { role: "assistant", content: `${greeting}\n\n${t("joel.intro")}`, type: "greeting" },
      { role: "assistant", content: `${t("joel.projectSummary")}:\n\n${summaryParts.join("\n")}`, type: "summary" },
      { role: "assistant", content: t("joel.askUpload"), type: "upload" },
    ]);
    setPhase("upload");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle]);

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `📎 ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)` },
      { role: "assistant", content: t("joel.fileReceived"), type: "text" },
      { role: "assistant", content: t("joel.askAnalysis"), type: "analysis" },
    ]);
    setPhase("analysis");
  };

  const toggleAnalysis = (key: string) => {
    setSelectedAnalyses((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const confirmAnalyses = () => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `${t("joel.selectedAnalyses")}: ${selectedAnalyses.map((a) => t(`student.analysis.${a}`)).join(", ")}` },
      { role: "assistant", content: t("joel.analysisStarting"), type: "text" },
    ]);
    setPhase("ready");
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: t("joel.processing"), type: "text" }]);
    }, 800);
    setInput("");
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
              {msg.content}
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
                {["xlsx", "csv", "sav", "dta"].map((fmt) => (
                  <Badge key={fmt} variant="outline" className="text-xs">.{fmt}</Badge>
                ))}
              </div>
              <input
                id="joel-file-upload"
                type="file"
                accept={ACCEPTED_FORMATS}
                className="hidden"
                onChange={(e) => {
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
              {analyses.map((key) => (
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
              <Button size="sm" className="w-full" onClick={confirmAnalyses}>
                <Sparkles className="mr-1 h-3 w-3" />
                {t("joel.startAnalysis")} ({selectedAnalyses.length})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("joel.askQuestion")}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
      </div>
    </>
  );
}
