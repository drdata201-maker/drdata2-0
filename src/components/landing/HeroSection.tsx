import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight } from "lucide-react";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden border-b bg-muted/30">
      <div className="container flex flex-col items-center py-28 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
          <BarChart3 className="h-4 w-4" />
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
        <div className="flex flex-col items-center gap-3">
          <Button size="lg" className="gap-2" asChild>
            <Link to="/signup">
              {t("landing.hero.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">{t("landing.hero.subCta")}</p>
        </div>
      </div>
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>
    </section>
  );
}
