import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const EmailSubscriptionBanner = ({ onSubscribe }) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => 
    localStorage.getItem('email_banner_dismissed') === 'true'
  );

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('email_banner_dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 mb-8 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📬</span>
          <div>
            <h3 className="font-bold text-lg">📬 {t('stay_on_track')}</h3>
            <p className="text-sm opacity-90">{t('join_community')}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onSubscribe}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {t('subscribe')}
          </button>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailSubscriptionBanner;