import { useLanguage } from "@/contexts/LanguageContext";
import { FolderPlus, Upload, Zap, FileText } from "lucide-react";

const actions = [
  { key: "newClientProject", icon: FolderPlus, label: "freelance.action.newClientProject", desc: "freelance.action.newClientProject.desc" },
  { key: "importClientData", icon: Upload, label: "freelance.action.importClientData", desc: "freelance.action.importClientData.desc" },
  { key: "quickAnalysis", icon: Zap, label: "freelance.action.quickAnalysis", desc: "freelance.action.quickAnalysis.desc" },
  { key: "generateReport", icon: FileText, label: "freelance.action.generateReport", desc: "freelance.action.generateReport.desc" },
];

export function FreelanceQuickActions() {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("dashboard.quickActions")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.key}
            className="group flex flex-col items-start rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-foreground">{t(action.label)}</span>
            <span className="mt-1 text-xs text-muted-foreground">{t(action.desc)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
