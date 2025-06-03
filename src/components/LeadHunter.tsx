
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MapPin, Users, Phone, Mail, Edit, Trash2, Loader2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead } from '@/types';
import AddLeadDialog from './AddLeadDialog';
import ExportButton from './ExportButton';
import { useLeads } from '@/hooks/useLeads';

interface LeadHunterProps {
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadHunter = ({ onNavigateToEmailGenerator }: LeadHunterProps) => {
  // Load saved filter data from localStorage
  const [savedFilterData, setSavedFilterData] = useLocalStorage('leadHunterFilters', {
    searchTerm: '',
    statusFilter: 'all',
    potentialFilter: 'all'
  });

  const [searchTerm, setSearchTerm] = useState(savedFilterData.searchTerm || '');
  const [statusFilter, setStatusFilter] = useState<string>(savedFilterData.statusFilter || 'all');
  const [potentialFilter, setPotentialFilter] = useState<string>(savedFilterData.potentialFilter || 'all');
  
  // Save filter data to localStorage whenever filters change
  useEffect(() => {
    setSavedFilterData({
      searchTerm,
      statusFilter,
      potentialFilter
    });
  }, [searchTerm, statusFilter, potentialFilter, setSavedFilterData]);

  // Use the new useLeads hook
  const { leads, isLoading, addLead, updateLeadStatus, deleteLead } = useLeads();

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPotential = potentialFilter === 'all' || lead.potential === potentialFilter;
    
    return matchesSearch && matchesStatus && matchesPotential;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nova': return 'bg-blue-100 text-blue-800';
      case 'Kontaktiran': return 'bg-yellow-100 text-yellow-800';
      case 'Zainteresiran': return 'bg-green-100 text-green-800';
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

  const handleEmailClick = (email: string, company: string) => {
    if (onNavigateToEmailGenerator) {
      onNavigateToEmailGenerator(email, company);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-slate-600">Učitavam leadove...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Lead Hunter</h2>
          <p className="text-slate-600">Pronađite i upravljajte potencijalnim klijentima</p>
        </div>
        <div className="flex space-x-2">
          <ExportButton data={filteredLeads} filename="leads" type="leads" />
          <AddLeadDialog onAddLead={addLead} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pretražite tvrtke, lokacije..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi statusi</SelectItem>
                <SelectItem value="Nova">Nova</SelectItem>
                <SelectItem value="Kontaktiran">Kontaktiran</SelectItem>
                <SelectItem value="Zainteresiran">Zainteresiran</SelectItem>
                <SelectItem value="Odbačen">Odbačen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={potentialFilter} onValueChange={setPotentialFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Potencijal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi potencijali</SelectItem>
                <SelectItem value="Visok">Visok</SelectItem>
                <SelectItem value="Srednji">Srednji</SelectItem>
                <SelectItem value="Nizak">Nizak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{lead.company}</h3>
                    <div className="flex items-center text-slate-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{lead.location}</span>
                      <Users className="h-4 w-4 ml-4 mr-1" />
                      <span className="text-sm">{lead.employees} zaposlenika</span>
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
                        onClick={() => handleEmailClick(lead.email, lead.company)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        title="Kliknite za slanje emaila"
                      >
                        {lead.email}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Select onValueChange={(value: Lead['status']) => updateLeadStatus(lead.id, value)}>
                      <SelectTrigger className="w-32">
                        <Edit className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nova">Nova</SelectItem>
                        <SelectItem value="Kontaktiran">Kontaktiran</SelectItem>
                        <SelectItem value="Zainteresiran">Zainteresiran</SelectItem>
                        <SelectItem value="Odbačen">Odbačen</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteLead(lead.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredLeads.length === 0 && !isLoading && (
              <div className="text-center py-8 text-slate-500">
                {leads.length === 0 
                  ? "Nema leadova. Dodajte prvi lead!" 
                  : "Nema leadova koji odgovaraju kriterijima pretrage."
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadHunter;
