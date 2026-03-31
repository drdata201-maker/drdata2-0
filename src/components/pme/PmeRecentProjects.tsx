import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PmeRecentProjects() {
  const { t } = useLanguage();

  const projects: Array<{ name: string; date: string; status: string }> = [];

  return (
    <div className="mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("pme.recentProjects")}</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t("pme.recentProjects.empty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">{t("pme.recentProjects.name")}</th>
                    <th className="pb-2 font-medium text-muted-foreground">{t("pme.recentProjects.date")}</th>
                    <th className="pb-2 font-medium text-muted-foreground">{t("pme.recentProjects.status")}</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2 text-muted-foreground">{p.date}</td>
                      <td className="py-2"><Badge variant="secondary">{p.status}</Badge></td>
                      <td className="py-2"><Button size="sm" variant="ghost">{t("pme.recentProjects.open")}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
