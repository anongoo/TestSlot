import React from 'react';
import { motion } from 'framer-motion';
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
    <footer className="bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white py-12 mt-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-10 right-10 text-fiesta-yellow text-4xl opacity-20"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🎉
        </motion.div>
        <motion.div 
          className="absolute bottom-10 left-10 text-fiesta-pink text-3xl opacity-20"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, -10, 10, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          💖
        </motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="md:col-span-2">
            <motion.div 
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.img 
                src="/english-fiesta-logo-hq.png" 
                alt="English Fiesta Logo" 
                className="w-8 h-8"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              />
              <h3 className="text-xl font-bold bg-gradient-to-r from-fiesta-yellow to-fiesta-orange bg-clip-text text-transparent font-baloo">
                English Fiesta
              </h3>
            </motion.div>
            <motion.p 
              className="text-gray-300 leading-relaxed mb-4 font-poppins"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {footerTagline}
            </motion.p>
            
            {/* Email Signup */}
            <motion.div 
              className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl p-6 border border-fiesta-blue border-opacity-30"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="font-semibold mb-2 text-fiesta-blue font-poppins">📬 {t('stay_on_track')}</h4>
              <p className="text-sm text-gray-300 mb-3 font-poppins">Get weekly updates and video tips!</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder={t('email_placeholder')}
                  className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-fiesta-blue font-poppins"
                />
                <motion.button 
                  className="bg-gradient-to-r from-fiesta-blue to-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition-all duration-200 font-poppins font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('subscribe')}
                </motion.button>
              </div>
            </motion.div>
          </div>
          
          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="font-semibold mb-4 text-fiesta-green font-poppins">{t('quick_links')}</h4>
            <ul className="space-y-3 text-gray-300">
              <li>
                <motion.a 
                  href="/about" 
                  className="hover:text-fiesta-green transition-colors font-poppins"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {t('about')}
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="/faq" 
                  className="hover:text-fiesta-green transition-colors font-poppins"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {t('faq')}
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="/join" 
                  className="hover:text-fiesta-yellow transition-colors font-poppins"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  🤝 Join the Team
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="/privacy" 
                  className="hover:text-white transition-colors font-poppins"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  Privacy Policy
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="/terms" 
                  className="hover:text-white transition-colors font-poppins"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  Terms of Use
                </motion.a>
              </li>
            </ul>
          </motion.div>
          
          {/* Connect & Language */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h4 className="font-semibold mb-4 text-fiesta-purple font-poppins">{t('connect')}</h4>
            <ul className="space-y-3 text-gray-300 mb-6">
              <li>
                <motion.a 
                  href="mailto:support@englishfiesta.com" 
                  className="hover:text-fiesta-purple transition-colors font-poppins"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {t('contact_us')}
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="https://www.youtube.com/@englishfiesta" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-400 transition-colors flex items-center font-poppins"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="mr-2">📺</span> YouTube
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="https://instagram.com/fiestaenglish" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-400 transition-colors flex items-center font-poppins"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="mr-2">📸</span> Instagram
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="https://www.tiktok.com/@english_fiesta" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors flex items-center font-poppins"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="mr-2">🎵</span> TikTok
                </motion.a>
              </li>
            </ul>

            {/* Donate Button */}
            <motion.a
              href="https://buymeacoffee.com/englishfiesta"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-fiesta-pink to-pink-500 text-white px-4 py-3 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 block text-center mb-6"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(236, 72, 153, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              💖 Help English Fiesta Grow
            </motion.a>
            
            {/* Language Selector */}
            <LanguageSelector />
          </motion.div>
        </div>
        
        {/* Divider */}
        <motion.div 
          className="border-t border-gray-700 pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p className="font-poppins">{copyrightText}</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <motion.a 
                href="/privacy" 
                className="hover:text-white transition-colors font-poppins"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Privacy
              </motion.a>
              <motion.a 
                href="/terms" 
                className="hover:text-white transition-colors font-poppins"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Terms
              </motion.a>
              <motion.a 
                href="mailto:support@englishfiesta.com" 
                className="hover:text-white transition-colors font-poppins"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Support
              </motion.a>
            </div>
          </div>
        </motion.div>
        
        {loading && (
          <motion.div 
            className="text-center text-gray-500 text-xs mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Loading content...
          </motion.div>
        )}
      </div>
    </footer>
  );
};

export default Footer;