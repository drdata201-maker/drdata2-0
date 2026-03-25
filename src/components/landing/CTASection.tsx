import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="border-t bg-primary py-16">
      <div className="container text-center">
        <h2 className="mb-4 text-3xl font-bold text-primary-foreground">{t("landing.cta.title")}</h2>
        <p className="mb-8 text-primary-foreground/80">{t("landing.cta.desc")}</p>
        <Button size="lg" variant="secondary" className="gap-2" asChild>
          <Link to="/signup">
            {t("landing.hero.cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
