import { useLanguage } from "@/contexts/LanguageContext";
import { DollarSign, TrendingUp, Users, FolderOpen, BarChart3, Target } from "lucide-react";

interface EnterpriseKPIsProps {
  companyType: "sme" | "enterprise";
}

export function EnterpriseKPIs({ companyType }: EnterpriseKPIsProps) {
  const { t } = useLanguage();

  const baseKpis = [
    { label: "enterprise.kpi.totalSales", value: "€0", icon: DollarSign, change: "+0%", trend: "up" as const },
    { label: "enterprise.kpi.growth", value: "0%", icon: TrendingUp, change: "+0%", trend: "up" as const },
    { label: "enterprise.kpi.activeClients", value: "0", icon: Users, change: "+0", trend: "neutral" as const },
    { label: "enterprise.kpi.activeProjects", value: "0", icon: FolderOpen, change: "+0", trend: "neutral" as const },
  ];

  const advancedKpis = [
    { label: "enterprise.kpi.conversionRate", value: "0%", icon: Target, change: "+0%", trend: "up" as const },
    { label: "enterprise.kpi.avgRevenue", value: "€0", icon: BarChart3, change: "+0%", trend: "up" as const },
  ];

  const kpis = companyType === "enterprise" ? [...baseKpis, ...advancedKpis] : baseKpis.slice(0, 3);

  const trendColor = (trend: string) =>
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.kpi.title")}</h2>
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${companyType === "enterprise" ? "lg:grid-cols-3" : "lg:grid-cols-3"}`}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <kpi.icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium ${trendColor(kpi.trend)}`}>{kpi.change}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{t(kpi.label)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
