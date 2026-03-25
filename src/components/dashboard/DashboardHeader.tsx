import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { User, ChevronDown } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  userName: string;
  userLevel: string;
}

export function DashboardHeader({ title, userName, userLevel }: DashboardHeaderProps) {
  const { t } = useLanguage();

  const levelLabel =
    userLevel === "licence"
      ? t("auth.level.licence")
      : userLevel === "master"
      ? t("auth.level.master")
      : userLevel === "doctorat"
      ? t("auth.level.doctorat")
      : "";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {userName?.charAt(0)?.toUpperCase() || <User className="h-3.5 w-3.5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{userName || "—"}</span>
            {levelLabel && (
              <span className="text-xs text-muted-foreground">{levelLabel}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
