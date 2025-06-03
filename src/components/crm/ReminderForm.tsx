import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users } from 'lucide-react';
import { Reminder, Lead } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface NewReminderForm {
  title: string;
  description: string;
  date: string;
  time: string;
  priority: Reminder['priority'];
  company: string;
  companyInputMode: 'select' | 'manual';
}

interface ReminderFormProps {
  newReminder: NewReminderForm;
  setNewReminder: (reminder: NewReminderForm) => void;
  leads: Lead[];
  onCreateReminder: () => void;
}

const ReminderForm = ({ newReminder, setNewReminder, leads, onCreateReminder }: ReminderFormProps) => {
  const { toast } = useToast();

  const handleSubmit = () => {
    try {
      if (!newReminder.title || !newReminder.date || !newReminder.time || !newReminder.company) {
        toast({
          title: "Nedostaju podaci",
          description: "Molimo unesite sve potrebne podatke za podsjetnik.",
          variant: "destructive"
        });
        return;
      }
      onCreateReminder();
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom kreiranja podsjetnika.",
        variant: "destructive"
      });
    }
  };

  return (
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
          <div className="space-y-2">
            <Select 
              value={newReminder.companyInputMode} 
              onValueChange={(value: 'select' | 'manual') => {
                setNewReminder({
                  ...newReminder, 
                  companyInputMode: value,
                  company: ''
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Odaberite način unosa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Odaberi iz Lead Hunter-a</SelectItem>
                <SelectItem value="manual">Unesi ručno</SelectItem>
              </SelectContent>
            </Select>

            {newReminder.companyInputMode === 'select' ? (
              <Select 
                value={newReminder.company} 
                onValueChange={(value) => setNewReminder({...newReminder, company: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite tvrtku" />
                </SelectTrigger>
                <SelectContent>
                  {leads.length > 0 ? (
                    leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.company}>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {lead.company}
                          <span className="text-xs text-slate-500 ml-2">({lead.status})</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-sm text-slate-500">
                      Nema leadova u sustavu
                    </div>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Unesite naziv tvrtke"
                value={newReminder.company}
                onChange={(e) => setNewReminder({...newReminder, company: e.target.value})}
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Opis
          </label>
          <Textarea
            placeholder="Opis aktivnosti"
            value={newReminder.description}
            onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
            className="min-h-16"
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

        <div className="grid grid-cols-2 gap-2">
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
        </div>

        <Button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Stvori Podsjetnik
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReminderForm;
