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

const emptyForm = () => ({
  company: '', location: '', city: '', employees: '', contact_person: '', phone: '', email: '', website: '',
  status: 'Nova' as Lead['status'], potential: 'Srednji' as Lead['potential'], industry: '', interested_in: 'Orderly',
  locations_count: '', next_step: '', notes: '',
});

const AddLeadDialog = ({ open, onOpenChange, onAddLead }: AddLeadDialogProps) => {
  const [formData, setFormData] = useState(emptyForm());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<Lead, 'id' | 'dateAdded'> = {
      company: formData.company,
      location: formData.location,
      employees: formData.employees,
      phone: formData.phone,
      email: formData.email,
      website: formData.website || undefined,
      status: formData.status,
      potential: formData.potential,
      industry: formData.industry,
      city: formData.city,
      interested_in: formData.interested_in,
      locations_count: formData.locations_count === '' ? undefined : Number(formData.locations_count),
      next_step: formData.next_step || undefined,
      notes: [formData.contact_person ? `Kontakt osoba: ${formData.contact_person}` : '', formData.notes].filter(Boolean).join('\n') || undefined,
    };
    const success = await onAddLead(payload);
    if (success) {
      setFormData(emptyForm());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[96dvh] w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl p-4 sm:max-w-[560px] sm:p-6">
        <DialogHeader><DialogTitle>Dodaj novi lead</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tvrtka *"><Input value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} required /></Field>
            <Field label="Kontakt osoba"><Input value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} /></Field>
            <Field label="Telefon"><Input inputMode="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></Field>
            <Field label="Email"><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></Field>
            <Field label="Web"><Input value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} placeholder="https://..." /></Field>
            <Field label="Grad"><Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} /></Field>
            <Field label="Lokacija / adresa"><Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></Field>
            <Field label="Industrija"><Input value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})} placeholder="Restoran, hotel, praonica..." /></Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Zainteresiran za">
              <Select value={formData.interested_in} onValueChange={(value) => setFormData({...formData, interested_in: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Orderly">Orderly</SelectItem><SelectItem value="AutomindAI">AutomindAI</SelectItem><SelectItem value="Oprema praone">Oprema praone</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Potencijal">
              <Select value={formData.potential} onValueChange={(value: Lead['potential']) => setFormData({...formData, potential: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Visok">Visok</SelectItem><SelectItem value="Srednji">Srednji</SelectItem><SelectItem value="Nizak">Nizak</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Broj lokacija"><Input type="number" min="0" inputMode="numeric" value={formData.locations_count} onChange={(e) => setFormData({...formData, locations_count: e.target.value})} /></Field>
          </div>

          <Field label="Sljedeći korak"><Input value={formData.next_step} onChange={(e) => setFormData({...formData, next_step: e.target.value})} placeholder="Npr. nazvati vlasnika, poslati demo..." /></Field>
          <Field label="Bilješke"><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="min-h-24" /></Field>
          <Button type="submit" className="h-12 w-full">Dodaj lead u CRM</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div><label className="mb-1 block text-sm font-medium">{label}</label>{children}</div>;

export default AddLeadDialog;
