
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
import { Lead } from '@/types';

const Index = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [leads, setLeads] = useLocalStorage<Lead[]>('leads', []);
  
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
  };

  const handleNavigateToModule = (module: string) => {
    setActiveModule(module);
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
