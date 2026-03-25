import { useLanguage } from "@/contexts/LanguageContext";
import {
  GraduationCap,
  TrendingUp,
  Eraser,
  LineChart,
  FileBarChart,
  FolderKanban,
} from "lucide-react";

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    { icon: GraduationCap, key: "landing.feat.academicAnalysis" },
    { icon: TrendingUp, key: "landing.feat.businessAnalysis" },
    { icon: Eraser, key: "landing.feat.dataCleaning" },
    { icon: LineChart, key: "landing.feat.dataViz" },
    { icon: FileBarChart, key: "landing.feat.reportGen" },
    { icon: FolderKanban, key: "landing.feat.projectMgmt" },
  ];

  return (
    <section id="features" className="scroll-mt-16 border-t bg-muted/40 py-20">
      <div className="container">
        <h2 className="mb-12 text-center text-3xl font-bold">{t("landing.features.title")}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.key} className="rounded-xl border bg-card p-7 transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex rounded-lg bg-accent p-3">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t(f.key)}</h3>
              <p className="text-sm text-muted-foreground">{t(f.key + ".desc")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
