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
import { StudentNewProjectPage } from "@/components/student/StudentNewProjectPage";
import { StudentProjectsPage } from "@/components/student/StudentProjectsPage";
import { StudentAnalysisPage } from "@/components/student/StudentAnalysisPage";
import { StudentHistoryPage } from "@/components/student/StudentHistoryPage";
import { MemoryAssistantPage } from "@/components/student/MemoryAssistantPage";

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userLevel, setUserLevel] = useState("licence");
  const [userCountry, setUserCountry] = useState("");
  const baseRoute = location.pathname.match(/^\/dashboard\/student-(license|master|doctorate)/)?.[0] || "/dashboard";
  const subPage = location.pathname.replace(baseRoute, "").replace(/^\//, "");

  // Derive userType from route as primary source
  const routeLevelMatch = baseRoute.match(/student-(license|master|doctorate)$/);
  const routeUserType = routeLevelMatch ? `student_${routeLevelMatch[1]}` : "student_license";
  const [userType, setUserType] = useState(routeUserType);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const meta = session.user.user_metadata;
      setUserEmail(session.user.email ?? "");
      setUserName(meta?.full_name || meta?.name || session.user.email?.split("@")[0] || "");
      setUserLevel(meta?.level || "licence");
      setUserCountry(meta?.country || "");
      setUserType(meta?.user_type || "student_license");
      if (meta?.user_type && !meta.user_type.startsWith("student")) { navigate(getDashboardRoute(meta), { replace: true }); return; }
      if (!meta?.profile_completed && !meta?.user_type) navigate("/complete-profile");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) navigate("/login"); });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const headerTitleMap: Record<string, string> = {
    "": "dashboard.dashboard",
    "new-project": "dashboard.newProject",
    "projects": "dashboard.myProjects",
    "quick-analysis": "dashboard.quickAnalysis",
    "history": "dashboard.history",
    "settings": "settings.title",
    "memory-assistant": "memoryAssistant.title",
  };

  const headerTitle = t(headerTitleMap[subPage] || "dashboard.dashboard");

  const renderContent = () => {
    switch (subPage) {
      case "settings":
        return <SettingsView userName={userName} userEmail={userEmail} userLevel={userLevel} userCountry={userCountry} onLogout={handleLogout} />;
      case "new-project":
        return <StudentNewProjectPage baseRoute={baseRoute} userType={userType} />;
      case "projects":
        return <StudentProjectsPage baseRoute={baseRoute} userType={userType} />;
      case "quick-analysis":
        return <StudentAnalysisPage userType={userType} />;
      case "history":
        return <StudentHistoryPage userType={userType} />;
      case "memory-assistant":
        return <MemoryAssistantPage />;
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
      <DashboardSidebar baseRoute={baseRoute} onLogout={handleLogout} />
      <div className="flex flex-1 flex-col">
        <DashboardHeader title={headerTitle} userName={userName} userLevel={userLevel} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
}
