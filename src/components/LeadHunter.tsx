
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead } from '@/types';
import AddLeadDialog from './AddLeadDialog';
import ExportButton from './ExportButton';
import LeadFilters from './lead-hunter/LeadFilters';
import LeadList from './lead-hunter/LeadList';
import { useLeadManagement } from '@/hooks/useLeadManagement';

interface LeadHunterProps {
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadHunter = ({ onNavigateToEmailGenerator }: LeadHunterProps) => {
  // Load saved filter data from localStorage
  const [savedFilterData, setSavedFilterData] = useLocalStorage('leadHunterFilters', {
    searchTerm: '',
    statusFilter: 'all',
    potentialFilter: 'all',
    cityFilter: 'all',
    countryFilter: 'all',
    industryFilter: 'all'
  });

  const [searchTerm, setSearchTerm] = useState(savedFilterData.searchTerm || '');
  const [statusFilter, setStatusFilter] = useState<string>(savedFilterData.statusFilter || 'all');
  const [potentialFilter, setPotentialFilter] = useState<string>(savedFilterData.potentialFilter || 'all');
  const [cityFilter, setCityFilter] = useState<string>(savedFilterData.cityFilter || 'all');
  const [countryFilter, setCountryFilter] = useState<string>(savedFilterData.countryFilter || 'all');
  const [industryFilter, setIndustryFilter] = useState<string>(savedFilterData.industryFilter || 'all');
  
  // Save filter data to localStorage whenever filters change
  useEffect(() => {
    setSavedFilterData({
      searchTerm,
      statusFilter,
      potentialFilter,
      cityFilter,
      countryFilter,
      industryFilter
    });
  }, [searchTerm, statusFilter, potentialFilter, cityFilter, countryFilter, industryFilter, setSavedFilterData]);

  const { leads, addLead, updateLeadStatus, deleteLead } = useLeadManagement();

  // Extract unique values for filter options with proper null checks
  const uniqueCities = [...new Set(leads.map(lead => {
    const city = (lead.location || '').split(',')[0]?.trim() || 'Unknown';
    return city;
  }))].filter(city => city && city !== 'Unknown').sort();
  
  const uniqueCountries = [...new Set(leads.map(lead => {
    const country = (lead.location || '').split(',')[1]?.trim() || 'Unknown';
    return country;
  }))].filter(country => country && country !== 'Unknown').sort();
  
  const uniqueIndustries = [...new Set(leads.map(lead => lead.industry).filter(Boolean))].sort();

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPotentialFilter('all');
    setCityFilter('all');
    setCountryFilter('all');
    setIndustryFilter('all');
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPotential = potentialFilter === 'all' || lead.potential === potentialFilter;
    
    const leadCity = (lead.location || '').split(',')[0]?.trim() || 'Unknown';
    const leadCountry = (lead.location || '').split(',')[1]?.trim() || 'Unknown';
    const matchesCity = cityFilter === 'all' || leadCity === cityFilter;
    const matchesCountry = countryFilter === 'all' || leadCountry === countryFilter;
    const matchesIndustry = industryFilter === 'all' || lead.industry === industryFilter;
    
    return matchesSearch && matchesStatus && matchesPotential && matchesCity && matchesCountry && matchesIndustry;
  });

  const handleEmailClick = (email: string, company: string) => {
    if (onNavigateToEmailGenerator) {
      onNavigateToEmailGenerator(email, company);
    }
  };

  const activeFiltersCount = [statusFilter, potentialFilter, cityFilter, countryFilter, industryFilter]
    .filter(filter => filter !== 'all').length;

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
          <LeadFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            potentialFilter={potentialFilter}
            setPotentialFilter={setPotentialFilter}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            countryFilter={countryFilter}
            setCountryFilter={setCountryFilter}
            industryFilter={industryFilter}
            setIndustryFilter={setIndustryFilter}
            uniqueCities={uniqueCities}
            uniqueCountries={uniqueCountries}
            uniqueIndustries={uniqueIndustries}
            activeFiltersCount={activeFiltersCount}
            clearAllFilters={clearAllFilters}
          />
        </CardHeader>
        <CardContent>
          <LeadList
            leads={filteredLeads}
            onUpdateStatus={updateLeadStatus}
            onDeleteLead={deleteLead}
            onEmailClick={handleEmailClick}
            activeFiltersCount={activeFiltersCount}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadHunter;
