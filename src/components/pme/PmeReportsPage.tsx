import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, FileText, Trash2 } from "lucide-react";

interface ReportRow {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
}

export function PmeReportsPage() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("general");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchReports = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("user_type", "pme")
      .order("created_at", { ascending: false });
    if (data) setReports(data as ReportRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleCreate = async () => {
    if (!title.trim()) { toast.error(t("pme.newAnalysis.titleRequired")); return; }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.from("reports").insert({
        user_id: session.user.id,
        title: title.trim(),
        type,
        status: "draft",
        user_type: "pme",
        content: { notes: content.trim() },
      });
      if (error) throw error;
      toast.success(t("pme.reports.created"));
      setTitle(""); setContent(""); setType("general"); setOpen(false);
      fetchReports();
    } catch { toast.error(t("pme.newAnalysis.error")); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success(t("pme.reports.deleted"));
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      draft: t("dashboard.status.draft"),
      published: t("pme.reports.published"),
      archived: t("pme.projects.archived"),
    };
    return map[s] || s;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("pme.sidebar.reports")}</h1>
          <p className="mt-1 text-muted-foreground">{t("pme.reports.desc")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> {t("pme.reports.new")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("pme.reports.new")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder={t("pme.newAnalysis.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t("pme.analysisType.general")}</SelectItem>
                  <SelectItem value="financial">{t("pme.analysisType.financial")}</SelectItem>
                  <SelectItem value="sales">{t("pme.analysisType.sales")}</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder={t("pme.reports.contentPlaceholder")} value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
              <Button onClick={handleCreate} disabled={creating} className="w-full">{creating ? "..." : t("pme.newAnalysis.create")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("pme.reports.list")} ({reports.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">{t("pme.projects.loading")}</p>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t("pme.reports.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pme.recentProjects.name")}</TableHead>
                    <TableHead>{t("pme.newAnalysis.type")}</TableHead>
                    <TableHead>{t("pme.recentProjects.status")}</TableHead>
                    <TableHead>{t("pme.recentProjects.date")}</TableHead>
                    <TableHead className="text-right">{t("pme.projects.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="capitalize">{r.type}</TableCell>
                      <TableCell><Badge variant="outline">{statusLabel(r.status)}</Badge></TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
