
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiscoveredLead } from './SearchForm';
import LeadCard from './LeadCard';
import { Search } from 'lucide-react';
import { Lead } from '@/types';

interface LeadListProps {
  discoveredLeads: DiscoveredLead[];
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadList = ({ discoveredLeads, onAddLead, onNavigateToEmailGenerator }: LeadListProps) => {
  if (discoveredLeads.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 shrink-0" />
          <span className="truncate">Pronađeni Leadovi ({discoveredLeads.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="space-y-3 sm:space-y-4">
          {discoveredLeads.map((lead) => (
            <LeadCard 
              key={lead.place_id} 
              lead={lead} 
              onAddLead={onAddLead}
              onNavigateToEmailGenerator={onNavigateToEmailGenerator}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadList;
