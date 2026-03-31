import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, DollarSign, Target } from "lucide-react";

interface PmeInsightsProps {
  companyName: string;
}

export function PmeInsights({ companyName }: PmeInsightsProps) {
  const { t } = useLanguage();

  const insights = [
    { icon: TrendingUp, label: "pme.insight.growth", color: "text-green-600" },
    { icon: DollarSign, label: "pme.insight.costOpt", color: "text-blue-600" },
    { icon: Target, label: "pme.insight.market", color: "text-purple-600" },
  ];

  return (
    <div className="mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            {t("pme.insights.title")}
          </CardTitle>
          {companyName && (
            <p className="text-sm text-muted-foreground">
              {t("enterprise.insights.forCompany").replace("{name}", companyName)}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.label} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <insight.icon className={`mt-0.5 h-4 w-4 shrink-0 ${insight.color}`} />
              <p className="text-sm text-foreground">{t(insight.label)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
