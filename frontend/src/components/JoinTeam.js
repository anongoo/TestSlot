import React from 'react';
import { motion } from 'framer-motion';

const JoinTeam = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fiesta-yellow via-white to-fiesta-orange py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-fiesta-pink via-fiesta-purple to-fiesta-blue bg-clip-text text-transparent font-baloo"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            🤝 Join the English Fiesta Team
          </motion.h1>
          
          {/* Floating emojis */}
          <div className="relative">
            <motion.div 
              className="absolute -top-10 -left-10 text-4xl opacity-60"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🎉
            </motion.div>
            <motion.div 
              className="absolute -top-8 -right-8 text-3xl opacity-60"
              animate={{ 
                y: [0, 15, 0],
                rotate: [0, -15, 15, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            >
              ✨
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Card */}
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-4 border-fiesta-yellow relative overflow-hidden"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-fiesta-pink to-fiesta-purple opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-fiesta-blue to-fiesta-green opacity-10 rounded-full transform -translate-x-6 translate-y-6"></div>

          {/* Content */}
          <motion.div 
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            
            {/* Blurb */}
            <motion.p 
              className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 font-poppins"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              We're looking for creative, passionate collaborators who believe in <span className="font-bold text-fiesta-purple">Comprehensible Input</span> and our mission to make language learning joyful and accessible.
            </motion.p>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-700 leading-relaxed mb-12 font-poppins"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Whether you're an <span className="font-bold text-fiesta-green">instructor</span>, <span className="font-bold text-fiesta-blue">designer</span>, <span className="font-bold text-fiesta-purple">developer</span>, <span className="font-bold text-fiesta-pink">translator</span>, or <span className="font-bold text-fiesta-orange">supporter</span>—we'd love to hear from you!
            </motion.p>

            {/* Role Icons */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              {[
                { emoji: "🎓", role: "Instructor", color: "from-fiesta-green to-green-400" },
                { emoji: "🎨", role: "Designer", color: "from-fiesta-blue to-blue-400" },
                { emoji: "💻", role: "Developer", color: "from-fiesta-purple to-purple-400" },
                { emoji: "🌍", role: "Translator", color: "from-fiesta-pink to-pink-400" },
                { emoji: "🤝", role: "Supporter", color: "from-fiesta-orange to-orange-400" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className={`bg-gradient-to-br ${item.color} rounded-xl p-4 text-center text-white shadow-lg`}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: [0, -5, 5, 0],
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                  }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <div className="font-semibold text-sm font-poppins">{item.role}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Contact Section */}
            <motion.div 
              className="text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 font-baloo">Ready to Join the Fiesta?</h2>
              
              <motion.a
                href="mailto:englishfiestateam@gmail.com"
                className="inline-flex items-center bg-gradient-to-r from-fiesta-pink to-fiesta-purple text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl transition-all duration-300"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(236, 72, 153, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-3 text-2xl">📧</span>
                <span className="font-poppins">englishfiestateam@gmail.com</span>
              </motion.a>

              <motion.p 
                className="text-gray-600 mt-6 font-poppins"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
              >
                Tell us about yourself and how you'd like to contribute to the English Fiesta community!
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom decoration */}
        <motion.div 
          className="flex justify-center mt-12 space-x-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          {["🎉", "🌟", "💫", "🎊", "✨"].map((emoji, index) => (
            <motion.div
              key={index}
              className="text-4xl"
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 3 + index * 0.5, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2
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

export default JoinTeam;