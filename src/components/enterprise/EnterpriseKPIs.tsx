import { useLanguage } from "@/contexts/LanguageContext";
import { DollarSign, TrendingUp, Users, FolderOpen } from "lucide-react";

export function EnterpriseKPIs() {
  const { t } = useLanguage();

  const kpis = [
    { label: "enterprise.kpi.totalSales", value: "€0", icon: DollarSign, change: "+0%" },
    { label: "enterprise.kpi.growth", value: "0%", icon: TrendingUp, change: "+0%" },
    { label: "enterprise.kpi.activeClients", value: "0", icon: Users, change: "+0" },
    { label: "enterprise.kpi.activeProjects", value: "0", icon: FolderOpen, change: "+0" },
  ];

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.kpi.title")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <kpi.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-emerald-600">{kpi.change}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{t(kpi.label)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
