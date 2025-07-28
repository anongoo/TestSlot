import React from 'react';
import { useTranslation } from 'react-i18next';
import { aboutContent } from '../i18n/content';

const About = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const content = aboutContent[currentLang] || aboutContent.en;

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Greg's Personal Language Learning Journey */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            {content.journey.title}
          </h2>
          <div className="prose prose-lg max-w-none">
            {content.journey.paragraphs.map((paragraph, index) => (
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
            ))}
          </div>
        </div>

        {/* Our Mission */}
        <div className="mb-16 bg-blue-50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            {content.mission.title}
          </h2>
          <p className="text-xl text-gray-700 text-center leading-relaxed">
            {content.mission.content.includes('natural understanding') ? (
              <>
                {content.mission.content.split('natural understanding')[0]}
                <strong>natural understanding</strong>
                {content.mission.content.split('natural understanding')[1]}
              </>
            ) : (
              content.mission.content
            )}
          </p>
        </div>

        {/* Why English Fiesta is Different */}
        {content.different && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              {content.different.title}
            </h2>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8">
              {content.different.intro.map((paragraph, index) => (
                <p key={index} className="text-lg text-gray-700 leading-relaxed mb-6">
                  {paragraph.includes('Comprehensible Input') ? (
                    <>
                      {paragraph.split('Comprehensible Input')[0]}
                      <strong>Comprehensible Input</strong>
                      {paragraph.split('Comprehensible Input')[1]}
                    </>
                  ) : (
                    paragraph
                  )}
                </p>
              ))}
              
              {content.different.points && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {content.different.points.map((point, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="text-2xl">{point.icon}</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1">{point.title}</h4>
                        <p className="text-gray-600">{point.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* How It Works */}
        {content.howItWorks && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              {content.howItWorks.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {content.howItWorks.steps.map((step, index) => (
                <div key={index} className="text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <h4 className="font-semibold mb-2">{step.text}</h4>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Our Vision */}
        {content.vision && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-6">{content.vision.title}</h2>
            {content.vision.content.map((paragraph, index) => (
              <p key={index} className="text-lg leading-relaxed mb-6">
                {paragraph.includes('joyful') && paragraph.includes('personal') && paragraph.includes('real') ? (
                  <>
                    {paragraph.split('joyful')[0]}
                    <strong>joyful</strong>
                    {paragraph.split('joyful')[1].split('personal')[0]}
                    <strong>personal</strong>
                    {paragraph.split('personal')[1].split('real')[0]}
                    <strong>real</strong>
                    {paragraph.split('real')[1]}
                  </>
                ) : (
                  paragraph
                )}
              </p>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default About;