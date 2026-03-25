import { useLanguage } from "@/contexts/LanguageContext";

export function QuickGuideSection() {
  const { t } = useLanguage();

  const steps = [
    { num: 1, label: "dashboard.quickGuide.step1", desc: "dashboard.quickGuide.step1.desc" },
    { num: 2, label: "dashboard.quickGuide.step2", desc: "dashboard.quickGuide.step2.desc" },
    { num: 3, label: "dashboard.quickGuide.step3", desc: "dashboard.quickGuide.step3.desc" },
  ];

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("dashboard.quickGuide")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.num} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {step.num}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t(step.label)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t(step.desc)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
