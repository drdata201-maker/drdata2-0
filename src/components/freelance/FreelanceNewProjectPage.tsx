import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Users, FileUp, PlusCircle } from "lucide-react";

interface ClientOption { id: string; name: string; }

export function FreelanceNewProjectPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("general");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("clients").select("id,name").then(({ data }) => {
      if (data) setClients(data);
    });
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) { toast.error(t("pme.newAnalysis.titleRequired")); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from("projects").insert({
        user_id: session.user.id,
        title: title.trim(),
        description: description.trim() || null,
        status: "active",
        user_type: "freelance",
      });
      if (error) throw error;

      toast.success(t("freelance.newProject.success"));
      navigate("/dashboard/freelance/projects");
    } catch { toast.error(t("pme.newAnalysis.error")); }
    finally { setLoading(false); }
  };

  const analysisTypes = [
    { value: "general", label: t("pme.analysisType.general") },
    { value: "financial", label: t("pme.analysisType.financial") },
    { value: "sales", label: t("pme.analysisType.sales") },
    { value: "market", label: t("pme.analysisType.market") },
    { value: "performance", label: t("pme.analysisType.performance") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("freelance.newClientProject")}</h1>
        <p className="mt-1 text-muted-foreground">{t("freelance.newProject.desc")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: Users, title: t("freelance.newProject.step1"), desc: t("freelance.newProject.step1Desc") },
          { icon: FileUp, title: t("freelance.newProject.step2"), desc: t("freelance.newProject.step2Desc") },
          { icon: PlusCircle, title: t("freelance.newProject.step3"), desc: t("freelance.newProject.step3Desc") },
        ].map((step, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("freelance.newProject.formTitle")}</CardTitle>
          <CardDescription>{t("freelance.newProject.formDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("pme.newAnalysis.analysisTitle")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("freelance.newProject.titlePlaceholder")} />
          </div>

          {clients.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("freelance.clientProjects.client")}</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder={t("freelance.newProject.selectClient")} /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("pme.newAnalysis.type")}</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {analysisTypes.map((at) => (
                  <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("pme.newAnalysis.description")}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("pme.newAnalysis.descPlaceholder")} rows={4} />
          </div>

          <Button onClick={handleCreate} disabled={loading} className="w-full sm:w-auto">
            {loading ? "..." : t("pme.newAnalysis.create")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
