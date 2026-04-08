import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Sparkles, Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

const RESEARCH_DOMAINS = [
  "health_sciences", "public_health", "medicine", "nursing", "pharmacy",
  "economics", "management", "finance", "accounting", "marketing",
  "sociology", "psychology", "education",
  "computer_science", "engineering", "agriculture",
  "law", "mathematics", "statistics",
  "communication", "political_science", "environmental_science",
  "biology", "chemistry", "physics",
];

const STUDY_TYPES = [
  "descriptive", "analytical", "comparative",
  "experimental", "cross_sectional", "longitudinal",
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
  const [objective, setObjective] = useState("");
  const [specificObjectives, setSpecificObjectives] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [domain, setDomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [domainOpen, setDomainOpen] = useState(false);
  const [studyType, setStudyType] = useState("");
  const [studyPopulation, setStudyPopulation] = useState("");
  const [primaryVariable, setPrimaryVariable] = useState("");
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

  const finalDomain = domain === "__other__" ? customDomain.trim() : domain;
  const domainLabel = useMemo(() => {
    if (!domain) return "";
    if (domain === "__other__") return customDomain || t("student.newProject.otherDomain");
    return t(`domain.${domain}`);
  }, [domain, customDomain, t]);

  const addSpecificObjective = () => {
    setSpecificObjectives((prev) => [...prev, ""]);
  };

  const updateSpecificObjective = (index: number, value: string) => {
    setSpecificObjectives((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const removeSpecificObjective = (index: number) => {
    setSpecificObjectives((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!title.trim() || !projectType || !objective.trim()) return;
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
        domain: finalDomain || null,
        status: "draft",
        user_type: resolvedUserType,
      };
      const { data, error } = await (supabase.from("projects") as any)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      toast.success(t("student.newProject.success"));

      const filteredObjectives = specificObjectives.filter((o) => o.trim());
      const params = new URLSearchParams({
        project: data.id,
        level: resolvedUserType,
        type: projectType,
        domain: finalDomain || "",
        objective: objective.trim(),
      });
      if (filteredObjectives.length > 0) params.set("specificObjectives", JSON.stringify(filteredObjectives));
      if (studyType) params.set("studyType", studyType);
      if (studyPopulation.trim()) params.set("population", studyPopulation.trim());
      if (primaryVariable.trim()) params.set("primaryVariable", primaryVariable.trim());

      navigate(`/analysis/workspace?${params.toString()}`);
    } catch (err: any) {
      toast.error(err?.message || t("pme.newAnalysis.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-2 lg:py-4">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          {t("dashboard.newProject")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground lg:text-base">
          {t("student.newProject.desc")}
        </p>
      </motion.div>

      {/* SECTION 1 — Study Information */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <Card className="border border-border/60 shadow-sm">
          <CardContent className="p-6 lg:p-8">
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              {t("student.newProject.sectionStudyInfo")}
            </h2>
            <div className="space-y-5">
              {/* Study Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("student.newProject.studyTopic")} <span className="text-destructive">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("student.newProject.studyTopicPlaceholder")}
                  className="h-11"
                />
              </div>

              {/* Project Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("student.wizard.projectType")} <span className="text-destructive">*</span>
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

              {/* Research Domain */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("student.wizard.domain")}
                </label>
                <Popover open={domainOpen} onOpenChange={setDomainOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={domainOpen}
                      className="h-11 w-full justify-between font-normal"
                    >
                      {domainLabel || <span className="text-muted-foreground">{t("student.wizard.domainPlaceholder")}</span>}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("student.newProject.searchDomain")} />
                      <CommandList>
                        <CommandEmpty>{t("history.noResults")}</CommandEmpty>
                        <CommandGroup>
                          {RESEARCH_DOMAINS.map((d) => (
                            <CommandItem
                              key={d}
                              value={t(`domain.${d}`)}
                              onSelect={() => { setDomain(d); setDomainOpen(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", domain === d ? "opacity-100" : "opacity-0")} />
                              {t(`domain.${d}`)}
                            </CommandItem>
                          ))}
                          <CommandItem
                            value={t("student.newProject.otherDomain")}
                            onSelect={() => { setDomain("__other__"); setDomainOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", domain === "__other__" ? "opacity-100" : "opacity-0")} />
                            {t("student.newProject.otherDomain")}
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {domain === "__other__" && (
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder={t("student.newProject.customDomainPlaceholder")}
                    className="mt-2 h-11"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 2 — Objectives */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
        <Card className="border border-border/60 shadow-sm">
          <CardContent className="p-6 lg:p-8">
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              {t("student.newProject.sectionObjectives")}
            </h2>
            <div className="space-y-5">
              {/* General Objective */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("student.newProject.objective")} <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder={t("student.newProject.objectivePlaceholder")}
                  rows={3}
                  className="min-h-[90px] resize-none"
                />
              </div>

              {/* Specific Objectives */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("student.newProject.specificObjectives")}
                </label>
                {specificObjectives.map((obj, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {idx + 1}
                    </span>
                    <Input
                      value={obj}
                      onChange={(e) => updateSpecificObjective(idx, e.target.value)}
                      placeholder={t("student.newProject.objectivePlaceholderSpecific")}
                      className="h-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSpecificObjective(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 gap-1.5"
                  onClick={addSpecificObjective}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("student.newProject.addObjective")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 3 — Study Details */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
        <Card className="border border-border/60 shadow-sm">
          <CardContent className="p-6 lg:p-8">
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              {t("student.newProject.sectionDetails")}
            </h2>
            <div className="space-y-5">
              {/* Study Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("student.newProject.studyType")}
                </label>
                <Select value={studyType} onValueChange={setStudyType}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t("student.newProject.studyTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDY_TYPES.map((st) => (
                      <SelectItem key={st} value={st}>{t(`studyType.${st}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Study Population */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("student.newProject.studyPopulation")}
                </label>
                <Input
                  value={studyPopulation}
                  onChange={(e) => setStudyPopulation(e.target.value)}
                  placeholder={t("student.newProject.studyPopulationPlaceholder")}
                  className="h-11"
                />
              </div>

              {/* Primary Variable */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("student.newProject.primaryVariable")}
                </label>
                <Input
                  value={primaryVariable}
                  onChange={(e) => setPrimaryVariable(e.target.value)}
                  placeholder={t("student.newProject.primaryVariablePlaceholder")}
                  className="h-11"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("pme.newAnalysis.description")}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("student.newProject.descPlaceholderEnhanced")}
                  rows={3}
                  className="min-h-[90px] resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={4}
        className="flex justify-end pb-4"
      >
        <Button
          onClick={handleCreate}
          disabled={loading || !title.trim() || !projectType || !objective.trim()}
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
