import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { User, Settings, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  title: string;
  userName: string;
  userLevel: string;
  onLogout?: () => void;
}

export function DashboardHeader({ title, userName, userLevel, onLogout }: DashboardHeaderProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const baseRoute = location.pathname.match(/^\/dashboard\/[^/]+/)?.[0] || "/dashboard";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAvatarUrl(session.user.user_metadata?.avatar_url || null);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAvatarUrl(session.user.user_metadata?.avatar_url || null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const levelLabel =
    userLevel === "licence"
      ? t("auth.level.licence")
      : userLevel === "master"
      ? t("auth.level.master")
      : userLevel === "doctorat"
      ? t("auth.level.doctorat")
      : "";

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await supabase.auth.signOut();
      navigate("/");
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <LanguageSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 transition-colors hover:bg-accent cursor-pointer outline-none">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  userName?.charAt(0)?.toUpperCase() || <User className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-medium text-foreground">{userName || "—"}</span>
                {levelLabel && (
                  <span className="text-xs text-muted-foreground">{levelLabel}</span>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate(`${baseRoute}/settings`)} className="cursor-pointer gap-2">
              <User className="h-4 w-4" />
              {t("settings.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`${baseRoute}/settings`)} className="cursor-pointer gap-2">
              <Settings className="h-4 w-4" />
              {t("dashboard.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              {t("dashboard.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
