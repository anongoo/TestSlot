import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      "loading": "Loading...",
      "login": "Login",
      "logout": "Logout",
      "signup": "Sign Up",
      "login_signup": "Login / Sign Up",
      "get_started": "Get Started",
      "browse_videos": "Browse Videos",
      "start_learning_free": "Start Learning Free",
      "ready_to_start": "Ready to Start Learning?",
      
      // Navigation
      "home": "Home",
      "about": "About",
      "faq": "FAQ",
      "watch": "Watch",
      "series": "Series",
      "my_list": "My List",
      "progress": "Progress",
      
      // Hero Section
      "hero_title": "Learn English the Natural Way",
      "hero_subtitle": "Real conversations. Real people. No textbooks.",
      "hero_value_prop_1": "Track your learning and build streaks",
      "hero_value_prop_2": "Learn through videos, not memorization", 
      "hero_value_prop_3": "Hear real accents from real people",
      "hero_value_prop_4": "Designed for beginners and beyond",
      "hero_value_prop_5": "Comprehensible Input Method: science-backed and effective",
      
      // Authentication
      "welcome_back": "Welcome back, {{name}}!",
      "not_logged_in": "Not logged in",
      "log_in_to_track": "Log in to track your progress!",
      "tracking_enabled": "Tracking enabled",
      "sign_in_required": "Please log in to access this content.",
      "insufficient_permissions": "Insufficient permissions.",
      
      // Video Player
      "tracking_status": "Tracking: {{minutes}}min",
      "not_tracking": "Not tracking",
      "want_to_track": "Want to track your progress?",
      "sign_up_to_track": "Sign up to save your watch time and unlock the Progress tab!",
      
      // Watch Page
      "english_fiesta_videos": "English Fiesta Videos",
      "learn_naturally": "Learn English naturally through comprehensible input",
      "track_learning_progress": "Track Your Learning Progress!",
      "create_account_benefits": "Create an account to track hours, save videos to My List, and unlock the Progress tab",
      
      // Video Levels
      "new_beginner": "New Beginner",
      "beginner": "Beginner", 
      "intermediate": "Intermediate",
      "advanced": "Advanced",
      
      // Video Categories
      "conversation": "Conversation",
      "grammar": "Grammar",
      "vocabulary": "Vocabulary",
      "pronunciation": "Pronunciation",
      "culture": "Culture",
      "business": "Business",
      "interview": "Interview",
      "travel": "Travel",
      "tutorial": "Tutorial",
      
      // Filters and Search
      "search_videos": "Search videos...",
      "all_levels": "All Levels",
      "all_categories": "All Categories",
      "all_accents": "All Accents",
      "newest_first": "Newest First",
      "most_popular": "Most Popular",
      "shortest_first": "Shortest First",
      "longest_first": "Longest First",
      
      // My List
      "saved_videos": "Saved Videos",
      "watch_history": "Watch History",
      "sign_in_to_access_mylist": "Sign in to access My List",
      "create_account_to_save": "Create an account to save videos for later and track your watch history across all your devices.",
      "no_saved_videos": "No saved videos yet",
      "no_watch_history": "No watch history yet",
      "videos_you_save": "Videos you save will appear here for easy access later.",
      "videos_you_watch": "Videos you watch will appear here with your progress.",
      "browse_videos_to_save": "Browse Videos to Save",
      "start_watching_videos": "Start Watching Videos",
      
      // Progress
      "learning_overview": "Learning Overview",
      "total_hours": "Total Hours",
      "day_streak": "Day Streak",
      "personal_best": "Personal Best",
      "videos_watched": "Videos Watched",
      "learning_activity": "Learning Activity",
      "learning_sources": "Learning Sources",
      "platform_videos": "Platform Videos",
      "manual_activities": "Manual Activities",
      "progress_by_level": "Progress by Level",
      "achievements": "Achievements",
      "sign_in_to_view_progress": "Sign in to view your Progress",
      
      // Email Subscription
      "stay_on_track": "Stay on Track — Get weekly updates and video tips!",
      "join_community": "Join our community of learners",
      "subscribe": "Subscribe",
      "email_placeholder": "Your email",
      "name_optional": "Your Name (Optional)",
      "email_address": "Your Email Address",
      "maybe_later": "Maybe Later",
      "subscribing": "Subscribing...",
      "stay_motivated": "Stay Motivated!",
      "get_learning_tips": "Get learning tips, progress updates, and new video notifications!",
      "never_spam": "We'll never spam you. Unsubscribe anytime with one click.",
      
      // Footer
      "footer_tagline": "Learn English naturally through real videos and real conversations — no memorization, just meaningful understanding.",
      "quick_links": "Quick Links",
      "contact_us": "Contact Us",
      "connect": "Connect",
      "language": "Language",
      "coming_soon": "Coming Soon",
      "copyright": "© 2025 English Fiesta. All rights reserved.",
      
      // Errors and Messages
      "no_videos_found": "No videos found",
      "adjust_search_criteria": "Try adjusting your search criteria.",
      "premium_content": "Premium Content",
      "login_for_access": "Login for Access",
      "premium_content_signup": "Premium content - Sign up to access",
      "create_account_premium": "Please create an account to access premium content!",
      
      // Admin
      "admin_dashboard": "Admin Dashboard",
      "user_management": "User Management",
      "video_management": "Video Management",
      "upload_videos": "Upload Videos",
      "add_youtube": "Add YouTube",
      "total_users": "Total Users",
      "students": "Students",
      "instructors": "Instructors",
      "admins": "Admins"
    }
  },
  es: {
    translation: {
      // Common
      "loading": "Cargando...",
      "login": "Iniciar Sesión",
      "logout": "Cerrar Sesión",
      "signup": "Registrarse",
      "login_signup": "Iniciar Sesión / Registrarse",
      "get_started": "Comenzar",
      "browse_videos": "Explorar Videos",
      "start_learning_free": "Comenzar a Aprender Gratis",
      "ready_to_start": "¿Listo para Comenzar a Aprender?",
      
      // Navigation
      "home": "Inicio",
      "about": "Acerca de",
      "faq": "Preguntas Frecuentes",
      "watch": "Ver",
      "series": "Series",
      "my_list": "Mi Lista",
      "progress": "Progreso",
      
      // Hero Section
      "hero_title": "Aprende Inglés de Forma Natural",
      "hero_subtitle": "Conversaciones reales. Personas reales. Sin libros de texto.",
      "hero_value_prop_1": "Rastrea tu aprendizaje y construye rachas",
      "hero_value_prop_2": "Aprende a través de videos, no memorización",
      "hero_value_prop_3": "Escucha acentos reales de personas reales",
      "hero_value_prop_4": "Diseñado para principiantes y más allá",
      "hero_value_prop_5": "Método de Input Comprensible: respaldado por la ciencia y efectivo",
      
      // Video Levels
      "new_beginner": "Principiante Nuevo",
      "beginner": "Principiante",
      "intermediate": "Intermedio", 
      "advanced": "Avanzado"
    }
  },
  pt: {
    translation: {
      // Common
      "loading": "Carregando...",
      "login": "Entrar",
      "logout": "Sair",
      "signup": "Cadastrar",
      "login_signup": "Entrar / Cadastrar",
      "get_started": "Começar",
      "browse_videos": "Explorar Vídeos",
      "start_learning_free": "Começar a Aprender Grátis",
      "ready_to_start": "Pronto para Começar a Aprender?",
      
      // Navigation
      "home": "Início",
      "about": "Sobre",
      "faq": "Perguntas Frequentes",
      "watch": "Assistir",
      "series": "Séries",
      "my_list": "Minha Lista",
      "progress": "Progresso",
      
      // Hero Section
      "hero_title": "Aprenda Inglês de Forma Natural",
      "hero_subtitle": "Conversas reais. Pessoas reais. Sem livros didáticos.",
      "hero_value_prop_1": "Acompanhe seu aprendizado e construa sequências",
      "hero_value_prop_2": "Aprenda através de vídeos, não memorização",
      "hero_value_prop_3": "Ouça sotaques reais de pessoas reais",
      "hero_value_prop_4": "Projetado para iniciantes e além",
      "hero_value_prop_5": "Método de Input Compreensível: baseado em ciência e eficaz",
      
      // Video Levels
      "new_beginner": "Iniciante Novo",
      "beginner": "Iniciante",
      "intermediate": "Intermediário",
      "advanced": "Avançado"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'english_fiesta_language',
      caches: ['localStorage']
    }
  });

export default i18n;