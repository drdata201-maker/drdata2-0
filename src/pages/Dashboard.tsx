import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/getDashboardRoute";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { QuickActionsSection } from "@/components/dashboard/QuickActionsSection";
import { RecentProjectsSection } from "@/components/dashboard/RecentProjectsSection";
import { ThesisAssistantSection } from "@/components/dashboard/ThesisAssistantSection";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { QuickGuideSection } from "@/components/dashboard/QuickGuideSection";
import { SettingsView } from "@/components/dashboard/SettingsView";

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userLevel, setUserLevel] = useState("licence");
  const [userCountry, setUserCountry] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const meta = session.user.user_metadata;
      setUserEmail(session.user.email ?? "");
      setUserName(meta?.full_name || meta?.name || session.user.email?.split("@")[0] || "");
      setUserLevel(meta?.level || "licence");
      setUserCountry(meta?.country || "");

      if (!meta?.profile_completed && !meta?.user_type) {
        navigate("/complete-profile");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const headerTitle =
    activeItem === "settings"
      ? t("settings.title")
      : t(`dashboard.${activeItem === "dashboard" ? "dashboard" : activeItem}`);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col">
        <DashboardHeader
          title={headerTitle}
          userName={userName}
          userLevel={userLevel}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeItem === "settings" ? (
            <SettingsView
              userName={userName}
              userEmail={userEmail}
              userLevel={userLevel}
              userCountry={userCountry}
              onLogout={handleLogout}
            />
          ) : (
            <>
              <WelcomeSection userName={userName} userLevel={userLevel} />
              <QuickActionsSection />
              <StatsSection />
              <RecentProjectsSection />
              <ThesisAssistantSection />
              <QuickGuideSection />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
