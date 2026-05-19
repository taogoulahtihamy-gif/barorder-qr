import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fr, en, tStatus, tPaymentMethod, tRole, tAction } from './translations';

export const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('locale') || 'fr');

  useEffect(() => {
    localStorage.setItem('locale', lang);
  }, [lang]);

  const setLang = useCallback((l) => setLangState(l), []);

  const toggleLanguage = useCallback(() => {
    setLangState((prev) => (prev === 'fr' ? 'en' : 'fr'));
  }, []);

  const dict = useMemo(() => (lang === 'fr' ? fr : en), [lang]);

  const t = useCallback(
    (key) => {
      if (key == null) return '';
      const val = dict[key];
      if (val === undefined) {
        console.warn(`[i18n] Missing translation key: "${key}"`);
        return en[key] || key;
      }
      return val;
    },
    [dict]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLanguage,
      t,
      tStatus: (status) => tStatus(status, lang),
      tPaymentMethod: (method) => tPaymentMethod(method, lang),
      tRole: (role) => tRole(role, lang),
      tAction: (action) => tAction(action, lang),
    }),
    [lang, setLang, toggleLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
