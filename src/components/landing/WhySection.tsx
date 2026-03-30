import { useLanguage } from "@/contexts/LanguageContext";
import { Zap, FileText, BookOpen, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";

export function WhySection() {
  const { t } = useLanguage();

  const whyItems = [
    { icon: Zap, key: "landing.why.fast" },
    { icon: FileText, key: "landing.why.reports" },
    { icon: BookOpen, key: "landing.why.academic" },
    { icon: TrendingUp, key: "landing.why.business" },
    { icon: Award, key: "landing.why.advanced" },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <motion.h2
          className="mb-12 text-center text-3xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          {t("landing.why.title")}
        </motion.h2>
        <div className="mx-auto grid max-w-3xl gap-4">
          {whyItems.map((w, i) => (
            <motion.div
              key={w.key}
              className="flex items-start gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex-shrink-0 rounded-lg bg-accent p-2.5">
                <w.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t(w.key)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(w.key + ".desc")}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
