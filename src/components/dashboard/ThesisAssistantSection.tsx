import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThesisAssistantSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const baseRoute = location.pathname.match(/^\/dashboard\/student-(license|master|doctorate)/)?.[0] || "/dashboard";

  return (
    <div className="mb-8">
      <div className="flex items-start gap-5 rounded-xl border border-border bg-card p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">{t("dashboard.thesisAssistant")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.thesisAssistant.desc")}</p>
          <Button className="mt-4" size="sm" onClick={() => navigate(`${baseRoute}/memory-assistant`)}>
            {t("dashboard.thesisAssistant.open")}
          </Button>
        </div>
      </div>
    </div>
  );
}
