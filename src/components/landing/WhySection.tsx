import { useLanguage } from "@/contexts/LanguageContext";
import { Zap, FileText, BookOpen, TrendingUp, Award } from "lucide-react";

export function WhySection() {
  const { t } = useLanguage();

  const whyItems = [
    { icon: Zap, key: "landing.why.fast" },
    { icon: FileText, key: "landing.why.reports" },
    { icon: BookOpen, key: "landing.why.academic" },
    { icon: TrendingUp, key: "landing.why.business" },
    { icon: Award, key: "landing.why.advanced" },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <h2 className="mb-12 text-center text-3xl font-bold">{t("landing.why.title")}</h2>
        <div className="mx-auto grid max-w-3xl gap-4">
          {whyItems.map((w) => (
            <div key={w.key} className="flex items-start gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm">
              <div className="flex-shrink-0 rounded-lg bg-accent p-2.5">
                <w.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t(w.key)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(w.key + ".desc")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
