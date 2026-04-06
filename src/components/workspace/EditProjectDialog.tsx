import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Edit3, Check, ChevronsUpDown } from "lucide-react";
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

interface EditProjectDialogProps {
  projectId: string | null;
  title: string;
  domain: string;
  objective: string;
  description: string;
  onSaved: (updates: { title: string; domain: string; objective: string; description: string }) => void;
}

export function EditProjectDialog({ projectId, title, domain, objective, description, onSaved }: EditProjectDialogProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDomain, setEditDomain] = useState("");
  const [editCustomDomain, setEditCustomDomain] = useState("");
  const [editObjective, setEditObjective] = useState(objective);
  const [editDescription, setEditDescription] = useState(description);
  const [domainOpen, setDomainOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Resolve initial domain state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setEditTitle(title);
      setEditObjective(objective);
      setEditDescription(description);
      // Check if domain matches a predefined one
      const match = RESEARCH_DOMAINS.find(d => t(`domain.${d}`) === domain || d === domain);
      if (match) {
        setEditDomain(match);
        setEditCustomDomain("");
      } else if (domain) {
        setEditDomain("__other__");
        setEditCustomDomain(domain);
      } else {
        setEditDomain("");
        setEditCustomDomain("");
      }
    }
    setOpen(isOpen);
  };

  const finalDomain = editDomain === "__other__" ? editCustomDomain.trim() : (editDomain ? t(`domain.${editDomain}`) : "");
  const domainLabel = useMemo(() => {
    if (!editDomain) return "";
    if (editDomain === "__other__") return editCustomDomain || t("student.newProject.otherDomain");
    return t(`domain.${editDomain}`);
  }, [editDomain, editCustomDomain, t]);

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("workspace.editProject")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("student.newProject.studyTopic")} *</label>
            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-10" />
          </div>

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

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("student.newProject.objective")} *</label>
            <Textarea value={editObjective} onChange={e => setEditObjective(e.target.value)} rows={2} className="min-h-[70px] resize-none" />
          </div>

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
      </DialogContent>
    </Dialog>
  );
}
