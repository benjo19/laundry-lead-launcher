import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAssignedLeads } from '@/hooks/useAssignedLeads';
import AddLeadDialog from '@/components/AddLeadDialog';
import LeadDetailDialog from '@/components/admin/LeadDetailDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, ChevronRight, CircleDollarSign, Mail, MapPin, Phone, Plus, RefreshCw, Search, UserRound, Users } from 'lucide-react';
import { toast } from 'sonner';

type LeadRow = {
  id:string; user_id:string; created_by:string|null; assigned_to:string|null; company:string; location:string|null; city:string|null; country:string|null;
  contact_person:string|null; phone:string|null; phone2:string|null; email:string|null; website:string|null; status:string|null; potential:string|null;
  industry:string|null; interested_in:string|null; notes:string|null; source:string|null; created_at:string|null; last_contact_at:string|null;
  contact_outcome:string|null; next_step:string|null; next_action_at:string|null; contact_type:string|null; pipeline_stage:string|null; locations_count:number|null;
  won_locations_count:number|null; opportunity_value:number|null; actual_mrr:number|null; lost_reason:string|null;
};
type Owner = { id:string; email:string|null; role:string };
type SortMode = 'newest' | 'oldest' | 'company-asc' | 'company-desc';
const INTERESTS = ['Orderly','AutomindAI','Oprema praone'];
const CRM_STATUS_FILTERS = ['Nova','Draft spreman','Kontaktiran','Odgovorio','Zainteresiran','Neisporučeno','Izgubljeno'];

const dateOnly = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};
const actionTone = (value?: string | null) => {
  if (!value) return 'none';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'none';
  const target = dateOnly(date);
  const today = dateOnly(new Date());
  if (target < today) return 'overdue';
  if (target === today) return 'today';
  return 'future';
};

const OrderlyOwnerCRM: React.FC = () => {
  const { user } = useAuthContext();
  const { addLead } = useAssignedLeads();
  const [leads,setLeads] = useState<LeadRow[]>([]);
  const [owners,setOwners] = useState<Owner[]>([]);
  const [loading,setLoading] = useState(true);
  const [addLeadOpen,setAddLeadOpen] = useState(false);
  const [selectedLead,setSelectedLead] = useState<LeadRow|null>(null);
  const [search,setSearch] = useState('');
  const [ownerFilter,setOwnerFilter] = useState('all');
  const [statusFilter,setStatusFilter] = useState('all');
  const [interestFilter,setInterestFilter] = useState('all');
  const [sortMode,setSortMode] = useState<SortMode>('newest');
  const [assigningId,setAssigningId] = useState<string|null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const db = supabase as any;
      const [leadResult,profileResult,roleResult] = await Promise.all([
        db.from('leads').select('id,user_id,created_by,assigned_to,company,location,city,country,contact_person,phone,phone2,email,website,status,potential,industry,interested_in,notes,source,created_at,last_contact_at,contact_outcome,next_step,next_action_at,contact_type,pipeline_stage,locations_count,won_locations_count,opportunity_value,actual_mrr,lost_reason').order('created_at',{ascending:false}),
        db.from('profiles').select('id,email'), db.from('user_roles').select('user_id,role'),
      ]);
      const error = leadResult.error || profileResult.error || roleResult.error;
      if (error) throw error;
      const roleMap = new Map<string,string>();
      (roleResult.data??[]).forEach((r:any)=>{ const current=roleMap.get(r.user_id); if(!current||r.role==='super_admin'||(r.role==='sales_partner'&&current!=='super_admin')) roleMap.set(r.user_id,r.role); });
      const ownerRows:Owner[]=(profileResult.data??[]).map((p:any)=>({id:p.id,email:p.email,role:roleMap.get(p.id)||'user'})).filter((p:Owner)=>p.role==='super_admin'||p.role==='sales_partner');
      setOwners(ownerRows); setLeads(leadResult.data??[]); setSelectedLead(c=>c?(leadResult.data??[]).find((r:LeadRow)=>r.id===c.id)??null:null);
    } catch(e:any) { toast.error(e?.message||'Nije moguće učitati CRM.'); } finally { setLoading(false); }
  };
  useEffect(()=>{load();},[]);
  const ownerMap=useMemo(()=>new Map(owners.map(o=>[o.id,o])),[owners]);
  const effectiveOwnerId=(lead:LeadRow)=>lead.assigned_to||lead.user_id;
  const statuses=CRM_STATUS_FILTERS;
  const filteredLeads=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return leads.filter(lead=>{
      const ownerId=effectiveOwnerId(lead); const owner=ownerMap.get(ownerId);
      const searchOk=!q||[lead.company,lead.location,lead.city,lead.contact_person,lead.phone,lead.phone2,lead.email,lead.website,lead.interested_in,lead.contact_outcome,lead.next_step,lead.lost_reason,owner?.email].filter(Boolean).some(v=>String(v).toLowerCase().includes(q));
      const rawStatus = lead.status || 'Nova';
      const normalizedStatus = rawStatus === 'Novi' ? 'Nova' : rawStatus === 'Izgubljen' ? 'Izgubljeno' : rawStatus;
      const statusOk = statusFilter==='all' || (statusFilter==='Draft spreman' ? lead.pipeline_stage==='Draft spreman' : normalizedStatus===statusFilter);
      return searchOk && (ownerFilter==='all'||ownerId===ownerFilter) && statusOk && (interestFilter==='all'||lead.interested_in===interestFilter);
    });
  },[leads,ownerMap,ownerFilter,statusFilter,interestFilter,search]);
  const sortedLeads=useMemo(()=>{
    const rows=[...filteredLeads];
    rows.sort((a,b)=>{
      if(sortMode==='company-asc') return a.company.localeCompare(b.company,'hr',{sensitivity:'base'});
      if(sortMode==='company-desc') return b.company.localeCompare(a.company,'hr',{sensitivity:'base'});
      const aTime=a.created_at?new Date(a.created_at).getTime():0;
      const bTime=b.created_at?new Date(b.created_at).getTime():0;
      return sortMode==='oldest'?aTime-bTime:bTime-aTime;
    });
    return rows;
  },[filteredLeads,sortMode]);
  const stats=useMemo(()=>({
    total:leads.length,
    orderly:leads.filter(l=>l.interested_in==='Orderly').length,
    wonLocations:leads.reduce((sum,l)=>sum+(l.won_locations_count||0),0),
    actualMrr:leads.reduce((sum,l)=>sum+Number(l.actual_mrr||0),0),
  }),[leads]);

  const handleAddLead=async(...args:Parameters<typeof addLead>)=>{const ok=await addLead(...args);if(ok){setAddLeadOpen(false);await load();}return ok;};
  const ownerLabel=(id:string)=>id===user?.id?'Benjamin / moj lead':ownerMap.get(id)?.email||'Nepoznat vlasnik';
  const assignLead=async(leadId:string,assignedTo:string)=>{setAssigningId(leadId);try{const db=supabase as any;const{error}=await db.from('leads').update({assigned_to:assignedTo,updated_at:new Date().toISOString()}).eq('id',leadId);if(error)throw error;setLeads(c=>c.map(l=>l.id===leadId?{...l,assigned_to:assignedTo}:l));toast.success('Lead je dodijeljen.');}catch(e:any){toast.error(e?.message||'Nije moguće dodijeliti lead.');}finally{setAssigningId(null);}};

  const NextAction = ({ lead, compact=false }: { lead: LeadRow; compact?: boolean }) => {
    const tone = actionTone(lead.next_action_at);
    const toneClass = tone === 'overdue' ? 'text-destructive' : tone === 'today' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground';
    return <div className={compact ? 'rounded-xl bg-muted/40 p-3' : ''}>
      <p className={`${compact ? 'font-medium text-foreground' : ''} ${!compact ? 'truncate' : ''}`}>{lead.next_step || 'Nema sljedeće akcije'}</p>
      {lead.next_action_at && <p className={`mt-1 text-xs font-medium ${toneClass}`}>{tone === 'overdue' ? 'Kasni · ' : tone === 'today' ? 'Danas · ' : ''}{new Date(lead.next_action_at).toLocaleString('hr-HR')}</p>}
    </div>;
  };

  return <div className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-4 sm:space-y-5 sm:px-5 md:px-6 md:pb-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 pr-12 sm:pr-0"><p className="text-xs font-medium text-muted-foreground sm:text-sm">Automind CRM</p><h2 className="text-xl font-bold tracking-tight sm:text-2xl">Leadovi</h2><p className="mt-1 hidden text-sm text-muted-foreground sm:block">Klikni na lead za puni account, timeline, follow-up i uređivanje.</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><Button variant="outline" onClick={load} disabled={loading} className="h-11 gap-2 sm:h-10"><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`} />Osvježi</Button><Button onClick={()=>setAddLeadOpen(true)} className="h-11 gap-2 sm:h-10"><Plus className="h-4 w-4" />Dodaj lead</Button></div></div>

    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4"><Stat label="Svi leadovi" value={stats.total} icon={Users}/><Stat label="Orderly leadovi" value={stats.orderly} icon={UserRound}/><Stat label="Osvojene lokacije" value={stats.wonLocations} icon={MapPin}/><Stat label="Stvarni MRR" value={`${stats.actualMrr.toFixed(0)} €`} icon={CircleDollarSign}/></div>

    <Card className="overflow-hidden"><CardHeader className="px-3 pb-3 pt-4 sm:px-6 sm:pt-6"><CardTitle className="text-lg sm:text-xl">Leadovi</CardTitle><CardDescription>{filteredLeads.length} prikazano od {leads.length}</CardDescription></CardHeader><CardContent className="space-y-4 px-3 pb-4 sm:px-6 sm:pb-6">
      <div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/20 p-1">
        {[['all','Svi'],...INTERESTS.map(x=>[x,x])].map(([value,label])=><button key={value} type="button" onClick={()=>setInterestFilter(value)} className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium transition ${interestFilter===value?'bg-background text-foreground shadow-sm':'text-muted-foreground hover:text-foreground'}`}>{label}</button>)}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_220px_180px_190px]"><div className="relative sm:col-span-2 lg:col-span-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Traži lead, kontakt, telefon..." className="h-11 pl-9 sm:h-10"/></div><Select value={ownerFilter} onValueChange={setOwnerFilter}><SelectTrigger className="h-11 sm:h-10"><SelectValue placeholder="Svi vlasnici"/></SelectTrigger><SelectContent><SelectItem value="all">Svi vlasnici</SelectItem>{owners.map(o=><SelectItem key={o.id} value={o.id}>{o.id===user?.id?'Benjamin / moji':o.email||o.id}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-11 sm:h-10"><SelectValue placeholder="Svi statusi"/></SelectTrigger><SelectContent><SelectItem value="all">Svi statusi</SelectItem>{statuses.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><Select value={sortMode} onValueChange={v=>setSortMode(v as SortMode)}><SelectTrigger className="h-11 sm:h-10"><SelectValue placeholder="Sortiraj"/></SelectTrigger><SelectContent><SelectItem value="newest">Najnoviji prvo</SelectItem><SelectItem value="oldest">Najstariji prvo</SelectItem><SelectItem value="company-asc">Tvrtka A–Ž</SelectItem><SelectItem value="company-desc">Tvrtka Ž–A</SelectItem></SelectContent></Select></div>

      <div className="space-y-2 lg:hidden">{!loading&&sortedLeads.length===0&&<div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Nema leadova za filtere.</div>}{sortedLeads.map(lead=>{const ownerId=effectiveOwnerId(lead);return <button key={lead.id} type="button" onClick={()=>setSelectedLead(lead)} className="w-full rounded-2xl border bg-card p-3 text-left shadow-sm transition active:scale-[0.995] sm:p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold">{lead.company}</p><Badge variant="secondary" className="text-[11px]">{lead.status||'Nova'}</Badge></div><p className="mt-1 truncate text-xs text-muted-foreground">{lead.interested_in||lead.source||'Bez kategorije'}</p></div><ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground"/></div><div className="mt-3"><NextAction lead={lead} compact /></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{(lead.city||lead.location)&&<Info icon={MapPin} text={[lead.location,lead.city].filter(Boolean).join(' · ')}/>} {lead.phone&&<Info icon={Phone} text={lead.phone}/>} {lead.email&&<Info icon={Mail} text={lead.email}/>}</div>{lead.interested_in==='Orderly'&&<div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">Potencijal: {lead.locations_count??'—'} lok.</Badge><Badge variant="outline">Osvojeno: {lead.won_locations_count??0}</Badge><Badge variant="outline">MRR: {Number(lead.actual_mrr||0).toFixed(0)} €</Badge></div>}<div className="mt-3 border-t pt-3" onClick={e=>e.stopPropagation()}><Select value={ownerId} onValueChange={v=>assignLead(lead.id,v)} disabled={assigningId===lead.id}><SelectTrigger className="h-10 w-full"><SelectValue/></SelectTrigger><SelectContent>{owners.map(o=><SelectItem key={o.id} value={o.id}>{ownerLabel(o.id)}</SelectItem>)}</SelectContent></Select></div></button>;})}</div>

      <div className="hidden overflow-x-auto rounded-xl border lg:block"><table className="w-full min-w-[1100px] text-sm"><thead className="border-b bg-muted/40 text-left"><tr><th className="px-4 py-3">Lead</th><th className="px-4 py-3">Interes</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Vlasnik</th><th className="px-4 py-3">Kontakt</th><th className="px-4 py-3">Lokacije / MRR</th><th className="px-4 py-3">Sljedeće</th></tr></thead><tbody className="divide-y">{!loading&&sortedLeads.length===0&&<tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nema leadova.</td></tr>}{sortedLeads.map(lead=>{const ownerId=effectiveOwnerId(lead);return <tr key={lead.id} onClick={()=>setSelectedLead(lead)} className="cursor-pointer hover:bg-muted/30"><td className="px-4 py-3 font-medium">{lead.company}</td><td className="px-4 py-3">{lead.interested_in||'—'}</td><td className="px-4 py-3"><Badge variant="secondary">{lead.status||'Nova'}</Badge></td><td className="min-w-[220px] px-4 py-3" onClick={e=>e.stopPropagation()}><Select value={ownerId} onValueChange={v=>assignLead(lead.id,v)} disabled={assigningId===lead.id}><SelectTrigger className="h-9"><SelectValue/></SelectTrigger><SelectContent>{owners.map(o=><SelectItem key={o.id} value={o.id}>{ownerLabel(o.id)}</SelectItem>)}</SelectContent></Select></td><td className="px-4 py-3"><p>{lead.phone||'—'}</p><p className="text-xs text-muted-foreground">{lead.email||''}</p></td><td className="px-4 py-3">{lead.interested_in==='Orderly'?<><p>{lead.won_locations_count||0}/{lead.locations_count||0} lok.</p><p className="text-xs text-muted-foreground">{Number(lead.actual_mrr||0).toFixed(0)} € MRR</p></>:'—'}</td><td className="max-w-[300px] px-4 py-3"><NextAction lead={lead}/></td></tr>;})}</tbody></table></div>
    </CardContent></Card>

    <LeadDetailDialog lead={selectedLead} owners={owners} open={Boolean(selectedLead)} onOpenChange={next=>{if(!next)setSelectedLead(null);}} onChanged={load}/><AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} onAddLead={handleAddLead}/>
  </div>;
};
const Stat=({label,value,icon:Icon}:{label:string;value:string|number;icon:React.ComponentType<{className?:string}>})=><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 sm:p-4 sm:pb-2"><CardTitle className="text-xs font-medium sm:text-sm">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent className="p-3 pt-1 sm:p-4 sm:pt-0"><div className="text-xl font-bold sm:text-2xl">{value}</div></CardContent></Card>;
const Info=({icon:Icon,text}:{icon:React.ComponentType<{className?:string}>;text:string})=><div className="flex min-w-0 items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4 shrink-0"/><span className="truncate">{text}</span></div>;

export default OrderlyOwnerCRM;
