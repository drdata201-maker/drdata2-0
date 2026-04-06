import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, Trash2, Play, Eye, Copy } from "lucide-react";
import { toast } from "sonner";

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_ORDER = ["draft", "active", "completed", "archived"];

export function StudentProjectsPage({ baseRoute, userType }: { baseRoute: string; userType: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
      const { data } = await (supabase.from("projects") as any)
        .select("id,title,description,domain,status,created_at,updated_at")
      .eq("user_type", userType)
      .order("created_at", { ascending: false });
    if (data) setProjects(data as ProjectRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [userType]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success(t("pme.projects.deleted"));
    }
  };

  const handleDuplicate = async (project: ProjectRow) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch full project data including dataset_summary
      const { data: original } = await (supabase.from("projects") as any)
        .select("title,description,domain,user_type,dataset_summary")
        .eq("id", project.id)
        .maybeSingle();
      if (!original) throw new Error("Project not found");

      const { data: newProject, error } = await (supabase.from("projects") as any)
        .insert({
          user_id: user.id,
          title: `${original.title} (${t("student.projects.copy")})`,
          description: original.description,
          domain: original.domain,
          user_type: original.user_type,
          dataset_summary: original.dataset_summary,
          status: original.dataset_summary ? "data_uploaded" : "draft",
        })
        .select("id,title,description,domain,status,created_at,updated_at")
        .single();
      if (error) throw error;

      setProjects(prev => [newProject as ProjectRow, ...prev]);
      toast.success(t("student.projects.duplicated"));
    } catch (e: any) {
      toast.error(e?.message || "Error");
    }
  };

  const statusVariant = (s: string) => {
    switch (s) {
      case "draft": return "outline";
      case "active": return "secondary";
      case "completed": return "default";
      case "archived": return "outline";
      default: return "outline";
    }
  };

  const statusLabel = (s: string) => t(`student.status.${s}`) || s;

  const statusProgress = (s: string) => {
    const idx = STATUS_ORDER.indexOf(s);
    return idx >= 0 ? ((idx + 1) / STATUS_ORDER.length) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.myProjects")}</h1>
          <p className="mt-1 text-muted-foreground">{t("student.projects.desc")}</p>
        </div>
        <Button onClick={() => navigate(`${baseRoute}/new-project`)}>
          <Plus className="mr-2 h-4 w-4" /> {t("pme.projects.create")}
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const count = projects.filter((p) => p.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{statusLabel(status)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>{t("pme.projects.list")} ({projects.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">{t("pme.projects.loading")}</p>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t("dashboard.recentProjects.empty")}</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate(`${baseRoute}/new-project`)}>
                <Plus className="mr-2 h-4 w-4" /> {t("pme.projects.create")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>{t("pme.recentProjects.name")}</TableHead>
                     <TableHead className="hidden md:table-cell">{t("student.wizard.domain")}</TableHead>
                     <TableHead>{t("pme.recentProjects.status")}</TableHead>
                     <TableHead className="hidden sm:table-cell">{t("student.projects.progress")}</TableHead>
                     <TableHead className="hidden lg:table-cell">{t("pme.recentProjects.date")}</TableHead>
                     <TableHead className="hidden lg:table-cell">{t("student.projects.lastModified")}</TableHead>
                     <TableHead className="text-right">{t("pme.projects.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.title}</p>
                          {p.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{p.domain || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(p.status) as any}>{statusLabel(p.status)}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${statusProgress(p.status)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{statusProgress(p.status)}%</span>
                        </div>
                      </TableCell>
                       <TableCell className="text-sm hidden lg:table-cell">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                       <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{new Date(p.updated_at).toLocaleDateString()}</TableCell>
                       <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-1">
                           <Button variant="ghost" size="icon" title={t("student.projects.continue")} onClick={() => navigate(`/analysis/workspace?project=${p.id}&level=${userType}`)}>
                             <Play className="h-4 w-4 text-primary" />
                           </Button>
                           <Button variant="ghost" size="icon" title={t("student.projects.viewResults")} onClick={() => navigate(`/analysis/workspace?project=${p.id}&level=${userType}`)}>
                             <Eye className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" title={t("student.projects.duplicate")} onClick={() => handleDuplicate(p)}>
                             <Copy className="h-4 w-4 text-muted-foreground" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                         </div>
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
