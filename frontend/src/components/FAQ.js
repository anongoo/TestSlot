import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContent } from '../hooks/useContent';

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
  const { content: faqContent, loading, getContentForLanguage } = useContent('faq_page');

  // Fallback FAQ data
  const fallbackFaqData = [
    {
      section: "English Fiesta Basics",
      items: [
        {
          question: "What is English Fiesta?",
          answer: "English Fiesta is a language-learning platform that helps you acquire English naturally through engaging videos and conversations, rather than traditional grammar drills or memorization."
        },
        {
          question: "How does English Fiesta work?",
          answer: "We use a method called Comprehensible Input, where learners watch videos they can mostly understand, even as beginners. Over time, you absorb grammar, vocabulary, and pronunciation by exposure — not by force."
        },
        {
          question: "Can I actually learn English with Comprehensible Input?",
          answer: "Yes — and research supports it. When you understand what you hear or read in a language, your brain naturally picks it up the way children do. It's a slower beginning, but results in deeper fluency and confidence over time — without needing to study flashcards or grammar rules directly."
        }
      ]
    },
    {
      section: "Comprehensible Input",
      items: [
        {
          question: "What is input?",
          answer: "Input is any language you hear or read. When you listen to someone speak or read a book, you're receiving input. Input is the fuel your brain uses to acquire language."
        },
        {
          question: "What is Comprehensible Input?",
          answer: "Comprehensible Input is language you can mostly understand — even if you don't know every word. It's simple, clear communication that's just slightly above your level. This kind of input helps your brain naturally absorb vocabulary, grammar, and pronunciation over time."
        }
      ]
    }
  ];

  // Get FAQ data from database or use fallback
  const getFaqData = () => {
    if (loading || !faqContent?.items) {
      return fallbackFaqData;
    }

    // Try to find FAQ sections in the content
    const faqSections = faqContent.items.filter(item => 
      item.section_key.startsWith('faq_section_')
    );

    if (faqSections.length === 0) {
      return fallbackFaqData;
    }

    // Transform database content to FAQ format
    return faqSections.map(section => {
      const sectionContent = getContentForLanguage(section);
      const sectionTitle = getContentForLanguage(section, 'title');
      
      try {
        const parsedContent = JSON.parse(sectionContent || '[]');
        return {
          section: sectionTitle || 'FAQ Section',
          items: Array.isArray(parsedContent) ? parsedContent : []
        };
      } catch (e) {
        console.warn('Failed to parse FAQ section content:', e);
        return {
          section: sectionTitle || 'FAQ Section',
          items: []
        };
      }
    }).filter(section => section.items.length > 0);
  };

  const faqData = getFaqData();

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
        
        {loading && (
          <div className="text-center mt-8 text-gray-500">
            Loading FAQ content...
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQ;