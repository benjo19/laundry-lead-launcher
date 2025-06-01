
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import LeadHunter from '@/components/LeadHunter';
import LeadDiscovery from '@/components/LeadDiscovery';
import EmailGenerator from '@/components/EmailGenerator';
import CRMReminder from '@/components/CRMReminder';
import ContentBooster from '@/components/ContentBooster';
import Analytics from '@/components/Analytics';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead } from '@/types';

const Index = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [leads, setLeads] = useLocalStorage<Lead[]>('leads', []);

  const addLead = (newLeadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    const newLead: Lead = {
      ...newLeadData,
      id: Date.now(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setLeads([...leads, newLead]);
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'lead-hunter':
        return <LeadHunter />;
      case 'lead-discovery':
        return <LeadDiscovery onAddLead={addLead} />;
      case 'email-generator':
        return <EmailGenerator />;
      case 'crm-reminder':
        return <CRMReminder />;
      case 'content-booster':
        return <ContentBooster />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
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
