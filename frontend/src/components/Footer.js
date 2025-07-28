import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">English Fiesta</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              Learn English naturally through real videos and real conversations — no memorization, 
              just meaningful understanding.
            </p>
            
            {/* Email Signup */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📬 Stay on Track</h4>
              <p className="text-sm text-gray-300 mb-3">Get weekly updates and video tips!</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Use</a></li>
            </ul>
          </div>
          
          {/* Contact & Social */}
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="mailto:support@englishfiesta.com" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center">
                  <span className="mr-2">📺</span> YouTube
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center">
                  <span className="mr-2">📸</span> Instagram
                </a>
              </li>
            </ul>
            
            {/* Language Selector Placeholder */}
            <div className="mt-4">
              <h5 className="font-semibold text-sm mb-2">Language</h5>
              <select className="bg-gray-700 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="en">🇺🇸 English</option>
                <option value="es" disabled>🇪🇸 Español (Coming Soon)</option>
                <option value="pt" disabled>🇧🇷 Português (Coming Soon)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>© 2025 English Fiesta. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="mailto:support@englishfiesta.com" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;