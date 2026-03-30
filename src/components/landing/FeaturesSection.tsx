import { useLanguage } from "@/contexts/LanguageContext";
import {
  GraduationCap,
  TrendingUp,
  Eraser,
  LineChart,
  FileBarChart,
  FolderKanban,
} from "lucide-react";
import { motion } from "framer-motion";

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    { icon: GraduationCap, key: "landing.feat.academicAnalysis" },
    { icon: TrendingUp, key: "landing.feat.businessAnalysis" },
    { icon: Eraser, key: "landing.feat.dataCleaning" },
    { icon: LineChart, key: "landing.feat.dataViz" },
    { icon: FileBarChart, key: "landing.feat.reportGen" },
    { icon: FolderKanban, key: "landing.feat.projectMgmt" },
  ];

  return (
    <section id="features" className="scroll-mt-16 border-t bg-muted/40 py-20">
      <div className="container">
        <motion.h2
          className="mb-12 text-center text-3xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          {t("landing.features.title")}
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.key}
              className="rounded-xl border bg-card p-7 transition-shadow hover:shadow-md"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="mb-4 inline-flex rounded-lg bg-accent p-3">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t(f.key)}</h3>
              <p className="text-sm text-muted-foreground">{t(f.key + ".desc")}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
