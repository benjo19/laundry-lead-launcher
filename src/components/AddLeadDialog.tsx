
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { Lead } from '@/types';

interface AddLeadDialogProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
}

const AddLeadDialog = ({ onAddLead }: AddLeadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    location: '',
    employees: '',
    phone: '',
    email: '',
    status: 'Nova' as Lead['status'],
    potential: 'Srednji' as Lead['potential'],
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead(formData);
    setFormData({
      company: '',
      location: '',
      employees: '',
      phone: '',
      email: '',
      status: 'Nova',
      potential: 'Srednji',
      notes: ''
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dodaj Novi Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tvrtka</label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lokacija</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Broj zaposlenika</label>
            <Input
              value={formData.employees}
              onChange={(e) => setFormData({...formData, employees: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Potencijal</label>
            <Select 
              value={formData.potential} 
              onValueChange={(value: Lead['potential']) => setFormData({...formData, potential: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Odaberite potencijal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Visok">Visok</SelectItem>
                <SelectItem value="Srednji">Srednji</SelectItem>
                <SelectItem value="Nizak">Nizak</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bilješke</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="min-h-20"
            />
          </div>
          <Button type="submit" className="w-full">Dodaj Lead</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadDialog;
