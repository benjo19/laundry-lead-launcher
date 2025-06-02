
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import LeadCard from './LeadCard';
import { DiscoveredLead } from './SearchForm';

interface LeadListProps {
  discoveredLeads: DiscoveredLead[];
  onAddLead: (lead: DiscoveredLead) => void;
}

const LeadList = ({ discoveredLeads, onAddLead }: LeadListProps) => {
  if (discoveredLeads.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-green-600" />
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
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadList;
