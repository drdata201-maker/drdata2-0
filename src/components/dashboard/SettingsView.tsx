import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Camera, Sun, Moon, Monitor, Trash2, Lock, Globe, Bell } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import type { Language } from "@/lib/i18n";

interface SettingsViewProps {
  userName: string;
  userEmail: string;
  userLevel: string;
  userCountry: string;
  onLogout: () => void;
}

const langOptions: { value: Language; label: string; flag: string }[] = [
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "pt", label: "Português", flag: "🇧🇷" },
];

const notifLabels: Record<string, Record<string, string>> = {
  fr: { emailReports: "Rapports par email", analysisComplete: "Analyse terminée", weeklySummary: "Résumé hebdomadaire", section: "Notifications", desc: "Gérez vos préférences de notification" },
  en: { emailReports: "Email reports", analysisComplete: "Analysis complete", weeklySummary: "Weekly summary", section: "Notifications", desc: "Manage your notification preferences" },
  es: { emailReports: "Informes por email", analysisComplete: "Análisis completado", weeklySummary: "Resumen semanal", section: "Notificaciones", desc: "Gestione sus preferencias de notificación" },
  de: { emailReports: "E-Mail-Berichte", analysisComplete: "Analyse abgeschlossen", weeklySummary: "Wöchentliche Zusammenfassung", section: "Benachrichtigungen", desc: "Verwalten Sie Ihre Benachrichtigungseinstellungen" },
  pt: { emailReports: "Relatórios por email", analysisComplete: "Análise concluída", weeklySummary: "Resumo semanal", section: "Notificações", desc: "Gerencie suas preferências de notificação" },
};

const langSectionLabels: Record<string, Record<string, string>> = {
  fr: { title: "Langue par défaut", desc: "La langue sera sauvegardée dans votre profil" },
  en: { title: "Default language", desc: "Language will be saved to your profile" },
  es: { title: "Idioma por defecto", desc: "El idioma se guardará en su perfil" },
  de: { title: "Standardsprache", desc: "Die Sprache wird in Ihrem Profil gespeichert" },
  pt: { title: "Idioma padrão", desc: "O idioma será salvo no seu perfil" },
};

interface NotifPrefs {
  email_reports: boolean;
  analysis_complete: boolean;
  weekly_summary: boolean;
}

export function SettingsView({ userName, userEmail, userLevel, userCountry, onLogout }: SettingsViewProps) {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(userName);
  const [institution, setInstitution] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem("dr-data-theme") || "light");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    email_reports: true,
    analysis_complete: true,
    weekly_summary: false,
  });

  // Load user data + preferences from DB
  useEffect(() => {
    setName(userName);
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const meta = session.user.user_metadata;
      setInstitution(meta?.institution || "");
      setAvatarUrl(meta?.avatar_url || null);

      // Load from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_language, preferred_theme, notification_preferences")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        if (profile.preferred_theme) {
          setActiveTheme(profile.preferred_theme);
          localStorage.setItem("dr-data-theme", profile.preferred_theme);
        }
        if (profile.notification_preferences) {
          const np = profile.notification_preferences as unknown as NotifPrefs;
          setNotifPrefs({
            email_reports: np.email_reports ?? true,
            analysis_complete: np.analysis_complete ?? true,
            weekly_summary: np.weekly_summary ?? false,
          });
        }
      }
    };
    load();
  }, [userName]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark", "theme-grey");
    root.classList.add(`theme-${activeTheme}`);
    localStorage.setItem("dr-data-theme", activeTheme);
  }, [activeTheme]);

  // Save theme to DB
  const handleThemeChange = async (theme: string) => {
    setActiveTheme(theme);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ preferred_theme: theme }).eq("user_id", user.id);
    }
  };

  // Save language to DB
  const handleLangChange = async (newLang: Language) => {
    setLang(newLang);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ preferred_language: newLang }).eq("user_id", user.id);
    }
  };

  // Save notification prefs to DB
  const handleNotifChange = async (key: keyof NotifPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        notification_preferences: JSON.parse(JSON.stringify(updated)),
      }).eq("user_id", user.id);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error(t("settings.profile.invalidFormat")); return; }
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!pendingFile) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const path = `${session.user.id}/avatar.${pendingFile.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, pendingFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      setAvatarUrl(url);
      setAvatarPreview(null);
      setPendingFile(null);
      toast.success(t("settings.profile.avatarSuccess"));
    } catch { toast.error(t("settings.profile.avatarError")); }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      if (pendingFile) await uploadAvatar();
      const { error } = await supabase.auth.updateUser({ data: { full_name: name, name, institution } });
      if (error) throw error;
      toast.success(t("settings.profile.saveSuccess"));
    } catch { toast.error(t("settings.profile.saveError")); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error(t("settings.account.passwordTooShort")); return; }
    if (newPassword !== confirmPassword) { toast.error(t("settings.account.passwordMismatch")); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t("settings.account.passwordSuccess"));
      setNewPassword(""); setConfirmPassword("");
    } catch { toast.error(t("settings.account.passwordError")); }
    finally { setSavingPassword(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail, password: deletePassword });
      if (signInError) { toast.error(t("settings.account.wrongPassword")); setDeleting(false); return; }
      await supabase.auth.signOut();
      toast.success(t("settings.account.deleteSuccess"));
      navigate("/login");
    } catch { toast.error(t("settings.account.deleteError")); }
    finally { setDeleting(false); setDeleteOpen(false); }
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

  const displayAvatar = avatarPreview || avatarUrl;
  const nl = notifLabels[lang] || notifLabels.en;
  const ll = langSectionLabels[lang] || langSectionLabels.en;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Profile Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("settings.profile")}</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground overflow-hidden">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                userName?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-1">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4" />
                {t("settings.profile.upload")}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
              {avatarPreview && <p className="text-xs text-primary font-medium">{t("settings.profile.previewReady")}</p>}
            </div>
            <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleAvatarSelect} />
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

      {/* Language Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {ll.title}
        </h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <Select value={lang} onValueChange={(v) => handleLangChange(v as Language)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {langOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{ll.desc}</p>
        </div>
      </section>

      {/* Interface / Theme Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("settings.interface")}</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <Label className="text-muted-foreground">{t("settings.interface.theme")}</Label>
          <div className="mt-3 flex gap-3">
            {themes.map((theme) => (
              <button
                key={theme.key}
                onClick={() => handleThemeChange(theme.key)}
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

      {/* Notifications Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          {nl.section}
        </h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground">{nl.desc}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{nl.emailReports}</Label>
              <Switch checked={notifPrefs.email_reports} onCheckedChange={(v) => handleNotifChange("email_reports", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">{nl.analysisComplete}</Label>
              <Switch checked={notifPrefs.analysis_complete} onCheckedChange={(v) => handleNotifChange("analysis_complete", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">{nl.weeklySummary}</Label>
              <Switch checked={notifPrefs.weekly_summary} onCheckedChange={(v) => handleNotifChange("weekly_summary", v)} />
            </div>
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
            <Button variant="destructive" size="sm" className="mt-3 gap-2" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              {t("settings.account.confirmDelete")}
            </Button>
          </div>
        </div>
      </section>

      {/* Delete Account Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.account.deleteAccount")}</DialogTitle>
            <DialogDescription>{t("settings.account.deleteConfirmMsg")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-muted-foreground">{t("settings.account.confirmPasswordLabel")}</Label>
            <Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder={t("settings.account.enterPassword")} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t("student.wizard.back")}</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting || !deletePassword}>
              {deleting ? "..." : t("settings.account.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
