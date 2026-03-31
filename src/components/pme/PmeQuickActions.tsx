import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { FolderPlus, Upload, FileText } from "lucide-react";

const actions = [
  { icon: FolderPlus, label: "pme.action.newAnalysis", desc: "pme.action.newAnalysis.desc" },
  { icon: Upload, label: "pme.action.importData", desc: "pme.action.importData.desc" },
  { icon: FileText, label: "pme.action.generateReport", desc: "pme.action.generateReport.desc" },
];

export function PmeQuickActions() {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("dashboard.quickActions")}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map((action) => (
          <Card key={action.label} className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm">{t(action.label)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t(action.desc)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
