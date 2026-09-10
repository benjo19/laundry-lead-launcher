import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CalendarClock, Mail, MapPin, Phone, Save, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

type Owner = { id: string; email: string | null; role: string };

type LeadDetail = {
  id: string;
  user_id: string;
  created_by: string | null;
  assigned_to: string | null;
  company: string;
  location: string | null;
  city: string | null;
  country?: string | null;
  contact_person?: string | null;
  phone: string | null;
  phone2?: string | null;
  email: string | null;
  website?: string | null;
  status: string | null;
  potential?: string | null;
  industry?: string | null;
  notes?: string | null;
  source: string | null;
  created_at: string | null;
};

type ReminderRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  priority: string;
  status: string;
};

interface Props {
  lead: LeadDetail | null;
  owners: Owner[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void> | void;
}

const STATUSES = ['Nova', 'Kontaktiran', 'Demo', 'Trial', 'Plaća', 'Sastanak', 'Ponuda', 'Pregovori', 'Dobiveno', 'Izgubljeno'];
const PRIORITIES = ['Nizak', 'Srednji', 'Visok'];

const LeadDetailDialog: React.FC<Props> = ({ lead, owners, open, onOpenChange, onChanged }) => {
  const { user } = useAuthContext();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [followUp, setFollowUp] = useState({ title: 'Follow-up', description: '', date: '', time: '09:00', priority: 'Srednji' });
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);

  const ownerMap = useMemo(() => new Map(owners.map((owner) => [owner.id, owner])), [owners]);

  useEffect(() => {
    if (!lead || !open) return;
    setForm({
      company: lead.company || '',
      contact_person: lead.contact_person || '',
      phone: lead.phone || '',
      phone2: lead.phone2 || '',
      email: lead.email || '',
      website: lead.website || '',
      location: lead.location || '',
      city: lead.city || '',
      country: lead.country || '',
      industry: lead.industry || '',
      status: lead.status || 'Nova',
      potential: lead.potential || 'Srednji',
      notes: lead.notes || '',
      assigned_to: lead.assigned_to || lead.user_id,
    });
    loadReminders(lead.id);
  }, [lead?.id, open]);

  const loadReminders = async (leadId: string) => {
    const db = supabase as any;
    const { data, error } = await db.from('reminders')
      .select('id,title,description,date,time,priority,status')
      .eq('lead_id', leadId)
      .order('date', { ascending: false });
    if (!error) setReminders(data ?? []);
  };

  if (!lead) return null;

  const setField = (key: string, value: string) => setForm((current: any) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const db = supabase as any;
      const { error } = await db.from('leads').update({
        company: form.company.trim(),
        contact_person: form.contact_person.trim() || null,
        phone: form.phone.trim() || null,
        phone2: form.phone2.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        location: form.location.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        industry: form.industry.trim() || null,
        status: form.status,
        potential: form.potential,
        notes: form.notes.trim() || null,
        assigned_to: form.assigned_to,
        updated_at: new Date().toISOString(),
      }).eq('id', lead.id);
      if (error) throw error;
      toast.success('Lead je ažuriran.');
      await onChanged();
    } catch (error: any) {
      toast.error(error?.message || 'Nije moguće spremiti promjene.');
    } finally {
      setSaving(false);
    }
  };

  const createFollowUp = async () => {
    if (!followUp.date) {
      toast.error('Odaberi datum follow-upa.');
      return;
    }
    setCreatingFollowUp(true);
    try {
      const db = supabase as any;
      const { error } = await db.from('reminders').insert({
        user_id: form.assigned_to || user?.id,
        lead_id: lead.id,
        title: followUp.title.trim() || 'Follow-up',
        description: followUp.description.trim() || null,
        date: followUp.date,
        time: followUp.time || '09:00',
        priority: followUp.priority,
        status: 'Aktivan',
        company: form.company || lead.company,
      });
      if (error) throw error;
      toast.success('Follow-up je postavljen.');
      setFollowUp({ title: 'Follow-up', description: '', date: '', time: '09:00', priority: 'Srednji' });
      await loadReminders(lead.id);
    } catch (error: any) {
      toast.error(error?.message || 'Nije moguće postaviti follow-up.');
    } finally {
      setCreatingFollowUp(false);
    }
  };

  const deleteLead = async () => {
    setDeleting(true);
    try {
      const db = supabase as any;
      const { error: reminderError } = await db.from('reminders').delete().eq('lead_id', lead.id);
      if (reminderError) throw reminderError;
      const { error } = await db.from('leads').delete().eq('id', lead.id);
      if (error) throw error;
      toast.success('Lead i vezani follow-upovi su obrisani.');
      onOpenChange(false);
      await onChanged();
    } catch (error: any) {
      toast.error(error?.message || 'Nije moguće obrisati lead.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{form.company || lead.company}</DialogTitle>
          <DialogDescription>Orderly lead account · svi podaci, follow-up i vlasništvo na jednom mjestu.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{form.status || 'Nova'}</Badge>
          <Badge variant="outline"><UserRound className="mr-1 h-3 w-3" />{ownerMap.get(form.assigned_to)?.email || 'Owner'}</Badge>
          {form.city && <Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />{form.city}</Badge>}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border p-4">
            <div><h3 className="font-semibold">Kontakt i podaci</h3><p className="text-sm text-muted-foreground">Klikni Spremi nakon izmjena.</p></div>
            <Field label="Naziv firme"><Input value={form.company || ''} onChange={(e) => setField('company', e.target.value)} /></Field>
            <Field label="Kontakt osoba"><Input value={form.contact_person || ''} onChange={(e) => setField('contact_person', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefon"><Input value={form.phone || ''} onChange={(e) => setField('phone', e.target.value)} /></Field>
              <Field label="Drugi telefon"><Input value={form.phone2 || ''} onChange={(e) => setField('phone2', e.target.value)} /></Field>
            </div>
            <Field label="Email"><Input value={form.email || ''} onChange={(e) => setField('email', e.target.value)} /></Field>
            <Field label="Web"><Input value={form.website || ''} onChange={(e) => setField('website', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lokacija / adresa"><Input value={form.location || ''} onChange={(e) => setField('location', e.target.value)} /></Field>
              <Field label="Grad"><Input value={form.city || ''} onChange={(e) => setField('city', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status"><Select value={form.status || 'Nova'} onValueChange={(v) => setField('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Potencijal"><Select value={form.potential || 'Srednji'} onValueChange={(v) => setField('potential', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <Field label="Vlasnik leada"><Select value={form.assigned_to || ''} onValueChange={(v) => setField('assigned_to', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{owners.map((owner) => <SelectItem key={owner.id} value={owner.id}>{owner.id === user?.id ? 'Benjamin / moj lead' : owner.email || owner.id}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Bilješke"><Textarea rows={5} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} /></Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Spremam…' : 'Spremi promjene'}</Button>
              {form.phone && <Button variant="outline" asChild><a href={`tel:${form.phone}`}><Phone className="mr-2 h-4 w-4" />Nazovi</a></Button>}
              {form.email && <Button variant="outline" asChild><a href={`mailto:${form.email}`}><Mail className="mr-2 h-4 w-4" />Email</a></Button>}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border p-4">
            <div><h3 className="font-semibold">Follow-up</h3><p className="text-sm text-muted-foreground">Novi podsjetnik je vezan direktno uz ovaj lead.</p></div>
            <Field label="Naslov"><Input value={followUp.title} onChange={(e) => setFollowUp((v) => ({ ...v, title: e.target.value }))} /></Field>
            <Field label="Napomena"><Textarea rows={3} value={followUp.description} onChange={(e) => setFollowUp((v) => ({ ...v, description: e.target.value }))} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Datum"><Input type="date" value={followUp.date} onChange={(e) => setFollowUp((v) => ({ ...v, date: e.target.value }))} /></Field>
              <Field label="Vrijeme"><Input type="time" value={followUp.time} onChange={(e) => setFollowUp((v) => ({ ...v, time: e.target.value }))} /></Field>
            </div>
            <Field label="Prioritet"><Select value={followUp.priority} onValueChange={(v) => setFollowUp((x) => ({ ...x, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></Field>
            <Button onClick={createFollowUp} disabled={creatingFollowUp} className="w-full"><CalendarClock className="mr-2 h-4 w-4" />{creatingFollowUp ? 'Spremam…' : 'Postavi follow-up'}</Button>

            <div className="border-t pt-4">
              <h4 className="mb-2 font-medium">Povijest follow-upa</h4>
              <div className="space-y-2">
                {reminders.length === 0 && <p className="text-sm text-muted-foreground">Još nema follow-upova za ovaj lead.</p>}
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-2"><div><p className="font-medium">{reminder.title}</p><p className="text-xs text-muted-foreground">{reminder.date} · {reminder.time}</p></div><Badge variant="outline">{reminder.status}</Badge></div>
                    {reminder.description && <p className="mt-2 text-sm text-muted-foreground">{reminder.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Obriši lead</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Potpuno obrisati {form.company || lead.company}?</AlertDialogTitle><AlertDialogDescription>Obrisat će se lead i svi follow-upovi koji su direktno vezani uz njega. Ovu radnju nije moguće poništiti.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Odustani</AlertDialogCancel><AlertDialogAction onClick={deleteLead} disabled={deleting}>{deleting ? 'Brišem…' : 'Da, obriši'}</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;

export default LeadDetailDialog;
