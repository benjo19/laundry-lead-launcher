
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, MapPin, Users, Phone, Mail } from 'lucide-react';

const LeadHunter = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const leads = [
    {
      id: 1,
      company: 'Praonica Split',
      location: 'Split, Croatia',
      employees: '15-25',
      phone: '+385 21 123 456',
      email: 'info@praonica-split.hr',
      status: 'Nova',
      potential: 'Visok'
    },
    {
      id: 2,
      company: 'Čistoća Zagreb d.o.o.',
      location: 'Zagreb, Croatia',
      employees: '50-100',
      phone: '+385 1 987 654',
      email: 'kontakt@cistoca-zg.hr',
      status: 'Kontaktiran',
      potential: 'Srednji'
    },
    {
      id: 3,
      company: 'Bijelo rublje Rijeka',
      location: 'Rijeka, Croatia',
      employees: '10-20',
      phone: '+385 51 456 789',
      email: 'office@bijelo-rublje.hr',
      status: 'Zainteresiran',
      potential: 'Visok'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nova': return 'bg-blue-100 text-blue-800';
      case 'Kontaktiran': return 'bg-yellow-100 text-yellow-800';
      case 'Zainteresiran': return 'bg-green-100 text-green-800';
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Lead Hunter</h2>
          <p className="text-slate-600">Pronađite i upravljajte potencijalnim klijentima</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj Lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pretražite tvrtke, lokacije..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtriraj
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leads.map((lead) => (
              <div key={lead.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{lead.company}</h3>
                    <div className="flex items-center text-slate-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{lead.location}</span>
                      <Users className="h-4 w-4 ml-4 mr-1" />
                      <span className="text-sm">{lead.employees} zaposlenika</span>
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
                      <span className="text-sm">{lead.email}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Kontaktiraj
                    </Button>
                    <Button variant="outline" size="sm">
                      Detalji
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadHunter;
