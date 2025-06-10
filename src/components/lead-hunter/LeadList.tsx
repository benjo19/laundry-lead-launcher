
import React from 'react';
import { Lead } from '@/types';
import LeadCard from './LeadCard';

interface LeadListProps {
  leads: Lead[];
  onUpdateStatus: (leadId: number, newStatus: Lead['status']) => void;
  onDeleteLead: (leadId: number) => void;
  onEmailClick: (email: string, company: string) => void;
  activeFiltersCount: number;
}

const LeadList = ({ 
  leads, 
  onUpdateStatus, 
  onDeleteLead, 
  onEmailClick, 
  activeFiltersCount 
}: LeadListProps) => {
  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        {activeFiltersCount > 0 ? 
          "Nema leadova koji odgovaraju zadanim filterima." :
          "Nema leadova koji odgovaraju kriterijima pretrage."
        }
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onUpdateStatus={onUpdateStatus}
          onDeleteLead={onDeleteLead}
          onEmailClick={onEmailClick}
        />
      ))}
    </div>
  );
};

export default LeadList;
