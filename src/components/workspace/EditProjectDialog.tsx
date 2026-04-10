import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Edit3, Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const RESEARCH_DOMAINS = [
  "health_sciences", "public_health", "medicine", "nursing", "pharmacy",
  "economics", "management", "finance", "accounting", "marketing",
  "sociology", "psychology", "education",
  "computer_science", "engineering", "agriculture",
  "law", "mathematics", "statistics",
  "communication", "political_science", "environmental_science",
  "biology", "chemistry", "physics",
];

const STUDY_TYPES = ["descriptive", "analytical", "comparative", "experimental", "cross_sectional", "longitudinal"];
const STUDY_DESIGNS = ["cross_sectional", "longitudinal", "prospective", "retrospective"];

export interface EditProjectMetadata {
  title: string;
  domain: string;
  objective: string;
  description: string;
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
}

interface EditProjectDialogProps {
  projectId: string | null;
  title: string;
  domain: string;
  objective: string;
  description: string;
  level?: string;
  metadata?: Partial<EditProjectMetadata>;
  onSaved: (updates: EditProjectMetadata) => void;
}

export function EditProjectDialog({ projectId, title, domain, objective, description, level, metadata, onSaved }: EditProjectDialogProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDomain, setEditDomain] = useState("");
  const [editCustomDomain, setEditCustomDomain] = useState("");
  const [editObjective, setEditObjective] = useState(objective);
  const [editDescription, setEditDescription] = useState(description);
  const [domainOpen, setDomainOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New metadata fields
  const [specificObjectives, setSpecificObjectives] = useState<string[]>([]);
  const [studyType, setStudyType] = useState("");
  const [studyDesign, setStudyDesign] = useState("");
  const [population, setPopulation] = useState("");
  const [primaryVariable, setPrimaryVariable] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [advancedHypothesis, setAdvancedHypothesis] = useState("");
  const [independentVars, setIndependentVars] = useState("");
  const [dependentVar, setDependentVar] = useState("");
  const [controlVars, setControlVars] = useState("");
  const [mediatorVars, setMediatorVars] = useState("");
  const [moderatorVars, setModeratorVars] = useState("");
  const [conceptualModel, setConceptualModel] = useState("");

  const isMaster = level?.includes("master");
  const isDoctorate = level?.includes("doctor") || level?.includes("doctorat");
  const showMasterFields = isMaster || isDoctorate;
  const showDocFields = isDoctorate;

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setEditTitle(title);
      setEditObjective(objective);
      setEditDescription(description);
      setSpecificObjectives(metadata?.specificObjectives || []);
      setStudyType(metadata?.studyType || "");
      setStudyDesign(metadata?.studyDesign || "");
      setPopulation(metadata?.population || "");
      setPrimaryVariable(metadata?.primaryVariable || "");
      setHypothesis(metadata?.hypothesis || "");
      setAdvancedHypothesis(metadata?.advancedHypothesis || "");
      setIndependentVars(metadata?.independentVars || "");
      setDependentVar(metadata?.dependentVar || "");
      setControlVars(metadata?.controlVars || "");
      setMediatorVars(metadata?.mediatorVars || "");
      setModeratorVars(metadata?.moderatorVars || "");
      setConceptualModel(metadata?.conceptualModel || "");

      const match = RESEARCH_DOMAINS.find(d => t(`domain.${d}`) === domain || d === domain);
      if (match) { setEditDomain(match); setEditCustomDomain(""); }
      else if (domain) { setEditDomain("__other__"); setEditCustomDomain(domain); }
      else { setEditDomain(""); setEditCustomDomain(""); }
    }
    setOpen(isOpen);
  };

  const domainLabel = useMemo(() => {
    if (!editDomain) return "";
    if (editDomain === "__other__") return editCustomDomain || t("student.newProject.otherDomain");
    return t(`domain.${editDomain}`);
  }, [editDomain, editCustomDomain, t]);

  const addSpecificObjective = () => setSpecificObjectives(prev => [...prev, ""]);
  const removeSpecificObjective = (i: number) => setSpecificObjectives(prev => prev.filter((_, idx) => idx !== i));
  const updateSpecificObjective = (i: number, val: string) => setSpecificObjectives(prev => prev.map((o, idx) => idx === i ? val : o));

  const handleSave = async () => {
    if (!editTitle.trim() || !editObjective.trim()) return;
    setSaving(true);
    try {
      if (projectId) {
        await (supabase.from("projects") as any)
          .update({
            title: editTitle.trim(),
            description: editDescription.trim() || null,
            domain: (editDomain === "__other__" ? editCustomDomain.trim() : editDomain) || null,
          })
          .eq("id", projectId);
      }
      const resolvedDomain = editDomain === "__other__" ? editCustomDomain.trim() : (editDomain || "");
      onSaved({
        title: editTitle.trim(),
        domain: resolvedDomain,
        objective: editObjective.trim(),
        description: editDescription.trim(),
        specificObjectives: specificObjectives.filter(o => o.trim()),
        studyType,
        studyDesign,
        population: population.trim(),
        primaryVariable: primaryVariable.trim(),
        hypothesis: hypothesis.trim(),
        advancedHypothesis: advancedHypothesis.trim(),
        independentVars: independentVars.trim(),
        dependentVar: dependentVar.trim(),
        controlVars: controlVars.trim(),
        mediatorVars: mediatorVars.trim(),
        moderatorVars: moderatorVars.trim(),
        conceptualModel: conceptualModel.trim(),
      });
      toast.success(t("student.newProject.success"));
      setOpen(false);
    } catch {
      toast.error("Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Edit3 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("workspace.editProject")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{t("workspace.editProject")}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("student.newProject.studyTopic")} *</label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-10" />
            </div>

            {/* Domain */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("student.wizard.domain")}</label>
              <Popover open={domainOpen} onOpenChange={setDomainOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="h-10 w-full justify-between font-normal">
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
                        {RESEARCH_DOMAINS.map(d => (
                          <CommandItem key={d} value={t(`domain.${d}`)} onSelect={() => { setEditDomain(d); setDomainOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", editDomain === d ? "opacity-100" : "opacity-0")} />
                            {t(`domain.${d}`)}
                          </CommandItem>
                        ))}
                        <CommandItem value={t("student.newProject.otherDomain")} onSelect={() => { setEditDomain("__other__"); setDomainOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", editDomain === "__other__" ? "opacity-100" : "opacity-0")} />
                          {t("student.newProject.otherDomain")}
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {editDomain === "__other__" && (
                <Input value={editCustomDomain} onChange={e => setEditCustomDomain(e.target.value)} placeholder={t("student.newProject.customDomainPlaceholder")} className="mt-2 h-10" />
              )}
            </div>

            {/* Study Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("student.newProject.studyType")}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 w-full justify-between font-normal">
                    {studyType ? studyType.split(",").map(v => t(`student.studyType.${v.trim()}`)).join(", ") : <span className="text-muted-foreground">{t("student.newProject.studyTypePlaceholder")}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {STUDY_TYPES.map(st => (
                          <CommandItem key={st} onSelect={() => setStudyType(st)}>
                            <Check className={cn("mr-2 h-4 w-4", studyType === st ? "opacity-100" : "opacity-0")} />
                            {t(`student.studyType.${st}`)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Population */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("student.newProject.population")}</label>
              <Input value={population} onChange={e => setPopulation(e.target.value)} className="h-10" placeholder={t("student.newProject.populationPlaceholder")} />
            </div>

            {/* Primary Variable */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("student.newProject.primaryVariable")}</label>
              <Input value={primaryVariable} onChange={e => setPrimaryVariable(e.target.value)} className="h-10" placeholder={t("student.newProject.primaryVariablePlaceholder")} />
            </div>

            {/* Objective */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("student.newProject.objective")} *</label>
              <Textarea value={editObjective} onChange={e => setEditObjective(e.target.value)} rows={2} className="min-h-[70px] resize-none" />
            </div>

            {/* Specific Objectives */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t("student.newProject.specificObjectives")}</label>
                <Button type="button" variant="ghost" size="sm" onClick={addSpecificObjective} className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" /> {t("student.newProject.addObjective")}
                </Button>
              </div>
              {specificObjectives.map((obj, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input value={obj} onChange={e => updateSpecificObjective(i, e.target.value)} className="h-9 text-sm" placeholder={`${t("student.newProject.specificObjective")} ${i + 1}`} />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeSpecificObjective(i)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Study Design */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("student.newProject.studyDesign")}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 w-full justify-between font-normal">
                    {studyDesign ? studyDesign.split(",").map(v => t(`student.studyDesign.${v.trim()}`)).join(", ") : <span className="text-muted-foreground">{t("student.newProject.studyDesignPlaceholder")}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {STUDY_DESIGNS.map(sd => (
                          <CommandItem key={sd} onSelect={() => setStudyDesign(sd)}>
                            <Check className={cn("mr-2 h-4 w-4", studyDesign === sd ? "opacity-100" : "opacity-0")} />
                            {t(`student.studyDesign.${sd}`)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Master+ fields */}
            {showMasterFields && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("student.newProject.hypothesis")}</label>
                  <Textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} rows={2} className="min-h-[60px] resize-none" placeholder={t("student.newProject.hypothesisPlaceholder")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("student.newProject.independentVars")}</label>
                  <Input value={independentVars} onChange={e => setIndependentVars(e.target.value)} className="h-10" placeholder={t("student.newProject.independentVarsPlaceholder")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("student.newProject.dependentVar")}</label>
                  <Input value={dependentVar} onChange={e => setDependentVar(e.target.value)} className="h-10" placeholder={t("student.newProject.dependentVarPlaceholder")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("student.newProject.controlVars")}</label>
                  <Input value={controlVars} onChange={e => setControlVars(e.target.value)} className="h-10" placeholder={t("student.newProject.controlVarsPlaceholder")} />
                </div>
              </>
            )}

            {/* Doctorate fields */}
            {showDocFields && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("student.newProject.advancedHypothesis")}</label>
                  <Textarea value={advancedHypothesis} onChange={e => setAdvancedHypothesis(e.target.value)} rows={2} className="min-h-[60px] resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("student.newProject.conceptualModel")}</label>
                  <Textarea value={conceptualModel} onChange={e => setConceptualModel(e.target.value)} rows={2} className="min-h-[60px] resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("student.newProject.mediatorVars")}</label>
                  <Input value={mediatorVars} onChange={e => setMediatorVars(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("student.newProject.moderatorVars")}</label>
                  <Input value={moderatorVars} onChange={e => setModeratorVars(e.target.value)} className="h-10" />
                </div>
              </>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("pme.newAnalysis.description")}</label>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} className="min-h-[70px] resize-none" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSave} disabled={saving || !editTitle.trim() || !editObjective.trim()}>
                {saving ? "..." : t("workspace.saveChanges")}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
