
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

const CRMReminder = () => {
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
  });

  const reminders = [
    {
      id: 1,
      title: 'Poziv Praonica Split',
      description: 'Zakazati demo prezentaciju Marketing Agent platforme',
      date: '2024-02-15',
      time: '14:00',
      priority: 'Visok',
      status: 'Aktivan',
      company: 'Praonica Split'
    },
    {
      id: 2,
      title: 'Follow-up email Čistoća Zagreb',
      description: 'Poslati detaljan poslovni prijedlog s cijenama',
      date: '2024-02-16',
      time: '10:30',
      priority: 'Srednji',
      status: 'Aktivan',
      company: 'Čistoća Zagreb'
    },
    {
      id: 3,
      title: 'Pregled ponude Bijelo rublje',
      description: 'Provjeriti status ponude i kontaktirati klijenta',
      date: '2024-02-14',
      time: '16:00',
      priority: 'Nizak',
      status: 'Završen',
      company: 'Bijelo rublje'
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Visok': return 'bg-red-100 text-red-800';
      case 'Srednji': return 'bg-yellow-100 text-yellow-800';
      case 'Nizak': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'Završen' ? 
      <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
      <AlertCircle className="h-4 w-4 text-orange-600" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">CRM Podsjetnik</h2>
          <p className="text-slate-600">Upravljajte terminima i komunikacijom s klijentima</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novi Podsjetnik
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Aktivni Podsjetnici
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(reminder.status)}
                        <h3 className="font-semibold text-slate-900">{reminder.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{reminder.description}</p>
                      <p className="text-xs text-slate-500">{reminder.company}</p>
                    </div>
                    <Badge className={getPriorityColor(reminder.priority)}>
                      {reminder.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{reminder.date}</span>
                      <Clock className="h-4 w-4 ml-3 mr-1" />
                      <span>{reminder.time}</span>
                    </div>
                    <div className="flex space-x-2">
                      {reminder.status === 'Aktivan' && (
                        <>
                          <Button variant="outline" size="sm">
                            Završi
                          </Button>
                          <Button variant="outline" size="sm">
                            Odgodi
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brzi Podsjetnik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Naslov
              </label>
              <Input
                placeholder="Naslov podsjetnika"
                value={newReminder.title}
                onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Opis
              </label>
              <Textarea
                placeholder="Opis aktivnosti"
                value={newReminder.description}
                onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                className="min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Datum
              </label>
              <Input
                type="date"
                value={newReminder.date}
                onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vrijeme
              </label>
              <Input
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
              />
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700">
              Stvori Podsjetnik
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMReminder;
