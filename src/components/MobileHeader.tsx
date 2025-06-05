
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
    <header className="bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between lg:hidden sticky top-0 z-50">
      <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate flex-1 min-w-0 mr-2">
        {displayTitle}
      </h1>
      <div className="flex items-center gap-2 shrink-0">
        <LanguageToggle />
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </header>
  );
};

export default MobileHeader;
