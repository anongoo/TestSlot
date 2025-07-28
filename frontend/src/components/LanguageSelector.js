import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', available: true },
    { code: 'es', name: 'Español', flag: '🇪🇸', available: false },
    { code: 'pt', name: 'Português', flag: '🇧🇷', available: false }
  ];

  const handleLanguageChange = (languageCode) => {
    if (languages.find(lang => lang.code === languageCode)?.available) {
      i18n.changeLanguage(languageCode);
    }
  };

  return (
    <div>
      <h5 className="font-semibold text-sm mb-2">{t('language')}</h5>
      <select 
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-gray-700 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {languages.map(lang => (
          <option 
            key={lang.code} 
            value={lang.code}
            disabled={!lang.available}
          >
            {lang.flag} {lang.name} {!lang.available && `(${t('coming_soon')})`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;