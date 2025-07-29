import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useAllContent } from '../hooks/useContent';

const HeroSection = () => {
  const { isAuthenticated, login } = useAuth();
  const { t } = useTranslation();
  const { getTitle, getContent, loading } = useAllContent();

  // Get dynamic content from database or fall back to translation keys
  const heroTitle = getTitle('hero_section.hero_title') || t('hero_title');
  const heroSubtitle = getContent('hero_section.hero_subtitle') || t('hero_subtitle');
  const ctaText = getTitle('hero_section.cta_button') || t('start_learning_free');

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 hero-title">
            {heroTitle}
          </h1>
          
          {/* Hero Subtitle */}
          <h2 className="text-xl md:text-2xl mb-8 opacity-90 hero-subtitle">
            {heroSubtitle}
          </h2>
          
          {/* CTA Button */}
          {!isAuthenticated && (
            <button
              onClick={login}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg mb-12"
            >
              {ctaText}
            </button>
          )}
          
          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-semibold mb-2">{t('hero_value_prop_1')}</h3>
              <p className="text-sm opacity-80">Monitor your progress and stay motivated with daily streak tracking</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-3xl mb-3">🎥</div>
              <h3 className="font-semibold mb-2">{t('hero_value_prop_2')}</h3>
              <p className="text-sm opacity-80">Absorb language naturally through engaging video content</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="font-semibold mb-2">{t('hero_value_prop_3')}</h3>
              <p className="text-sm opacity-80">Experience authentic English from speakers around the world</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">{t('hero_value_prop_4')}</h3>
              <p className="text-sm opacity-80">Content tailored to your level, from new beginner to advanced</p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300 md:col-span-2 lg:col-span-1">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="font-semibold mb-2">{t('hero_value_prop_5')}</h3>
              <p className="text-sm opacity-80">Science-backed and effective language acquisition approach</p>
            </div>
          </div>
          
          {loading && (
            <div className="text-center mt-4 text-sm opacity-60">
              Loading content...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;