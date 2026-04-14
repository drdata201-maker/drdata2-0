import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, BarChart3, FileText, Download } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: Upload, key: "upload" },
  { icon: BarChart3, key: "choose" },
  { icon: FileText, key: "generate" },
  { icon: Download, key: "export" },
];

export default function Documentation() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="mb-4 text-4xl font-bold">{t("page.docs.title")}</h1>
          <p className="mb-12 max-w-2xl text-lg text-muted-foreground">{t("page.docs.desc")}</p>
        </motion.div>

        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-semibold">{t("page.docs.howItWorks")}</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-xl border bg-card p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {t("page.docs.step")} {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{t(`page.docs.${step.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`page.docs.${step.key}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-xl border bg-card p-8">
          <h2 className="mb-4 text-2xl font-semibold">{t("page.docs.levels.title")}</h2>
          <p className="mb-6 text-muted-foreground">{t("page.docs.levels.desc")}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {["licence", "master", "doctorate", "enterprise"].map((level) => (
              <div key={level} className="rounded-lg border p-4">
                <h3 className="mb-1 font-semibold">{t(`page.docs.levels.${level}`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`page.docs.levels.${level}.desc`)}</p>
              </div>
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
