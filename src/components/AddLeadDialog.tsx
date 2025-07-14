
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Lead } from '@/types';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'dateAdded'>) => Promise<boolean>;
}

const AddLeadDialog = ({ open, onOpenChange, onAddLead }: AddLeadDialogProps) => {
  const [formData, setFormData] = useState({
    company: '',
    location: '',
    employees: '',
    phone: '',
    email: '',
    status: 'Nova' as Lead['status'],
    potential: 'Srednji' as Lead['potential'],
    industry: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AddLeadDialog: handleSubmit called with formData:', formData);
    
    try {
      const success = await onAddLead(formData);
      console.log('AddLeadDialog: onAddLead result:', success);
      
      if (success) {
        setFormData({
          company: '',
          location: '',
          employees: '',
          phone: '',
          email: '',
          status: 'Nova',
          potential: 'Srednji',
          industry: '',
          notes: ''
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('AddLeadDialog: Error in handleSubmit:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <label className="block text-sm font-medium mb-1">Industrija</label>
            <Input
              value={formData.industry}
              onChange={(e) => setFormData({...formData, industry: e.target.value})}
              placeholder="npr. Praonice, Hoteli, Restorani..."
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
