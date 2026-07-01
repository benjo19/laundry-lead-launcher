
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Key, Zap, Globe, Building2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import IndustrySelector, { industries } from './IndustrySelector';
import CountrySelector from './CountrySelector';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface DiscoveredLead {
  name: string;
  address: string;
  phone: string;
  website: string;
  email?: string;
  emailScraped?: boolean;
  emailGuessed?: boolean;
  socialProfiles?: {
    linkedin?: string;
    facebook?: string;
    yellowPages?: string;
  };
  emailSource?: string; // odakle je pronađen email (website, linkedin, facebook, etc.)
  rating?: number;
  types: string[];
  place_id: string;
  geometry?: any;
  business_status?: string;
  user_ratings_total?: number;
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
}

// Export industries from IndustrySelector for consistency
export { industries };

interface SearchFormProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  location: string;
  setLocation: (location: string) => void;
  country: string;
  setCountry: (country: string) => void;
  industry: string;
  setIndustry: (industry: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  searchMethod: 'google' | 'apify' | 'firecrawl' | 'all';
  setSearchMethod: (method: 'google' | 'apify' | 'firecrawl' | 'all') => void;
  isSearching: boolean;
  isAnalyzing: boolean;
  discoveredLeads: AnalyzedLead[];
  onSearchLeads: () => void;
  onAnalyzeWithAI: (leads: AnalyzedLead[]) => void;
  showApiKeyInput: boolean;
  businessProfiles: BusinessProfile[];
  selectedBusinessProfileId: string | null;
  setSelectedBusinessProfileId: (profileId: string | null) => void;
  isLoadingBusinessProfiles: boolean;
}

const SearchForm = ({
  searchQuery,
  setSearchQuery,
  location,
  setLocation,
  country,
  setCountry,
  industry,
  setIndustry,
  apiKey,
  setApiKey,
  searchMethod,
  setSearchMethod,
  isSearching,
  isAnalyzing,
  discoveredLeads,
  onSearchLeads,
  onAnalyzeWithAI,
  showApiKeyInput,
  businessProfiles,
  selectedBusinessProfileId,
  setSelectedBusinessProfileId,
  isLoadingBusinessProfiles
}: SearchFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchLeads();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2 text-primary" />
          Pretraži Leadove
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Poboljšane kategorije za preciznije rezultate - svaka kategorija koristi specifične Google upite
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Za koje poduzeće tražiš leadove?
            </label>
            {businessProfiles.length > 0 ? (
              <Select
                value={selectedBusinessProfileId ?? undefined}
                onValueChange={setSelectedBusinessProfileId}
                disabled={isLoadingBusinessProfiles}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberi poslovni profil" />
                </SelectTrigger>
                <SelectContent>
                  {businessProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id!}>
                      {profile.name} {profile.company_name ? `• ${profile.company_name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Prvo dodaj poslovni profil u Settings da bi se u webhook slao podatak za koju firmu tražiš leadove.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Metoda pretraživanja
            </label>
            <RadioGroup value={searchMethod} onValueChange={setSearchMethod} className="flex gap-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-success" />
                  <span>Svi izvori (paralelno + dedupe)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="apify" id="apify" />
                <Label htmlFor="apify" className="cursor-pointer flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-primary" />
                  <span>Apify</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="google" id="google" />
                <Label htmlFor="google" className="cursor-pointer flex items-center">
                  <Search className="h-4 w-4 mr-1 text-primary" />
                  <span>Google Maps API</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="firecrawl" id="firecrawl" />
                <Label htmlFor="firecrawl" className="cursor-pointer flex items-center">
                  <Globe className="h-4 w-4 mr-1 text-primary" />
                  <span>Firecrawl Web Scraping</span>
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-1">
              {searchMethod === 'all'
                ? 'Pokreće Apify + Firecrawl (+ Google Maps ako je ključ unesen) paralelno i miče duplikate po domeni/telefonu/nazivu.'
                : searchMethod === 'apify'
                ? 'Koristi Apify za najbrže i najpouzdanije rezultate sa Google Mapsa'
                : searchMethod === 'firecrawl'
                ? 'Pretražuje web stranice i ekstraktira kontakt podatke direktno sa web stranica'
                : 'Koristi Google Maps API za direktno pretraživanje'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-foreground mb-1">
                Država
              </label>
              <CountrySelector 
                value={country} 
                onChange={setCountry} 
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
                Grad/Regija *
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
              <label htmlFor="industry" className="block text-sm font-medium text-foreground mb-1">
                Industrija (poboljšane kategorije)
              </label>
              <IndustrySelector 
                value={industry} 
                onChange={setIndustry} 
              />
            </div>
          </div>

          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-foreground mb-1">
              Dodatni uvjeti pretraživanja (opcionalno)
            </label>
            <Input
              id="searchQuery"
              type="text"
              placeholder="npr. veliki, novo otvoren, premium..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tip: Ostavite prazno za najbolje rezultate s odabranom kategorijom
            </p>
          </div>

          {showApiKeyInput && searchMethod === 'google' && (
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-foreground mb-1">
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
              <p className="text-xs text-muted-foreground mt-1">
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

          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
