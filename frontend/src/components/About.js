import React from 'react';
import { useTranslation } from 'react-i18next';
import { useContent } from '../hooks/useContent';

const About = () => {
  const { i18n } = useTranslation();
  const { content: aboutContent, loading, getContentForLanguage } = useContent('about_page');

  // Fallback content structure for when database content is not available
  const fallbackContent = {
    journey: {
      title: "Greg's Personal Language Learning Journey",
      paragraphs: [
        "Greg's journey with language learning started like many others — full of effort, repetition, and frustration. He spent years memorizing vocabulary, drilling grammar rules, and trying to piece together conversations from textbooks and apps. Despite all that effort, real communication always felt just out of reach.",
        "That changed when he discovered the method of Comprehensible Input.",
        "For the first time, language began to feel alive. Through real messages, authentic conversations, and content he could actually understand, English and other languages opened up in a way they never had before. He wasn't just learning words — he was learning culture, building connection, and truly experiencing the language.",
        "This transformation sparked a mission: to build a space where learners all over the world could experience that same breakthrough. That space became English Fiesta — a platform designed to help people learn naturally, joyfully, and meaningfully."
      ]
    },
    mission: {
      title: "Our Mission",
      content: "English Fiesta is here to help you learn English the way your brain was designed to learn — through real, meaningful input. No memorization. No pressure. Just natural understanding."
    }
  };

  // Get content from database or use fallback
  const getAboutContent = (sectionKey, field = 'content') => {
    if (loading || !aboutContent?.items) {
      return null;
    }
    
    const item = aboutContent.items.find(item => item.section_key === sectionKey);
    return item ? getContentForLanguage(item, field) : null;
  };

  const journeyTitle = getAboutContent('journey_title', 'title') || fallbackContent.journey.title;
  const journeyContent = getAboutContent('journey_content');
  const missionTitle = getAboutContent('mission_title', 'title') || fallbackContent.mission.title;
  const missionContent = getAboutContent('mission_content') || fallbackContent.mission.content;

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Greg's Personal Language Learning Journey */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            {journeyTitle}
          </h2>
          <div className="prose prose-lg max-w-none">
            {journeyContent ? (
              <div dangerouslySetInnerHTML={{ __html: journeyContent }} />
            ) : (
              fallbackContent.journey.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-lg text-gray-700 leading-relaxed mb-6">
                  {paragraph.includes('Comprehensible Input') ? (
                    <>
                      {paragraph.split('Comprehensible Input')[0]}
                      <strong>Comprehensible Input</strong>
                      {paragraph.split('Comprehensible Input')[1]}
                    </>
                  ) : paragraph.includes('culture') && paragraph.includes('connection') ? (
                    <>
                      {paragraph.split('culture')[0]}
                      <strong>culture</strong>
                      {paragraph.split('culture')[1].split('connection')[0]}
                      <strong>connection</strong>
                      {paragraph.split('connection')[1]}
                    </>
                  ) : paragraph.includes('English Fiesta') ? (
                    <>
                      {paragraph.split('English Fiesta')[0]}
                      <strong>English Fiesta</strong>
                      {paragraph.split('English Fiesta')[1]}
                    </>
                  ) : (
                    paragraph
                  )}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Our Mission */}
        <div className="mb-16 bg-blue-50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            {missionTitle}
          </h2>
          <div className="text-xl text-gray-700 text-center leading-relaxed">
            {missionContent ? (
              <div dangerouslySetInnerHTML={{ __html: missionContent }} />
            ) : (
              <p>
                {fallbackContent.mission.content.includes('natural understanding') ? (
                  <>
                    {fallbackContent.mission.content.split('natural understanding')[0]}
                    <strong>natural understanding</strong>
                    {fallbackContent.mission.content.split('natural understanding')[1]}
                  </>
                ) : (
                  fallbackContent.mission.content
                )}
              </p>
            )}
          </div>
        </div>

        {/* How It Works - Static for now */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: "🎥", text: "Watch real, comprehensible videos" },
              { icon: "⏱", text: "Track your time" },
              { icon: "🧠", text: "Learn naturally" },
              { icon: "🗣", text: "Hear real accents" },
              { icon: "💬", text: "Join the experience" }
            ].map((step, index) => (
              <div key={index} className="text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                <div className="text-3xl mb-3">{step.icon}</div>
                <h4 className="font-semibold mb-2">{step.text}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* Our Vision - Static for now */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
          <p className="text-lg leading-relaxed mb-6">
            We believe language learning should be <strong>joyful</strong>, <strong>personal</strong>, and <strong>real</strong>.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            English Fiesta isn't just a tool — it's a movement to make English learning accessible and empowering for people everywhere, no matter their background or starting level.
          </p>
          <p className="text-lg leading-relaxed">
            Join us — and start learning in a way that finally works.
          </p>
        </div>
        
        {loading && (
          <div className="text-center mt-8 text-gray-500">
            Loading content...
          </div>
        )}
        
      </div>
    </div>
  );
};

export default About;