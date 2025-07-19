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

const Index = () => {
  console.log('Index: Component starting to render');
  
  const [activeModule, setActiveModule] = useState('dashboard');
  console.log('Index: useState works');
  
  const { addLead } = useLeadManagement();
  console.log('Index: useLeadManagement works');
  
  return (
    <div className="flex min-h-screen bg-background w-full">
      <div style={{color: 'green', fontSize: '18px', padding: '20px'}}>
        INDEX WITH BASIC STATE WORKS! Active module: {activeModule}
      </div>
    </div>
  );
};

export default Index;