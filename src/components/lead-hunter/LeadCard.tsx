
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Users, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { Lead } from '@/types';

interface LeadCardProps {
  lead: Lead;
  onUpdateStatus: (leadId: number, newStatus: Lead['status']) => void;
  onDeleteLead: (leadId: number) => void;
  onEmailClick: (email: string, company: string) => void;
}

const LeadCard = ({ lead, onUpdateStatus, onDeleteLead, onEmailClick }: LeadCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nova': return 'bg-blue-100 text-blue-800';
      case 'Kontaktiran': return 'bg-yellow-100 text-yellow-800';
      case 'Zainteresiran': return 'bg-green-100 text-green-800';
      case 'Zatvoren': return 'bg-purple-100 text-purple-800';
      case 'Odbačen': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'Visok': return 'bg-red-100 text-red-800';
      case 'Srednji': return 'bg-orange-100 text-orange-800';
      case 'Nizak': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{lead.company}</h3>
          <div className="flex items-center text-slate-600 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{lead.location || 'Lokacija nepoznata'}</span>
            <Users className="h-4 w-4 ml-4 mr-1" />
            <span className="text-sm">{lead.employees} zaposlenika</span>
            {lead.industry && (
              <>
                <span className="mx-2 text-slate-400">•</span>
                <Badge variant="outline" className="text-xs">
                  {lead.industry}
                </Badge>
              </>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge className={getStatusColor(lead.status)}>
            {lead.status}
          </Badge>
          <Badge className={getPotentialColor(lead.potential)}>
            {lead.potential} potencijal
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <div className="flex items-center text-slate-600">
            <Phone className="h-4 w-4 mr-1" />
            <span className="text-sm">{lead.phone}</span>
          </div>
          <div className="flex items-center text-slate-600">
            <Mail className="h-4 w-4 mr-1" />
            <button 
              onClick={() => onEmailClick(lead.email, lead.company)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              title="Kliknite za slanje emaila"
            >
              {lead.email}
            </button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Select onValueChange={(value: Lead['status']) => onUpdateStatus(lead.id, value)}>
            <SelectTrigger className="w-32">
              <Edit className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nova">Nova</SelectItem>
              <SelectItem value="Kontaktiran">Kontaktiran</SelectItem>
              <SelectItem value="Zainteresiran">Zainteresiran</SelectItem>
              <SelectItem value="Zatvoren">Zatvoren</SelectItem>
              <SelectItem value="Odbačen">Odbačen</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDeleteLead(lead.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
