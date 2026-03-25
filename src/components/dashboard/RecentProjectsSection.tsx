import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function RecentProjectsSection() {
  const { t } = useLanguage();

  // Placeholder — no real projects yet
  const projects: Array<{
    name: string;
    domain: string;
    date: string;
    status: "draft" | "inProgress" | "completed";
  }> = [];

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    inProgress: "bg-accent text-accent-foreground",
    completed: "bg-primary/10 text-primary",
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.recentProjects.domain")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.recentProjects.date")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.recentProjects.status")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.domain}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={statusColors[p.status]}>
                      {t(`dashboard.status.${p.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline">{t("dashboard.recentProjects.open")}</Button>
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
