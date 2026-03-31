import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PmeSettingsViewProps {
  companyName: string;
  userEmail: string;
  userCountry: string;
  industry: string;
  onLogout: () => void;
}

export function PmeSettingsView({ companyName, userEmail, userCountry, industry, onLogout }: PmeSettingsViewProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t("pme.settings.companyProfile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("pme.settings.companyName")}</Label>
            <Input defaultValue={companyName} />
          </div>
          <div className="space-y-2">
            <Label>{t("settings.profile.email")}</Label>
            <Input defaultValue={userEmail} disabled />
          </div>
          <div className="space-y-2">
            <Label>{t("settings.profile.country")}</Label>
            <Input defaultValue={userCountry} />
          </div>
          <div className="space-y-2">
            <Label>{t("pme.settings.industry")}</Label>
            <Input defaultValue={industry} />
          </div>
          <Button>{t("settings.profile.save")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={onLogout}>{t("settings.account.logout")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
