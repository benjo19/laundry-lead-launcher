
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const MobileHeader = ({ onMenuClick, title }: MobileHeaderProps) => {
  const { t } = useLanguage();
  
  const displayTitle = title || t('marketing_agent');

  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 border-b border-blue-300 p-3 sm:p-4 flex items-center justify-between lg:hidden sticky top-0 z-50 shadow-lg">
      <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate flex-1 min-w-0 mr-2 drop-shadow-sm">
        {displayTitle}
      </h1>
      <div className="flex items-center gap-2 shrink-0">
        <LanguageToggle />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick} 
          className="shrink-0 h-8 w-8 sm:h-10 sm:w-10 text-white hover:bg-white/20 border border-white/30 backdrop-blur-sm"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </header>
  );
};

export default MobileHeader;
