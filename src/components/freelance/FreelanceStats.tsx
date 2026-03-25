import { useLanguage } from "@/contexts/LanguageContext";
import { Users, FolderOpen, BarChart3, FileText } from "lucide-react";

export function FreelanceStats() {
  const { t } = useLanguage();

  const stats = [
    { label: "freelance.stats.clients", value: 0, icon: Users },
    { label: "freelance.stats.activeProjects", value: 0, icon: FolderOpen },
    { label: "freelance.stats.analyses", value: 0, icon: BarChart3 },
    { label: "freelance.stats.reports", value: 0, icon: FileText },
  ];

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("dashboard.stats")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
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
