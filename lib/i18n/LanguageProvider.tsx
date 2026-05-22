'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type Language, type TranslationKey, getTranslation } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children, initialLang = 'English' }: { children: ReactNode; initialLang?: Language }) {
  const [language, setLanguageState] = useState<Language>(initialLang);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('roadsos_web_lang', lang);
    }
  }, []);

  const t = useCallback((key: TranslationKey) => getTranslation(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
