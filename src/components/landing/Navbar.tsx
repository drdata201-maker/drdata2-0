import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { t } = useLanguage();

  const navLinks = [
    { key: "nav.features", href: "#features" },
    { key: "nav.pricing", href: "/pricing" },
    { key: "nav.about", href: "/about" },
    { key: "nav.contact", href: "#footer" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.key}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(link.key)}
                </a>
              ) : (
                <Link
                  key={link.key}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(link.key)}
                </Link>
              )
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" asChild>
            <Link to="/login">{t("landing.login")}</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">{t("landing.hero.cta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
