import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-20">
        <h1 className="mb-6 text-4xl font-bold">{t("page.about.title")}</h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">{t("page.about.desc")}</p>
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
