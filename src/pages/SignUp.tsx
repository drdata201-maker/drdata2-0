import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { GraduationCap, Briefcase, Building2, ArrowLeft } from "lucide-react";

type UserType = "student" | "freelance" | "organisation";
type Step = "choose-method" | "choose-type" | "form";

const COUNTRIES = [
  "France", "Senegal", "Cameroun", "Côte d'Ivoire", "Mali", "Burkina Faso",
  "Congo (RDC)", "Gabon", "Togo", "Bénin", "Guinée", "Niger", "Tchad",
  "Madagascar", "Maroc", "Tunisie", "Algérie", "Canada", "Belgique", "Suisse",
  "États-Unis", "Royaume-Uni", "Allemagne", "Espagne", "Portugal", "Brésil",
  "Autre",
];

export default function SignUp() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose-method");
  const [userType, setUserType] = useState<UserType | "">("");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");

  const handleGoogleSignUp = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(error.message);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== confirmEmail) {
      toast.error(t("auth.email") + " — mismatch");
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("auth.confirmPassword") + " — mismatch");
      return;
    }
    setLoading(true);

    // Build flat user_type value
    let flatUserType = userType as string;
    if (userType === "student") {
      const levelMap: Record<string, string> = {
        licence: "student_license",
        master: "student_master",
        doctorat: "student_doctorate",
      };
      flatUserType = levelMap[level] || "student_license";
    } else if (userType === "organisation") {
      flatUserType = orgType === "enterprise" ? "enterprise" : "pme";
    }

    const metadata: Record<string, string> = {
      full_name: userType === "organisation" ? orgName : fullName,
      user_type: flatUserType,
      country,
    };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.createAccount") + " ✓");
      navigate("/login");
    }
  };

  const userTypeCards = [
    { type: "student" as const, icon: GraduationCap, labelKey: "auth.userType.student" },
    { type: "freelance" as const, icon: Briefcase, labelKey: "auth.userType.freelance" },
    { type: "organisation" as const, icon: Building2, labelKey: "auth.userType.organisation" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/"><Logo /></Link>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md space-y-6">

          {/* STEP 1: Choose method */}
          {step === "choose-method" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold">{t("auth.signup")}</h1>
              </div>
              <Button
                variant="outline"
                className="w-full gap-3 h-12"
                onClick={handleGoogleSignUp}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t("auth.continueWithGoogle")}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t("auth.orSeparator")}</span>
                </div>
              </div>
              <Button
                className="w-full h-12"
                onClick={() => setStep("choose-type")}
              >
                {t("auth.manualSignup")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.haveAccount")}{" "}
                <Link to="/login" className="font-medium text-primary underline">{t("auth.login")}</Link>
              </p>
            </div>
          )}

          {/* STEP 2: Choose user type */}
          {step === "choose-type" && (
            <div className="space-y-6">
              <button onClick={() => setStep("choose-method")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {t("auth.back")}
              </button>
              <div className="text-center">
                <h1 className="text-2xl font-bold">{t("auth.selectUserType")}</h1>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {userTypeCards.map((card) => (
                  <button
                    key={card.type}
                    onClick={() => { setUserType(card.type); setStep("form"); }}
                    className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="rounded-lg bg-accent p-3">
                      <card.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{t(card.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Registration form */}
          {step === "form" && (
            <div className="space-y-6">
              <button onClick={() => setStep("choose-type")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {t("auth.back")}
              </button>
              <div className="text-center">
                <h1 className="text-2xl font-bold">{t("auth.createAccount")}</h1>
              </div>
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Name field */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {userType === "organisation" ? t("auth.orgName") : t("auth.fullName")}
                  </Label>
                  <Input
                    id="fullName"
                    value={userType === "organisation" ? orgName : fullName}
                    onChange={(e) => userType === "organisation" ? setOrgName(e.target.value) : setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">{t("auth.confirmEmail")}</Label>
                  <Input id="confirmEmail" type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                {/* Student: Level */}
                {userType === "student" && (
                  <div className="space-y-2">
                    <Label>{t("auth.level")}</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger><SelectValue placeholder={t("auth.level")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="licence">{t("auth.level.licence")}</SelectItem>
                        <SelectItem value="master">{t("auth.level.master")}</SelectItem>
                        <SelectItem value="doctorat">{t("auth.level.doctorat")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Organisation: Type */}
                {userType === "organisation" && (
                  <div className="space-y-2">
                    <Label>{t("auth.orgType")}</Label>
                    <Select value={orgType} onValueChange={setOrgType}>
                      <SelectTrigger><SelectValue placeholder={t("auth.orgType")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sme">{t("auth.orgType.sme")}</SelectItem>
                        <SelectItem value="enterprise">{t("auth.orgType.enterprise")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Country */}
                <div className="space-y-2">
                  <Label>{t("auth.country")}</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue placeholder={t("auth.country")} /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "..." : t("auth.createAccount")}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.haveAccount")}{" "}
                <Link to="/login" className="font-medium text-primary underline">{t("auth.login")}</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
