import { useLanguage } from "@/contexts/LanguageContext";
import { ShoppingCart, Users, Megaphone, PieChart, Briefcase, Globe } from "lucide-react";

interface EnterpriseAnalyticsProps {
  companyType: "sme" | "enterprise";
}

export function EnterpriseAnalytics({ companyType }: EnterpriseAnalyticsProps) {
  const { t } = useLanguage();

  const baseAnalytics = [
    { icon: ShoppingCart, label: "enterprise.analytics.sales", desc: "enterprise.analytics.sales.desc" },
    { icon: Users, label: "enterprise.analytics.clients", desc: "enterprise.analytics.clients.desc" },
    { icon: Megaphone, label: "enterprise.analytics.marketing", desc: "enterprise.analytics.marketing.desc" },
  ];

  const advancedAnalytics = [
    { icon: PieChart, label: "enterprise.analytics.financial", desc: "enterprise.analytics.financial.desc" },
    { icon: Briefcase, label: "enterprise.analytics.operations", desc: "enterprise.analytics.operations.desc" },
    { icon: Globe, label: "enterprise.analytics.market", desc: "enterprise.analytics.market.desc" },
  ];

  const analytics = companyType === "enterprise" ? [...baseAnalytics, ...advancedAnalytics] : baseAnalytics;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.analytics.title")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {analytics.map((item) => (
          <button
            key={item.label}
            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-5 text-left transition-all hover:bg-accent hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-foreground">{t(item.label)}</span>
            <span className="text-xs text-muted-foreground">{t(item.desc)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
