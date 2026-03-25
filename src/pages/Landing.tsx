import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Users } from "lucide-react";

export default function Landing() {
  const { t } = useLanguage();

  const features = [
    { icon: BarChart3, titleKey: "landing.feature1.title", descKey: "landing.feature1.desc" },
    { icon: FileText, titleKey: "landing.feature2.title", descKey: "landing.feature2.desc" },
    { icon: Users, titleKey: "landing.feature3.title", descKey: "landing.feature3.desc" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" asChild>
              <Link to="/login">{t("landing.login")}</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">{t("landing.signup")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center py-24 text-center">
        <span className="mb-4 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
          {t("landing.hero.badge")}
        </span>
        <h1 className="mb-6 text-5xl font-bold tracking-tight lg:text-6xl">
          {t("landing.title")}
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
          {t("landing.subtitle")}
        </p>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <Link to="/signup">{t("landing.signup")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">{t("landing.login")}</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-24">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.titleKey}
              className="rounded-xl border bg-card p-8 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex rounded-lg bg-accent p-3">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t(f.titleKey)}</h3>
              <p className="text-muted-foreground">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
