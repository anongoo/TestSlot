import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="bg-gradient-to-br from-fiesta-blue via-fiesta-purple to-fiesta-pink text-white overflow-hidden relative">
      {/* Floating elements for fun */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-10 left-10 text-6xl opacity-20"
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🎉
        </motion.div>
        <motion.div 
          className="absolute top-20 right-20 text-4xl opacity-20"
          animate={{ 
            y: [0, 10, 0],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          📚
        </motion.div>
        <motion.div 
          className="absolute bottom-20 left-20 text-5xl opacity-20"
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          🌟
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Title */}
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 hero-title font-baloo"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {heroTitle}
          </motion.h1>
          
          {/* Hero Subtitle */}
          <motion.h2 
            className="text-xl md:text-2xl mb-8 opacity-90 hero-subtitle font-poppins font-medium"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            {heroSubtitle}
          </motion.h2>
          
          {/* CTA Button */}
          {!isAuthenticated && (
            <motion.button
              onClick={login}
              className="bg-fiesta-yellow text-gray-800 px-8 py-4 rounded-full text-xl font-bold hover:bg-yellow-300 transition-all duration-300 transform shadow-2xl mb-12 font-poppins"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.4,
                type: "spring",
                stiffness: 200 
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(250, 204, 21, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              {ctaText}
            </motion.button>
          )}
          
          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              { emoji: "📈", title: t('hero_value_prop_1'), desc: "Monitor your progress and stay motivated with daily streak tracking", color: "from-fiesta-green to-green-400" },
              { emoji: "🎥", title: t('hero_value_prop_2'), desc: "Absorb language naturally through engaging video content", color: "from-fiesta-orange to-orange-400" },
              { emoji: "🌍", title: t('hero_value_prop_3'), desc: "Experience authentic English from speakers around the world", color: "from-fiesta-blue to-blue-400" },
              { emoji: "🎯", title: t('hero_value_prop_4'), desc: "Content tailored to your level, from new beginner to advanced", color: "from-fiesta-purple to-purple-400" },
              { emoji: "🧠", title: t('hero_value_prop_5'), desc: "Science-backed and effective language acquisition approach", color: "from-fiesta-pink to-pink-400" }
            ].map((prop, index) => (
              <motion.div
                key={index}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300 border border-white border-opacity-20"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeOut", 
                  delay: 0.6 + (index * 0.1) 
                }}
                whileHover={{ 
                  scale: 1.05,
                  y: -5
                }}
              >
                <motion.div 
                  className="text-3xl mb-3"
                  whileHover={{ 
                    scale: 1.2,
                    rotate: [0, -10, 10, 0]
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {prop.emoji}
                </motion.div>
                <h3 className="font-semibold mb-2 font-poppins">{prop.title}</h3>
                <p className="text-sm opacity-80 font-poppins">{prop.desc}</p>
              </motion.div>
            ))}
            
            {/* Join the Fiesta Button - 6th grid item */}
            <motion.div
              className="bg-gradient-to-br from-fiesta-yellow via-yellow-300 to-fiesta-orange backdrop-blur-sm rounded-xl p-6 hover:shadow-2xl transition-all duration-300 border-2 border-yellow-300 cursor-pointer"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: "easeOut", 
                delay: 1.1
              }}
              whileHover={{ 
                scale: 1.05,
                y: -10,
                boxShadow: "0 20px 40px rgba(250, 204, 21, 0.6)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/watch'}
            >
              <motion.div 
                className="text-4xl mb-3"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🎯
              </motion.div>
              <h3 className="font-bold mb-2 text-gray-800 text-lg font-baloo">Join the Fiesta</h3>
              <p className="text-sm text-gray-700 font-medium">Start watching videos now!</p>
            </motion.div>
          </div>
          
          {loading && (
            <motion.div 
              className="text-center mt-4 text-sm opacity-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Loading content...
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;