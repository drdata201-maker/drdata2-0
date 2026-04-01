import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
}

export function PmeProjectsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_type", "pme")
      .order("created_at", { ascending: false });

    if (!error && data) setProjects(data as ProjectRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success(t("pme.projects.deleted"));
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "default";
      case "completed": return "secondary";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: t("dashboard.status.inProgress"),
      completed: t("dashboard.status.completed"),
      draft: t("dashboard.status.draft"),
      archived: t("pme.projects.archived"),
    };
    return map[s] || s;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("pme.sidebar.projects")}</h1>
          <p className="mt-1 text-muted-foreground">{t("pme.projects.desc")}</p>
        </div>
        <Button onClick={() => navigate("/dashboard/pme/new-analysis")}>
          <Plus className="mr-2 h-4 w-4" /> {t("pme.projects.create")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pme.projects.list")} ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">{t("pme.projects.loading")}</p>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t("pme.recentProjects.empty")}</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/pme/new-analysis")}>
                <Plus className="mr-2 h-4 w-4" /> {t("pme.projects.create")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pme.recentProjects.name")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("pme.newAnalysis.description")}</TableHead>
                    <TableHead>{t("pme.recentProjects.status")}</TableHead>
                    <TableHead>{t("pme.recentProjects.date")}</TableHead>
                    <TableHead className="text-right">{t("pme.projects.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="hidden max-w-[200px] truncate sm:table-cell">{p.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusColor(p.status) as any}>{statusLabel(p.status)}</Badge>
                      </TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
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
