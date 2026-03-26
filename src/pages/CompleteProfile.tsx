import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getDashboardRoute } from "@/lib/getDashboardRoute";

export default function CompleteProfile() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [userType, setUserType] = useState("");
  const [loading, setLoading] = useState(false);

  // Student fields
  const [university, setUniversity] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [thesisTopic, setThesisTopic] = useState("");

  // Freelance fields
  const [freelanceDomain, setFreelanceDomain] = useState("");
  const [clientType, setClientType] = useState("");

  // Organisation fields
  const [orgSize, setOrgSize] = useState("");
  const [sector, setSector] = useState("");
  const [objectives, setObjectives] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const ut = session.user.user_metadata?.user_type || "";
      setUserType(ut);
    });
  }, [navigate]);

  const handleSave = async () => {
    setLoading(true);
    const profileData: Record<string, string> = {};
    if (userType === "student") {
      profileData.university = university;
      profileData.field_of_study = fieldOfStudy;
      profileData.thesis_topic = thesisTopic;
    } else if (userType === "freelance") {
      profileData.freelance_domain = freelanceDomain;
      profileData.client_type = clientType;
    } else if (userType === "organisation") {
      profileData.org_size = orgSize;
      profileData.sector = sector;
      profileData.objectives = objectives;
    }
    profileData.profile_completed = "true";

    const { error } = await supabase.auth.updateUser({ data: profileData });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("profile.save") + " ✓");
      // Re-fetch session to get updated metadata
      const { data: { session } } = await supabase.auth.getSession();
      navigate(getDashboardRoute(session?.user?.user_metadata));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t("profile.completeTitle")}</h1>
            <p className="mt-2 text-muted-foreground">{t("profile.completeDesc")}</p>
          </div>

          <div className="space-y-4">
            {userType === "student" && (
              <>
                <div className="space-y-2">
                  <Label>{t("profile.university")}</Label>
                  <Input value={university} onChange={(e) => setUniversity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.fieldOfStudy")}</Label>
                  <Input value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.thesisTopic")}</Label>
                  <Input value={thesisTopic} onChange={(e) => setThesisTopic(e.target.value)} />
                </div>
              </>
            )}

            {userType === "freelance" && (
              <>
                <div className="space-y-2">
                  <Label>{t("profile.freelanceDomain")}</Label>
                  <Input value={freelanceDomain} onChange={(e) => setFreelanceDomain(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.clientType")}</Label>
                  <Input value={clientType} onChange={(e) => setClientType(e.target.value)} />
                </div>
              </>
            )}

            {userType === "organisation" && (
              <>
                <div className="space-y-2">
                  <Label>{t("profile.orgSize")}</Label>
                  <Input value={orgSize} onChange={(e) => setOrgSize(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.sector")}</Label>
                  <Input value={sector} onChange={(e) => setSector(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.objectives")}</Label>
                  <Textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} />
                </div>
              </>
            )}

            {/* If Google user with no user_type, show a message */}
            {!userType && (
              <p className="text-center text-muted-foreground text-sm">
                {t("profile.completeDesc")}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                {t("profile.skip")}
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={loading}>
                {loading ? "..." : t("profile.save")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
