import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Camera, Sun, Moon, Monitor, Trash2, Lock } from "lucide-react";

interface SettingsViewProps {
  userName: string;
  userEmail: string;
  userLevel: string;
  userCountry: string;
  onLogout: () => void;
}

export function SettingsView({ userName, userEmail, userLevel, userCountry, onLogout }: SettingsViewProps) {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [name, setName] = useState(userName);
  const [institution, setInstitution] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Theme state
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem("dr-data-theme") || "light");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Load existing data
  useEffect(() => {
    setName(userName);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const meta = session.user.user_metadata;
        setInstitution(meta?.institution || "");
        setAvatarUrl(meta?.avatar_url || null);
      }
    });
  }, [userName]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark", "theme-grey");
    root.classList.add(`theme-${activeTheme}`);
    localStorage.setItem("dr-data-theme", activeTheme);
  }, [activeTheme]);

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(t("settings.profile.invalidFormat"));
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const path = `${session.user.id}/avatar.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      setAvatarUrl(url);
      toast.success(t("settings.profile.avatarSuccess"));
    } catch {
      toast.error(t("settings.profile.avatarError"));
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name, name, institution },
      });
      if (error) throw error;
      toast.success(t("settings.profile.saveSuccess"));
    } catch {
      toast.error(t("settings.profile.saveError"));
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(t("settings.account.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.account.passwordMismatch"));
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t("settings.account.passwordSuccess"));
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error(t("settings.account.passwordError"));
    } finally {
      setSavingPassword(false);
    }
  };

  const themes = [
    { key: "light", label: "settings.interface.light", icon: Sun },
    { key: "dark", label: "settings.interface.dark", icon: Moon },
    { key: "grey", label: "settings.interface.grey", icon: Monitor },
  ];

  const levelLabel =
    userLevel === "licence" ? t("auth.level.licence")
    : userLevel === "master" ? t("auth.level.master")
    : userLevel === "doctorat" ? t("auth.level.doctorat")
    : userLevel || "—";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Profile Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("settings.profile")}</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                userName?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />
              )}
            </div>
            <div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4" />
                {t("settings.profile.upload")}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP</p>
            </div>
            <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">{t("settings.profile.username")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">{t("settings.profile.email")}</Label>
              <Input defaultValue={userEmail} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">{t("settings.profile.institution")}</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} className="mt-1" placeholder={t("settings.profile.institutionPlaceholder")} />
            </div>
            <div>
              <Label className="text-muted-foreground">{t("settings.profile.level")}</Label>
              <Input value={levelLabel} disabled className="mt-1" />
            </div>
          </div>
          <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? "..." : t("settings.profile.save")}
          </Button>
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
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lock className="h-4 w-4" />
              {t("settings.account.changePassword")}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">{t("settings.account.newPassword")}</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">{t("settings.account.confirmPassword")}</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" />
              </div>
            </div>
            <Button size="sm" className="mt-3" onClick={handleChangePassword} disabled={savingPassword}>
              {savingPassword ? "..." : t("settings.account.updatePassword")}
            </Button>
          </div>
          <Separator />
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
