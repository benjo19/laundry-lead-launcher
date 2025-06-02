
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import LeadHunter from '@/components/LeadHunter';
import LeadDiscovery from '@/components/LeadDiscovery';
import EmailGenerator from '@/components/EmailGenerator';
import CRMReminder from '@/components/CRMReminder';
import ContentBooster from '@/components/ContentBooster';
import Analytics from '@/components/Analytics';
import Settings from '@/components/Settings';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsMobile } from '@/hooks/use-mobile';
import { Lead } from '@/types';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [leads, setLeads] = useLocalStorage<Lead[]>('leads', []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // State for passing email data to EmailGenerator
  const [emailGeneratorData, setEmailGeneratorData] = useState<{
    email?: string;
    company?: string;
  }>({});

  const addLead = (newLeadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    const newLead: Lead = {
      ...newLeadData,
      id: Date.now(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setLeads([...leads, newLead]);
  };

  const handleNavigateToEmailGenerator = (email: string, company: string) => {
    setEmailGeneratorData({ email, company });
    setActiveModule('email-generator');
    if (isMobile) setSidebarOpen(false);
  };

  const handleNavigateToModule = (module: string) => {
    setActiveModule(module);
    if (isMobile) setSidebarOpen(false);
  };

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    if (isMobile) setSidebarOpen(false);
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigateToModule={handleNavigateToModule} />;
      case 'lead-hunter':
        return <LeadHunter onNavigateToEmailGenerator={handleNavigateToEmailGenerator} />;
      case 'lead-discovery':
        return <LeadDiscovery onAddLead={addLead} onNavigateToEmailGenerator={handleNavigateToEmailGenerator} />;
      case 'email-generator':
        return (
          <EmailGenerator 
            preSelectedEmail={emailGeneratorData.email}
            preSelectedCompany={emailGeneratorData.company}
          />
        );
      case 'crm-reminder':
        return <CRMReminder />;
      case 'content-booster':
        return <ContentBooster />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigateToModule={handleNavigateToModule} />;
    }
  };

  if (isMobile) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <div className="flex-1 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between lg:hidden">
              <h1 className="text-xl font-semibold text-gray-900">Marketing Agent</h1>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
            </header>
            <main className="flex-1 overflow-auto p-4">
              {renderActiveModule()}
            </main>
          </div>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="flex-1 overflow-auto">
        {renderActiveModule()}
      </main>
    </div>
  );
};

export default Index;
