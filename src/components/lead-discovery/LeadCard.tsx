
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Phone, Mail } from 'lucide-react';
import { DiscoveredLead } from './SearchForm';

interface LeadCardProps {
  lead: DiscoveredLead;
  onAddLead: (lead: DiscoveredLead) => void;
}

const LeadCard = ({ lead, onAddLead }: LeadCardProps) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">{lead.name}</h3>
          <div className="flex items-center text-slate-600 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{lead.address}</span>
          </div>
          {lead.rating && (
            <div className="flex items-center mt-1">
              <span className="text-yellow-500">★</span>
              <span className="text-sm text-slate-600 ml-1">{lead.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex flex-wrap gap-1">
            {lead.types.slice(0, 2).map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
          <Button 
            size="sm"
            onClick={() => onAddLead(lead)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Dodaj
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-slate-600">
        {lead.phone && (
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-1" />
            <span>{lead.phone}</span>
          </div>
        )}
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-1" />
          <span className="text-slate-400">Email potreban</span>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
