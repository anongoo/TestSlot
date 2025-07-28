import React, { useState } from 'react';

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
  const [openItem, setOpenItem] = useState(null);

  const handleToggle = (index) => {
    setOpenItem(openItem === index ? null : index);
  };

  const faqData = [
    // Section 1: English Fiesta Basics
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
        },
        {
          question: "Who is this for?",
          answer: "For English learners of all levels, especially beginners. No matter your background, if you want to understand and speak English better, this is for you."
        },
        {
          question: "Is it free?",
          answer: "Yes, many videos are free. Some advanced content may be part of a premium plan."
        }
      ]
    },
    // Section 2: Comprehensible Input
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
        },
        {
          question: "Do grammar study, exercises, or flashcards count as input?",
          answer: "Not really. While those tools can support your learning, they don't count as input. Comprehensible Input works best when you're focused on meaning — not memorization. That's why our videos are designed to help you understand the story or message first, and let the language come naturally."
        },
        {
          question: "Do I have to memorize vocabulary or grammar?",
          answer: "Nope! You'll learn grammar and words by hearing and seeing them used naturally."
        },
        {
          question: "Will this help me speak English?",
          answer: "Yes. As you understand more, your speaking improves — naturally and without pressure."
        }
      ]
    },
    // Section 3: How to Watch
    {
      section: "How to Watch",
      items: [
        {
          question: "What should I focus on or do when watching the videos?",
          answer: "Relax and enjoy the story or message. Don't worry about understanding every single word. Try to focus on the overall meaning — your brain will gradually pick up the details over time."
        },
        {
          question: "How much time should I spend getting input every day?",
          answer: "Even 10–15 minutes a day can make a difference, but the more you listen, the better. Set a goal you can stick to consistently — 30 to 60 minutes daily is ideal for faster progress."
        },
        {
          question: "Should I use subtitles?",
          answer: "We suggest trying to watch videos without subtitles whenever possible. If you find yourself relying on subtitles to follow along, that means the content is currently beyond your listening level. In that case, it's better to choose an easier video instead.\n\nIn real life, people don't speak with subtitles! Reading subtitles can take your focus away from the important task of training your brain to recognize and understand the natural sounds of English. Building that mental connection to spoken language is key for long-term listening success."
        },
        {
          question: "Which level of videos is good for me?",
          answer: "Choose videos where you understand at least 70–80% of what's being said. If it's too hard, try an easier level. If it's too easy, move up! Our platform helps you filter by level, topic, and accent so you can find the right fit."
        },
        {
          question: "What kind of videos are on English Fiesta?",
          answer: "Fun, real-life videos — interviews, skits, travel scenes, classroom moments, and more. Always designed to be understandable and beginner-friendly."
        },
        {
          question: "How do I know what level to choose?",
          answer: "Start with \"New Beginner\" if you're just starting out. Move up as you understand more."
        }
      ]
    }
  ];

  let itemIndex = 0;

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h1>
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
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;