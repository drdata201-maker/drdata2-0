import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, TrendingUp, FolderOpen, CheckCircle, AlertCircle } from "lucide-react";

const departments = [
  { key: "marketing", icon: "📢", projects: 12, performance: 87, status: "active" },
  { key: "finance", icon: "💰", projects: 8, performance: 92, status: "active" },
  { key: "hr", icon: "👥", projects: 5, performance: 78, status: "active" },
  { key: "sales", icon: "📈", projects: 15, performance: 81, status: "active" },
  { key: "production", icon: "🏭", projects: 9, performance: 74, status: "review" },
];

export function EnterpriseDepartments() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("enterprise.departments.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("enterprise.departments.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
          <Building2 className="h-4 w-4" />
          {departments.length} {t("enterprise.departments.active")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <div
            key={dept.key}
            className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{dept.icon}</span>
                <h3 className="font-semibold text-foreground">
                  {t(`enterprise.dept.${dept.key}`)}
                </h3>
              </div>
              {dept.status === "active" ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5" />
                  {t("enterprise.departments.projects")}
                </span>
                <span className="font-medium text-foreground">{dept.projects}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t("enterprise.departments.performance")}
                </span>
                <span className="font-medium text-foreground">{dept.performance}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${dept.performance}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
