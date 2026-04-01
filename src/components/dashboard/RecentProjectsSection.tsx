import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface ProjectRow {
  id: string;
  title: string;
  domain: string | null;
  status: string;
  created_at: string;
}

export function RecentProjectsSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const baseRoute = location.pathname.match(/^\/dashboard\/student-(license|licence|master|doctorate|doctorat)/)?.[0] || "/dashboard";

  const [projects, setProjects] = useState<ProjectRow[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await (supabase.from("projects") as any)
        .select("id,title,domain,status,created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setProjects(data as ProjectRow[]);
    };
    fetch();
  }, []);

  const statusColors: Record<string, string> = {
    created: "bg-muted text-muted-foreground",
    data_uploaded: "bg-accent text-accent-foreground",
    analysis_running: "bg-primary/10 text-primary",
    completed: "bg-primary/20 text-primary",
    active: "bg-accent text-accent-foreground",
  };

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("dashboard.recentProjects")}</h2>
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("dashboard.recentProjects.empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.recentProjects.name")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">{t("dashboard.recentProjects.domain")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.recentProjects.status")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">{t("dashboard.recentProjects.date")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.domain || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={statusColors[p.status] || ""}>
                      {t(`student.status.${p.status}`) || p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => navigate(`${baseRoute}/quick-analysis?project=${p.id}`)}>
                      <Play className="mr-1 h-3 w-3" /> {t("dashboard.recentProjects.open")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
