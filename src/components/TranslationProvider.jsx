import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const TranslationContext = createContext();

const languageNames = {
  'en': 'English',
  'th': 'ไทย (Thai)',
  'de': 'Deutsch',
  'fr': 'Français',
  'ja': '日本語',
  'de-ch': 'Schweizerdeutsch',
  'it': 'Italiano',
  'nl': 'Nederlands',
  'sv': 'Svenska',
  'zh': '中文',
  'hi': 'हिन्दी',
  'ru': 'Русский',
  'ko': '한국어',
  'da': 'Dansk',
  'no': 'Norsk',
  'fi': 'Suomi',
  'ms': 'Bahasa Melayu',
  'tl': 'Filipino',
  'es': 'Español',
  'pt': 'Português',
  'he': 'עברית',
  'cs': 'Čeština',
  'pl': 'Polski',
  'hu': 'Magyar',
  'el': 'Ελληνικά',
  'ro': 'Română',
  'uk': 'Українська',
  'af': 'Afrikaans',
  'my': 'မြန်မာဘာသာ',
  'lo': 'ລາວ',
  'km': 'ខ្មែរ',
  'vi': 'Tiếng Việt',
};

export function TranslationProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    // Initialize language from localStorage on mount (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage?.getItem?.('preferred_language');
        if (saved && saved !== 'en') {
          setCurrentLanguage(saved);
        }
      } catch {
        // localStorage may not be available, fail silently
      }
    }
  }, []);

  // Load translations for current language - DISABLED for English
    // Only run on client (base44 is not available during SSR)
    const isClient = typeof window !== 'undefined';
    const { data: translations = [] } = useQuery({
    queryKey: ['translations', currentLanguage],
    queryFn: async () => {
      if (currentLanguage === 'en') return [];
      return base44.entities.Translation.filter({ target_language: currentLanguage });
    },
      enabled: isClient && currentLanguage !== 'en',
    staleTime: 1000 * 60 * 60 * 24,
  });

  const changeLanguage = async (langCode) => {
    setCurrentLanguage(langCode);
    try {
      localStorage?.setItem?.('preferred_language', langCode);
    } catch {
      // localStorage may not be available
    }
    try {
      await base44.auth.updateMe({ preferred_language: langCode });
    } catch {
      // Not logged in, using local storage only
    }
  };

  // Get translated content for a specific page section
  const getTranslation = (pageName, sectionContext, englishContent) => {
    // CRITICAL: Always return English content directly for English language
    if (currentLanguage === 'en') {
      return englishContent;
    }

    const translation = translations.find(
      t => t.page_name === pageName && t.section_context === sectionContext
    );

    if (translation?.translated_content) {
      return translation.translated_content;
    }

    // Translation missing - return English as fallback
    // User should manually translate from Admin panel
    return englishContent;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    getTranslation,
    languageNames,
    availableLanguages: Object.keys(languageNames),
    pendingTranslations: 0 // Disabled auto-translation
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}