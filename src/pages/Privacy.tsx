import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const sections = ["collect", "use", "storage", "sharing", "rights", "cookies", "changes"] as const;

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="mb-4 text-4xl font-bold">{t("page.privacy.title")}</h1>
          <p className="mb-2 text-sm text-muted-foreground">{t("page.privacy.lastUpdated")}</p>
          <p className="mb-10 max-w-3xl text-muted-foreground">{t("page.privacy.intro")}</p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((s, i) => (
            <motion.section
              key={s}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-xl border bg-card p-6"
            >
              <h2 className="mb-3 text-xl font-semibold">{t(`page.privacy.${s}.title`)}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`page.privacy.${s}.desc`)}</p>
            </motion.section>
          ))}
        </div>

        <div className="mt-10">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("auth.back")}
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
