
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface LeadFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  potentialFilter: string;
  setPotentialFilter: (value: string) => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  countryFilter: string;
  setCountryFilter: (value: string) => void;
  industryFilter: string;
  setIndustryFilter: (value: string) => void;
  uniqueCities: string[];
  uniqueCountries: string[];
  uniqueIndustries: string[];
  activeFiltersCount: number;
  clearAllFilters: () => void;
}

const LeadFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  potentialFilter,
  setPotentialFilter,
  cityFilter,
  setCityFilter,
  countryFilter,
  setCountryFilter,
  industryFilter,
  setIndustryFilter,
  uniqueCities,
  uniqueCountries,
  uniqueIndustries,
  activeFiltersCount,
  clearAllFilters
}: LeadFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Pretražite tvrtke, lokacije..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Filter Row */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
          <Filter className="h-4 w-4" />
          Filteri:
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
            <SelectItem value="Zatvoren">Zatvoren</SelectItem>
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
        
        <Select value={cityFilter} onValueChange={setCityFilter}>
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
        
        <Select value={countryFilter} onValueChange={setCountryFilter}>
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
        
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
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
