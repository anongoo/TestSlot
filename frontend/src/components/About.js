import React from 'react';

const About = () => {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Greg's Personal Language Learning Journey */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Greg's Personal Language Learning Journey</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Greg's journey with language learning started like many others — full of effort, repetition, and frustration. 
              He spent years memorizing vocabulary, drilling grammar rules, and trying to piece together conversations from 
              textbooks and apps. Despite all that effort, real communication always felt just out of reach.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              That changed when he discovered the method of <strong>Comprehensible Input</strong>.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              For the first time, language began to feel alive. Through real messages, authentic conversations, and content 
              he could actually understand, English and other languages opened up in a way they never had before. He wasn't 
              just learning words — he was learning <strong>culture</strong>, building <strong>connection</strong>, and 
              truly experiencing the language.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              This transformation sparked a mission: to build a space where learners all over the world could experience 
              that same breakthrough. That space became <strong>English Fiesta</strong> — a platform designed to help 
              people learn naturally, joyfully, and meaningfully.
            </p>
          </div>
        </div>

        {/* Our Mission */}
        <div className="mb-16 bg-blue-50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Mission</h2>
          <p className="text-xl text-gray-700 text-center leading-relaxed">
            English Fiesta is here to help you <strong>learn English the way your brain was designed to learn</strong> — 
            through real, meaningful input. No memorization. No pressure. Just <strong>natural understanding</strong>.
          </p>
        </div>

        {/* Why English Fiesta is Different */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Why English Fiesta is Different</h2>
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Traditional methods focus on tests, drills, and endless grammar rules. But research — and experience — 
              show that language is acquired through <strong>comprehension</strong>, not memorization.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              English Fiesta is built around the science of <strong>Comprehensible Input</strong>. That means:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🎥</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">You watch and understand real content</h4>
                  <p className="text-gray-600">Engaging videos that match your comprehension level</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🧠</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Your brain naturally picks up the language</h4>
                  <p className="text-gray-600">Subconscious acquisition through exposure</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">✨</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Learning happens without you even realizing it</h4>
                  <p className="text-gray-600">Effortless progress through enjoyable content</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Personalized to your level</h4>
                  <p className="text-gray-600">Content that's challenging but understandable</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
              <div className="text-3xl mb-3">🎥</div>
              <h4 className="font-semibold mb-2">Watch real, comprehensible videos</h4>
            </div>
            <div className="text-center bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
              <div className="text-3xl mb-3">⏱</div>
              <h4 className="font-semibold mb-2">Track your time</h4>
            </div>
            <div className="text-center bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
              <div className="text-3xl mb-3">🧠</div>
              <h4 className="font-semibold mb-2">Learn naturally</h4>
            </div>
            <div className="text-center bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
              <div className="text-3xl mb-3">🗣</div>
              <h4 className="font-semibold mb-2">Hear real accents</h4>
            </div>
            <div className="text-center bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl p-6">
              <div className="text-3xl mb-3">💬</div>
              <h4 className="font-semibold mb-2">Join the experience</h4>
            </div>
          </div>
        </div>

        {/* Our Vision */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
          <p className="text-lg leading-relaxed mb-6">
            We believe language learning should be <strong>joyful</strong>, <strong>personal</strong>, and <strong>real</strong>.
          </p>
          <p className="text-lg leading-relaxed mb-8">
            English Fiesta isn't just a tool — it's a movement to make English learning accessible and empowering for 
            people everywhere, no matter their background or starting level.
          </p>
          <p className="text-xl font-semibold">
            Join us — and start learning in a way that finally works.
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default About;