import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.div 
      className="bg-white shadow-lg border-b-2 border-fiesta-yellow"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <a href="/" className="flex items-center gap-3">
              <img 
                src="/english-fiesta-logo-hq.png" 
                alt="English Fiesta Logo" 
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-fiesta-pink to-fiesta-purple bg-clip-text text-transparent font-baloo">
                English Fiesta
              </h1>
            </a>
          </motion.div>
          
          {/* Navigation */}
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <motion.a 
                href="/" 
                className="text-gray-600 hover:text-fiesta-pink transition-colors font-medium"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Home
              </motion.a>
              <motion.a 
                href="/about" 
                className="text-gray-600 hover:text-fiesta-blue transition-colors font-medium"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                About
              </motion.a>
              <motion.a 
                href="/faq" 
                className="text-gray-600 hover:text-fiesta-purple transition-colors font-medium"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                FAQ
              </motion.a>
              <motion.a 
                href="/book" 
                className="flex items-center justify-center text-gray-600 hover:text-fiesta-orange transition-colors font-medium px-2 py-1 rounded-lg"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="flex items-center gap-1">
                  <span>🎯</span>
                  <span>Join a Class</span>
                </span>
              </motion.a>
            </nav>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
            
            {/* Donate Button */}
            <motion.a
              href="https://buymeacoffee.com/englishfiesta"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block bg-gradient-to-r from-fiesta-pink to-pink-500 text-white px-3 py-2 rounded-full font-semibold text-xs md:text-sm shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(236, 72, 153, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              💖 Help English Fiesta Grow
            </motion.a>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <motion.div 
                  className="text-right"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="font-semibold text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user.role === 'admin' && '👑 '}
                    {user.role === 'instructor' && '🎓 '}
                    {user.role === 'student' && '📚 '}
                    {user.role}
                  </div>
                </motion.div>
                {user.picture && (
                  <motion.img 
                    src={user.picture} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-fiesta-yellow shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}
                <motion.button
                  onClick={logout}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm transition-all duration-200 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={login}
                className="bg-gradient-to-r from-fiesta-blue to-blue-500 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(56, 189, 248, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                Login / Sign Up
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden bg-white border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-4 space-y-3">
                <motion.a 
                  href="/"
                  className="block text-gray-600 hover:text-fiesta-pink transition-colors font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  whileHover={{ x: 5 }}
                >
                  Home
                </motion.a>
                <motion.a 
                  href="/about"
                  className="block text-gray-600 hover:text-fiesta-blue transition-colors font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  whileHover={{ x: 5 }}
                >
                  About
                </motion.a>
                <motion.a 
                  href="/faq"
                  className="block text-gray-600 hover:text-fiesta-purple transition-colors font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  whileHover={{ x: 5 }}
                >
                  FAQ
                </motion.a>
                <motion.a 
                  href="/book"
                  className="block text-gray-600 hover:text-fiesta-orange transition-colors font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  whileHover={{ x: 5 }}
                >
                  🎯 Join a Class
                </motion.a>
                
                {/* Mobile Donate Button */}
                <motion.a
                  href="https://buymeacoffee.com/englishfiesta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block sm:hidden bg-gradient-to-r from-fiesta-pink to-pink-500 text-white px-4 py-3 rounded-lg font-semibold text-sm text-center shadow-lg mt-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💖 Help English Fiesta Grow
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Header;