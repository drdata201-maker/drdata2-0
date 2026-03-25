import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, detectLanguage, t as translate } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("drdata-lang") as Language | null;
    return saved ?? detectLanguage();
  });

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("drdata-lang", l);
  };

  const t = (key: string) => translate(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
