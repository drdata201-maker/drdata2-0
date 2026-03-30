import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden border-b">
      <motion.img
        src={heroBg}
        alt=""
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <div className="absolute inset-0 bg-foreground/70" />

      <div className="container relative z-10 flex flex-col items-center py-28 text-center">
        <motion.span
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <BarChart3 className="h-4 w-4" />
          {t("landing.hero.badge")}
        </motion.span>
        <motion.h1
          className="mb-5 max-w-3xl text-5xl font-bold leading-tight tracking-tight text-primary-foreground lg:text-6xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          {t("landing.title")}
        </motion.h1>
        <motion.p
          className="mb-3 max-w-2xl text-lg text-primary-foreground/80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {t("landing.subtitle")}
        </motion.p>
        <motion.p
          className="mb-10 max-w-2xl text-base text-primary-foreground/70"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {t("landing.subtitle2")}
        </motion.p>
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Button size="lg" className="gap-2" asChild>
            <Link to="/signup">
              {t("landing.hero.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-primary-foreground/70">{t("landing.hero.subCta")}</p>
        </motion.div>
      </div>
    </section>
  );
}
