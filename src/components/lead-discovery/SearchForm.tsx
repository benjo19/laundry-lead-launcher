
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Brain, Key } from 'lucide-react';
import IndustrySelector from './IndustrySelector';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';

export interface DiscoveredLead {
  name: string;
  address: string;
  phone: string;
  website: string;
  email?: string;
  emailScraped?: boolean;
  emailGuessed?: boolean;
  rating?: number;
  types: string[];
  place_id: string;
  geometry?: any;
  business_status?: string;
  user_ratings_total?: number;
}

export const industries = [
  { value: 'laundry', label: 'Praonice rublja', query: 'laundry dry cleaning' },
  { value: 'restaurant', label: 'Restorani', query: 'restaurant cafe food' },
  { value: 'beauty', label: 'Kozmetički saloni', query: 'beauty salon spa' },
  { value: 'fitness', label: 'Fitness centri', query: 'gym fitness center' },
  { value: 'retail', label: 'Maloprodaja', query: 'retail store shop' },
  { value: 'services', label: 'Usluge', query: 'services business' },
  { value: 'healthcare', label: 'Zdravstvo', query: 'clinic doctor healthcare' },
  { value: 'automotive', label: 'Autoindustrija', query: 'auto repair car service' },
  { value: 'construction', label: 'Građevinarstvo', query: 'construction contractor builder' },
  { value: 'real-estate', label: 'Nekretnine', query: 'real estate agency' }
];

interface SearchFormProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  location: string;
  setLocation: (location: string) => void;
  industry: string;
  setIndustry: (industry: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  isSearching: boolean;
  isAnalyzing: boolean;
  discoveredLeads: AnalyzedLead[];
  onSearchLeads: () => void;
  onAnalyzeWithAI: (leads: AnalyzedLead[]) => void;
  showApiKeyInput: boolean;
}

const SearchForm = ({
  searchQuery,
  setSearchQuery,
  location,
  setLocation,
  industry,
  setIndustry,
  apiKey,
  setApiKey,
  isSearching,
  isAnalyzing,
  discoveredLeads,
  onSearchLeads,
  onAnalyzeWithAI,
  showApiKeyInput
}: SearchFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchLeads();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2 text-blue-600" />
          Pretraži Leadove
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">
                Lokacija *
              </label>
              <Input
                id="location"
                type="text"
                placeholder="npr. Zagreb, Split, Osijek..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-1">
                Industrija
              </label>
              <IndustrySelector 
                value={industry} 
                onChange={setIndustry} 
              />
            </div>
          </div>

          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-slate-700 mb-1">
              Dodatni uvjeti pretraživanja (opcionalno)
            </label>
            <Input
              id="searchQuery"
              type="text"
              placeholder="npr. veliki, novo otvoren, premium..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {showApiKeyInput && (
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-1">
                <Key className="inline h-4 w-4 mr-1" />
                Google Maps API ključ *
              </label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Unesite Google Maps API ključ"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Potreban je za pretraživanje leadova. Možete ga postaviti u Settings za buduću upotrebu.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="submit" 
              disabled={isSearching || isAnalyzing}
              className="flex-1"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isSearching ? 'Pretraživanje...' : 'Pretraži Leadove'}
            </Button>

            {discoveredLeads.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onAnalyzeWithAI(discoveredLeads)}
                disabled={isSearching || isAnalyzing}
                className="flex-1 sm:flex-none"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                {isAnalyzing ? 'AI Analiza...' : 'AI Analiza'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
