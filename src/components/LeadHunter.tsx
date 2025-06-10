import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MapPin, Users, Phone, Mail, Edit, Trash2, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead } from '@/types';
import AddLeadDialog from './AddLeadDialog';
import ExportButton from './ExportButton';
import { useToast } from '@/hooks/use-toast';

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

  const [leads, setLeads] = useLocalStorage<Lead[]>('leads', [
    {
      id: 1,
      company: 'Praonica Split',
      location: 'Split, Croatia',
      employees: '15-25',
      phone: '+385 21 123 456',
      email: 'info@praonica-split.hr',
      status: 'Nova',
      potential: 'Visok',
      dateAdded: '2024-02-10',
      industry: 'Praonice'
    },
    {
      id: 2,
      company: 'Čistoća Zagreb d.o.o.',
      location: 'Zagreb, Croatia',
      employees: '50-100',
      phone: '+385 1 987 654',
      email: 'kontakt@cistoca-zg.hr',
      status: 'Kontaktiran',
      potential: 'Srednji',
      dateAdded: '2024-02-08',
      industry: 'Čišćenje'
    },
    {
      id: 3,
      company: 'Bijelo rublje Rijeka',
      location: 'Rijeka, Croatia',
      employees: '10-20',
      phone: '+385 51 456 789',
      email: 'office@bijelo-rublje.hr',
      status: 'Zainteresiran',
      potential: 'Visok',
      dateAdded: '2024-02-05',
      industry: 'Praonice'
    },
    {
      id: 4,
      company: 'Hotel Dubrovnik',
      location: 'Dubrovnik, Croatia',
      employees: '100-200',
      phone: '+385 20 123 456',
      email: 'reservations@hotel-dubrovnik.hr',
      status: 'Nova',
      potential: 'Visok',
      dateAdded: '2024-02-12',
      industry: 'Hoteli'
    },
    {
      id: 5,
      company: 'Restoran Kod Ante',
      location: 'Pula, Croatia',
      employees: '10-15',
      phone: '+385 52 987 654',
      email: 'info@kod-ante.hr',
      status: 'Kontaktiran',
      potential: 'Srednji',
      dateAdded: '2024-02-09',
      industry: 'Restorani'
    },
    {
      id: 6,
      company: 'Beauty Salon Lux',
      location: 'Osijek, Croatia',
      employees: '5-10',
      phone: '+385 31 456 789',
      email: 'booking@beauty-lux.hr',
      status: 'Nova',
      potential: 'Nizak',
      dateAdded: '2024-02-11',
      industry: 'Ljepota i wellness'
    }
  ]);

  const { toast } = useToast();

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

  const checkForDuplicate = (company: string, email: string): boolean => {
    return leads.some(lead => 
      lead.company.toLowerCase() === company.toLowerCase() || 
      lead.email.toLowerCase() === email.toLowerCase()
    );
  };

  const addLead = (newLeadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    // Check for duplicates
    if (checkForDuplicate(newLeadData.company, newLeadData.email)) {
      toast({
        title: "Duplikat pronađen",
        description: `Lead s tim nazivom tvrtke ili email adresom već postoji.`,
        variant: "destructive",
      });
      return;
    }

    const newLead: Lead = {
      ...newLeadData,
      id: Date.now(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setLeads([...leads, newLead]);
    toast({
      title: "Lead dodan",
      description: `${newLead.company} je uspješno dodan u sustav.`,
    });
  };

  const updateLeadStatus = (leadId: number, newStatus: Lead['status']) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
    toast({
      title: "Status ažuriran",
      description: "Status lead-a je uspješno ažuriran.",
    });
  };

  const deleteLead = (leadId: number) => {
    const leadToDelete = leads.find(lead => lead.id === leadId);
    setLeads(leads.filter(lead => lead.id !== leadId));
    toast({
      title: "Lead obrisan",
      description: `${leadToDelete?.company} je obrisan iz sustava.`,
    });
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nova': return 'bg-blue-100 text-blue-800';
      case 'Kontaktiran': return 'bg-yellow-100 text-yellow-800';
      case 'Zainteresiran': return 'bg-green-100 text-green-800';
      case 'Zatvoren': return 'bg-purple-100 text-purple-800';
      case 'Odbačen': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'Visok': return 'bg-red-100 text-red-800';
      case 'Srednji': return 'bg-orange-100 text-orange-800';
      case 'Nizak': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{lead.company}</h3>
                    <div className="flex items-center text-slate-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{lead.location || 'Lokacija nepoznata'}</span>
                      <Users className="h-4 w-4 ml-4 mr-1" />
                      <span className="text-sm">{lead.employees} zaposlenika</span>
                      {lead.industry && (
                        <>
                          <span className="mx-2 text-slate-400">•</span>
                          <Badge variant="outline" className="text-xs">
                            {lead.industry}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                    <Badge className={getPotentialColor(lead.potential)}>
                      {lead.potential} potencijal
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4">
                    <div className="flex items-center text-slate-600">
                      <Phone className="h-4 w-4 mr-1" />
                      <span className="text-sm">{lead.phone}</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                      <Mail className="h-4 w-4 mr-1" />
                      <button 
                        onClick={() => handleEmailClick(lead.email, lead.company)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        title="Kliknite za slanje emaila"
                      >
                        {lead.email}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Select onValueChange={(value: Lead['status']) => updateLeadStatus(lead.id, value)}>
                      <SelectTrigger className="w-32">
                        <Edit className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nova">Nova</SelectItem>
                        <SelectItem value="Kontaktiran">Kontaktiran</SelectItem>
                        <SelectItem value="Zainteresiran">Zainteresiran</SelectItem>
                        <SelectItem value="Zatvoren">Zatvoren</SelectItem>
                        <SelectItem value="Odbačen">Odbačen</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteLead(lead.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                {activeFiltersCount > 0 ? 
                  "Nema leadova koji odgovaraju zadanim filterima." :
                  "Nema leadova koji odgovaraju kriterijima pretrage."
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadHunter;
