import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAllContent } from '../hooks/useContent';
import LanguageSelector from './LanguageSelector';

const Footer = () => {
  const { t } = useTranslation();
  const { getContent, loading } = useAllContent();

  // Get dynamic content from database or fall back to translation keys
  const footerTagline = getContent('footer.footer_tagline') || t('footer_tagline');
  const copyrightText = getContent('footer.footer_copyright') || t('copyright');

  return (
    <footer className="bg-gray-800 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">English Fiesta</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              {footerTagline}
            </p>
            
            {/* Email Signup */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📬 {t('stay_on_track')}</h4>
              <p className="text-sm text-gray-300 mb-3">Get weekly updates and video tips!</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder={t('email_placeholder')}
                  className="flex-1 px-3 py-2 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                  {t('subscribe')}
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('quick_links')}</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/about" className="hover:text-white transition-colors">{t('about')}</a></li>
              <li><a href="/faq" className="hover:text-white transition-colors">{t('faq')}</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Use</a></li>
            </ul>
          </div>
          
          {/* Connect & Language */}
          <div>
            <h4 className="font-semibold mb-4">{t('connect')}</h4>
            <ul className="space-y-2 text-gray-300 mb-6">
              <li>
                <a href="mailto:support@englishfiesta.com" className="hover:text-white transition-colors">
                  {t('contact_us')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center">
                  <span className="mr-2">📺</span> YouTube
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center">
                  <span className="mr-2">📸</span> Instagram
                </a>
              </li>
            </ul>
            
            {/* Language Selector */}
            <LanguageSelector />
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>{copyrightText}</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="mailto:support@englishfiesta.com" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="text-center text-gray-500 text-xs mt-2">
            Loading content...
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;