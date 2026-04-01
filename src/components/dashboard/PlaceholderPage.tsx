import { useLanguage } from "@/contexts/LanguageContext";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  titleKey: string;
  descKey?: string;
}

export function PlaceholderPage({ titleKey, descKey }: PlaceholderPageProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl bg-muted p-6 mb-6">
        <Construction className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">{t(titleKey)}</h2>
      <p className="text-muted-foreground max-w-md">
        {descKey ? t(descKey) : t("placeholder.comingSoon")}
      </p>
    </div>
  );
}
