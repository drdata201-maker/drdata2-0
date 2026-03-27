import { useLanguage } from "@/contexts/LanguageContext";
import { FolderOpen, BarChart3, FileText, Building2 } from "lucide-react";

export function EnterpriseStats() {
  const { t } = useLanguage();

  const stats = [
    { label: "enterprise.stats.projects", value: 49, icon: FolderOpen },
    { label: "enterprise.stats.analyses", value: 128, icon: BarChart3 },
    { label: "enterprise.stats.reports", value: 34, icon: FileText },
    { label: "enterprise.stats.departments", value: 5, icon: Building2 },
  ];

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.stats.title")}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{t(stat.label)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
