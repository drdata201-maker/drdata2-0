import frTranslations from "@/locales/fr.json";
import enTranslations from "@/locales/en.json";
import esTranslations from "@/locales/es.json";
import ptTranslations from "@/locales/pt.json";
import deTranslations from "@/locales/de.json";

export type Language = "fr" | "en" | "es" | "pt" | "de";

export const languageLabels: Record<Language, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
};

const translations: Record<Language, Record<string, string>> = {
  fr: frTranslations,
  en: enTranslations,
  es: esTranslations,
  pt: ptTranslations,
  de: deTranslations,
};

export function detectLanguage(): Language {
  const browserLang = navigator.language.slice(0, 2).toLowerCase();
  if (browserLang in translations) return browserLang as Language;
  return "fr";
}

export function t(key: string, lang: Language): string {
  return translations[lang]?.[key] ?? translations.fr[key] ?? key;
}
