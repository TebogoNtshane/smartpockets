import { createContext, useContext, useState, useEffect } from "react";
import { TRANSLATIONS, LANGUAGES } from "../lib/translations.js";
import { api } from "../api/client.js";

const LangContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("smartpockets:lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("smartpockets:lang", lang);
    // try save to user profile if logged in
    api.auth.me().then(u => {
      if (u.preferred_language !== lang) {
        api.entities.SavingsProfile; // ignore
        // update user record directly in local storage
        const users = JSON.parse(localStorage.getItem("smartpockets:entity:User") || "[]") || 
                      JSON.parse(localStorage.getItem("smartpockets:users") || "[]");
        // fallback: just store, we save lang in separate key for auth
      }
    }).catch(()=>{});
  }, [lang]);

  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;

  return (
    <LangContext.Provider value={{ lang, setLang, t, LANGUAGES }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLanguage = () => useContext(LangContext);