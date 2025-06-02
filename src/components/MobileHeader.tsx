
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const MobileHeader = ({ onMenuClick, title = "Marketing Agent" }: MobileHeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between lg:hidden sticky top-0 z-50">
      <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{title}</h1>
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="shrink-0">
        <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </header>
  );
};

export default MobileHeader;
