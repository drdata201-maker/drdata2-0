import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

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

  const handleCreate = async () => {
    if (!title.trim() || !projectType) return;
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
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
      const { data, error } = await (supabase.from("projects") as any)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      toast.success(t("student.newProject.success"));
      navigate(`/analysis/workspace?project=${data.id}&level=${resolvedUserType}&type=${encodeURIComponent(projectType)}&domain=${encodeURIComponent(domain || "")}`);
    } catch (err: any) {
      toast.error(err?.message || t("pme.newAnalysis.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-2 lg:py-4">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          {t("dashboard.newProject")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground lg:text-base">
          {t("student.newProject.desc")}
        </p>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <Card className="border border-border/60 shadow-sm">
          <CardContent className="p-6 lg:p-8">
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              {t("student.wizard.step1Title")}
            </h2>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("pme.newAnalysis.analysisTitle")}
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("student.newProject.titlePlaceholder")}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("student.wizard.projectType")}
                </label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t("student.wizard.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((pt) => (
                      <SelectItem key={pt} value={pt}>{t(`student.type.${pt}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("student.wizard.domain")}
                </label>
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={t("student.wizard.domainPlaceholder")}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("pme.newAnalysis.description")}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("student.newProject.descPlaceholder")}
                  rows={4}
                  className="min-h-[110px] resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        className="flex justify-end pb-4"
      >
        <Button
          onClick={handleCreate}
          disabled={loading || !title.trim() || !projectType}
          size="lg"
          className="h-12 px-8 text-base font-medium shadow-sm"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "..." : t("joel.createAndStart")}
        </Button>
      </motion.div>
    </div>
  );
}
