
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Search, TrendingUp, GitMerge, FileSpreadsheet } from 'lucide-react';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import LeadFilters from '@/components/lead-hunter/LeadFilters';
import SelectableLeadList from '@/components/lead-hunter/SelectableLeadList';
import BulkOperations from '@/components/lead-hunter/BulkOperations';
import AddLeadDialog from '@/components/AddLeadDialog';
import DuplicateFinderDialog from '@/components/lead-hunter/DuplicateFinderDialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import { Input } from '@/components/ui/input';
import { Lead } from '@/types';
import { parseLocation } from '@/utils/locationParser';
import SalesFunnel from '@/components/SalesFunnel';

interface LeadHunterProps {
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadHunter = ({ onNavigateToEmailGenerator }: LeadHunterProps) => {
  const { leads, loading, error, addLead, updateLead, updateLeadStatus, updateLeadNotes, deleteLead, refreshLeads } = useLeadManagement();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
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
  
  const leadCityOf = (lead: Lead) =>
    lead.city || parseLocation(lead.location).city || null;
  const leadCountryOf = (lead: Lead) =>
    lead.country || parseLocation(lead.location).country || null;

  const uniqueCities = useMemo(
    () => [...new Set(leads.map(leadCityOf).filter(Boolean) as string[])],
    [leads]
  );

  const uniqueCountries = useMemo(
    () => [...new Set(leads.map(leadCountryOf).filter(Boolean) as string[])],
    [leads]
  );

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

      if (selectedCountry !== 'all' && leadCountryOf(lead) !== selectedCountry) return false;
      if (selectedCity !== 'all' && leadCityOf(lead) !== selectedCity) return false;

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

  const handleBulkEnrich = async () => {
    if (selectedLeads.length === 0) return;

    // Collect company names for selected leads that have NO email
    const selectedSet = new Set(selectedLeads);
    const eligibleCompanies = filteredLeads
      .filter((l) => selectedSet.has(l.id) && (!l.email || !String(l.email).trim()))
      .map((l) => l.company);

    if (eligibleCompanies.length === 0) {
      toast({
        title: "Nema leadova za obogaćivanje",
        description: "Svi odabrani leadovi već imaju email adresu.",
      });
      return;
    }

    try {
      setIsEnriching(true);
      const { data, error } = await supabase.functions.invoke('bulk-enrich-leads', {
        body: { companies: eligibleCompanies },
      });

      if (error) throw error;

      toast({
        title: "Obogaćivanje pokrenuto",
        description: `Tražimo emailove za ${data?.eligible ?? eligibleCompanies.length} leadova. Ovo može potrajati par minuta — osvježit će se automatski.`,
      });

      // Refresh after a short delay so users see updates as they come in
      setTimeout(() => {
        refreshLeads();
      }, 8000);
      setTimeout(() => {
        refreshLeads();
      }, 25000);
    } catch (err) {
      console.error('Bulk enrich failed:', err);
      toast({
        title: "Greška",
        description: "Pokretanje obogaćivanja nije uspjelo. Pokušajte ponovno.",
        variant: "destructive",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleMergeDuplicates = async (
    masterId: number,
    duplicateIds: number[],
    mergedData: Partial<Lead>
  ) => {
    try {
      if (mergedData && Object.keys(mergedData).length > 0) {
        await updateLead(masterId, mergedData);
      }
      for (const dupId of duplicateIds) {
        await deleteLead(dupId);
      }
      toast({
        title: 'Spojeno',
        description: `${duplicateIds.length} ${duplicateIds.length === 1 ? 'duplikat je obrisan' : 'duplikata je obrisano'}, master zapis ažuriran.`,
      });
      await refreshLeads();
    } catch (err) {
      console.error('Merge failed:', err);
      toast({
        title: 'Greška',
        description: 'Spajanje duplikata nije uspjelo.',
        variant: 'destructive',
      });
    }
  };


  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      toast({
        title: "Nema leadova za izvoz",
        description: "Trenutno nema leadova koji odgovaraju filterima.",
      });
      return;
    }

    const escapeCsv = (value: string | null | undefined) => {
      const str = value == null ? "" : String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ["Tvrtka", "Email", "Telefon", "Lokacija", "Broj zaposlenika", "Tip poslovanja", "Status", "Potencijal", "Datum dodavanja", "Bilješke", "Website"];
    const rows = filteredLeads.map(lead => [
      lead.company,
      lead.email,
      lead.phone,
      lead.location,
      lead.employees,
      lead.industry,
      lead.status,
      lead.potential,
      lead.dateAdded,
      lead.notes,
      lead.website
    ].map(escapeCsv));

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leadovi-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV izvezen",
      description: `Izvezeno ${filteredLeads.length} leadova.`,
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
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-3 sm:px-5 lg:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">Leadovi</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Prodajni pipeline i upravljanje potencijalnim klijentima</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          <Input
            placeholder="Pretraži leadove..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 lg:w-64"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsDuplicateDialogOpen(true)}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none flex items-center gap-2"
            >
              <GitMerge className="h-4 w-4" />
              <span className="hidden sm:inline">Pronađi duplikate</span>
              <span className="sm:hidden">Duplikati</span>
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Izvezi CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="flex-1 sm:flex-none flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Dodaj Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ukupno Leadova', value: leads.length, Icon: Users, tone: 'text-primary bg-primary/10' },
          { label: 'Zainteresirani', value: leads.filter(l => l.status === 'Zainteresiran').length, Icon: TrendingUp, tone: 'text-success bg-success/10' },
          { label: 'Novi', value: leads.filter(l => l.status === 'Nova').length, Icon: Search, tone: 'text-warning bg-warning/10' },
          { label: 'Kontaktirani', value: leads.filter(l => l.status === 'Kontaktiran').length, Icon: Users, tone: 'text-accent-foreground bg-accent' },
        ].map(({ label, value, Icon, tone }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Funnel */}
      <SalesFunnel
        leads={leads}
        onStageClick={(status) => setSelectedStatus(status)}
      />

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
        onBulkEnrich={handleBulkEnrich}
        isEnriching={isEnriching}
      />

      {/* Search Results Info */}
      {debouncedSearchQuery && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs sm:text-sm text-foreground">
            Prikazano <span className="font-semibold">{filteredLeads.length}</span> od {leads.length} leadova za "{debouncedSearchQuery}"
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

      {/* Duplicate Finder Dialog */}
      <DuplicateFinderDialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        leads={leads}
        onMerge={handleMergeDuplicates}
      />
    </div>
  );
};

export default LeadHunter;
