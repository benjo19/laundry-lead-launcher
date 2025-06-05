
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'hr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  hr: {
    'marketing_agent': 'Marketing Agent',
    'ai_assistant': 'AI asistent za marketing',
    'dashboard': 'Dashboard',
    'lead_hunter': 'Lead Hunter',
    'lead_discovery': 'Lead Discovery',
    'email_generator': 'Email Generator',
    'crm_reminder': 'CRM Podsjetnici',
    'content_booster': 'Content Booster',
    'analytics': 'Analytics',
    'settings': 'Postavke',
    'logout': 'Odjava',
    'loading': 'Učitavanje...',
    'business_profile': 'Poslovni Profil',
    'ai_settings': 'AI Postavke',
    'email': 'Email',
    'social_networks': 'Društvene mreže',
    'manage_settings': 'Upravljajte vašim korisničkim postavkama i preferencijama',
    'back_to_dashboard': 'Povratak na Dashboard',
    'error_occurred': 'Dogodila se greška',
    'error_loading': 'Dogodila se greška prilikom učitavanja aplikacije.',
    'try_again': 'Pokušaj ponovo',
    'language': 'Jezik'
  },
  en: {
    'marketing_agent': 'Marketing Agent',
    'ai_assistant': 'AI marketing assistant',
    'dashboard': 'Dashboard',
    'lead_hunter': 'Lead Hunter',
    'lead_discovery': 'Lead Discovery',
    'email_generator': 'Email Generator',
    'crm_reminder': 'CRM Reminders',
    'content_booster': 'Content Booster',
    'analytics': 'Analytics',
    'settings': 'Settings',
    'logout': 'Logout',
    'loading': 'Loading...',
    'business_profile': 'Business Profile',
    'ai_settings': 'AI Settings',
    'email': 'Email',
    'social_networks': 'Social Networks',
    'manage_settings': 'Manage your user settings and preferences',
    'back_to_dashboard': 'Back to Dashboard',
    'error_occurred': 'An error occurred',
    'error_loading': 'An error occurred while loading the application.',
    'try_again': 'Try again',
    'language': 'Language'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'hr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
