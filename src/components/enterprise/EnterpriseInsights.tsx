import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown, Lightbulb, Target } from "lucide-react";

export function EnterpriseInsights() {
  const { t } = useLanguage();

  const insights = [
    { icon: TrendingUp, label: "enterprise.insight.salesUp", color: "text-emerald-600" },
    { icon: TrendingDown, label: "enterprise.insight.salesDown", color: "text-red-500" },
    { icon: Lightbulb, label: "enterprise.insight.marketingRec", color: "text-amber-500" },
    { icon: Target, label: "enterprise.insight.businessRec", color: "text-blue-500" },
  ];

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.insights.title")}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {insights.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
          >
            <item.icon className={`mt-0.5 h-5 w-5 shrink-0 ${item.color}`} />
            <p className="text-sm text-foreground">{t(item.label)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
