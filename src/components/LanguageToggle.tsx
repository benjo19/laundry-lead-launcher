
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
      className="flex items-center gap-2 text-slate-700 hover:bg-slate-100"
      title={t('language')}
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">{language.toUpperCase()}</span>
    </Button>
  );
};

export default LanguageToggle;
