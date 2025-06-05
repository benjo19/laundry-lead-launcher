
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Sparkles, Settings, Loader2 } from 'lucide-react';
import IndustrySelector, { industries } from './IndustrySelector';
import ExportButton from '@/components/ExportButton';
import { useAISettings } from '@/hooks/useAISettings';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';

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
  discoveredLeads: AnalyzedLead[];
  onSearchLeads: () => void;
  onAnalyzeWithAI: (leads: AnalyzedLead[]) => void;
  showApiKeyInput?: boolean;
  isAnalyzing?: boolean;
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
  showApiKeyInput = true,
  isAnalyzing = false
}: SearchFormProps) => {
  const { isAIConfigured } = useAISettings();

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <span className="flex items-center">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
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
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 gap-4">
            {showApiKeyInput && (
              <div className="space-y-2 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-orange-200">
                <Label htmlFor="apiKey" className="text-orange-800 font-semibold">Google Maps API ključ</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Unesite Google Maps API ključ ili ga postavite u Settings"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-white border-orange-300 focus:border-orange-500"
                />
                <p className="text-xs text-orange-600">
                  💡 Postavite API ključ u Settings da ga ne morate unositi svaki put
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-700 font-semibold">Lokacija</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                <Input
                  id="location"
                  placeholder="Zagreb, Split, Rijeka..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 bg-white border-2 border-gray-200 focus:border-blue-400 hover:border-blue-300 transition-colors"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Industrija</Label>
              <IndustrySelector value={industry} onChange={setIndustry} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchQuery" className="text-slate-700 font-semibold">Prilagođena pretraga (opcionalno)</Label>
              <Input
                id="searchQuery"
                placeholder="Dodajte specifične ključne riječi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-2 border-gray-200 focus:border-purple-400 hover:border-purple-300 transition-colors"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button 
              onClick={onSearchLeads} 
              disabled={isSearching}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Pretražujem...' : 'Pretražuj Leadove'}
            </Button>
            {discoveredLeads.length > 0 && (
              <Button 
                onClick={() => onAnalyzeWithAI(discoveredLeads)}
                variant="outline"
                disabled={!isAIConfigured() || isAnalyzing}
                className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 hover:from-purple-200 hover:to-pink-200 text-purple-700 font-semibold hover:scale-105 transition-all duration-200"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI Analizira...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Analiza
                  </>
                )}
                {!isAIConfigured() && (
                  <Settings className="h-4 w-4 ml-1 text-amber-500" />
                )}
              </Button>
            )}
          </div>

          {!isAIConfigured() && discoveredLeads.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium">
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
