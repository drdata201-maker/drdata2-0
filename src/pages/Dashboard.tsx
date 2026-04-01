import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userLevel, setUserLevel] = useState("licence");
  const [userCountry, setUserCountry] = useState("");

  // Determine base route from path
  const baseRoute = location.pathname.match(/^\/dashboard\/student-(license|master|doctorate)/)?.[0] || "/dashboard";
  const subPage = location.pathname.replace(baseRoute, "").replace(/^\//, "");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const meta = session.user.user_metadata;
      setUserEmail(session.user.email ?? "");
      setUserName(meta?.full_name || meta?.name || session.user.email?.split("@")[0] || "");
      const resolvedLevel = meta?.level || "licence";
      setUserLevel(resolvedLevel);
      setUserCountry(meta?.country || "");

      const userType = meta?.user_type;
      if (userType && !userType.startsWith("student")) {
        navigate(getDashboardRoute(meta), { replace: true });
        return;
      }

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

  const headerTitleMap: Record<string, string> = {
    "": "dashboard.dashboard",
    "new-project": "dashboard.newProject",
    "projects": "dashboard.myProjects",
    "quick-analysis": "dashboard.quickAnalysis",
    "history": "dashboard.history",
    "settings": "settings.title",
  };

  const headerTitle = t(headerTitleMap[subPage] || "dashboard.dashboard");

  const renderContent = () => {
    switch (subPage) {
      case "settings":
        return (
          <SettingsView
            userName={userName}
            userEmail={userEmail}
            userLevel={userLevel}
            userCountry={userCountry}
            onLogout={handleLogout}
          />
        );
      case "new-project":
        return <PlaceholderPage titleKey="dashboard.newProject" descKey="placeholder.comingSoon" />;
      case "projects":
        return (
          <>
            <RecentProjectsSection />
          </>
        );
      case "quick-analysis":
        return <PlaceholderPage titleKey="dashboard.quickAnalysis" descKey="placeholder.comingSoon" />;
      case "history":
        return <PlaceholderPage titleKey="dashboard.history" descKey="placeholder.comingSoon" />;
      default:
        return (
          <>
            <WelcomeSection userName={userName} userLevel={userLevel} />
            <QuickActionsSection />
            <StatsSection />
            <RecentProjectsSection />
            <ThesisAssistantSection />
            <QuickGuideSection />
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        baseRoute={baseRoute}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col">
        <DashboardHeader
          title={headerTitle}
          userName={userName}
          userLevel={userLevel}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
