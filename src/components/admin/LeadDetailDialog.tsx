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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, CalendarClock, Euro, History, Mail, MapPin, MessageSquarePlus, Phone, Save, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

type Owner = { id: string; email: string | null; role: string };
type LeadDetail = {
  id: string; user_id: string; created_by: string | null; assigned_to: string | null; company: string; location: string | null;
  city: string | null; country?: string | null; contact_person?: string | null; phone: string | null; phone2?: string | null;
  email: string | null; website?: string | null; status: string | null; potential?: string | null; industry?: string | null;
  interested_in?: string | null; notes?: string | null; source: string | null; created_at: string | null; last_contact_at?: string | null;
  contact_outcome?: string | null; next_step?: string | null; next_action_at?: string | null; contact_type?: string | null;
  locations_count?: number | null; won_locations_count?: number | null; opportunity_value?: number | null; actual_mrr?: number | null; lost_reason?: string | null;
};
type ReminderRow = { id: string; title: string; description: string | null; date: string; time: string; priority: string; status: string };
type ActivityRow = { id: string; activity_type: string; title: string | null; notes: string | null; occurred_at: string; created_at: string };
interface Props { lead: LeadDetail | null; owners: Owner[]; open: boolean; onOpenChange: (open: boolean) => void; onChanged: () => Promise<void> | void }

const STATUSES = ['Nova','Kontaktiran','Odgovorio','Demo','Trial','Plaća','Sastanak','Ponuda','Pregovori','Dobiveno','Izgubljeno'];
const PRIORITIES = ['Nizak','Srednji','Visok'];
const ACTIVITY_TYPES = ['Poziv','Email','WhatsApp','Sastanak','Demo','Bilješka'];
const INTERESTS = ['Orderly','AutomindAI','Oprema praone'];
const toLocalDateTimeInput = (value?: string | null) => { if (!value) return ''; const d = new Date(value); if (Number.isNaN(d.getTime())) return ''; const local = new Date(d.getTime() - d.getTimezoneOffset()*60000); return local.toISOString().slice(0,16); };
const localNowInput = () => toLocalDateTimeInput(new Date().toISOString());
const toIsoOrNull = (value?: string) => value ? new Date(value).toISOString() : null;

const LeadDetailDialog: React.FC<Props> = ({ lead, owners, open, onOpenChange, onChanged }) => {
  const { user } = useAuthContext();
  const [form,setForm] = useState<any>({});
  const [saving,setSaving] = useState(false);
  const [deleting,setDeleting] = useState(false);
  const [reminders,setReminders] = useState<ReminderRow[]>([]);
  const [activities,setActivities] = useState<ActivityRow[]>([]);
  const [followUp,setFollowUp] = useState({ title:'Follow-up', description:'', date:'', time:'09:00', priority:'Srednji' });
  const [creatingFollowUp,setCreatingFollowUp] = useState(false);
  const [activity,setActivity] = useState({ activity_type:'Poziv', notes:'', occurred_at:localNowInput() });
  const [savingActivity,setSavingActivity] = useState(false);
  const [activeTab,setActiveTab] = useState('overview');
  const ownerMap = useMemo(() => new Map(owners.map(o => [o.id,o])), [owners]);

  const loadHistory = async (leadId: string) => {
    const db = supabase as any;
    const [r,a] = await Promise.all([
      db.from('reminders').select('id,title,description,date,time,priority,status').eq('lead_id',leadId).order('date',{ascending:false}),
      db.from('lead_activities').select('id,activity_type,title,notes,occurred_at,created_at').eq('lead_id',leadId).order('occurred_at',{ascending:false}),
    ]);
    if (!r.error) setReminders(r.data ?? []);
    if (!a.error) setActivities(a.data ?? []);
  };

  useEffect(() => {
    if (!lead || !open) return;
    setActiveTab('overview');
    setForm({
      company:lead.company||'', contact_person:lead.contact_person||'', phone:lead.phone||'', phone2:lead.phone2||'', email:lead.email||'', website:lead.website||'',
      location:lead.location||'', city:lead.city||'', country:lead.country||'', industry:lead.industry||'', interested_in:lead.interested_in||'', status:lead.status||'Nova',
      potential:lead.potential||'Srednji', notes:lead.notes||'', assigned_to:lead.assigned_to||lead.user_id, last_contact_at:toLocalDateTimeInput(lead.last_contact_at),
      contact_outcome:lead.contact_outcome||'', next_step:lead.next_step||'', next_action_at:toLocalDateTimeInput(lead.next_action_at), contact_type:lead.contact_type||'',
      locations_count:lead.locations_count??'', won_locations_count:lead.won_locations_count??'', opportunity_value:lead.opportunity_value??'', actual_mrr:lead.actual_mrr??'', lost_reason:lead.lost_reason||'',
    });
    setActivity({ activity_type:'Poziv', notes:'', occurred_at:localNowInput() });
    loadHistory(lead.id);
  }, [lead?.id, open]);

  const timeline = useMemo(() => [...activities.map(i => ({id:`a-${i.id}`,kind:'Aktivnost',type:i.activity_type,title:i.title||i.activity_type,note:i.notes,status:null as string|null,at:i.occurred_at})), ...reminders.map(i => ({id:`r-${i.id}`,kind:'Follow-up',type:'Follow-up',title:i.title,note:i.description,status:i.status,at:`${i.date}T${i.time||'00:00'}`}))].sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime()), [activities,reminders]);
  if (!lead) return null;
  const setField = (key:string,value:string|number) => setForm((x:any)=>({...x,[key]:value}));

  const save = async () => {
    setSaving(true);
    try {
      const db = supabase as any;
      const won = form.won_locations_count === '' ? null : Math.max(0,Number.parseInt(String(form.won_locations_count),10)||0);
      const actualMrr = form.actual_mrr === '' ? (form.interested_in === 'Orderly' && won != null ? won * 25 : null) : Number(form.actual_mrr);
      const { error } = await db.from('leads').update({
        company:String(form.company||'').trim(), contact_person:String(form.contact_person||'').trim()||null, phone:String(form.phone||'').trim()||null,
        phone2:String(form.phone2||'').trim()||null, email:String(form.email||'').trim()||null, website:String(form.website||'').trim()||null,
        location:String(form.location||'').trim()||null, city:String(form.city||'').trim()||null, country:String(form.country||'').trim()||null,
        industry:String(form.industry||'').trim()||null, interested_in:String(form.interested_in||'').trim()||null, status:form.status, potential:form.potential,
        notes:String(form.notes||'').trim()||null, assigned_to:form.assigned_to, last_contact_at:toIsoOrNull(form.last_contact_at), contact_outcome:String(form.contact_outcome||'').trim()||null,
        next_step:String(form.next_step||'').trim()||null, next_action_at:toIsoOrNull(form.next_action_at), contact_type:String(form.contact_type||'').trim()||null,
        locations_count:form.locations_count===''?null:Math.max(0,Number.parseInt(String(form.locations_count),10)||0), won_locations_count:won,
        opportunity_value:form.opportunity_value===''?null:Number(form.opportunity_value), actual_mrr:actualMrr,
        lost_reason:form.status==='Izgubljeno'?(String(form.lost_reason||'').trim()||null):null, updated_at:new Date().toISOString(),
      }).eq('id',lead.id);
      if (error) throw error;
      setForm((x:any)=>({...x,actual_mrr:actualMrr??''}));
      toast.success('Lead je ažuriran.'); await onChanged();
    } catch (e:any) { toast.error(e?.message||'Nije moguće spremiti promjene.'); } finally { setSaving(false); }
  };

  const addActivity = async () => {
    if (!user) return; setSavingActivity(true);
    try {
      const db = supabase as any; const occurredAt = activity.occurred_at ? new Date(activity.occurred_at).toISOString() : new Date().toISOString();
      const { error } = await db.from('lead_activities').insert({lead_id:lead.id,user_id:user.id,activity_type:activity.activity_type,title:activity.activity_type,notes:activity.notes.trim()||null,occurred_at:occurredAt});
      if (error) throw error;
      if (activity.activity_type !== 'Bilješka') {
        const update:any = {last_contact_at:occurredAt,contact_type:activity.activity_type,contact_outcome:activity.notes.trim()||form.contact_outcome||null,updated_at:new Date().toISOString()};
        if (form.status === 'Nova') update.status = 'Kontaktiran';
        const { error: leadError } = await db.from('leads').update(update).eq('id',lead.id); if (leadError) throw leadError;
        setForm((x:any)=>({...x,last_contact_at:toLocalDateTimeInput(occurredAt),contact_type:activity.activity_type,contact_outcome:activity.notes.trim()||x.contact_outcome,status:x.status==='Nova'?'Kontaktiran':x.status}));
      }
      toast.success('Aktivnost je spremljena.'); setActivity({activity_type:'Poziv',notes:'',occurred_at:localNowInput()}); await loadHistory(lead.id); await onChanged();
    } catch (e:any) { toast.error(e?.message||'Nije moguće spremiti aktivnost.'); } finally { setSavingActivity(false); }
  };

  const createFollowUp = async () => {
    if (!followUp.date) { toast.error('Odaberi datum follow-upa.'); return; }
    setCreatingFollowUp(true);
    try {
      const db = supabase as any;
      const { error } = await db.from('reminders').insert({user_id:form.assigned_to||user?.id,lead_id:lead.id,title:followUp.title.trim()||'Follow-up',description:followUp.description.trim()||null,date:followUp.date,time:followUp.time||'09:00',priority:followUp.priority,status:'Aktivan',company:form.company||lead.company});
      if (error) throw error;
      const nextActionAt = new Date(`${followUp.date}T${followUp.time||'09:00'}`).toISOString();
      const { error: leadError } = await db.from('leads').update({next_action_at:nextActionAt,next_step:followUp.title.trim()||'Follow-up',updated_at:new Date().toISOString()}).eq('id',lead.id); if (leadError) throw leadError;
      setForm((x:any)=>({...x,next_action_at:toLocalDateTimeInput(nextActionAt),next_step:followUp.title.trim()||'Follow-up'}));
      toast.success('Follow-up je postavljen.'); setFollowUp({title:'Follow-up',description:'',date:'',time:'09:00',priority:'Srednji'}); await loadHistory(lead.id); await onChanged();
    } catch (e:any) { toast.error(e?.message||'Nije moguće postaviti follow-up.'); } finally { setCreatingFollowUp(false); }
  };

  const deleteLead = async () => {
    setDeleting(true);
    try { const db = supabase as any; const { error } = await db.rpc('delete_lead_complete',{p_lead_id:lead.id}); if (error) throw error; toast.success('Lead i sva vezana CRM povijest su obrisani.'); onOpenChange(false); await onChanged(); }
    catch (e:any) { toast.error(e?.message||'Nije moguće obrisati lead.'); } finally { setDeleting(false); }
  };

  const currentInterestIsKnown = !form.interested_in || INTERESTS.includes(form.interested_in);

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="h-[100dvh] w-screen max-w-none overflow-y-auto rounded-none p-0 sm:h-auto sm:max-h-[94dvh] sm:w-[calc(100vw-2rem)] sm:max-w-6xl sm:rounded-2xl">
      <div className="sticky top-0 z-20 border-b bg-background/95 px-4 pb-3 pt-4 backdrop-blur sm:px-6 sm:pt-6">
        <DialogHeader><DialogTitle className="pr-8 text-xl sm:text-2xl">{form.company||lead.company}</DialogTitle><DialogDescription>Kontakt, prodajna prilika, aktivnosti i follow-up.</DialogDescription></DialogHeader>
        <div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{form.status||'Nova'}</Badge>{form.interested_in&&<Badge variant="outline">{form.interested_in}</Badge>}<Badge variant="outline"><UserRound className="mr-1 h-3 w-3" />{ownerMap.get(form.assigned_to)?.email||'Owner'}</Badge>{form.city&&<Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />{form.city}</Badge>}{form.locations_count!==''&&<Badge variant="outline"><Building2 className="mr-1 h-3 w-3" />{form.locations_count} lok.</Badge>}{form.actual_mrr!==''&&<Badge variant="outline"><Euro className="mr-1 h-3 w-3" />{form.actual_mrr} MRR</Badge>}</div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-28 pt-4 sm:px-6 sm:pb-6">
        <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="overview">Pregled</TabsTrigger><TabsTrigger value="activities">Aktivnosti</TabsTrigger><TabsTrigger value="followup">Follow-up</TabsTrigger></TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="space-y-4 rounded-2xl border p-3 sm:p-4">
              <div><h3 className="font-semibold">Kontakt i osnovni podaci</h3><p className="text-sm text-muted-foreground">Glavni podaci o leadu.</p></div>
              <Field label="Naziv firme"><Input value={form.company||''} onChange={e=>setField('company',e.target.value)} /></Field>
              <Field label="Kontakt osoba"><Input value={form.contact_person||''} onChange={e=>setField('contact_person',e.target.value)} /></Field>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Telefon"><Input value={form.phone||''} onChange={e=>setField('phone',e.target.value)} /></Field><Field label="Drugi telefon"><Input value={form.phone2||''} onChange={e=>setField('phone2',e.target.value)} /></Field></div>
              <Field label="Email"><Input value={form.email||''} onChange={e=>setField('email',e.target.value)} /></Field><Field label="Web"><Input value={form.website||''} onChange={e=>setField('website',e.target.value)} /></Field>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Lokacija / adresa"><Input value={form.location||''} onChange={e=>setField('location',e.target.value)} /></Field><Field label="Grad"><Input value={form.city||''} onChange={e=>setField('city',e.target.value)} /></Field></div>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Država"><Input value={form.country||''} onChange={e=>setField('country',e.target.value)} /></Field><Field label="Branša"><Input value={form.industry||''} onChange={e=>setField('industry',e.target.value)} /></Field></div>
              <Field label="Zainteresiran za"><Select value={form.interested_in||'none'} onValueChange={v=>setField('interested_in',v==='none'?'':v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nije odabrano</SelectItem>{!currentInterestIsKnown&&<SelectItem value={form.interested_in}>{form.interested_in}</SelectItem>}{INTERESTS.map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Vlasnik leada"><Select value={form.assigned_to||''} onValueChange={v=>setField('assigned_to',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{owners.map(o=><SelectItem key={o.id} value={o.id}>{o.id===user?.id?'Benjamin / moj lead':o.email||o.id}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Bilješke"><Textarea rows={4} value={form.notes||''} onChange={e=>setField('notes',e.target.value)} /></Field>
            </section>

            <section className="space-y-4 rounded-2xl border p-3 sm:p-4">
              <div><h3 className="font-semibold">Prodajna prilika</h3><p className="text-sm text-muted-foreground">Pipeline, vrijednost i sljedeći potez.</p></div>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Status"><Select value={form.status||'Nova'} onValueChange={v=>setField('status',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field><Field label="Potencijal"><Select value={form.potential||'Srednji'} onValueChange={v=>setField('potential',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></Field></div>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Potencijalne lokacije"><Input type="number" min="0" value={form.locations_count??''} onChange={e=>setField('locations_count',e.target.value)} /></Field><Field label="Vrijednost prilike (€)"><Input type="number" min="0" step="0.01" value={form.opportunity_value??''} onChange={e=>setField('opportunity_value',e.target.value)} /></Field></div>
              {form.interested_in==='Orderly'&&<div className="grid gap-3 sm:grid-cols-2"><Field label="Osvojene lokacije"><Input type="number" min="0" value={form.won_locations_count??''} onChange={e=>setField('won_locations_count',e.target.value)} /></Field><Field label="Stvarni MRR (€)"><Input type="number" min="0" step="0.01" value={form.actual_mrr??''} onChange={e=>setField('actual_mrr',e.target.value)} placeholder="Automatski 25 € × osvojene lokacije" /></Field></div>}
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Zadnji kontakt"><Input type="datetime-local" value={form.last_contact_at||''} onChange={e=>setField('last_contact_at',e.target.value)} /></Field><Field label="Tip kontakta"><Select value={form.contact_type||'none'} onValueChange={v=>setField('contact_type',v==='none'?'':v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nije uneseno</SelectItem>{ACTIVITY_TYPES.filter(x=>x!=='Bilješka').map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field></div>
              <Field label="Ishod zadnjeg kontakta"><Textarea rows={2} value={form.contact_outcome||''} onChange={e=>setField('contact_outcome',e.target.value)} /></Field>
              <Field label="Sljedeći korak"><Input value={form.next_step||''} onChange={e=>setField('next_step',e.target.value)} /></Field><Field label="Datum sljedeće akcije"><Input type="datetime-local" value={form.next_action_at||''} onChange={e=>setField('next_action_at',e.target.value)} /></Field>
              {form.status==='Izgubljeno'&&<Field label="Razlog izgubljenog leada"><Textarea rows={2} value={form.lost_reason||''} onChange={e=>setField('lost_reason',e.target.value)} /></Field>}
            </section>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="mt-5 space-y-5">
          <section className="space-y-4 rounded-2xl border p-3 sm:p-4"><div><h3 className="font-semibold">Zapiši aktivnost</h3><p className="text-sm text-muted-foreground">Poziv, email, WhatsApp, sastanak, demo ili interna bilješka.</p></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Tip"><Select value={activity.activity_type} onValueChange={v=>setActivity(x=>({...x,activity_type:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACTIVITY_TYPES.map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field><Field label="Datum i vrijeme"><Input type="datetime-local" value={activity.occurred_at} onChange={e=>setActivity(x=>({...x,occurred_at:e.target.value}))} /></Field></div><Field label="Što se dogodilo"><Textarea rows={3} value={activity.notes} onChange={e=>setActivity(x=>({...x,notes:e.target.value}))} placeholder="Npr. razgovarao s vlasnikom, zainteresiran za demo..." /></Field><Button onClick={addActivity} disabled={savingActivity} className="h-11 w-full sm:w-auto"><MessageSquarePlus className="mr-2 h-4 w-4" />{savingActivity?'Spremam…':'Spremi aktivnost'}</Button></section>
          <section className="space-y-3 rounded-2xl border p-3 sm:p-4"><div className="flex items-center gap-2"><History className="h-4 w-4" /><h3 className="font-semibold">Timeline aktivnosti</h3></div>{timeline.length===0?<p className="text-sm text-muted-foreground">Još nema aktivnosti ili follow-upova.</p>:<div className="space-y-2">{timeline.map(item=><div key={item.id} className="rounded-xl border p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.kind} · {new Date(item.at).toLocaleString('hr-HR')}</p></div><div className="flex gap-1"><Badge variant="outline">{item.type}</Badge>{item.status&&<Badge variant="secondary">{item.status}</Badge>}</div></div>{item.note&&<p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.note}</p>}</div>)}</div>}</section>
        </TabsContent>

        <TabsContent value="followup" className="mt-5 space-y-5">
          <section className="space-y-4 rounded-2xl border p-3 sm:p-4"><div><h3 className="font-semibold">Novi follow-up</h3><p className="text-sm text-muted-foreground">Postavi konkretnu sljedeću obvezu za ovaj lead.</p></div><Field label="Naslov"><Input value={followUp.title} onChange={e=>setFollowUp(v=>({...v,title:e.target.value}))} /></Field><Field label="Napomena"><Textarea rows={2} value={followUp.description} onChange={e=>setFollowUp(v=>({...v,description:e.target.value}))} /></Field><div className="grid gap-3 sm:grid-cols-3"><Field label="Datum"><Input type="date" value={followUp.date} onChange={e=>setFollowUp(v=>({...v,date:e.target.value}))} /></Field><Field label="Vrijeme"><Input type="time" value={followUp.time} onChange={e=>setFollowUp(v=>({...v,time:e.target.value}))} /></Field><Field label="Prioritet"><Select value={followUp.priority} onValueChange={v=>setFollowUp(x=>({...x,priority:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></Field></div><Button onClick={createFollowUp} disabled={creatingFollowUp} className="h-11 w-full sm:w-auto"><CalendarClock className="mr-2 h-4 w-4" />{creatingFollowUp?'Spremam…':'Postavi follow-up'}</Button></section>
          <section className="space-y-3 rounded-2xl border p-3 sm:p-4"><h3 className="font-semibold">Follow-up povijest</h3>{reminders.length===0?<p className="text-sm text-muted-foreground">Nema follow-upova za ovaj lead.</p>:<div className="space-y-2">{reminders.map(r=><div key={r.id} className="rounded-xl border p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.date} · {r.time||'—'} · {r.priority}</p></div><Badge variant={r.status==='Završen'?'secondary':'outline'}>{r.status}</Badge></div>{r.description&&<p className="mt-2 text-sm text-muted-foreground">{r.description}</p>}</div>)}</div>}</section>
        </TabsContent>
      </Tabs>

      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col-reverse gap-2 border-t bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur sm:static sm:mx-6 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:border-t sm:bg-transparent sm:px-0 sm:pb-0"><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Obriši lead</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Potpuno obrisati {form.company||lead.company}?</AlertDialogTitle><AlertDialogDescription>Obrisat će se lead, follow-upovi, aktivnosti i povezani CRM zapisi. Radnju nije moguće poništiti.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Odustani</AlertDialogCancel><AlertDialogAction onClick={deleteLead} disabled={deleting}>{deleting?'Brišem…':'Da, obriši'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><div className="grid grid-cols-2 gap-2 sm:flex">{form.phone&&<Button variant="outline" asChild><a href={`tel:${form.phone}`}><Phone className="mr-2 h-4 w-4" />Nazovi</a></Button>}{form.email&&<Button variant="outline" asChild><a href={`mailto:${form.email}`}><Mail className="mr-2 h-4 w-4" />Email</a></Button>}<Button onClick={save} disabled={saving} className="col-span-2"><Save className="mr-2 h-4 w-4" />{saving?'Spremam…':'Spremi promjene'}</Button></div></div>
    </DialogContent>
  </Dialog>;
};

const Field = ({label,children}:{label:string;children:React.ReactNode}) => <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
export default LeadDetailDialog;
