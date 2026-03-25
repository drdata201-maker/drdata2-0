import { useLanguage } from "@/contexts/LanguageContext";

interface WelcomeSectionProps {
  userName: string;
  userLevel: string;
}

export function WelcomeSection({ userName, userLevel }: WelcomeSectionProps) {
  const { t } = useLanguage();

  const subtitleKey =
    userLevel === "master"
      ? "dashboard.student.master.subtitle"
      : userLevel === "doctorat"
      ? "dashboard.student.doctorat.subtitle"
      : "dashboard.student.licence.subtitle";

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground">
        {t("dashboard.welcomeName").replace("{name}", userName || "—")}
      </h1>
      <p className="mt-1 text-muted-foreground">{t(subtitleKey)}</p>
    </div>
  );
}
