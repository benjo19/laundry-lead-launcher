
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { useLeadSearch } from '@/contexts/LeadSearchContext';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const MobileHeader = ({ onMenuClick, title }: MobileHeaderProps) => {
  const { t } = useLanguage();
  const { isSearching, searchLabel } = useLeadSearch();
  
  const displayTitle = title || t('marketing_agent');

  return (
    <header className="bg-gradient-primary border-b border-border/20 px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between lg:hidden sticky top-0 z-50 shadow-elegant backdrop-blur-md">
      <h1 className="text-base sm:text-lg font-bold text-primary-foreground truncate flex-1 min-w-0 mr-2">
        {displayTitle}
      </h1>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {isSearching && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary-foreground/15 border border-primary-foreground/25 text-primary-foreground text-xs"
            title={`Pretraga u tijeku: ${searchLabel}`}
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="hidden sm:inline">Tražim…</span>
          </div>
        )}
        <ThemeToggle />
        <LanguageToggle />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick} 
          className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 text-primary-foreground hover:bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg transition-all duration-200 touch-manipulation"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </header>
  );
};

export default MobileHeader;
