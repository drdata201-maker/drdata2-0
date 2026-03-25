import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Camera, Sun, Moon, Monitor, LogOut, Trash2, Lock } from "lucide-react";

interface SettingsViewProps {
  userName: string;
  userEmail: string;
  userLevel: string;
  userCountry: string;
  onLogout: () => void;
}

export function SettingsView({ userName, userEmail, userLevel, userCountry, onLogout }: SettingsViewProps) {
  const { t } = useLanguage();
  const [activeTheme, setActiveTheme] = useState("light");

  const themes = [
    { key: "light", label: "settings.interface.light", icon: Sun },
    { key: "dark", label: "settings.interface.dark", icon: Moon },
    { key: "grey", label: "settings.interface.grey", icon: Monitor },
  ];

  const levelLabel =
    userLevel === "licence"
      ? t("auth.level.licence")
      : userLevel === "master"
      ? t("auth.level.master")
      : userLevel === "doctorat"
      ? t("auth.level.doctorat")
      : userLevel || "—";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Profile Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("settings.profile")}</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {userName?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />}
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Camera className="h-4 w-4" />
              {t("settings.profile.upload")}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">{t("settings.profile.username")}</Label>
              <Input defaultValue={userName} className="mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">{t("settings.profile.email")}</Label>
              <Input defaultValue={userEmail} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">{t("settings.profile.level")}</Label>
              <Input value={levelLabel} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">{t("settings.profile.country")}</Label>
              <Input defaultValue={userCountry} className="mt-1" />
            </div>
          </div>
          <Button size="sm">{t("settings.profile.save")}</Button>
        </div>
      </section>

      {/* Interface Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("settings.interface")}</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <Label className="text-muted-foreground">{t("settings.interface.theme")}</Label>
          <div className="mt-3 flex gap-3">
            {themes.map((theme) => (
              <button
                key={theme.key}
                onClick={() => setActiveTheme(theme.key)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTheme === theme.key
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <theme.icon className="h-4 w-4" />
                {t(theme.label)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("settings.account")}</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Change Password */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lock className="h-4 w-4" />
              {t("settings.account.changePassword")}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-muted-foreground">{t("settings.account.currentPassword")}</Label>
                <Input type="password" className="mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">{t("settings.account.newPassword")}</Label>
                <Input type="password" className="mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">{t("settings.account.confirmPassword")}</Label>
                <Input type="password" className="mt-1" />
              </div>
            </div>
            <Button size="sm" className="mt-3">{t("settings.account.updatePassword")}</Button>
          </div>

          <Separator />

          {/* Logout */}
          <Button variant="outline" className="gap-2" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            {t("settings.account.logout")}
          </Button>

          <Separator />

          {/* Delete Account */}
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.account.deleteWarning")}</p>
            <Button variant="destructive" size="sm" className="mt-3 gap-2">
              <Trash2 className="h-4 w-4" />
              {t("settings.account.confirmDelete")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
