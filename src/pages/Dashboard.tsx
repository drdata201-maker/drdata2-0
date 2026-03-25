import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  FolderPlus,
  BarChart3,
  Clock,
  Settings,
  LogOut,
  Plus,
  User,
} from "lucide-react";

const sidebarItems = [
  { key: "dashboard.dashboard", icon: LayoutDashboard },
  { key: "dashboard.newProject", icon: FolderPlus },
  { key: "dashboard.analysis", icon: BarChart3 },
  { key: "dashboard.history", icon: Clock },
  { key: "dashboard.settings", icon: Settings },
];

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("dashboard.dashboard");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUserEmail(session.user.email ?? "");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-5">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveItem(item.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeItem === item.key
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </button>
          ))}
        </nav>
        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t("dashboard.logout")}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h2 className="text-lg font-semibold">{t(activeItem)}</h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{userEmail}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold">{t("dashboard.welcome")}</h1>
            <p className="mb-8 text-muted-foreground">{t("dashboard.emptyDesc")}</p>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              {t("dashboard.createProject")}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
