import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/getDashboardRoute";
import { EnterpriseSidebar } from "@/components/enterprise/EnterpriseSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EnterpriseQuickActions } from "@/components/enterprise/EnterpriseQuickActions";
import { EnterpriseKPIs } from "@/components/enterprise/EnterpriseKPIs";
import { EnterpriseCharts } from "@/components/enterprise/EnterpriseCharts";
import { EnterpriseInsights } from "@/components/enterprise/EnterpriseInsights";
import { EnterpriseRecentProjects } from "@/components/enterprise/EnterpriseRecentProjects";
import { EnterpriseAnalytics } from "@/components/enterprise/EnterpriseAnalytics";
import { EnterpriseStats } from "@/components/enterprise/EnterpriseStats";
import { EnterpriseDepartments } from "@/components/enterprise/EnterpriseDepartments";
import { EnterpriseTeams } from "@/components/enterprise/EnterpriseTeams";
import { EnterpriseSettingsView } from "@/components/enterprise/EnterpriseSettingsView";

export default function EnterpriseDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [companyName, setCompanyName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyType, setCompanyType] = useState<"sme" | "enterprise">("enterprise");

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
      setCompanySize(meta?.org_size || "");

      const orgType = meta?.org_type || "";
      setCompanyType(orgType === "enterprise" ? "enterprise" : "sme");

      const userType = meta?.user_type;
      if (userType && userType !== "organisation") {
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

  const sidebarLabelMap: Record<string, string> = {
    dashboard: "enterprise.sidebar.dashboard",
    newAnalysis: "enterprise.sidebar.newAnalysis",
    departments: "enterprise.sidebar.departments",
    teams: "enterprise.sidebar.teams",
    projects: "enterprise.sidebar.projects",
    advancedAnalysis: "enterprise.sidebar.advancedAnalysis",
    charts: "enterprise.sidebar.charts",
    reports: "enterprise.sidebar.reports",
    history: "enterprise.sidebar.history",
    settings: "settings.title",
  };

  const headerTitle = t(sidebarLabelMap[activeItem] || "enterprise.sidebar.dashboard");

  const companyTypeLabel = companyType === "enterprise" ? t("auth.orgType.enterprise") : t("auth.orgType.sme");

  const renderContent = () => {
    switch (activeItem) {
      case "settings":
        return (
          <EnterpriseSettingsView
            companyName={companyName}
            userEmail={userEmail}
            userCountry={userCountry}
            industry={industry}
            companySize={companySize}
            onLogout={handleLogout}
          />
        );
      case "departments":
        return <EnterpriseDepartments />;
      case "teams":
        return <EnterpriseTeams />;
      case "charts":
        return <EnterpriseCharts companyType={companyType} />;
      case "projects":
        return <EnterpriseRecentProjects />;
      default:
        return (
          <>
            {/* Welcome */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                {t("dashboard.welcomeName").replace("{name}", companyName || "—")}
              </h1>
              <p className="mt-1 text-muted-foreground">{t("enterprise.subtitle.advanced")}</p>
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
                  {companyTypeLabel}
                </span>
              </div>
            </div>

            <EnterpriseQuickActions />
            <EnterpriseKPIs companyType={companyType} />
            <EnterpriseCharts companyType={companyType} />
            <EnterpriseInsights companyType={companyType} companyName={companyName} />
            <EnterpriseStats />
            <EnterpriseRecentProjects />
            <EnterpriseAnalytics companyType={companyType} />
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <EnterpriseSidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col">
        <DashboardHeader
          title={headerTitle}
          userName={companyName}
          userLevel={companyTypeLabel}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
