import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, BarChart3, FileText } from "lucide-react";

export function PmeStats() {
  const { t } = useLanguage();

  const stats = [
    { icon: FolderOpen, label: "pme.stats.projects", value: "0" },
    { icon: BarChart3, label: "pme.stats.analyses", value: "0" },
    { icon: FileText, label: "pme.stats.reports", value: "0" },
  ];

  return (
    <div className="mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("pme.stats.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{t(s.label)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
