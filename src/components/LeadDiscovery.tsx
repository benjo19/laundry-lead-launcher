
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Brain, Plus, Loader2, Building2, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types';

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

interface LeadDiscoveryProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
}

const LeadDiscovery = ({ onAddLead }: LeadDiscoveryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('laundry');
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([]);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const industries = [
    { value: 'laundry', label: 'Praonica rublja', query: 'laundry dry cleaning' },
    { value: 'restaurant', label: 'Restorani', query: 'restaurant food service' },
    { value: 'hotel', label: 'Hoteli', query: 'hotel accommodation' },
    { value: 'gym', label: 'Teretane', query: 'gym fitness center' },
    { value: 'spa', label: 'Spa centri', query: 'spa wellness center' },
    { value: 'hospital', label: 'Bolnice', query: 'hospital medical center' },
    { value: 'school', label: 'Škole', query: 'school education' },
  ];

  const searchLeads = async () => {
    if (!apiKey) {
      toast({
        title: "API ključ potreban",
        description: "Molimo unesite Google Maps API ključ.",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "Lokacija potrebna",
        description: "Molimo unesite lokaciju za pretraživanje.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const selectedIndustry = industries.find(ind => ind.value === industry);
      const query = searchQuery || selectedIndustry?.query || 'business';
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' in ' + location)}&key=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Greška pri dohvaćanju podataka');
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(data.error_message || 'Greška pri pretraživanju');
      }
      
      setDiscoveredLeads(data.results.slice(0, 10)); // Limit to 10 results
      
      toast({
        title: "Pretraživanje završeno",
        description: `Pronađeno ${data.results.length} potencijalnih leadova.`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri pretraživanju leadova.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addDiscoveredLead = (discoveredLead: DiscoveredLead) => {
    const newLead: Omit<Lead, 'id' | 'dateAdded'> = {
      company: discoveredLead.name,
      location: discoveredLead.address,
      employees: '10-50', // Default estimate
      phone: discoveredLead.phone || '',
      email: '', // Will need to be filled manually
      status: 'Nova',
      potential: 'Srednji',
      notes: `Pronađeno putem Google Maps - Rating: ${discoveredLead.rating || 'N/A'}, Tipovi: ${discoveredLead.types.join(', ')}`
    };

    onAddLead(newLead);
    
    // Remove from discovered leads
    setDiscoveredLeads(prevLeads => 
      prevLeads.filter(lead => lead.place_id !== discoveredLead.place_id)
    );

    toast({
      title: "Lead dodan",
      description: `${discoveredLead.name} je dodan u Lead Hunter.`,
    });
  };

  const analyzeWithAI = async (leads: DiscoveredLead[]) => {
    toast({
      title: "AI analiza",
      description: "AI funkcionalnost će biti dodana u budućoj verziji.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Lead Discovery</h2>
          <p className="text-slate-600">Pronađite nove leadove pomoću Google Maps i AI analize</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-600" />
            Parametri pretraživanja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              onClick={searchLeads} 
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
                onClick={() => analyzeWithAI(discoveredLeads)}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Analiza
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {discoveredLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-green-600" />
              Pronađeni Leadovi ({discoveredLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {discoveredLeads.map((lead) => (
                <div key={lead.place_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{lead.name}</h3>
                      <div className="flex items-center text-slate-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{lead.address}</span>
                      </div>
                      {lead.rating && (
                        <div className="flex items-center mt-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm text-slate-600 ml-1">{lead.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {lead.types.slice(0, 2).map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => addDiscoveredLead(lead)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Dodaj
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    {lead.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      <span className="text-slate-400">Email potreban</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {discoveredLeads.length === 0 && !isSearching && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Započnite pretraživanje</h3>
            <p className="text-slate-600">
              Unesite lokaciju i odaberite industriju za pronalaženje novih leadova
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadDiscovery;
