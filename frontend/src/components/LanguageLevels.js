import React, { useState } from 'react';

const LanguageLevels = () => {
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);

  const levels = [
    {
      level: 1,
      title: "Starting from zero",
      hours: 0,
      words: 0,
      videoType: "New Beginner",
      color: "from-red-100 to-red-200",
      borderColor: "border-red-300",
      titleColor: "text-red-600",
      whatYouCanDo: "The sounds of the language sound weird to your ears. You can't tell many of those sounds apart from each other. When hearing the language, it's hard for you to know when one word ends and when the next one begins.",
      whatYouNeedToDo: "Listen A LOT. The listening needs to be very comprehensible. The best materials are classes or videos where the teachers speak in the language, but make it easy to understand by using a lot of drawings, pictures, and gestures.",
      whatYouAreLearning: "You mostly learn individual nouns for concrete things: car, nose, elephant. Action verbs: walk, eat, sing. Adjectives for simple emotions and sensations: happy, scared, cold.",
      fullDescription: {
        whatYouCanDo: "The sounds of the language sound weird to your ears. You can't tell many of those sounds apart from each other. When hearing the language, it's hard for you to know when one word ends and when the next one begins. Even when you guess what a sentence means, many times you can't guess at the meaning of the different parts. You can't say any words and be confident that a native speaker would understand you.",
        whatYouNeedToDo: "Listen A LOT. The listening needs to be very comprehensible. The best materials are classes or videos where the teachers speak in the language, but make it easy to understand by using a lot of drawings, pictures, and gestures. Crosstalk is the most efficient activity that you can do, if you can find speakers of the language. Reading is not recommended until later on, especially if you care about having clear pronunciation. Practicing writing or speaking is not recommended yet.",
        whatYouAreLearning: "You mostly learn individual nouns for concrete things: car, nose, elephant. Action verbs: walk, eat, sing. Adjectives for simple emotions and sensations: happy, scared, cold. Adjectives for physical properties: blue, tall, fat, beautiful. Interjections are the clearest words early on: Hey! Wow! Hi! You may learn the numbers early on, but this depends quite a lot on the kind of content you listen to."
      }
    },
    {
      level: 2,
      title: "You know some common words",
      hours: 50,
      words: 300,
      videoType: "Beginner",
      color: "from-orange-100 to-orange-200",
      borderColor: "border-orange-300",
      titleColor: "text-orange-600",
      whatYouCanDo: "You understand some common words, even if you are not 100% sure how to pronounce them. You can now guess the meaning of some 2-word sentences, like \"go home\", or \"eat cake\".",
      whatYouNeedToDo: "Listen A LOT. You are still best served with Crosstalk or classes or videos where the teacher(s) speak in a very comprehensible way. However, with a few words under your belt you are better prepared to make the most of that input.",
      whatYouAreLearning: "More verbs, since nouns help you understand them. Still mostly nouns and verbs for concrete things. Many expressions are learned as a chunk. You don't know what their parts mean yet.",
      fullDescription: {
        whatYouCanDo: "You understand some common words, even if you are not 100% sure how to pronounce them. You can now guess the meaning of some 2-word sentences, like \"go home\", or \"eat cake\". There are only a few words that you could produce yourself. For many words, you're still not sure what sounds they're made of.",
        whatYouNeedToDo: "Listen A LOT. You are still best served with Crosstalk or classes or videos where the teacher(s) speak in a very comprehensible way. However, with a few words under your belt you are better prepared to make the most of that input. Those words will help you understand the rest of the input you are listening to. Reading not recommended yet.",
        whatYouAreLearning: "More verbs, since nouns help you understand them. Still mostly nouns and verbs for concrete things. Many expressions are learned as a chunk. You don't know what their parts mean yet. Grammar for basic sentence order. Many common function words will remain unclear for a long time."
      }
    },
    {
      level: 3,
      title: "You can follow topics that are adapted for learners",
      hours: 150,
      words: 1500,
      videoType: "Intermediate",
      color: "from-yellow-100 to-yellow-200",
      borderColor: "border-yellow-300",
      titleColor: "text-yellow-700",
      whatYouCanDo: "You can now understand people if they stay within certain topics. They still need to talk to you in a way that's appropriate for you, but you know many words, and you don't rely exclusively on visual information.",
      whatYouNeedToDo: "Listen A LOT. Now you can listen to videos or classes in which the teacher doesn't use as much visual input, and may even be able to take advantage of really easy audios and podcasts that are catered to learners at your level.",
      whatYouAreLearning: "Because you are starting to get used to what the language sounds like, and what kinds of sound combinations to expect, you start learning words faster, without needing to hear them so many times.",
      fullDescription: {
        whatYouCanDo: "You can now understand people if they stay within certain topics. They still need to talk to you in a way that's appropriate for you, but you know many words, and you don't rely exclusively on visual information. You still aren't completely used to the sounds of the language. You have a good intuition for basic grammar, like sentence order. You can sometimes feel it when other learners make mistakes. It sounds wrong somehow. You can now say quite a few words and that will already be useful when traveling to the country.",
        whatYouNeedToDo: "Listen A LOT. Now you can listen to videos or classes in which the teacher doesn't use as much visual input, and may even be able to take advantage of really easy audios and podcasts that are catered to learners at your level. Crosstalk is still the best way to spend your time. At this level it becomes easier than before to do crosstalk over the internet using video call software, so you won't need to find native speakers where you live anymore. Reading is still not recommended if you care about your final achievement in pronunciation, but it starts becoming possible to understand lower level graded readers.",
        whatYouAreLearning: "Because you are starting to get used to what the language sounds like, and what kinds of sound combinations to expect, you start learning words faster, without needing to hear them so many times. You learn nouns faster and faster. Knowing a decent amount of nouns helps you also learn more adjectives. You start learning more abstract terms for feelings, appearance, and more abstract verbs: to need, to have to, to be good at, etc. You are now getting used to more complicated grammar faster."
      }
    },
    {
      level: 4,
      title: "You can understand a person speaking to you patiently",
      hours: 300,
      words: 3000,
      videoType: "Intermediate",
      color: "from-green-100 to-green-200",
      borderColor: "border-green-300",
      titleColor: "text-green-600",
      whatYouCanDo: "You're at the intermediate level! You can understand a patient native speaker. You still miss some words, but the speaker can explain their meaning to you without resorting to translation.",
      whatYouNeedToDo: "Listen A LOT. You can understand videos or classes in which the teacher doesn't use any visual cues, and can now benefit from listening extensively to audios and podcasts for learners everywhere you go, anytime you can.",
      whatYouAreLearning: "Surprisingly, in this phase you learn many common function words that are taught right at the beginning of most language courses. These words are used very frequently, but carry very little meaning.",
      fullDescription: {
        whatYouCanDo: "You're at the intermediate level! You can understand a patient native speaker. You still miss some words, but the speaker can explain their meaning to you without resorting to translation. You can understand a range of daily topics without visual support like drawings or pictures. The sounds of the language are becoming clearer now, and you are getting used to how the sounds are likely to be combined. That helps with retaining new words. If you tried speaking at a store, you could get your point across most of the time, but you still struggle producing even some basic words. Making friends in the language is now possible, but you need to find people who are quite patient, because not everybody will want to make that effort. Depending on your tolerance for getting negative reactions, you may want to wait a bit longer before speaking.",
        whatYouNeedToDo: "Listen A LOT. You can understand videos or classes in which the teacher doesn't use any visual cues, and can now benefit from listening extensively to audios and podcasts for learners everywhere you go, anytime you can. Crosstalk is still the best, most efficient way to improve. You can now make friends with whom you communicate only in the target language. While you will learn a lot when listening to people speak to you, speaking this early will invariably result in hard-to-fix non-native pronunciation, noticeably bad grammar, and poor word usage. If you really want to start having conversations with people it's recommended that you don't try to actively practice grammar or vocabulary, but rather speak in single words or simple sentences that come to mind easily. Reading is still not recommended if you care about your final achievement in pronunciation. By now you could understand slightly more difficult books, but still mostly just graded readers.",
        whatYouAreLearning: "Surprisingly, in this phase you learn many common function words that are taught right at the beginning of most language courses. These words are used very frequently, but carry very little meaning. For example: the verb \"to be\" (or equivalent), prepositions (in, at, on), conjunctions (therefore, so, and), and even some pronouns. Once you become aware of a new word, you'll encounter it everywhere. At this point you may start feeling that there are many more words that you don't know than words you do know. The exposure to less controlled speech allows you to notice many new words. Don't worry, you'll eventually also acquire those words the same way you acquired all the words you have learned until now. By this point you are full on acquiring all kinds of vocabulary, both concrete and abstract."
      }
    },
    {
      level: 5,
      title: "You can understand native speakers speaking to you normally",
      hours: 600,
      words: 5000,
      videoType: "Intermediate/Advanced",
      color: "from-blue-100 to-blue-200",
      borderColor: "border-blue-300",
      titleColor: "text-blue-600",
      whatYouCanDo: "You can understand people well when they speak directly to you. They won't need to adapt their speech for you. Understanding a conversation between native speakers is still hard.",
      whatYouNeedToDo: "Listen A LOT. You'll be able to understand more advanced materials for learners. Listen to audios and podcasts daily if you want to learn fast. Crosstalk is still as good as always.",
      whatYouAreLearning: "This level can feel frustratingly similar to the previous one. You will still feel that there are many more words that you don't know than words you do know. You'll now feel many more instances of finally understanding that word that you have been hearing since forever.",
      fullDescription: {
        whatYouCanDo: "You can understand people well when they speak directly to you. They won't need to adapt their speech for you. Understanding a conversation between native speakers is still hard. You'll almost understand TV programs in the language, because you understand so many of the words, but they are still hard enough to leave you frustrated or bored. Conversation can be tiresome, and if you try to speak you can feel a bit like a child, since it will be hard to express abstract concepts and complex thoughts. You understand most of the words used during daily conversation, but you still can't use many yourself. If you try to speak the language, it will feel like you are missing many important words. However, you can, often, already speak with the correct intonation patterns of the language, without knowing why, and even make a distinction between similar sounds in the language when you say them out loud.",
        whatYouNeedToDo: "Listen A LOT. You'll be able to understand more advanced materials for learners. Listen to audios and podcasts daily if you want to learn fast. Crosstalk is still as good as always. You may start feeling you are not getting much out of getting input about daily life topics. Try getting input about new topics. Easier TV programs and cartoons should be accessible too. The purists who want to get really close to a native speaker and get a really good accent may still want to hold off on speaking and reading for a little more, but if you do start speaking and reading it's not a big deal by this point. You'll still end up with better pronunciation and fluency than the vast majority of learners. If you want to start reading, by this point you'll be able to understand books targeted at children of lower grade levels, and you can skip over graded readers. If you start reading, try setting every gadget you own (PC, phone, Google and Facebook settings, etc.) to the target language, and following speakers of the language on social media.",
        whatYouAreLearning: "This level can feel frustratingly similar to the previous one. You will still feel that there are many more words that you don't know than words you do know. You'll now feel many more instances of finally understanding that word that you have been hearing since forever. It may feel like these words are infinite, but no! Continue doing what you are doing and you'll little by little fill in all the missing gaps. For some words, you'll even wonder why you hadn't learned such a basic word yet. Learning abstract words (democracy, absence, patience) will be your bread and butter, as will be learning more and more grammatical connectors. At this level you'll mostly finish up the grammar and the different sentence types. While still not being able to make the most complex sentences yourself, you'll become able to understand almost every type of sentence."
      }
    },
    {
      level: 6,
      title: "You are comfortable with daily conversation",
      hours: 1000,
      words: 7000,
      videoType: "Advanced",
      whatYouCanDo: "You can really have fun with the language at this point. You are conversationally fluent for daily purposes of living in the country and you can get by at the bank, at the hospital, at the post office, or looking for an apartment to rent.",
      whatYouNeedToDo: "Listen and read A LOT. It's also a good idea to get massive input in authentic media, be it TV, podcasts, radio, movies, etc. If you can't find a lot of easy media in the target language, you may find that videos and audios for learners are still more efficient for acquiring new vocabulary until you get a bit better.",
      whatYouAreLearning: "You may find the odd common word that you haven't learned yet, but by now your known vocabulary pretty much covers everything that you will usually want to say during everyday conversation. If you make friends and have real conversations, or watch certain TV shows, you will now be learning a lot of slang.",
      fullDescription: {
        whatYouCanDo: "You can really have fun with the language at this point. You are conversationally fluent for daily purposes of living in the country and you can get by at the bank, at the hospital, at the post office, or looking for an apartment to rent. In spite of that odd word that is not quite there when you need it, you can always manage to get your point across in one way or another, and by now you are already making complex longer phrases. At this level, for the first time, you start feeling like you are actually thinking about what you want to say, and not about how you want to say it, even though you may fall back on thinking about how you say things, especially in stressful situations or when feeling self-conscious. Using humor in the language is much easier now. You can understand TV shows about daily life quite well (80 to 90%). Shows about families, friends, etc. Unscripted shows will usually also be easier to understand than scripted shows, as long as they are not too chaotic or rely too much on cultural knowledge. Thrillers and other genres will still be hard.",
        whatYouNeedToDo: "Listen and read A LOT. It's also a good idea to get massive input in authentic media, be it TV, podcasts, radio, movies, etc. If you can't find a lot of easy media in the target language, you may find that videos and audios for learners are still more efficient for acquiring new vocabulary until you get a bit better. If your target language has many common words with a language you already know you may be able to understand quite well things like TED talks and university lectures. Lots of reading is also recommended if you want to be literate and if you care about reading. You'll still want to read books that are targeted at elementary school children, although maybe you don't need to stick to the lower grades. Nonfiction will often be much easier to understand than fiction. By this point, speaking and reading are completely unrestricted, and it's really encouraged to make friends in the language. If you live in the country, join as many social activities as you can. Live in a shared apartment, go to bars, join dance classes, a sports team, anything! Set your PC, phone, and all your online profiles to your target language. Make a list of daily things you do in your own language, and find alternatives to do them in your target language.",
        whatYouAreLearning: "You may find the odd common word that you haven't learned yet, but by now your known vocabulary pretty much covers everything that you will usually want to say during everyday conversation. If you make friends and have real conversations, or watch certain TV shows, you will now be learning a lot of slang. By now, your knowledge will cover most sentence structures and grammatical words, so you will rarely learn these anymore, unless they are specific to certain registers of the language. You will mostly learn specific vocabulary used in formal speech or in writing. Most words that you learn now will be words that are used in more formal registers of speech like in the news, words used in formal writing, literary writing, or technical terms used in the specific fields that you are interested in: politics, technology, science, or 13th century woodblock prints. If your language doesn't share a lot of its specialized vocabulary with your new language, you may still have to work on this for a long while."
      }
    },
    {
      level: 7,
      title: "You can use the language effectively for all practical purposes",
      hours: 1500,
      words: "12,000+",
      videoType: "Advanced",
      whatYouCanDo: "You can understand any general content effortlessly, including newspapers, novels, and all types of TV shows and movies. You might still struggle with technical texts in unfamiliar fields, heavy regional slang, and shows with intricate plots.",
      whatYouNeedToDo: "Listen and read A LOT. Add variety to what you read and listen to. By this point it's easy to find media in the target language that you understand very well, but it's also easy to get comfortable and not seek new challenges.",
      whatYouAreLearning: "You will continue learning slang, and learning about the culture, and that will allow you to understand more and more cultural references. You can explore other regional dialects of the language, ancient literary versions of the language, or vocabulary in other technical or scientific fields that you may want to learn about.",
      fullDescription: {
        whatYouCanDo: "You can understand any general content effortlessly, including newspapers, novels, and all types of TV shows and movies. You might still struggle with technical texts in unfamiliar fields, heavy regional slang, and shows with intricate plots. You speak fluently and effortlessly, without thinking about the language. While native speakers might still detect a slight accent, your clarity and fluidity make your speech easy to understand, and no one considers you a learner anymore. You may still make some mistakes, or miss a specific word here and there, but it doesn't hinder you from being an effective member of society.",
        whatYouNeedToDo: "Listen and read A LOT. Add variety to what you read and listen to. By this point it's easy to find media in the target language that you understand very well, but it's also easy to get comfortable and not seek new challenges. If you want to continue improving, simply do things that you have never done before. Try reading a book by a new author, try watching a show about a topic that you're unfamiliar with (about space, about the Middle Ages, about lawyers, etc). If you live in the country, try joining activities that are new to you: a sports team, an improv group, comedy nights, etc.",
        whatYouAreLearning: "You will continue learning slang, and learning about the culture, and that will allow you to understand more and more cultural references. You can explore other regional dialects of the language, ancient literary versions of the language, or vocabulary in other technical or scientific fields that you may want to learn about. You will still encounter new idioms and proverbs, but they will almost always be clear from the context. And of course, you can start learning your next language! 🚀"
      }
    }
  ];

  const handleCardClick = (level) => {
    setSelectedLevel(level);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLevel(null);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Language Level</h2>
        <div className="group relative">
          <svg className="w-5 h-5 text-gray-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute bottom-6 left-0 hidden group-hover:block bg-gray-800 text-white text-sm rounded-lg p-3 whitespace-nowrap z-10 shadow-lg">
            <div className="max-w-xs">
              Coming from a related language (e.g. French, Spanish)? The standard roadmap applies.<br />
              Coming from an unrelated language (e.g. Arabic or Korean)? Expect to take twice as long.
            </div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level) => (
          <div
            key={level.level}
            onClick={() => handleCardClick(level)}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-600">Level {level.level}</h3>
              <div className="text-sm text-gray-500">
                {level.hours}h • {typeof level.words === 'string' ? level.words : level.words.toLocaleString()} words
              </div>
            </div>
            
            <h4 className="font-semibold text-gray-800 mb-3">{level.title}</h4>
            
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium text-purple-600">Recommended:</span> {level.videoType}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <h5 className="font-semibold text-gray-700 mb-1">What you can do</h5>
                <p className="text-gray-600 line-clamp-2">{level.whatYouCanDo}</p>
              </div>
              
              <div>
                <h5 className="font-semibold text-gray-700 mb-1">What you need to do</h5>
                <p className="text-gray-600 line-clamp-2">{level.whatYouNeedToDo}</p>
              </div>
              
              <div>
                <h5 className="font-semibold text-gray-700 mb-1">What you're learning</h5>
                <p className="text-gray-600 line-clamp-2">{level.whatYouAreLearning}</p>
              </div>
            </div>

            <div className="mt-4 text-blue-600 text-sm font-medium">
              Click to read more →
            </div>
          </div>
        ))}
      </div>

      {/* Attribution and Download */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="mb-2">
          <em>Level system utilized with appreciation from <a href="https://www.dreamingspanish.com/method" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Dreaming Spanish</a></em>
        </p>
        <p>
          <a 
            href="https://customer-assets.emergentagent.com/job_dynacontent-hub/artifacts/sdn3qri0_Language_Learning_Roadmap_by_Dreaming_Spanish%20%281%29.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            📄 Download full roadmap
          </a>
        </p>
      </div>

      {/* Modal */}
      {showModal && selectedLevel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600 mb-2">Level {selectedLevel.level}</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{selectedLevel.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span><strong>Hours:</strong> {selectedLevel.hours}</span>
                    <span><strong>Words:</strong> {typeof selectedLevel.words === 'string' ? selectedLevel.words : selectedLevel.words.toLocaleString()}</span>
                    <span><strong>Videos:</strong> {selectedLevel.videoType}</span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">What you can do</h4>
                <p className="text-gray-700 leading-relaxed">{selectedLevel.fullDescription.whatYouCanDo}</p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">What you need to do</h4>
                <p className="text-gray-700 leading-relaxed">{selectedLevel.fullDescription.whatYouNeedToDo}</p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">What you're learning</h4>
                <p className="text-gray-700 leading-relaxed">{selectedLevel.fullDescription.whatYouAreLearning}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageLevels;