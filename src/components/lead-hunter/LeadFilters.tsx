
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface LeadFiltersProps {
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedPotential: string;
  setSelectedPotential: (value: string) => void;
  selectedIndustry: string;
  setSelectedIndustry: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  uniqueStatuses: string[];
  uniquePotentials: string[];
  uniqueIndustries: string[];
  uniqueCities: string[];
  uniqueCountries: string[];
  activeFiltersCount: number;
}

const LeadFilters = ({
  selectedStatus,
  setSelectedStatus,
  selectedPotential,
  setSelectedPotential,
  selectedIndustry,
  setSelectedIndustry,
  selectedCity,
  setSelectedCity,
  selectedCountry,
  setSelectedCountry,
  uniqueStatuses,
  uniquePotentials,
  uniqueIndustries,
  uniqueCities,
  uniqueCountries,
  activeFiltersCount
}: LeadFiltersProps) => {
  const clearAllFilters = () => {
    setSelectedStatus('all');
    setSelectedPotential('all');
    setSelectedIndustry('all');
    setSelectedCity('all');
    setSelectedCountry('all');
  };

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
          <Filter className="h-4 w-4" />
          Filteri:
        </div>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            {uniqueStatuses.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedPotential} onValueChange={setSelectedPotential}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Potencijal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi potencijali</SelectItem>
            {uniquePotentials.map((potential) => (
              <SelectItem key={potential} value={potential}>{potential}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Država" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sve države</SelectItem>
            {uniqueCountries.map((country) => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Grad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi gradovi</SelectItem>
            {uniqueCities.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tip poslovanja" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sve industrije</SelectItem>
            {uniqueIndustries.map((industry) => (
              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {activeFiltersCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearAllFilters}
            className="text-slate-600 hover:text-slate-800"
          >
            <X className="h-4 w-4 mr-1" />
            Očisti ({activeFiltersCount})
          </Button>
        )}
      </div>
    </div>
  );
};

export default LeadFilters;
