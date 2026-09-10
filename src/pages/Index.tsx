import React, { useState, useEffect } from 'react';
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
import AdminDashboard from '@/components/AdminDashboard';
import BusinessDocuments from '@/components/BusinessDocuments';
import MakeIntegration from '@/components/MakeIntegration';
import PartnerWorkspace from '@/components/partner/PartnerWorkspace';

import MobileHeader from '@/components/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { HelpChatbox } from '@/components/HelpChatbox';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { useUserRole } from '@/hooks/useUserRole';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';
import { useLocation } from 'react-router-dom';

const MODULE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  'lead-hunter': 'Leadovi',
  clients: 'Klijenti',
  offers: 'Ponude',
  'crm-reminder': 'Follow-up',
  documents: 'Dokumenti',
  'email-generator': 'AI Mail',
  integrations: 'Integracije',
  settings: 'Postavke',
  'lead-discovery': 'Lead Discovery',
  'knowledge-base': 'Knowledge Base',
  'ai-chat': 'AI Asistent',
  'content-booster': 'Content Booster',
  analytics: 'Analitika',
  subscription: 'Pretplata',
  'admin-dashboard': 'Admin Dashboard',
};

const Index = () => {
  const location = useLocation();
  const [activeModule, setActiveModule] = useState('dashboard');
  const { addLead } = useLeadManagement();
  const { isSalesPartner, loading: roleLoading } = useUserRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (location.pathname === '/admin') {
      setActiveModule('admin-dashboard');
    }
  }, [location]);

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

  const getModuleTitle = () => MODULE_TITLES[activeModule] ?? 'Brentareno CRM';

  const renderActiveModule = () => {
    try {
      switch (activeModule) {
        case 'dashboard':
          return <Dashboard onNavigateToModule={handleNavigateToModule} />;
        case 'lead-hunter':
          return <LeadHunter onNavigateToEmailGenerator={handleNavigateToEmailGenerator} />;
        case 'clients':
          return <LeadHunter onNavigateToEmailGenerator={handleNavigateToEmailGenerator} />;
        case 'offers':
          return (
            <div className="p-6">
              <div className="surface-card p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Ponude</h2>
                <p className="text-sm text-muted-foreground">
                  Pipeline ponuda (Kanban) dolazi u sljedećoj fazi redizajna.
                </p>
              </div>
            </div>
          );
        case 'crm-reminder':
          return <CRMReminder />;
        case 'documents':
          return <BusinessDocuments />;
        case 'email-generator':
          return (
            <EmailGenerator
              preSelectedEmail={emailGeneratorData.email}
              preSelectedCompany={emailGeneratorData.company}
            />
          );
        case 'integrations':
          return (
            <div className="p-6">
              <MakeIntegration />
            </div>
          );
        case 'settings':
          return <Settings />;
        case 'lead-discovery':
          return (
            <LeadDiscovery
              onAddLead={addLead}
              onNavigateToEmailGenerator={handleNavigateToEmailGenerator}
            />
          );
        case 'knowledge-base':
          return <KnowledgeBase />;
        case 'ai-chat':
          return <AIKnowledgeChat />;
        case 'content-booster':
          return <ContentBooster />;
        case 'analytics':
          return <Analytics />;
        case 'subscription':
          return <SubscriptionPlans />;
        case 'admin-dashboard':
          return <AdminDashboard />;
        default:
          return <Dashboard onNavigateToModule={handleNavigateToModule} />;
      }
    } catch (error) {
      console.error('Index: Error rendering module:', error);
      return (
        <div className="p-6">
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Greška pri učitavanju modula
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{error?.toString()}</p>
            <button
              onClick={() => setActiveModule('dashboard')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Povratak na Dashboard
            </button>
          </div>
        </div>
      );
    }
  };

  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Učitavam radni prostor…</div>
      </div>
    );
  }

  if (isSalesPartner && location.pathname !== '/admin') {
    return <PartnerWorkspace />;
  }

  if (isMobile) {
    return (
      <div className="flex min-h-screen bg-background w-full">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <div className="flex-1 flex flex-col min-w-0">
            <MobileHeader
              onMenuClick={() => setSidebarOpen(true)}
              title={getModuleTitle()}
            />
            <main className="flex-1 overflow-auto bg-background">
              <div className="animate-fade-in w-full max-w-full">
                {renderActiveModule()}
              </div>
            </main>
          </div>
          <SheetContent side="left" className="w-[280px] sm:w-80 p-0 border-r border-sidebar-border">
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
      <main className="flex-1 overflow-auto min-w-0 bg-background">
        <div className="animate-fade-in">{renderActiveModule()}</div>
      </main>
      <HelpChatbox />
    </div>
  );
};

export default Index;
