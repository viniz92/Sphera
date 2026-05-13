import { createContext, useContext, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("sphera_lang") || "pt");

  function setLanguage(code) {
    localStorage.setItem("sphera_lang", code);
    setLang(code);
  }

  function t(key) {
    return translations[lang]?.[key] ?? translations.pt[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
