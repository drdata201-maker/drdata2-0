import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { Language, detectLanguage, t as translate } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

// Use a global symbol to ensure singleton context across HMR boundaries
const CONTEXT_KEY = "__DRDATA_LANGUAGE_CONTEXT__";

function getOrCreateContext(): React.Context<LanguageContextType | undefined> {
  const globalObj = globalThis as Record<string, unknown>;
  if (!globalObj[CONTEXT_KEY]) {
    globalObj[CONTEXT_KEY] = createContext<LanguageContextType | undefined>(undefined);
  }
  return globalObj[CONTEXT_KEY] as React.Context<LanguageContextType | undefined>;
}

const LanguageContext = getOrCreateContext();

const VALID_LANGS: Language[] = ["fr", "en", "es", "de", "pt"];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("drdata-lang") as Language | null;
      return saved ?? detectLanguage();
    } catch {
      return detectLanguage();
    }
  });

  // Load saved language from profile on auth
  useEffect(() => {
    let cancelled = false;
    const loadSavedLang = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.preferred_language && VALID_LANGS.includes(data.preferred_language as Language) && !cancelled) {
          setLangState(data.preferred_language as Language);
          localStorage.setItem("drdata-lang", data.preferred_language);
        }
      } catch {
        // silently fail
      }
    };
    loadSavedLang();

    // Also load on auth state change (login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") loadSavedLang();
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

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

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (ctx === undefined) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
