import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { faqContent } from '../i18n/content';

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        onClick={onToggle}
        className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-colors"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 pr-4">{question}</h3>
          <span className={`text-2xl transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const { i18n, t } = useTranslation();
  const [openItem, setOpenItem] = useState(null);
  
  const currentLang = i18n.language || 'en';
  const faqData = faqContent[currentLang] || faqContent.en;

  const handleToggle = (index) => {
    setOpenItem(openItem === index ? null : index);
  };

  let itemIndex = 0;

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('faq')}</h1>
          <p className="text-lg text-gray-600">Everything you need to know about English Fiesta and Comprehensible Input</p>
        </div>

        {faqData.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center bg-blue-100 py-3 rounded-lg">
              {section.section}
            </h2>
            <div className="space-y-4">
              {section.items.map((item) => {
                const currentIndex = itemIndex++;
                return (
                  <FAQItem
                    key={currentIndex}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openItem === currentIndex}
                    onToggle={() => handleToggle(currentIndex)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="text-lg mb-6">We're here to help you on your English learning journey</p>
          <a 
            href="mailto:support@englishfiesta.com"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            {t('contact_us')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;