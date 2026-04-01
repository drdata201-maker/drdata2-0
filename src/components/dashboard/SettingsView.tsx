import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Camera, Sun, Moon, Monitor, Trash2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SettingsViewProps {
  userName: string;
  userEmail: string;
  userLevel: string;
  userCountry: string;
  onLogout: () => void;
}

export function SettingsView({ userName, userEmail, userLevel, userCountry, onLogout }: SettingsViewProps) {
  const { t } = useLanguage();
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

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark", "theme-grey");
    root.classList.add(`theme-${activeTheme}`);
    localStorage.setItem("dr-data-theme", activeTheme);
  }, [activeTheme]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(t("settings.profile.invalidFormat"));
      return;
    }
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
    } catch {
      toast.error(t("settings.profile.avatarError"));
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      if (pendingFile) await uploadAvatar();
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

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error(t("settings.account.passwordTooShort")); return; }
    if (newPassword !== confirmPassword) { toast.error(t("settings.account.passwordMismatch")); return; }
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

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: deletePassword,
      });
      if (signInError) {
        toast.error(t("settings.account.wrongPassword"));
        setDeleting(false);
        return;
      }
      // Sign out and redirect - actual deletion requires admin/edge function
      await supabase.auth.signOut();
      toast.success(t("settings.account.deleteSuccess"));
      navigate("/login");
    } catch {
      toast.error(t("settings.account.deleteError"));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
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

  const displayAvatar = avatarPreview || avatarUrl;

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
              {avatarPreview && (
                <p className="text-xs text-primary font-medium">{t("settings.profile.previewReady")}</p>
              )}
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
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t("settings.account.enterPassword")}
            />
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
