import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import id from './id';
import en from './en';

const savedLang = localStorage.getItem('lang') || 'id';

i18n.use(initReactI18next).init({
  resources: { id, en },
  lng: savedLang,
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
});

export default i18n;
