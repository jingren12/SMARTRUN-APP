import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Lang, Translations } from './translations';
import { translations } from './translations';

interface LangContextValue {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = 'smartrun-lang';

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
  } catch { /* localStorage unavailable */ }
  return 'zh';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT(): Translations {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useT must be used within LangProvider');
  return ctx.t;
}

export function useLang(): { lang: Lang; setLang: (lang: Lang) => void } {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return { lang: ctx.lang, setLang: ctx.setLang };
}
