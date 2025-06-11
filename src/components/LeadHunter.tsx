
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import LeadList from '@/components/lead-hunter/LeadList';
import LeadFilters from '@/components/lead-hunter/LeadFilters';
import { AddLeadDialog } from '@/components/AddLeadDialog';

const LeadHunter = () => {
  const { leads, addLead, updateLeadStatus, deleteLead } = useLeadManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPotential, setSelectedPotential] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const uniqueStatuses = useMemo(() => 
    [...new Set(leads.map(lead => lead.status))], [leads]
  );

  const uniquePotentials = useMemo(() => 
    [...new Set(leads.map(lead => lead.potential))], [leads]
  );

  const uniqueIndustries = useMemo(() => 
    [...new Set(leads.map(lead => lead.industry).filter(Boolean))], [leads]
  );

  const uniqueCities = useMemo(() => {
    const cities = leads.map(lead => 
      (lead.location || '').split(',')[0].trim() || 'Unknown'
    ).filter(city => city && city !== 'Unknown');
    return [...new Set(cities)];
  }, [leads]);

  const uniqueCountries = useMemo(() => {
    const countries = leads.map(lead => 
      (lead.location || '').split(',')[1]?.trim() || 'Unknown'
    ).filter(country => country && country !== 'Unknown');
    return [...new Set(countries)];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchTerm === '' || 
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.location || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === '' || lead.status === selectedStatus;
      const matchesPotential = selectedPotential === '' || lead.potential === selectedPotential;
      const matchesIndustry = selectedIndustry === '' || lead.industry === selectedIndustry;
      
      const leadCity = (lead.location || '').split(',')[0].trim() || 'Unknown';
      const leadCountry = (lead.location || '').split(',')[1]?.trim() || 'Unknown';
      const matchesCity = selectedCity === '' || leadCity === selectedCity;
      const matchesCountry = selectedCountry === '' || leadCountry === selectedCountry;

      return matchesSearch && matchesStatus && matchesPotential && 
             matchesIndustry && matchesCity && matchesCountry;
    });
  }, [leads, searchTerm, selectedStatus, selectedPotential, selectedIndustry, selectedCity, selectedCountry]);

  const activeFiltersCount = [
    selectedStatus, selectedPotential, selectedIndustry, 
    selectedCity, selectedCountry
  ].filter(Boolean).length;

  const handleEmailClick = (email: string, company: string) => {
    const subject = encodeURIComponent(`Prilika za suradnju - ${company}`);
    const body = encodeURIComponent(`Poštovani,\n\nObraćam vam se u vezi s potencijalnom suradnjom...\n\nS poštovanjem`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Lead Hunter</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Dodaj novi lead
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Pretraži po nazivu tvrtke, emailu ili lokaciji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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

      <div className="text-sm text-slate-600">
        Prikazano {filteredLeads.length} od {leads.length} leadova
        {activeFiltersCount > 0 && ` (${activeFiltersCount} aktivnih filtera)`}
      </div>

      <LeadList
        leads={filteredLeads}
        onUpdateStatus={updateLeadStatus}
        onDeleteLead={deleteLead}
        onEmailClick={handleEmailClick}
        activeFiltersCount={activeFiltersCount}
      />

      <AddLeadDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddLead={addLead}
      />
    </div>
  );
};

export default LeadHunter;
