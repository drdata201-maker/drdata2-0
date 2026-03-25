import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown, Lightbulb, Target, Zap, BarChart3 } from "lucide-react";

interface EnterpriseInsightsProps {
  companyType: "sme" | "enterprise";
  companyName: string;
}

export function EnterpriseInsights({ companyType, companyName }: EnterpriseInsightsProps) {
  const { t } = useLanguage();

  const baseInsights = [
    { icon: TrendingUp, label: "enterprise.insight.salesUp", variant: "success" as const },
    { icon: TrendingDown, label: "enterprise.insight.salesDown", variant: "danger" as const },
    { icon: Lightbulb, label: "enterprise.insight.marketingRec", variant: "warning" as const },
    { icon: Target, label: "enterprise.insight.businessRec", variant: "info" as const },
  ];

  const advancedInsights = [
    { icon: Zap, label: "enterprise.insight.efficiency", variant: "success" as const },
    { icon: BarChart3, label: "enterprise.insight.benchmark", variant: "info" as const },
  ];

  const insights = companyType === "enterprise" ? [...baseInsights, ...advancedInsights] : baseInsights;

  const variantStyles = {
    success: "border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
    danger: "border-l-4 border-l-destructive bg-red-50/50 dark:bg-red-950/20",
    warning: "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
    info: "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
  };

  const iconStyles = {
    success: "text-emerald-600",
    danger: "text-destructive",
    warning: "text-amber-500",
    info: "text-blue-500",
  };

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t("enterprise.insights.title")}</h2>
        <span className="text-xs text-muted-foreground">
          {t("enterprise.insights.forCompany").replace("{name}", companyName)}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {insights.map((item) => (
          <div
            key={item.label}
            className={`flex items-start gap-3 rounded-xl border border-border p-4 transition-shadow hover:shadow-sm ${variantStyles[item.variant]}`}
          >
            <item.icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconStyles[item.variant]}`} />
            <p className="text-sm text-foreground">{t(item.label)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
