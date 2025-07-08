
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LanguageToggle = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
      <SelectTrigger className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 w-auto h-auto shadow-sm">
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">
          {currentLanguage?.flag} {currentLanguage?.code.toUpperCase()}
        </span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </SelectTrigger>
      <SelectContent className="min-w-48 border-2 shadow-elegant">
        {languages.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code}
            className="cursor-pointer hover:bg-accent focus:bg-accent"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageToggle;
