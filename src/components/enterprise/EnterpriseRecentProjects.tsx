import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export function EnterpriseRecentProjects() {
  const { t } = useLanguage();

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
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.recentProjects.date")}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t("enterprise.recentProjects.status")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t("enterprise.recentProjects.empty")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
