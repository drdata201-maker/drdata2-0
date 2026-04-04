import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

interface SaveAsProjectDialogProps {
  currentTitle: string;
  level: string;
}

export function SaveAsProjectDialog({ currentTitle, level }: SaveAsProjectDialogProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dataset, analysisResults, interpretationData } = useDataset();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState(currentTitle || t("dashboard.quickAnalysis") || "Quick Analysis");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");

  const domains = [
    "Sciences sociales", "Santé", "Économie", "Marketing",
    "Éducation", "Psychologie", "Environnement", "Informatique", "Autre",
  ];

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error(t("common.sessionExpired") || "Session expired"); return; }

      // Create project
      const { data: project, error: pErr } = await (supabase.from("projects") as any)
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          domain: domain || null,
          user_id: session.user.id,
          user_type: level,
          status: analysisResults.length > 0 ? "completed" : "active",
        })
        .select("id")
        .single();

      if (pErr || !project) throw pErr || new Error("Failed to create project");

      // Save analysis results if any
      if (analysisResults.length > 0) {
        await (supabase.from("analyses") as any).insert({
          project_id: project.id,
          user_id: session.user.id,
          user_type: level,
          title: `${title.trim()} - Analysis`,
          type: "general",
          status: "completed",
          results: JSON.parse(JSON.stringify({
            analysisResults,
            interpretationData,
            datasetInfo: dataset ? {
              fileName: dataset.fileName,
              observations: dataset.observations,
              variables: dataset.variables.length,
            } : null,
          })),
        });
      }

      // Update URL to reference the new project (exit quick mode)
      const newParams = new URLSearchParams(searchParams);
      newParams.set("project", project.id);
      newParams.delete("mode");
      if (domain) newParams.set("domain", encodeURIComponent(domain));
      setSearchParams(newParams, { replace: true });

      setSaved(true);
      toast.success(t("quickAnalysis.savedAsProject") || "Analyse sauvegardée comme projet !");
      setTimeout(() => setOpen(false), 1200);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Error saving project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSaved(false); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">{t("quickAnalysis.saveAsProject") || "Sauvegarder comme projet"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("quickAnalysis.saveAsProject") || "Sauvegarder comme projet"}</DialogTitle>
        </DialogHeader>
        {saved ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <p className="text-sm font-medium text-foreground">{t("quickAnalysis.savedAsProject") || "Projet créé avec succès !"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("student.projectTitle") || "Titre du projet"}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mon analyse..." />
            </div>
            <div className="space-y-2">
              <Label>{t("student.projectDomain") || "Domaine"}</Label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger><SelectValue placeholder={t("student.selectDomain") || "Choisir un domaine"} /></SelectTrigger>
                <SelectContent>
                  {domains.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("student.projectDescription") || "Description"}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("student.projectDescPlaceholder") || "Description optionnelle..."} rows={3} />
            </div>
            {dataset && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                <p>📊 {dataset.fileName} — {dataset.observations} obs. × {dataset.variables.length} var.</p>
                {analysisResults.length > 0 && <p>✅ {analysisResults.length} {t("workspace.results") || "résultat(s)"}</p>}
                {interpretationData && <p>📝 {t("workspace.interpretation") || "Interprétation"} incluse</p>}
              </div>
            )}
            <Button onClick={handleSave} disabled={saving || !title.trim()} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t("quickAnalysis.saveAsProject") || "Sauvegarder comme projet"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
