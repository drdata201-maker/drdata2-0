import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Features() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-20">
        <div className="container mb-12">
          <h1 className="mb-4 text-4xl font-bold">{t("page.features.title")}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{t("page.features.desc")}</p>
        </div>
        <FeaturesSection />
        <div className="container mt-8">
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
