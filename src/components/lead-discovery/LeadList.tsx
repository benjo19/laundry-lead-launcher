
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiscoveredLead } from './SearchForm';
import LeadCard from './LeadCard';
import { Search } from 'lucide-react';

interface LeadListProps {
  discoveredLeads: DiscoveredLead[];
  onAddLead: (lead: DiscoveredLead) => void;
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadList = ({ discoveredLeads, onAddLead, onNavigateToEmailGenerator }: LeadListProps) => {
  if (discoveredLeads.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2 text-blue-600" />
          Pronađeni Leadovi ({discoveredLeads.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
