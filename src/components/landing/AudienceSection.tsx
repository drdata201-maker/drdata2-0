import { useLanguage } from "@/contexts/LanguageContext";
import { GraduationCap, Briefcase, Building2, Building } from "lucide-react";
import { motion } from "framer-motion";

export function AudienceSection() {
  const { t } = useLanguage();

  const audiences = [
    { icon: GraduationCap, titleKey: "landing.audience.students", descKey: "landing.audience.students.desc" },
    { icon: Briefcase, titleKey: "landing.audience.freelancers", descKey: "landing.audience.freelancers.desc" },
    { icon: Building2, titleKey: "landing.audience.smes", descKey: "landing.audience.smes.desc" },
    { icon: Building, titleKey: "landing.audience.enterprises", descKey: "landing.audience.enterprises.desc" },
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
          {t("landing.audience.title")}
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a, i) => (
            <motion.div
              key={a.titleKey}
              className="rounded-xl border bg-card p-6 text-center transition-shadow hover:shadow-md"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="mx-auto mb-4 inline-flex rounded-lg bg-accent p-3">
                <a.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{t(a.titleKey)}</h3>
              <p className="text-sm text-muted-foreground">{t(a.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
