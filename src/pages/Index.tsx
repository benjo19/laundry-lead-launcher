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
import MobileHeader from '@/components/MobileHeader';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lead } from '@/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const Index = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [leads, setLeads] = useLocalStorage<Lead[]>('leads', []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  // State for passing email data to EmailGenerator
  const [emailGeneratorData, setEmailGeneratorData] = useState<{
    email?: string;
    company?: string;
  }>({});

  const addLead = async (newLeadData: Omit<Lead, 'id' | 'dateAdded'>): Promise<boolean> => {
    try {
      const newLead: Lead = {
        ...newLeadData,
        id: Date.now(),
        dateAdded: new Date().toISOString().split('T')[0]
      };
      setLeads([...leads, newLead]);
      return true;
    } catch (error) {
      console.error('Error adding lead:', error);
      return false;
    }
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

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard': return t('dashboard');
      case 'lead-hunter': return t('lead_hunter');
      case 'lead-discovery': return t('lead_discovery');
      case 'email-generator': return t('email_generator');
      case 'crm-reminder': return t('crm_reminder');
      case 'content-booster': return t('content_booster');
      case 'analytics': return t('analytics');
      case 'settings': return t('settings');
      default: return t('marketing_agent');
    }
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
      <div className="flex min-h-screen bg-gray-50 w-full">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <div className="flex-1 flex flex-col min-w-0">
            <MobileHeader 
              onMenuClick={() => setSidebarOpen(true)}
              title={getModuleTitle()}
            />
            <main className="flex-1 overflow-auto p-3 sm:p-4">
              {renderActiveModule()}
            </main>
          </div>
          <SheetContent side="left" className="w-64 sm:w-72 p-0">
            <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 w-full">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="flex-1 overflow-auto min-w-0">
        {renderActiveModule()}
      </main>
    </div>
  );
};

export default Index;
