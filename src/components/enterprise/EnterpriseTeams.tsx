import { useLanguage } from "@/contexts/LanguageContext";
import { Users, TrendingUp } from "lucide-react";

const teams = [
  { name: "Marketing Digital", manager: "Sophie Martin", dept: "marketing", performance: 91, members: 8, status: "active" },
  { name: "Analyse Financière", manager: "Pierre Dupont", dept: "finance", performance: 88, members: 5, status: "active" },
  { name: "Recrutement", manager: "Marie Claire", dept: "hr", performance: 82, members: 4, status: "active" },
  { name: "Ventes B2B", manager: "Jean Leclerc", dept: "sales", performance: 85, members: 12, status: "active" },
  { name: "Ventes B2C", manager: "Lucie Bernard", dept: "sales", performance: 79, members: 10, status: "review" },
  { name: "Production Industrielle", manager: "Marc Durand", dept: "production", performance: 76, members: 15, status: "active" },
];

export function EnterpriseTeams() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t("enterprise.teams.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("enterprise.teams.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.teams.team")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.teams.manager")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.teams.department")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.teams.members")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.teams.performance")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.teams.status")}</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {team.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{team.manager}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                      {t(`enterprise.dept.${team.dept}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{team.members}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-medium text-foreground">{team.performance}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      team.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    }`}>
                      {team.status === "active" ? t("enterprise.status.active") : t("enterprise.status.review")}
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
