import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/getDashboardRoute";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const meta = session.user.user_metadata;
        const dashRoute = getDashboardRoute(meta);
        // If user navigated to a dashboard sub-route that doesn't exist, redirect to their dashboard
        if (location.pathname.startsWith("/dashboard")) {
          navigate(dashRoute, { replace: true });
          return;
        }
      }
      setChecked(true);
    });
  }, [location.pathname, navigate]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          {t("notFound.message") !== "notFound.message"
            ? t("notFound.message")
            : "This page doesn't exist or is temporarily unavailable."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("workspace.back") !== "workspace.back" ? t("workspace.back") : "Go Back"}
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home className="h-4 w-4" />
            {t("landing.home") !== "landing.home" ? t("landing.home") : "Home"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
