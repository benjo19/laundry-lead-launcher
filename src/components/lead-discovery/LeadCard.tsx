
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Phone, Mail, Globe, Star, CheckCircle, AlertCircle } from 'lucide-react';
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
          <div className="flex items-center mt-2 space-x-4">
            {lead.rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm text-slate-600 ml-1">{lead.rating.toFixed(1)}</span>
                {lead.user_ratings_total && (
                  <span className="text-xs text-slate-500 ml-1">({lead.user_ratings_total})</span>
                )}
              </div>
            )}
            {lead.business_status && (
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  lead.business_status === 'OPERATIONAL' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-slate-600">
                  {lead.business_status === 'OPERATIONAL' ? 'Aktivan' : 'Zatvoren'}
                </span>
              </div>
            )}
          </div>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-1" />
          <span>{lead.phone || 'Broj nije dostupan'}</span>
        </div>
        <div className="flex items-center">
          <Globe className="h-4 w-4 mr-1" />
          {lead.website ? (
            <a 
              href={lead.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate"
            >
              {lead.website.replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <span className="text-slate-400">Website nije dostupan</span>
          )}
        </div>
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-1" />
          {lead.email ? (
            <div className="flex items-center">
              <span className="text-green-700">{lead.email}</span>
              {lead.emailScraped && (
                <div className="ml-1" title="Email automatski pronađen">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-slate-400">Email nije pronađen</span>
              <div className="ml-1" title="Email potrebno pronaći ručno">
                <AlertCircle className="h-3 w-3 text-orange-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
