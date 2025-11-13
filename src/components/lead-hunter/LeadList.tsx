
import React from 'react';
import { Lead } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, Trash2 } from 'lucide-react';

interface LeadListProps {
  leads: Lead[];
  onUpdateStatus: (leadId: number, newStatus: Lead['status']) => void;
  onDeleteLead: (leadId: number) => void;
  onEmailClick: (email: string, company: string) => void;
  activeFiltersCount: number;
}

const LeadList = ({ leads, onUpdateStatus, onDeleteLead, onEmailClick, activeFiltersCount }: LeadListProps) => {
  const extractCity = (location: string) => {
    if (!location) return 'Nepoznato';
    // Extract city from location string (usually format: "Address, City, Country")
    const parts = location.split(',').map(p => p.trim());
    // Return the second-to-last part (city) if available, otherwise the first part
    return parts.length > 1 ? parts[parts.length - 2] : parts[0];
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'Visok': return 'bg-green-100 text-green-800 border-green-300';
      case 'Srednji': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Nizak': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nova': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Kontaktiran': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Zainteresiran': return 'bg-green-100 text-green-800 border-green-300';
      case 'Odbačen': return 'bg-red-100 text-red-800 border-red-300';
      case 'Zatvoren': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 mb-4">
          <Mail className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {activeFiltersCount > 0 ? 'Nema rezultata' : 'Nema leadova'}
        </h3>
        <p className="text-slate-600">
          {activeFiltersCount > 0 
            ? 'Pokušajte promijeniti filtere za prikaz rezultata.'
            : 'Dodajte prvi lead kako biste počeli s upravljanjem kontaktima.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {leads.map((lead) => (
        <Card key={lead.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-slate-900 text-lg">{lead.company}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteLead(lead.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{extractCity(lead.location)}</span>
              </div>
              {lead.email && (
                <div className="flex items-center text-sm text-slate-600">
                  <Mail className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-slate-600">
                <Phone className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{lead.phone}</span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Badge className={`text-xs border ${getPotentialColor(lead.potential)}`}>
                {lead.potential}
              </Badge>
              {lead.industry && (
                <Badge variant="outline" className="text-xs">
                  {lead.industry}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Status</label>
                <Select value={lead.status} onValueChange={(value: Lead['status']) => onUpdateStatus(lead.id, value)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nova">Nova</SelectItem>
                    <SelectItem value="Kontaktiran">Kontaktiran</SelectItem>
                    <SelectItem value="Zainteresiran">Zainteresiran</SelectItem>
                    <SelectItem value="Odbačen">Odbačen</SelectItem>
                    <SelectItem value="Zatvoren">Zatvoren</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onEmailClick(lead.email, lead.company)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Pošalji email
              </Button>
            </div>

            <div className="text-xs text-slate-500 mt-3 border-t pt-2">
              Dodano: {new Date(lead.dateAdded).toLocaleDateString('hr-HR')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LeadList;
