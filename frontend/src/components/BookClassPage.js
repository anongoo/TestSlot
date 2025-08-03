import React from 'react';
import { motion } from 'framer-motion';

const BookClassPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fiesta-blue via-white to-fiesta-purple py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="flex items-center justify-center gap-4 mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.img 
              src="/english-fiesta-logo-hq.png" 
              alt="English Fiesta Logo" 
              className="w-16 h-16 md:w-20 md:h-20"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-fiesta-pink via-fiesta-purple to-fiesta-blue bg-clip-text text-transparent font-baloo">
              Join a Class
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-700 font-poppins max-w-3xl mx-auto"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            with an English Fiesta Instructor
          </motion.p>
          
          {/* Floating emojis */}
          <div className="relative">
            <motion.div 
              className="absolute -top-10 -left-20 text-4xl opacity-60"
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🎓
            </motion.div>
            <motion.div 
              className="absolute -top-8 -right-16 text-3xl opacity-60"
              animate={{ 
                y: [0, 20, 0],
                rotate: [0, -15, 15, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            >
              💬
            </motion.div>
          </div>
        </motion.div>

        {/* Class Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Crosstalk (Spanish Speakers Only) */}
          <motion.div 
            className="bg-gradient-to-br from-fiesta-yellow via-yellow-200 to-yellow-300 rounded-2xl shadow-2xl p-8 border-4 border-yellow-400 relative overflow-hidden"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 25px 50px rgba(250, 204, 21, 0.4)"
            }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-20 rounded-full transform translate-x-8 -translate-y-8"></div>
            
            <motion.div 
              className="text-6xl mb-6 text-center"
              whileHover={{ 
                scale: 1.2,
                rotate: [0, -10, 10, 0]
              }}
              transition={{ duration: 0.3 }}
            >
              🧠
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center font-baloo">
              Crosstalk
            </h3>
            <p className="text-sm text-gray-700 mb-2 text-center font-poppins font-semibold">
              (Spanish Speakers Only)
            </p>
            
            <p className="text-gray-700 leading-relaxed mb-6 font-poppins text-center">
              You speak Spanish, instructor speaks English. Focused on listening and understanding — no pressure to speak.
            </p>
            
            <motion.a
              href="#crosstalk"
              className="block w-full bg-gradient-to-r from-fiesta-orange to-orange-500 text-white py-4 px-6 rounded-xl font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 font-poppins"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎯 Join a Class
            </motion.a>
          </motion.div>

          {/* English Conversation */}
          <motion.div 
            className="bg-gradient-to-br from-fiesta-blue via-blue-200 to-blue-300 rounded-2xl shadow-2xl p-8 border-4 border-blue-400 relative overflow-hidden"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 25px 50px rgba(56, 189, 248, 0.4)"
            }}
          >
            {/* Background decoration */}
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-20 rounded-full transform -translate-x-6 translate-y-6"></div>
            
            <motion.div 
              className="text-6xl mb-6 text-center"
              whileHover={{ 
                scale: 1.2,
                rotate: [0, 15, -15, 0]
              }}
              transition={{ duration: 0.3 }}
            >
              🗣️
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center font-baloo">
              English Conversation
            </h3>
            
            <p className="text-gray-700 leading-relaxed mb-6 font-poppins text-center">
              Fully in English. Practice fluency, vocabulary, and pronunciation.
            </p>
            
            <motion.a
              href="#conversation"
              className="block w-full bg-gradient-to-r from-fiesta-green to-green-500 text-white py-4 px-6 rounded-xl font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 font-poppins"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎯 Join a Class
            </motion.a>
          </motion.div>

          {/* 1-on-1 Comprehensible Input */}
          <motion.div 
            className="bg-gradient-to-br from-fiesta-purple via-purple-200 to-purple-300 rounded-2xl shadow-2xl p-8 border-4 border-purple-400 relative overflow-hidden"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 25px 50px rgba(168, 85, 247, 0.4)"
            }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full transform -translate-x-10 -translate-y-10"></div>
            
            <motion.div 
              className="text-6xl mb-6 text-center"
              whileHover={{ 
                scale: 1.2,
                rotate: [0, -15, 15, 0]
              }}
              transition={{ duration: 0.3 }}
            >
              🎬
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center font-baloo">
              1-on-1 Comprehensible Input
            </h3>
            
            <p className="text-gray-700 leading-relaxed mb-6 font-poppins text-center">
              Like English Fiesta videos — slow, level-matched English with visuals.
            </p>
            
            <motion.a
              href="#ci"
              className="block w-full bg-gradient-to-r from-fiesta-pink to-pink-500 text-white py-4 px-6 rounded-xl font-bold text-center shadow-lg hover:shadow-xl transition-all duration-300 font-poppins"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎯 Join a Class
            </motion.a>
          </motion.div>
        </div>

        {/* Coming Soon Card */}
        <motion.div 
          className="max-w-md mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.9 }}
        >
          <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl shadow-xl p-8 border-4 border-gray-500 relative overflow-hidden opacity-75">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gray-500 opacity-10"></div>
            
            <motion.div 
              className="text-6xl mb-6 text-center opacity-60"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🔒
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-700 mb-2 text-center font-baloo">
              Group Classes
            </h3>
            
            <motion.div 
              className="bg-fiesta-orange text-white px-4 py-2 rounded-full text-sm font-bold text-center mb-4 font-poppins"
              animate={{ 
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Coming Soon!
            </motion.div>
            
            <p className="text-gray-600 leading-relaxed text-center font-poppins">
              Interactive group learning experiences with fellow English learners.
            </p>
          </div>
        </motion.div>

        {/* Bottom decoration */}
        <motion.div 
          className="flex justify-center mt-16 space-x-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          {["🎓", "💬", "🌟", "🎯", "✨"].map((emoji, index) => (
            <motion.div
              key={index}
              className="text-5xl opacity-60"
              animate={{ 
                y: [0, -30, 0],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 4 + index * 0.5, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default BookClassPage;