import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('as_dairy_lang') || 'en';
  });

  const dir = lang === 'ur' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('as_dairy_lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    if (lang === 'ur') {
      document.body.classList.add('font-urdu');
    } else {
      document.body.classList.remove('font-urdu');
    }
  }, [lang, dir]);

  const toggleLang = () => {
    setLang(prev => (prev === 'en' ? 'ur' : 'en'));
  };

  const t = (key, fallback = '') => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, toggleLang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
