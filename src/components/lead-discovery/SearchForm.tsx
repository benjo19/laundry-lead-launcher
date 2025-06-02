
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Brain, Loader2, AlertCircle } from 'lucide-react';

interface DiscoveredLead {
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  types: string[];
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface SearchFormProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
  isSearching: boolean;
  discoveredLeads: DiscoveredLead[];
  onSearchLeads: () => void;
  onAnalyzeWithAI: (leads: DiscoveredLead[]) => void;
}

const industries = [
  { value: 'laundry', label: 'Praonica rublja', query: 'laundry dry cleaning' },
  { value: 'restaurant', label: 'Restorani', query: 'restaurant food service' },
  { value: 'hotel', label: 'Hoteli', query: 'hotel accommodation' },
  { value: 'gym', label: 'Teretane', query: 'gym fitness center' },
  { value: 'spa', label: 'Spa centri', query: 'spa wellness center' },
  { value: 'hospital', label: 'Bolnice', query: 'hospital medical center' },
  { value: 'school', label: 'Škole', query: 'school education' },
];

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
  onAnalyzeWithAI
}: SearchFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2 text-blue-600" />
          Parametri pretraživanja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Potreban Google Maps API ključ</p>
              <p>Za korištenje ove funkcionalnosti potrebno je kreirati Google Maps API ključ s omogućenim Places API. 
              Više informacija na: <a href="https://developers.google.com/maps/documentation/places/web-service/get-api-key" 
              target="_blank" rel="noopener noreferrer" className="underline">Google Places API dokumentaciji</a></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Google Maps API ključ</label>
            <Input
              type="password"
              placeholder="Unesite svoj Google Maps API ključ"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              Potreban je za pristup Google Maps Places API
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Lokacija</label>
            <Input
              placeholder="Zagreb, Split, Rijeka..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Industrija</label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Odaberite industriju" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((ind) => (
                  <SelectItem key={ind.value} value={ind.value}>
                    {ind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Dodatni pojmovi (opcionalno)</label>
            <Input
              placeholder="Dodatni ključni pojmovi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={onSearchLeads} 
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Pretražujem...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Pretražuj Leadove
              </>
            )}
          </Button>
          
          {discoveredLeads.length > 0 && (
            <Button 
              variant="outline"
              onClick={() => onAnalyzeWithAI(discoveredLeads)}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Analiza
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
export { industries };
export type { DiscoveredLead };
