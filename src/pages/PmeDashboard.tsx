import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/getDashboardRoute";
import { PmeSidebar } from "@/components/pme/PmeSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PmeQuickActions } from "@/components/pme/PmeQuickActions";
import { PmeKPIs } from "@/components/pme/PmeKPIs";
import { PmeCharts } from "@/components/pme/PmeCharts";
import { PmeInsights } from "@/components/pme/PmeInsights";
import { PmeRecentProjects } from "@/components/pme/PmeRecentProjects";
import { PmeStats } from "@/components/pme/PmeStats";
import { PmeSettingsView } from "@/components/pme/PmeSettingsView";
import { PmeNewAnalysisPage } from "@/components/pme/PmeNewAnalysisPage";
import { PmeProjectsPage } from "@/components/pme/PmeProjectsPage";
import { PmeReportsPage } from "@/components/pme/PmeReportsPage";
import { PmeChartsPage } from "@/components/pme/PmeChartsPage";
import { PmeHistoryPage } from "@/components/pme/PmeHistoryPage";

const BASE = "/dashboard/pme";

export default function PmeDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [companyName, setCompanyName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const [industry, setIndustry] = useState("");

  const subPage = location.pathname.replace(BASE, "").replace(/^\//, "") || "";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const meta = session.user.user_metadata;
      setUserEmail(session.user.email ?? "");
      setCompanyName(meta?.org_name || meta?.full_name || session.user.email?.split("@")[0] || "");
      setUserCountry(meta?.country || "");
      setIndustry(meta?.sector || "");

      const userType = meta?.user_type;
      if (userType && userType !== "pme") {
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
    "": "pme.sidebar.dashboard",
    "new-analysis": "pme.sidebar.newAnalysis",
    "projects": "pme.sidebar.projects",
    "charts": "pme.sidebar.charts",
    "reports": "pme.sidebar.reports",
    "history": "pme.sidebar.history",
    "settings": "settings.title",
  };

  const headerTitle = t(headerTitleMap[subPage] || "pme.sidebar.dashboard");

  const knownSubPages = new Set(["", "settings", "new-analysis", "projects", "charts", "reports", "history"]);

  const renderContent = () => {
    if (subPage && !knownSubPages.has(subPage)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Page unavailable</p>
          <p className="text-sm text-muted-foreground mb-4">This page doesn't exist. Please try again.</p>
          <button onClick={() => navigate(BASE)} className="text-primary underline text-sm">{t("pme.sidebar.dashboard")}</button>
        </div>
      );
    }
    switch (subPage) {
      case "settings":
        return (
          <PmeSettingsView
            companyName={companyName}
            userEmail={userEmail}
            userCountry={userCountry}
            industry={industry}
            onLogout={handleLogout}
          />
        );
      case "new-analysis":
        return <PmeNewAnalysisPage />;
      case "projects":
        return <PmeProjectsPage />;
      case "charts":
        return <PmeChartsPage />;
      case "reports":
        return <PmeReportsPage />;
      case "history":
        return <PmeHistoryPage />;
      default:
        return (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                {t("dashboard.welcomeName").replace("{name}", companyName || "—")}
              </h1>
              <p className="mt-1 text-muted-foreground">{t("pme.subtitle")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {industry && (
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    {industry}
                  </span>
                )}
                {userCountry && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {userCountry}
                  </span>
                )}
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {t("auth.orgType.sme")}
                </span>
              </div>
            </div>

            <PmeQuickActions />
            <PmeKPIs />
            <PmeCharts />
            <PmeInsights companyName={companyName} />
            <PmeStats />
            <PmeRecentProjects />
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <PmeSidebar onLogout={handleLogout} />

      <div className="flex flex-1 flex-col">
        <DashboardHeader
          title={headerTitle}
          userName={companyName}
          userLevel={t("auth.orgType.sme")}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
