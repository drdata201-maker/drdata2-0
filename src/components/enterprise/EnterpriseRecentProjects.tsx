import { useLanguage } from "@/contexts/LanguageContext";

const projects = [
  { name: "Analyse CA Q4", dept: "Finance", manager: "Pierre Dupont", date: "2024-12-15", status: "completed" },
  { name: "Étude marché 2025", dept: "Marketing", manager: "Sophie Martin", date: "2025-01-08", status: "inProgress" },
  { name: "Optimisation RH", dept: "RH", manager: "Marie Claire", date: "2025-01-20", status: "inProgress" },
  { name: "Performance ventes", dept: "Commercial", manager: "Jean Leclerc", date: "2025-02-01", status: "draft" },
  { name: "Audit production", dept: "Production", manager: "Marc Durand", date: "2025-02-10", status: "draft" },
];

export function EnterpriseRecentProjects() {
  const { t } = useLanguage();

  const statusStyles: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    inProgress: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    draft: "bg-muted text-muted-foreground",
  };

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.recentProjects")}</h2>
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.recentProjects.project")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.recentProjects.department")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.recentProjects.manager")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.recentProjects.date")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.recentProjects.status")}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.dept}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.manager}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[p.status]}`}>
                      {t(`dashboard.status.${p.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
