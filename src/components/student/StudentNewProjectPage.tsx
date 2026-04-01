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
import { BookOpen, FileUp, PlusCircle } from "lucide-react";

export function StudentNewProjectPage({ baseRoute, userType }: { baseRoute: string; userType: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("thesis");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { toast.error(t("pme.newAnalysis.titleRequired")); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.from("projects").insert({ user_id: session.user.id, title: title.trim(), description: description.trim() || null, status: "active", user_type: userType });
      if (error) throw error;
      toast.success(t("student.newProject.success"));
      navigate(`${baseRoute}/projects`);
    } catch { toast.error(t("pme.newAnalysis.error")); }
    finally { setLoading(false); }
  };

  const projectTypes = [
    { value: "thesis", label: t("student.projectType.thesis") },
    { value: "memoir", label: t("student.projectType.memoir") },
    { value: "research", label: t("student.projectType.research") },
    { value: "analysis", label: t("student.projectType.analysis") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.newProject")}</h1>
        <p className="mt-1 text-muted-foreground">{t("student.newProject.desc")}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: BookOpen, title: t("student.newProject.step1"), desc: t("student.newProject.step1Desc") },
          { icon: FileUp, title: t("student.newProject.step2"), desc: t("student.newProject.step2Desc") },
          { icon: PlusCircle, title: t("student.newProject.step3"), desc: t("student.newProject.step3Desc") },
        ].map((step, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2"><step.icon className="h-5 w-5 text-primary" /></div>
              <div><p className="font-medium text-foreground">{step.title}</p><p className="text-sm text-muted-foreground">{step.desc}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("student.newProject.formTitle")}</CardTitle>
          <CardDescription>{t("student.newProject.formDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("pme.newAnalysis.analysisTitle")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("student.newProject.titlePlaceholder")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("pme.newAnalysis.type")}</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{projectTypes.map((pt) => (<SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("pme.newAnalysis.description")}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("student.newProject.descPlaceholder")} rows={4} />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full sm:w-auto">{loading ? "..." : t("pme.newAnalysis.create")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
