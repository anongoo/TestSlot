import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useContent = (contentType, sectionKey = null) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        let url = `${process.env.REACT_APP_BACKEND_URL}/api/content`;
        
        if (contentType && sectionKey) {
          url += `/${contentType}/${sectionKey}`;
        } else if (contentType) {
          url += `/${contentType}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setContent(data);
        } else {
          throw new Error(`Failed to fetch content: ${response.status}`);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentType, sectionKey]);

  // Helper function to get content for current language
  const getContentForLanguage = (item, field = 'content') => {
    if (!item || !item.languages) return '';
    
    const currentLang = i18n.language || 'en';
    const langContent = item.languages[currentLang] || item.languages.en || {};
    
    return langContent[field] || '';
  };

  // Helper function to get title for current language
  const getTitleForLanguage = (item) => {
    return getContentForLanguage(item, 'title');
  };

  return {
    content,
    loading,
    error,
    getContentForLanguage,
    getTitleForLanguage
  };
};

// Hook specifically for getting all content organized by type and section
export const useAllContent = () => {
  const [allContent, setAllContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    const fetchAllContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/content`);
        if (response.ok) {
          const data = await response.json();
          setAllContent(data);
        } else {
          throw new Error(`Failed to fetch content: ${response.status}`);
        }
      } catch (err) {
        console.error('Error fetching all content:', err);
        setError(err);
        // Fall back to empty content structure
        setAllContent({});
      } finally {
        setLoading(false);
      }
    };

    fetchAllContent();
  }, []);

  // Helper function to get content by path (e.g., 'hero_section.hero_title')
  const getContent = (path, field = 'content') => {
    const [contentType, sectionKey] = path.split('.');
    const currentLang = i18n.language || 'en';
    
    try {
      const item = allContent[contentType]?.[sectionKey];
      if (!item || !item.languages) return '';
      
      const langContent = item.languages[currentLang] || item.languages.en || {};
      return langContent[field] || '';
    } catch (err) {
      console.warn(`Failed to get content for ${path}:`, err);
      return '';
    }
  };

  // Helper function to get title by path
  const getTitle = (path) => {
    return getContent(path, 'title');
  };

  return {
    allContent,
    loading,
    error,
    getContent,
    getTitle
  };
};