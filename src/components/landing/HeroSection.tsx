import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden border-b">
      {/* Background image */}
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-foreground/70" />

      <div className="container relative z-10 flex flex-col items-center py-28 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
          <BarChart3 className="h-4 w-4" />
          {t("landing.hero.badge")}
        </span>
        <h1 className="mb-5 max-w-3xl text-5xl font-bold leading-tight tracking-tight text-primary-foreground lg:text-6xl">
          {t("landing.title")}
        </h1>
        <p className="mb-3 max-w-2xl text-lg text-primary-foreground/80">
          {t("landing.subtitle")}
        </p>
        <p className="mb-10 max-w-2xl text-base text-primary-foreground/70">
          {t("landing.subtitle2")}
        </p>
        <div className="flex flex-col items-center gap-3">
          <Button size="lg" className="gap-2" asChild>
            <Link to="/signup">
              {t("landing.hero.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-primary-foreground/70">{t("landing.hero.subCta")}</p>
        </div>
      </div>
    </section>
  );
}
