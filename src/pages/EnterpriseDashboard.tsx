import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { EnterpriseSidebar } from "@/components/enterprise/EnterpriseSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EnterpriseQuickActions } from "@/components/enterprise/EnterpriseQuickActions";
import { EnterpriseKPIs } from "@/components/enterprise/EnterpriseKPIs";
import { EnterpriseCharts } from "@/components/enterprise/EnterpriseCharts";
import { EnterpriseInsights } from "@/components/enterprise/EnterpriseInsights";
import { EnterpriseRecentProjects } from "@/components/enterprise/EnterpriseRecentProjects";
import { EnterpriseAnalytics } from "@/components/enterprise/EnterpriseAnalytics";
import { EnterpriseStats } from "@/components/enterprise/EnterpriseStats";
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
      setCompanySize(meta?.org_size || meta?.org_type || "");

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
      : t(`enterprise.sidebar.${activeItem === "dashboard" ? "dashboard" : activeItem}`);

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
          userLevel={t("enterprise.userType")}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeItem === "settings" ? (
            <EnterpriseSettingsView
              companyName={companyName}
              userEmail={userEmail}
              userCountry={userCountry}
              industry={industry}
              companySize={companySize}
              onLogout={handleLogout}
            />
          ) : (
            <>
              {/* Welcome */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                  {t("dashboard.welcomeName").replace("{name}", companyName || "—")}
                </h1>
                <p className="mt-1 text-muted-foreground">{t("enterprise.subtitle")}</p>
              </div>

              <EnterpriseQuickActions />
              <EnterpriseKPIs />
              <EnterpriseCharts />
              <EnterpriseInsights />
              <EnterpriseStats />
              <EnterpriseRecentProjects />
              <EnterpriseAnalytics />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
