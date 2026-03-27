import { useLanguage } from "@/contexts/LanguageContext";
import { DollarSign, TrendingUp, Building2, FolderOpen, BarChart3, Target } from "lucide-react";

interface EnterpriseKPIsProps {
  companyType: "sme" | "enterprise";
}

export function EnterpriseKPIs({ companyType }: EnterpriseKPIsProps) {
  const { t } = useLanguage();

  const kpis = [
    { label: "enterprise.kpi.globalRevenue", value: "€2.4M", icon: DollarSign, change: "+12.5%", trend: "up" as const },
    { label: "enterprise.kpi.globalGrowth", value: "18.3%", icon: TrendingUp, change: "+3.2%", trend: "up" as const },
    { label: "enterprise.kpi.activeDepartments", value: "5", icon: Building2, change: "+1", trend: "up" as const },
    { label: "enterprise.kpi.activeProjects", value: "49", icon: FolderOpen, change: "+8", trend: "up" as const },
    { label: "enterprise.kpi.globalPerformance", value: "84%", icon: BarChart3, change: "+5.1%", trend: "up" as const },
    { label: "enterprise.kpi.globalROI", value: "3.2x", icon: Target, change: "+0.4x", trend: "up" as const },
  ];

  const displayKpis = companyType === "enterprise" ? kpis : kpis.slice(0, 3);

  const trendColor = (trend: string) =>
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.kpi.title")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayKpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
