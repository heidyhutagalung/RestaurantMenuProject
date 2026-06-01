import { useTranslation } from 'react-i18next';

export default function LangSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const isId = i18n.language === 'id';

  function toggle() {
    const newLang = isId ? 'en' : 'id';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-white text-xs font-semibold
                  active:scale-95 transition-all tracking-wide ${className}`}
    >
      <span>{isId ? '🇮🇩' : '🇺🇸'}</span>
      <span>{isId ? 'ID' : 'EN'}</span>
    </button>
  );
}
