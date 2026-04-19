
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Search, TrendingUp } from 'lucide-react';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import LeadFilters from '@/components/lead-hunter/LeadFilters';
import SelectableLeadList from '@/components/lead-hunter/SelectableLeadList';
import BulkOperations from '@/components/lead-hunter/BulkOperations';
import AddLeadDialog from '@/components/AddLeadDialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import { Input } from '@/components/ui/input';
import { Lead } from '@/types';

interface LeadHunterProps {
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadHunter = ({ onNavigateToEmailGenerator }: LeadHunterProps) => {
  const { leads, loading, error, addLead, updateLeadStatus, updateLeadNotes, deleteLead, refreshLeads } = useLeadManagement();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const { toast } = useToast();
  
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
      // Take the second part if available (city), otherwise take the first part
      // Format usually: "Street, City, Country" or "City, Country" or just "City"
      return parts.length > 2 ? parts[1]?.trim() : 
             parts.length > 1 ? parts[0]?.trim() : 
             parts[0]?.trim();
    }).filter(Boolean);
    return [...new Set(cities)];
  }, [leads]);
  
  const uniqueCountries = useMemo(() => {
    const countries = leads.map(lead => {
      if (!lead.location) return null;
      const parts = lead.location.split(',');
      // Take the last part as country (usually format: "Street, City, Country")
      return parts.length > 1 ? parts[parts.length - 1]?.trim() : parts[0]?.trim();
    }).filter(Boolean);
    return [...new Set(countries)];
  }, [leads]);

  // Filter leads based on selected filters and search query
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesSearch = 
          lead.company.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          (lead.location && lead.location.toLowerCase().includes(query)) ||
          (lead.industry && lead.industry.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      if (selectedStatus !== 'all' && lead.status !== selectedStatus) return false;
      if (selectedPotential !== 'all' && lead.potential !== selectedPotential) return false;
      if (selectedIndustry !== 'all' && lead.industry !== selectedIndustry) return false;
      
      if (selectedCountry !== 'all') {
        const parts = lead.location?.split(',');
        const leadCountry = parts && parts.length > 1 ? parts[parts.length - 1]?.trim() : parts?.[0]?.trim();
        if (leadCountry !== selectedCountry) return false;
      }
      
      if (selectedCity !== 'all') {
        const parts = lead.location?.split(',');
        // Use the same logic as uniqueCities generation
        const leadCity = parts && parts.length > 2 ? parts[1]?.trim() : 
                         parts && parts.length > 1 ? parts[0]?.trim() : 
                         parts?.[0]?.trim();
        if (leadCity !== selectedCity) return false;
      }
      
      return true;
    });
  }, [leads, selectedStatus, selectedPotential, selectedIndustry, selectedCity, selectedCountry, debouncedSearchQuery]);

  // Count active filters
  const activeFiltersCount = [selectedStatus, selectedPotential, selectedIndustry, selectedCity, selectedCountry]
    .filter(filter => filter !== 'all').length;

  const handleEmailClick = (email: string, company: string) => {
    if (onNavigateToEmailGenerator) {
      onNavigateToEmailGenerator(email, company);
    }
  };

  const handleToggleSelect = (leadId: number) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    setSelectedLeads(filteredLeads.map(lead => lead.id));
  };

  const handleDeselectAll = () => {
    setSelectedLeads([]);
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;

    for (const leadId of selectedLeads) {
      await deleteLead(leadId);
    }
    
    setSelectedLeads([]);
    toast({
      title: "Leadovi obrisani",
      description: `${selectedLeads.length} leadova je uspješno obrisano.`,
    });
  };

  const handleBulkStatusChange = async (newStatus: Lead['status']) => {
    if (selectedLeads.length === 0) return;

    for (const leadId of selectedLeads) {
      await updateLeadStatus(leadId, newStatus);
    }
    
    setSelectedLeads([]);
    toast({
      title: "Status ažuriran",
      description: `Status je ažuriran za ${selectedLeads.length} leadova.`,
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" text="Učitavam leadove..." className="py-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage 
          message={`Greška prilikom učitavanja leadova: ${error}`}
          onRetry={refreshLeads}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Hunter</h1>
          <p className="text-slate-600">Upravljajte svojim potencijalnim klijentima</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Pretraži leadove..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Dodaj Lead
          </Button>
        </div>
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

      {/* Bulk Operations */}
      <BulkOperations
        selectedLeads={selectedLeads}
        allLeads={filteredLeads}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
      />

      {/* Search Results Info */}
      {debouncedSearchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Prikazano {filteredLeads.length} od {leads.length} leadova za pretraživanje "{debouncedSearchQuery}"
          </p>
        </div>
      )}

      {/* Leads List */}
      <SelectableLeadList
        leads={filteredLeads}
        selectedLeads={selectedLeads}
        onToggleSelect={handleToggleSelect}
        onUpdateStatus={updateLeadStatus}
        onUpdateNotes={updateLeadNotes}
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
