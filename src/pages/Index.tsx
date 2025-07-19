import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpChatbox } from '@/components/HelpChatbox';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import MobileHeader from '@/components/MobileHeader';

const Index = () => {
  console.log('Index: Component rendering - SUCCESS!');
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard': return t('dashboard');
      default: return t('marketing_agent');
    }
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigateToModule={setActiveModule} />;
      default:
        return <Dashboard onNavigateToModule={setActiveModule} />;
    }
  };

  if (isMobile) {
    return (
      <div className="flex min-h-screen bg-background w-full">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <div className="flex-1 flex flex-col min-w-0">
            <MobileHeader 
              onMenuClick={() => setSidebarOpen(true)}
              title={getModuleTitle()}
            />
            <main className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 bg-gradient-to-br from-background to-muted/20">
              <div className="animate-fade-in w-full max-w-full">
                {renderActiveModule()}
              </div>
            </main>
          </div>
          <SheetContent side="left" className="w-[280px] sm:w-80 p-0 border-r border-border/40">
            <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
          </SheetContent>
        </Sheet>
        <HelpChatbox />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="flex-1 overflow-auto min-w-0 bg-gradient-to-br from-background to-muted/30">
        <div className="animate-fade-in">
          {renderActiveModule()}
        </div>
      </main>
      <HelpChatbox />
    </div>
  );
};

export default Index;
