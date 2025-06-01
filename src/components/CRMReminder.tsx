
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Plus, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Reminder } from '@/types';
import { useToast } from '@/hooks/use-toast';

const CRMReminder = () => {
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    priority: 'Srednji' as Reminder['priority'],
    company: ''
  });

  const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', [
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
  ]);

  const { toast } = useToast();

  const createReminder = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time || !newReminder.company) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite sve potrebne podatke za podsjetnik.",
        variant: "destructive"
      });
      return;
    }

    const reminder: Reminder = {
      ...newReminder,
      id: Date.now(),
      status: 'Aktivan'
    };

    setReminders([reminder, ...reminders]);
    setNewReminder({
      title: '',
      description: '',
      date: '',
      time: '',
      priority: 'Srednji',
      company: ''
    });

    toast({
      title: "Podsjetnik kreiran",
      description: `Podsjetnik "${reminder.title}" je uspješno kreiran.`,
    });
  };

  const updateReminderStatus = (reminderId: number, newStatus: Reminder['status']) => {
    setReminders(reminders.map(reminder => 
      reminder.id === reminderId ? { ...reminder, status: newStatus } : reminder
    ));
    
    const reminderTitle = reminders.find(r => r.id === reminderId)?.title;
    toast({
      title: "Status ažuriran",
      description: `Podsjetnik "${reminderTitle}" je označen kao ${newStatus.toLowerCase()}.`,
    });
  };

  const deleteReminder = (reminderId: number) => {
    const reminderToDelete = reminders.find(r => r.id === reminderId);
    setReminders(reminders.filter(reminder => reminder.id !== reminderId));
    toast({
      title: "Podsjetnik obrisan",
      description: `"${reminderToDelete?.title}" je obrisan.`,
    });
  };

  const postponeReminder = (reminderId: number) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    // Postpone by 1 day
    const currentDate = new Date(reminder.date);
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = currentDate.toISOString().split('T')[0];

    setReminders(reminders.map(r => 
      r.id === reminderId ? { ...r, date: newDate, status: 'Odgođen' } : r
    ));

    toast({
      title: "Podsjetnik odgođen",
      description: `"${reminder.title}" je odgođen za jedan dan.`,
    });
  };

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

  const activeReminders = reminders.filter(r => r.status === 'Aktivan');
  const completedReminders = reminders.filter(r => r.status === 'Završen');
  const postponedReminders = reminders.filter(r => r.status === 'Odgođen');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">CRM Podsjetnik</h2>
          <p className="text-slate-600">Upravljajte terminima i komunikacijom s klijentima</p>
        </div>
        <div className="flex space-x-2">
          <span className="text-sm text-slate-600">
            Aktivno: {activeReminders.length} | Završeno: {completedReminders.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Svi Podsjetnici
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
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          reminder.status === 'Aktivan' ? 'bg-blue-100 text-blue-800' :
                          reminder.status === 'Završen' ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {reminder.status}
                        </span>
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateReminderStatus(reminder.id, 'Završen')}
                          >
                            Završi
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => postponeReminder(reminder.id)}
                          >
                            Odgodi
                          </Button>
                        </>
                      )}
                      {reminder.status === 'Završen' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateReminderStatus(reminder.id, 'Aktivan')}
                        >
                          Aktiviraj
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {reminders.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Nemate kreanih podsjetnika.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2 text-green-600" />
              Novi Podsjetnik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Naslov *
              </label>
              <Input
                placeholder="Naslov podsjetnika"
                value={newReminder.title}
                onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tvrtka *
              </label>
              <Input
                placeholder="Naziv tvrtke"
                value={newReminder.company}
                onChange={(e) => setNewReminder({...newReminder, company: e.target.value})}
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
                Prioritet
              </label>
              <Select value={newReminder.priority} onValueChange={(value: Reminder['priority']) => setNewReminder({...newReminder, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visok">Visok</SelectItem>
                  <SelectItem value="Srednji">Srednji</SelectItem>
                  <SelectItem value="Nizak">Nizak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Datum *
              </label>
              <Input
                type="date"
                value={newReminder.date}
                onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vrijeme *
              </label>
              <Input
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
              />
            </div>

            <Button onClick={createReminder} className="w-full bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Stvori Podsjetnik
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMReminder;
