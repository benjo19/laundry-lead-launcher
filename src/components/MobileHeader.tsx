
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
    <header className="bg-gradient-primary border-b border-border p-4 flex items-center justify-between lg:hidden sticky top-0 z-50 shadow-elegant backdrop-blur-md">
      <h1 className="text-lg font-bold text-primary-foreground truncate flex-1 min-w-0 mr-2">
        {displayTitle}
      </h1>
      <div className="flex items-center gap-3 shrink-0">
        <LanguageToggle />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick} 
          className="shrink-0 h-10 w-10 text-primary-foreground hover:bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default MobileHeader;
