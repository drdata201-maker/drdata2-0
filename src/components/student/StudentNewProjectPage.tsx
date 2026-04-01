import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles } from "lucide-react";

const licenceProjectTypes = [
  "memoir_licence", "academic_project", "questionnaire_analysis",
  "field_survey_analysis", "descriptive_analysis",
];

const masterProjectTypes = [
  "memoir_master", "research_project", "scientific_article",
  "comparative_analysis", "quantitative_research", "qualitative_research",
];

const doctoratProjectTypes = [
  "phd_thesis", "scientific_research", "scientific_publication",
  "advanced_analysis", "scientific_modeling", "experimental_research",
];

export function StudentNewProjectPage({ baseRoute, userType }: { baseRoute: string; userType: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const resolveStudentUserType = (): "student_license" | "student_master" | "student_doctorate" => {
    const routeLevel = baseRoute.match(/student-(license|licence|master|doctorate|doctorat)$/)?.[1];
    if (routeLevel === "master") return "student_master";
    if (routeLevel === "doctorate" || routeLevel === "doctorat") return "student_doctorate";
    if (routeLevel === "license" || routeLevel === "licence") return "student_license";
    const normalized = (userType || "").toLowerCase();
    if (normalized.includes("master")) return "student_master";
    if (normalized.includes("doctorat") || normalized.includes("doctorate")) return "student_doctorate";
    return "student_license";
  };

  const resolvedUserType = resolveStudentUserType();
  const types =
    resolvedUserType === "student_master"
      ? masterProjectTypes
      : resolvedUserType === "student_doctorate"
      ? doctoratProjectTypes
      : licenceProjectTypes;

  const getLevelLabel = () => {
    if (resolvedUserType === "student_master") return t("auth.level.master");
    if (resolvedUserType === "student_doctorate") return t("auth.level.doctorat");
    return t("auth.level.licence");
  };

  const handleCreate = async () => {
    if (!title.trim() || !projectType) return;
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("createProject:auth error", authError?.message);
        toast.error("Authentication error – please log in again.");
        navigate("/login");
        return;
      }
      const payload = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        status: "draft",
        user_type: resolvedUserType,
      };
      console.log("createProject:payload", payload);
      const { data, error } = await (supabase.from("projects") as any)
        .insert(payload)
        .select("id")
        .single();
      console.log("createProject:response", { data, error });
      if (error) throw new Error(error.message);
      toast.success(t("student.newProject.success"));
      navigate(`/analysis/workspace?project=${data.id}&level=${resolvedUserType}&type=${encodeURIComponent(projectType)}&domain=${encodeURIComponent(domain || "")}`);
    } catch (err: any) {
      console.error("createProject:error", err);
      toast.error(err?.message || t("pme.newAnalysis.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.newProject")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("student.newProject.desc")}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{t("student.wizard.step1Title")}</CardTitle>
              <CardDescription>{t("student.wizard.step1Desc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm text-primary font-medium">
              <Sparkles className="mr-1 inline h-4 w-4" />
              {t("joel.redirectInfo")} — {getLevelLabel()}
            </p>
          </div>
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

      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={loading || !title.trim() || !projectType} size="lg">
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "..." : t("joel.createAndStart")}
        </Button>
      </div>
    </div>
  );
}
