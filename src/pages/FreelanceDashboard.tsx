import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/getDashboardRoute";
import { FreelanceSidebar } from "@/components/freelance/FreelanceSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FreelanceQuickActions } from "@/components/freelance/FreelanceQuickActions";
import { FreelanceStats } from "@/components/freelance/FreelanceStats";
import { ClientProjectsSection } from "@/components/freelance/ClientProjectsSection";
import { QuickGuideSection } from "@/components/dashboard/QuickGuideSection";
import { FreelanceSettingsView } from "@/components/freelance/FreelanceSettingsView";
import { FreelanceNewProjectPage } from "@/components/freelance/FreelanceNewProjectPage";
import { FreelanceProjectsPage } from "@/components/freelance/FreelanceProjectsPage";
import { FreelanceClientsPage } from "@/components/freelance/FreelanceClientsPage";
import { FreelanceReportsPage } from "@/components/freelance/FreelanceReportsPage";
import { FreelanceHistoryPage } from "@/components/freelance/FreelanceHistoryPage";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

const BASE = "/dashboard/freelance";

export default function FreelanceDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const [freelanceDomain, setFreelanceDomain] = useState("");

  const subPage = location.pathname.replace(BASE, "").replace(/^\//, "") || "";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const meta = session.user.user_metadata;
      setUserEmail(session.user.email ?? "");
      setUserName(meta?.full_name || meta?.name || session.user.email?.split("@")[0] || "");
      setUserCountry(meta?.country || "");
      setFreelanceDomain(meta?.freelance_domain || "");
      const userType = meta?.user_type;
      if (userType && userType !== "freelance") { navigate(getDashboardRoute(meta), { replace: true }); return; }
      if (!meta?.profile_completed && !meta?.user_type) navigate("/complete-profile");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) navigate("/login"); });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const headerTitleMap: Record<string, string> = {
    "": "dashboard.dashboard",
    "new-project": "freelance.newClientProject",
    "projects": "freelance.myClientProjects",
    "clients": "freelance.clients",
    "reports": "pme.sidebar.reports",
    "analysis": "dashboard.quickAnalysis",
    "history": "dashboard.history",
    "settings": "settings.title",
  };

  const headerTitle = t(headerTitleMap[subPage] || "dashboard.dashboard");

  const knownSubPages = new Set(["", "settings", "clients", "projects", "new-project", "reports", "history", "analysis"]);

  const renderContent = () => {
    if (subPage && !knownSubPages.has(subPage)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Page unavailable</p>
          <p className="text-sm text-muted-foreground mb-4">This page doesn't exist. Please try again.</p>
          <button onClick={() => navigate(BASE)} className="text-primary underline text-sm">{t("dashboard.dashboard")}</button>
        </div>
      );
    }
    switch (subPage) {
      case "settings":
        return <FreelanceSettingsView userName={userName} userEmail={userEmail} userCountry={userCountry} freelanceDomain={freelanceDomain} onLogout={handleLogout} />;
      case "clients":
        return <FreelanceClientsPage />;
      case "projects":
        return <FreelanceProjectsPage />;
      case "new-project":
        return <FreelanceNewProjectPage />;
      case "reports":
        return <FreelanceReportsPage />;
      case "history":
        return <FreelanceHistoryPage />;
      case "analysis":
        return <PlaceholderPage titleKey="dashboard.quickAnalysis" descKey="placeholder.comingSoon" />;
      default:
        return (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">{t("dashboard.welcomeName").replace("{name}", userName || "—")}</h1>
              <p className="mt-1 text-muted-foreground">{t("freelance.subtitle")}</p>
            </div>
            <FreelanceQuickActions />
            <FreelanceStats />
            <ClientProjectsSection />
            <QuickGuideSection />
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <FreelanceSidebar onLogout={handleLogout} />
      <div className="flex flex-1 flex-col">
        <DashboardHeader title={headerTitle} userName={userName} userLevel={t("freelance.userType")} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
}
