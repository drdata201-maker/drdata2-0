import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileText,
  Users,
  GraduationCap,
  Briefcase,
  Building2,
  Building,
  FlaskConical,
  Sparkles,
  Eraser,
  TestTube2,
  Brain,
  FileBarChart,
  LineChart,
  Zap,
  Award,
  BookOpen,
  TrendingUp,
  Globe,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Landing() {
  const { t } = useLanguage();

  const audiences = [
    { icon: GraduationCap, titleKey: "landing.audience.students", descKey: "landing.audience.students.desc" },
    { icon: Briefcase, titleKey: "landing.audience.freelancers", descKey: "landing.audience.freelancers.desc" },
    { icon: Building2, titleKey: "landing.audience.smes", descKey: "landing.audience.smes.desc" },
    { icon: Building, titleKey: "landing.audience.enterprises", descKey: "landing.audience.enterprises.desc" },
    { icon: FlaskConical, titleKey: "landing.audience.researchers", descKey: "landing.audience.researchers.desc" },
  ];

  const features = [
    { icon: Sparkles, key: "landing.feat.smartAnalysis" },
    { icon: Eraser, key: "landing.feat.dataCleaning" },
    { icon: TestTube2, key: "landing.feat.statTests" },
    { icon: Brain, key: "landing.feat.aiInterpretation" },
    { icon: FileBarChart, key: "landing.feat.reportGen" },
    { icon: LineChart, key: "landing.feat.dataViz" },
  ];

  const whyItems = [
    { icon: Zap, key: "landing.why.fast" },
    { icon: FileText, key: "landing.why.reports" },
    { icon: BookOpen, key: "landing.why.academic" },
    { icon: TrendingUp, key: "landing.why.business" },
    { icon: Brain, key: "landing.why.ai" },
  ];

  const languages = [
    { flag: "🇫🇷", name: "Français" },
    { flag: "🇬🇧", name: "English" },
    { flag: "🇪🇸", name: "Español" },
    { flag: "🇵🇹", name: "Português" },
    { flag: "🇩🇪", name: "Deutsch" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

      {/* HERO */}
      <section className="container flex flex-col items-center py-28 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
          <Sparkles className="h-4 w-4" />
          {t("landing.hero.badge")}
        </span>
        <h1 className="mb-5 max-w-3xl text-5xl font-bold leading-tight tracking-tight lg:text-6xl">
          {t("landing.title")}
        </h1>
        <p className="mb-3 max-w-2xl text-lg text-muted-foreground">
          {t("landing.subtitle")}
        </p>
        <p className="mb-10 max-w-2xl text-base text-muted-foreground">
          {t("landing.subtitle2")}
        </p>
        <div className="flex gap-4">
          <Button size="lg" className="gap-2" asChild>
            <Link to="/signup">
              {t("landing.signup")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">{t("landing.login")}</Link>
          </Button>
        </div>
      </section>

      {/* SECTION 2 — WHO IS THIS FOR */}
      <section className="border-t bg-muted/40 py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">{t("landing.audience.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {audiences.map((a) => (
              <div key={a.titleKey} className="rounded-xl border bg-card p-6 text-center transition-shadow hover:shadow-md">
                <div className="mx-auto mb-4 inline-flex rounded-lg bg-accent p-3">
                  <a.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{t(a.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(a.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURES */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">{t("landing.features.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.key} className="rounded-xl border bg-card p-7 transition-shadow hover:shadow-md">
                <div className="mb-4 inline-flex rounded-lg bg-accent p-3">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{t(f.key)}</h3>
                <p className="text-sm text-muted-foreground">{t(f.key + ".desc")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — LANGUAGES */}
      <section className="border-t bg-muted/40 py-20">
        <div className="container text-center">
          <div className="mx-auto mb-4 inline-flex rounded-lg bg-accent p-3">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-4 text-3xl font-bold">{t("landing.lang.title")}</h2>
          <p className="mb-10 text-muted-foreground">{t("landing.lang.desc")}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {languages.map((l) => (
              <div key={l.name} className="flex items-center gap-2 rounded-full border bg-card px-5 py-2.5 text-sm font-medium shadow-sm">
                <span className="text-xl">{l.flag}</span>
                {l.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHY DR DATA */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">{t("landing.why.title")}</h2>
          <div className="mx-auto grid max-w-3xl gap-4">
            {whyItems.map((w) => (
              <div key={w.key} className="flex items-start gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm">
                <div className="flex-shrink-0 rounded-lg bg-accent p-2.5">
                  <w.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t(w.key)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(w.key + ".desc")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA */}
      <section className="border-t bg-primary py-16">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">{t("landing.cta.title")}</h2>
          <p className="mb-8 text-primary-foreground/80">{t("landing.cta.desc")}</p>
          <Button size="lg" variant="secondary" className="gap-2" asChild>
            <Link to="/signup">
              {t("landing.signup")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Logo size="sm" />
              <p className="mt-3 text-sm text-muted-foreground">{t("landing.subtitle")}</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">{t("footer.features")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {features.slice(0, 4).map((f) => (
                  <li key={f.key}>{t(f.key)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">{t("footer.company")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t("footer.about")}</li>
                <li>{t("footer.pricing")}</li>
                <li>{t("footer.contact")}</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">{t("footer.legal")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{t("footer.privacy")}</li>
                <li>{t("footer.terms")}</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dr Data 2.0. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
