import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import "./App.css";

// i18n setup
import './i18n';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import EmailCaptureModal from './components/EmailCaptureModal';

// Pages
import HomePage from './pages/HomePage';
import WatchPage from './pages/WatchPage';
import NewWatchPage from './pages/NewWatchPage';
import About from './components/About';
import FAQ from './components/FAQ';
import JoinTeam from './components/JoinTeam';
import BookClassPage from './components/BookClassPage';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col font-poppins">
          <Header />
          
          <motion.main 
            className="flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              <Route path="/" element={
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <HomePage />
                </motion.div>
              } />
              <Route path="/watch" element={
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <WatchPage />
                </motion.div>
              } />
              <Route path="/about" element={
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <About />
                </motion.div>
              } />
              <Route path="/faq" element={
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <FAQ />
                </motion.div>
              } />
              <Route path="/join" element={
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <JoinTeam />
                </motion.div>
              } />
              <Route path="/book" element={
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <BookClassPage />
                </motion.div>
              } />
            </Routes>
          </motion.main>
          
          <Footer />
          
          {/* Email Capture Modal */}
          <EmailCaptureModal />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;