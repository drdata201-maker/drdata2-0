import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, Upload, Zap, FileText } from "lucide-react";

const actions = [
  { icon: BarChart3, label: "enterprise.action.newAnalysis", desc: "enterprise.action.newAnalysis.desc" },
  { icon: Upload, label: "enterprise.action.importEnterprise", desc: "enterprise.action.importEnterprise.desc" },
  { icon: Zap, label: "enterprise.action.advancedAnalysis", desc: "enterprise.action.advancedAnalysis.desc" },
  { icon: FileText, label: "enterprise.action.execReport", desc: "enterprise.action.execReport.desc" },
];

export function EnterpriseQuickActions() {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("dashboard.quickActions")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.label}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-foreground">{t(action.label)}</span>
            <span className="text-xs text-muted-foreground">{t(action.desc)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
