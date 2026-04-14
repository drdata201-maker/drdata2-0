import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Logo } from "@/components/Logo";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer id="footer" className="scroll-mt-16 border-t py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Logo size="sm" />
            <p className="mt-3 text-sm text-muted-foreground">{t("landing.subtitle")}</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">{t("footer.product")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/features" className="hover:text-foreground">{t("nav.features")}</Link></li>
              <li><span className="cursor-not-allowed opacity-50">{t("footer.pricing")}</span></li>
              <li><Link to="/documentation" className="hover:text-foreground">{t("footer.docs")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">{t("footer.company")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">{t("footer.about")}</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">{t("footer.contact")}</Link></li>
              <li><Link to="/blog" className="hover:text-foreground">{t("footer.blog")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground">{t("footer.privacy")}</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">{t("footer.terms")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Dr Data 2.0. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
