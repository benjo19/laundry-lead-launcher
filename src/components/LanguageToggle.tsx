
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'hr' ? 'en' : 'hr');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 text-white hover:bg-white/20 border border-white/30 backdrop-blur-sm px-3 py-1 rounded-full transition-all duration-200 hover:scale-105"
      title={t('language')}
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-bold tracking-wider">{language.toUpperCase()}</span>
    </Button>
  );
};

export default LanguageToggle;
