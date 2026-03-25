import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { Language, detectLanguage, t as translate } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("drdata-lang") as Language | null;
      return saved ?? detectLanguage();
    } catch {
      return detectLanguage();
    }
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem("drdata-lang", l);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const t = useCallback((key: string) => translate(key, lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (ctx === undefined) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
