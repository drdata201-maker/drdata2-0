import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileUp, BarChart3, ChevronRight, ChevronLeft, CheckCircle2, Upload } from "lucide-react";

const PROJECT_TYPES: Record<string, string[]> = {
  student_license: [
    "memoir_licence", "academic_project", "questionnaire_analysis",
    "field_survey_analysis", "descriptive_analysis",
  ],
  student_master: [
    "memoir_master", "research_project", "scientific_article",
    "advanced_analysis", "multivariate_analysis", "comparative_study",
  ],
  student_doctorate: [
    "phd_thesis", "scientific_research", "scientific_publication",
    "doctoral_advanced_analysis", "scientific_modeling", "predictive_analysis",
  ],
};

const ANALYSIS_OPTIONS: Record<string, string[]> = {
  student_license: [
    "descriptive_stats", "frequencies", "mean", "median",
    "simple_correlation", "t_test", "chi_square", "crosstab",
  ],
  student_master: [
    "descriptive_stats", "correlation", "simple_regression", "multiple_regression",
    "anova", "t_test", "chi_square", "factor_analysis", "pca", "cronbach_alpha",
  ],
  student_doctorate: [
    "multiple_regression", "panel_data", "time_series", "sem",
    "advanced_factor_analysis", "machine_learning", "logistic_regression",
    "survival_analysis", "multilevel_modeling",
  ],
};

const ACCEPTED_FORMATS = ".xlsx,.xls,.csv,.sav,.dta,.txt";

export function StudentNewProjectPage({ baseRoute, userType }: { baseRoute: string; userType: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [domain, setDomain] = useState("");
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const types = PROJECT_TYPES[userType] || PROJECT_TYPES.student_license;
  const analyses = ANALYSIS_OPTIONS[userType] || ANALYSIS_OPTIONS.student_license;

  const toggleAnalysis = (key: string) => {
    setSelectedAnalyses((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const canNext = () => {
    if (step === 1) return title.trim() && projectType;
    if (step === 2) return true;
    if (step === 3) return selectedAnalyses.length > 0;
    return false;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await (supabase.from("projects") as any).insert({
        user_id: session.user.id,
        title: title.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        status: "created",
        user_type: userType,
      });
      if (error) throw error;
      toast.success(t("student.newProject.success"));
      navigate(`${baseRoute}/projects`);
    } catch {
      toast.error(t("pme.newAnalysis.error"));
    } finally {
      setLoading(false);
    }
  };

  const stepIcons = [BookOpen, FileUp, BarChart3];
  const stepKeys = ["student.wizard.step1", "student.wizard.step2", "student.wizard.step3"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.newProject")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("student.newProject.desc")}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => {
          const Icon = stepIcons[s - 1];
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step > s
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{t(stepKeys[s - 1])}</span>
                <span className="sm:hidden">{s}</span>
              </div>
              {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Project Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("student.wizard.step1Title")}</CardTitle>
            <CardDescription>{t("student.wizard.step1Desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("pme.newAnalysis.analysisTitle")}</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("student.newProject.titlePlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("student.wizard.projectType")}</label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger><SelectValue placeholder={t("student.wizard.selectType")} /></SelectTrigger>
                <SelectContent>
                  {types.map((pt) => (
                    <SelectItem key={pt} value={pt}>{t(`student.type.${pt}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("student.wizard.domain")}</label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder={t("student.wizard.domainPlaceholder")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("pme.newAnalysis.description")}</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("student.newProject.descPlaceholder")} rows={3} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Data Import */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("student.wizard.step2Title")}</CardTitle>
            <CardDescription>{t("student.wizard.step2Desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
              }`}
              onClick={() => document.getElementById("file-upload")?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{t("student.wizard.dropFile")}</p>
                <p className="text-sm text-muted-foreground">{t("student.wizard.dropFileDesc")}</p>
              </div>
              {file && (
                <Badge variant="secondary" className="mt-2">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </Badge>
              )}
              <input id="file-upload" type="file" accept={ACCEPTED_FORMATS} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {["xlsx", "csv", "sav", "dta", "txt"].map((fmt) => (
                <Badge key={fmt} variant="outline" className="text-xs">.{fmt}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Analysis Options */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("student.wizard.step3Title")}</CardTitle>
            <CardDescription>{t("student.wizard.step3Desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {analyses.map((key) => (
                <Button key={key} variant={selectedAnalyses.includes(key) ? "default" : "outline"} size="sm" className="h-auto py-2 text-xs" onClick={() => toggleAnalysis(key)}>
                  {t(`student.analysis.${key}`)}
                </Button>
              ))}
            </div>
            {selectedAnalyses.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {selectedAnalyses.length} {t("student.wizard.selected")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          <ChevronLeft className="mr-1 h-4 w-4" /> {t("student.wizard.back")}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            {t("student.wizard.next")} <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={loading || !canNext()}>
            {loading ? "..." : t("student.wizard.create")}
          </Button>
        )}
      </div>
    </div>
  );
}
