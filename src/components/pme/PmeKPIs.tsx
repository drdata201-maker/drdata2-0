import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, FolderOpen, Activity } from "lucide-react";

export function PmeKPIs() {
  const { t } = useLanguage();

  const kpis = [
    { label: "pme.kpi.revenue", value: "€124,500", change: "+8.2%", icon: DollarSign, positive: true },
    { label: "pme.kpi.growth", value: "+12.4%", change: "+3.1%", icon: TrendingUp, positive: true },
    { label: "pme.kpi.activeProjects", value: "8", change: "+2", icon: FolderOpen, positive: true },
    { label: "pme.kpi.performance", value: "87%", change: "+5%", icon: Activity, positive: true },
  ];

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("pme.kpi.title")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                <span className={`text-xs font-medium ${kpi.positive ? "text-green-600" : "text-red-500"}`}>
                  {kpi.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{t(kpi.label)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
