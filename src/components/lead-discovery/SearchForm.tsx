
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Sparkles, Settings } from 'lucide-react';
import IndustrySelector, { industries } from './IndustrySelector';
import ExportButton from '@/components/ExportButton';
import { useAISettings } from '@/hooks/useAISettings';

export interface DiscoveredLead {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating?: number;
  types: string[];
  place_id: string;
  geometry?: any;
  business_status?: string;
  user_ratings_total?: number;
  email?: string;
  emailScraped?: boolean;
}

export { industries };

interface SearchFormProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  location: string;
  setLocation: (location: string) => void;
  industry: string;
  setIndustry: (industry: string) => void;
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  isSearching: boolean;
  discoveredLeads: DiscoveredLead[];
  onSearchLeads: () => void;
  onAnalyzeWithAI: (leads: DiscoveredLead[]) => void;
  showApiKeyInput?: boolean;
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
  discoveredLeads,
  onSearchLeads,
  onAnalyzeWithAI,
  showApiKeyInput = true
}: SearchFormProps) => {
  const { isAIConfigured } = useAISettings();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <span className="flex items-center">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              Pretraživanje Leadova
            </span>
            {discoveredLeads.length > 0 && (
              <ExportButton 
                data={discoveredLeads} 
                filename="discovered-leads" 
                type="leads"
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {showApiKeyInput && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">Google Maps API ključ</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Unesite Google Maps API ključ ili ga postavite u Settings"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  💡 Postavite API ključ u Settings da ga ne morate unositi svaki put
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="location">Lokacija</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="location"
                  placeholder="Zagreb, Split, Rijeka..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Industrija</Label>
              <IndustrySelector value={industry} onChange={setIndustry} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchQuery">Prilagođena pretraga (opcionalno)</Label>
              <Input
                id="searchQuery"
                placeholder="Dodajte specifične ključne riječi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button 
              onClick={onSearchLeads} 
              disabled={isSearching}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Pretražujem...' : 'Pretražuj Leadove'}
            </Button>
            {discoveredLeads.length > 0 && (
              <Button 
                onClick={() => onAnalyzeWithAI(discoveredLeads)}
                variant="outline"
                disabled={!isAIConfigured()}
                className="bg-purple-50 border-purple-200 hover:bg-purple-100"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Analiza
                {!isAIConfigured() && (
                  <Settings className="h-4 w-4 ml-1 text-amber-500" />
                )}
              </Button>
            )}
          </div>

          {!isAIConfigured() && discoveredLeads.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <Settings className="h-4 w-4 inline mr-1" />
                Za AI analizu potrebno je postaviti AI ključ u Postavkama.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchForm;
