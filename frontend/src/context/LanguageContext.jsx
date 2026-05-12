import { createContext, useContext, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("palantir_lang") || "pt");

  function toggle() {
    const next = lang === "pt" ? "en" : "pt";
    localStorage.setItem("palantir_lang", next);
    setLang(next);
  }

  function t(key) {
    return translations[lang]?.[key] ?? translations.pt[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
