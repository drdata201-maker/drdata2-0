import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Newspaper } from "lucide-react";
import { motion } from "framer-motion";

export default function Blog() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-bold">{t("page.blog.title")}</h1>
          <p className="mb-8 text-lg text-muted-foreground">{t("page.blog.comingSoon")}</p>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("auth.back")}
            </Link>
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
