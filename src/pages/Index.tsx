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
import KnowledgeBase from '@/components/KnowledgeBase';
import AIKnowledgeChat from '@/components/AIKnowledgeChat';
import { EmailScrapingTest } from '@/components/EmailScrapingTest';
import MobileHeader from '@/components/MobileHeader';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpChatbox } from '@/components/HelpChatbox';
import { Lead } from '@/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';

const Index = () => {
  console.log('Index: Component starting to render');
  const [activeModule, setActiveModule] = useState('dashboard');
  console.log('Index: Active module state set:', activeModule);
  const { addLead } = useLeadManagement();
  console.log('Index: useLeadManagement hook called');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  console.log('Index: isMobile:', isMobile);
  const { t } = useLanguage();
  console.log('Index: useLanguage hook called');
  
  // State for passing email data to EmailGenerator
  const [emailGeneratorData, setEmailGeneratorData] = useState<{
    email?: string;
    company?: string;
  }>({});


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
      case 'knowledge-base': return 'Knowledge Base';
      case 'email-scraping-test': return 'Email Scraping Test';
      case 'ai-chat': return 'AI Asistent';
      case 'email-generator': return t('email_generator');
      case 'crm-reminder': return 'CRM Datoteke';
      case 'content-booster': return t('content_booster');
      case 'analytics': return t('analytics');
      case 'settings': return t('settings');
      case 'subscription': return 'Subscription';
      default: return t('marketing_agent');
    }
  };

  const renderActiveModule = () => {
    try {
      console.log('Index: Rendering module:', activeModule);
      switch (activeModule) {
        case 'dashboard':
          console.log('Index: Rendering Dashboard');
          return <Dashboard onNavigateToModule={handleNavigateToModule} />;
        case 'lead-hunter':
          console.log('Index: Rendering LeadHunter');
          return <LeadHunter onNavigateToEmailGenerator={handleNavigateToEmailGenerator} />;
        case 'lead-discovery':
          console.log('Index: Rendering LeadDiscovery');
          return <LeadDiscovery onAddLead={addLead} onNavigateToEmailGenerator={handleNavigateToEmailGenerator} />;
        case 'knowledge-base':
          console.log('Index: Rendering KnowledgeBase');
          return <KnowledgeBase />;
        case 'email-scraping-test':
          console.log('Index: Rendering EmailScrapingTest');
          return <EmailScrapingTest />;
        case 'ai-chat':
          console.log('Index: Rendering AIKnowledgeChat');
          return <AIKnowledgeChat />;
        case 'email-generator':
          console.log('Index: Rendering EmailGenerator');
          return (
            <EmailGenerator 
              preSelectedEmail={emailGeneratorData.email}
              preSelectedCompany={emailGeneratorData.company}
            />
          );
        case 'crm-reminder':
          console.log('Index: Rendering CRMReminder');
          return <CRMReminder />;
        case 'content-booster':
          console.log('Index: Rendering ContentBooster');
          return <ContentBooster />;
        case 'analytics':
          console.log('Index: Rendering Analytics');
          return <Analytics />;
        case 'settings':
          console.log('Index: Rendering Settings');
          return <Settings />;
        case 'subscription':
          console.log('Index: Rendering SubscriptionPlans');
          return <SubscriptionPlans />;
        default:
          console.log('Index: Rendering default Dashboard');
          return <Dashboard onNavigateToModule={handleNavigateToModule} />;
      }
    } catch (error) {
      console.error('Index: Error rendering module:', error);
      return (
        <div className="p-6">
          <h2 className="text-xl font-bold text-destructive mb-4">Greška pri učitavanju modula</h2>
          <p className="text-muted-foreground mb-4">Dogodila se greška: {error?.toString()}</p>
          <button 
            onClick={() => setActiveModule('dashboard')} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Povratak na Dashboard
          </button>
        </div>
      );
    }
  };

  console.log('Index: About to render, isMobile:', isMobile);
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
            <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />
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
