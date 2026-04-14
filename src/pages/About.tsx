import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Briefcase, FlaskConical, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const audiences = [
  { key: "students", icon: GraduationCap },
  { key: "freelancers", icon: Briefcase },
  { key: "researchers", icon: FlaskConical },
  { key: "companies", icon: Building2 },
];

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="mb-4 text-4xl font-bold">{t("page.about.title")}</h1>
          <p className="mb-10 max-w-3xl text-lg text-muted-foreground">{t("page.about.desc")}</p>
        </motion.div>

        <div className="mb-12 grid gap-8 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-6">
            <h2 className="mb-3 text-xl font-semibold">{t("page.about.mission.title")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("page.about.mission.desc")}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-6">
            <h2 className="mb-3 text-xl font-semibold">{t("page.about.vision.title")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("page.about.vision.desc")}</p>
          </motion.div>
        </div>

        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold">{t("page.about.audience.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a, i) => (
              <motion.div key={a.key} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="rounded-xl border bg-card p-5 text-center">
                <a.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold">{t(`page.about.audience.${a.key}`)}</h3>
                <p className="text-xs text-muted-foreground">{t(`page.about.audience.${a.key}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("auth.back")}
          </Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
