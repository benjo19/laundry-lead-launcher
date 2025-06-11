
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Search, TrendingUp } from 'lucide-react';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import LeadFilters from '@/components/lead-hunter/LeadFilters';
import LeadList from '@/components/lead-hunter/LeadList';
import AddLeadDialog from '@/components/AddLeadDialog';
import { Lead } from '@/types';

interface LeadHunterProps {
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadHunter = ({ onNavigateToEmailGenerator }: LeadHunterProps) => {
  const { leads, addLead, updateLeadStatus, deleteLead } = useLeadManagement();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Filter states - using 'all' instead of empty strings
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPotential, setSelectedPotential] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');

  // Extract unique values for filters
  const uniqueStatuses = useMemo(() => [...new Set(leads.map(lead => lead.status))], [leads]);
  const uniquePotentials = useMemo(() => [...new Set(leads.map(lead => lead.potential))], [leads]);
  const uniqueIndustries = useMemo(() => [...new Set(leads.map(lead => lead.industry).filter(Boolean))], [leads]);
  
  const uniqueCities = useMemo(() => {
    const cities = leads.map(lead => {
      if (!lead.location) return null;
      const parts = lead.location.split(',');
      return parts[0]?.trim();
    }).filter(Boolean);
    return [...new Set(cities)];
  }, [leads]);
  
  const uniqueCountries = useMemo(() => {
    const countries = leads.map(lead => {
      if (!lead.location) return null;
      const parts = lead.location.split(',');
      return parts[1]?.trim();
    }).filter(Boolean);
    return [...new Set(countries)];
  }, [leads]);

  // Filter leads based on selected filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (selectedStatus !== 'all' && lead.status !== selectedStatus) return false;
      if (selectedPotential !== 'all' && lead.potential !== selectedPotential) return false;
      if (selectedIndustry !== 'all' && lead.industry !== selectedIndustry) return false;
      
      if (selectedCity !== 'all') {
        const leadCity = lead.location?.split(',')[0]?.trim();
        if (leadCity !== selectedCity) return false;
      }
      
      if (selectedCountry !== 'all') {
        const leadCountry = lead.location?.split(',')[1]?.trim();
        if (leadCountry !== selectedCountry) return false;
      }
      
      return true;
    });
  }, [leads, selectedStatus, selectedPotential, selectedIndustry, selectedCity, selectedCountry]);

  // Count active filters
  const activeFiltersCount = [selectedStatus, selectedPotential, selectedIndustry, selectedCity, selectedCountry]
    .filter(filter => filter !== 'all').length;

  const handleEmailClick = (email: string, company: string) => {
    if (onNavigateToEmailGenerator) {
      onNavigateToEmailGenerator(email, company);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Hunter</h1>
          <p className="text-slate-600">Upravljajte svojim potencijalnim klijentima</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Dodaj Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Ukupno Leadova</p>
                <p className="text-2xl font-bold text-slate-900">{leads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Zainteresirani</p>
                <p className="text-2xl font-bold text-slate-900">
                  {leads.filter(lead => lead.status === 'Zainteresiran').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Novi</p>
                <p className="text-2xl font-bold text-slate-900">
                  {leads.filter(lead => lead.status === 'Nova').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Kontaktirani</p>
                <p className="text-2xl font-bold text-slate-900">
                  {leads.filter(lead => lead.status === 'Kontaktiran').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <LeadFilters
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedPotential={selectedPotential}
        setSelectedPotential={setSelectedPotential}
        selectedIndustry={selectedIndustry}
        setSelectedIndustry={setSelectedIndustry}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        uniqueStatuses={uniqueStatuses}
        uniquePotentials={uniquePotentials}
        uniqueIndustries={uniqueIndustries}
        uniqueCities={uniqueCities}
        uniqueCountries={uniqueCountries}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Leads List */}
      <LeadList
        leads={filteredLeads}
        onUpdateStatus={updateLeadStatus}
        onDeleteLead={deleteLead}
        onEmailClick={handleEmailClick}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Add Lead Dialog */}
      <AddLeadDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddLead={addLead}
      />
    </div>
  );
};

export default LeadHunter;
