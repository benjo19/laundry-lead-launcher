import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users } from 'lucide-react';
import { Reminder, Lead, ReminderFormData, ReminderEventType } from '@/types';
import { EVENT_TYPE_LABEL, PROJECTS } from './CRMCalendar';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';


interface ReminderFormProps {
  newReminder: ReminderFormData;
  setNewReminder: (reminder: ReminderFormData) => void;
  leads: Lead[];
  onCreateReminder: () => void;
  editingReminder?: Reminder | null;
  onCancelEdit?: () => void;
  partnerMode?: boolean;
}

const ReminderForm = ({ newReminder, setNewReminder, leads, onCreateReminder, editingReminder, onCancelEdit, partnerMode = false }: ReminderFormProps) => {
  const { toast } = useToast();
  const { isSalesPartner } = useUserRole();
  const effectivePartnerMode = partnerMode || isSalesPartner;

  const handleSubmit = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time || !newReminder.company) {
      toast({ title: 'Nedostaju podaci', description: 'Unesi naslov, klijenta, datum i vrijeme.', variant: 'destructive' });
      return;
    }
    onCreateReminder();
  };

  const clientSelect = (
    <Select value={newReminder.company} onValueChange={(value) => { const lead = leads.find(l => l.company === value); const proj = PROJECTS.some(p => p.value === lead?.interested_in) ? String(lead?.interested_in) : newReminder.project; setNewReminder({ ...newReminder, company: value, companyInputMode: 'select', leadUuid: lead?.uuid, project: proj }); }}>
      <SelectTrigger className="h-11"><SelectValue placeholder={effectivePartnerMode ? 'Odaberi klijenta' : 'Odaberi lead'} /></SelectTrigger>
      <SelectContent>
        {leads.length > 0 ? leads.map((lead) => <SelectItem key={lead.uuid || lead.id} value={lead.company}><div className="flex items-center"><Users className="mr-2 h-4 w-4" />{lead.company}<span className="ml-2 text-xs text-muted-foreground">({lead.status})</span></div></SelectItem>) : <div className="px-2 py-2 text-sm text-muted-foreground">Nema dostupnih leadova.</div>}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      {editingReminder && onCancelEdit && <div className="flex justify-end"><Button variant="ghost" size="sm" onClick={onCancelEdit}>Odustani od uređivanja</Button></div>}
      <Field label="Naslov *"><Input className="h-11" placeholder="Npr. nazvati vlasnika" value={newReminder.title} onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })} /></Field>
      <Field label={effectivePartnerMode ? 'Klijent *' : 'Lead / tvrtka *'}>
        <div className="space-y-2">
          {effectivePartnerMode ? clientSelect : <>
            <Select value={newReminder.companyInputMode} onValueChange={(value: 'select' | 'manual') => setNewReminder({ ...newReminder, companyInputMode: value, company: '', leadUuid: undefined })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="select">Odaberi postojeći lead</SelectItem><SelectItem value="manual">Unesi ručno</SelectItem></SelectContent>
            </Select>
            {newReminder.companyInputMode === 'select' ? clientSelect : <Input className="h-11" placeholder="Naziv tvrtke" value={newReminder.company} onChange={(e) => setNewReminder({ ...newReminder, company: e.target.value, leadUuid: undefined })} />}
          </>}
        </div>
      </Field>
      <Field label="Napomena"><Textarea placeholder="Što treba napraviti?" value={newReminder.description} onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })} className="min-h-20" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Vrsta"><Select value={newReminder.eventType} onValueChange={(v: ReminderEventType) => setNewReminder({ ...newReminder, eventType: v })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EVENT_TYPE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Projekt"><Select value={newReminder.project || 'none'} onValueChange={(v) => setNewReminder({ ...newReminder, project: v === 'none' ? '' : v })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Bez projekta</SelectItem>{PROJECTS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></Field>
      </div>
      <Field label="Prioritet"><Select value={newReminder.priority} onValueChange={(value: Reminder['priority']) => setNewReminder({ ...newReminder, priority: value })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Visok">Visok</SelectItem><SelectItem value="Srednji">Srednji</SelectItem><SelectItem value="Nizak">Nizak</SelectItem></SelectContent></Select></Field>
      <div className="grid grid-cols-2 gap-2"><Field label="Datum *"><Input className="h-11" type="date" value={newReminder.date} onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })} /></Field><Field label="Vrijeme *"><Input className="h-11" type="time" value={newReminder.time} onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })} /></Field></div>
      <Field label="Trajanje"><Select value={String(newReminder.durationMinutes)} onValueChange={(v) => setNewReminder({ ...newReminder, durationMinutes: Number(v) })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{[15, 30, 45, 60, 90, 120].map(m => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}</SelectContent></Select></Field>
      <p className="text-xs text-muted-foreground">Vrijeme je po zoni Europe/Zagreb.</p>
      <Button onClick={handleSubmit} className="h-11 w-full"><Plus className="mr-2 h-4 w-4" />{editingReminder ? 'Spremi izmjene' : 'Postavi follow-up'}</Button>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-1.5"><label className="text-sm font-medium">{label}</label>{children}</div>;
export default ReminderForm;
