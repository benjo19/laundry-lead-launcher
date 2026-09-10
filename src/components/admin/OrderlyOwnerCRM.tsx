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
import { Plus, RefreshCw, Search, Users, MapPin, CircleDollarSign, UserRound, Phone, Mail, CalendarClock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

type LeadRow = {
  id: string;
  user_id: string;
  created_by: string | null;
  assigned_to: string | null;
  company: string;
  location: string | null;
  city: string | null;
  country: string | null;
  contact_person: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  website: string | null;
  status: string | null;
  potential: string | null;
  industry: string | null;
  interested_in: string | null;
  notes: string | null;
  source: string | null;
  created_at: string | null;
  last_contact_at: string | null;
  contact_outcome: string | null;
  next_step: string | null;
  next_action_at: string | null;
  contact_type: string | null;
  locations_count: number | null;
  opportunity_value: number | null;
  lost_reason: string | null;
};

type Owner = { id: string; email: string | null; role: string };

const OrderlyOwnerCRM: React.FC = () => {
  const { user } = useAuthContext();
  const { addLead } = useAssignedLeads();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const db = supabase as any;
      const [leadResult, profileResult, roleResult] = await Promise.all([
        db.from('leads').select('id,user_id,created_by,assigned_to,company,location,city,country,contact_person,phone,phone2,email,website,status,potential,industry,interested_in,notes,source,created_at,last_contact_at,contact_outcome,next_step,next_action_at,contact_type,locations_count,opportunity_value,lost_reason').order('created_at', { ascending: false }),
        db.from('profiles').select('id,email'),
        db.from('user_roles').select('user_id,role'),
      ]);
      const error = leadResult.error || profileResult.error || roleResult.error;
      if (error) throw error;

      const roleMap = new Map<string, string>();
      (roleResult.data ?? []).forEach((row: any) => {
        const current = roleMap.get(row.user_id);
        if (!current || row.role === 'super_admin' || (row.role === 'sales_partner' && current !== 'super_admin')) roleMap.set(row.user_id, row.role);
      });
      const ownerRows: Owner[] = (profileResult.data ?? [])
        .map((profile: any) => ({ id: profile.id, email: profile.email, role: roleMap.get(profile.id) || 'user' }))
        .filter((profile: Owner) => profile.role === 'super_admin' || profile.role === 'sales_partner');
      setOwners(ownerRows);
      setLeads(leadResult.data ?? []);
      setSelectedLead((current) => current ? (leadResult.data ?? []).find((row: LeadRow) => row.id === current.id) ?? null : null);
    } catch (error: any) {
      console.error('Orderly owner CRM load error:', error);
      toast.error(error?.message || 'Nije moguće učitati Orderly CRM.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const ownerMap = useMemo(() => new Map(owners.map((owner) => [owner.id, owner])), [owners]);
  const effectiveOwnerId = (lead: LeadRow) => lead.assigned_to || lead.user_id;

  const filteredLeads = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const ownerId = effectiveOwnerId(lead);
      const owner = ownerMap.get(ownerId);
      const creator = ownerMap.get(lead.created_by || lead.user_id);
      const matchesSearch = !needle || [lead.company, lead.location, lead.city, lead.contact_person, lead.phone, lead.phone2, lead.email, lead.website, lead.interested_in, lead.contact_outcome, lead.next_step, lead.lost_reason, owner?.email, creator?.email].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle));
      return matchesSearch && (ownerFilter === 'all' || ownerId === ownerFilter) && (statusFilter === 'all' || (lead.status || 'Nova') === statusFilter);
    });
  }, [leads, ownerMap, ownerFilter, search, statusFilter]);

  const stats = useMemo(() => {
    const partnerIds = new Set(owners.filter((owner) => owner.role === 'sales_partner').map((owner) => owner.id));
    return {
      total: leads.length,
      mine: leads.filter((lead) => effectiveOwnerId(lead) === user?.id).length,
      partner: leads.filter((lead) => partnerIds.has(effectiveOwnerId(lead))).length,
      paying: leads.filter((lead) => ['Plaća', 'Dobiveno'].includes(lead.status || '')).length,
    };
  }, [leads, owners, user?.id]);

  const statuses = useMemo(() => Array.from(new Set(leads.map((lead) => lead.status || 'Nova'))).sort(), [leads]);

  const handleAddLead = async (...args: Parameters<typeof addLead>) => {
    const result = await addLead(...args);
    if (result) { setAddLeadOpen(false); await load(); }
    return result;
  };

  const ownerLabel = (ownerId: string) => ownerId === user?.id ? 'Benjamin / moj lead' : ownerMap.get(ownerId)?.email || 'Nepoznat vlasnik';

  const assignLead = async (leadId: string, assignedTo: string) => {
    setAssigningId(leadId);
    try {
      const db = supabase as any;
      const { error } = await db.from('leads').update({ assigned_to: assignedTo, updated_at: new Date().toISOString() }).eq('id', leadId);
      if (error) throw error;
      setLeads((current) => current.map((lead) => lead.id === leadId ? { ...lead, assigned_to: assignedTo } : lead));
      toast.success('Lead je dodijeljen.');
    } catch (error: any) {
      toast.error(error?.message || 'Nije moguće dodijeliti lead.');
    } finally { setAssigningId(null); }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-4 sm:space-y-5 sm:px-5 sm:pt-5 md:px-6 md:pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 pr-12 sm:pr-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">Orderly</p>
          <h2 className="truncate text-xl font-bold tracking-tight sm:text-2xl">Leadovi</h2>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">Klikni na lead za account, timeline, follow-up, uređivanje ili brisanje.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" onClick={load} disabled={loading} className="h-11 gap-2 sm:h-10">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Osvježi
          </Button>
          <Button onClick={() => setAddLeadOpen(true)} className="h-11 gap-2 sm:h-10">
            <Plus className="h-4 w-4" /> Dodaj lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <Stat label="Svi leadovi" value={stats.total} icon={Users} />
        <Stat label="Moji leadovi" value={stats.mine} icon={UserRound} />
        <Stat label="Kod terenaca" value={stats.partner} icon={MapPin} />
        <Stat label="Plaćajući" value={stats.paying} icon={CircleDollarSign} />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="px-3 pb-3 pt-4 sm:px-6 sm:pt-6">
          <CardTitle className="text-lg sm:text-xl">Leadovi</CardTitle>
          <CardDescription>{filteredLeads.length} prikazano od {leads.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-3 pb-4 sm:space-y-4 sm:px-6 sm:pb-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_220px_180px]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Traži lead, kontakt, telefon..." className="h-11 pl-9 sm:h-10" />
            </div>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="h-11 sm:h-10"><SelectValue placeholder="Svi vlasnici" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Svi vlasnici</SelectItem>{owners.map((owner) => <SelectItem key={owner.id} value={owner.id}>{owner.id === user?.id ? 'Benjamin / moji' : owner.email || owner.id}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 sm:h-10"><SelectValue placeholder="Svi statusi" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Svi statusi</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Mobile + tablet: touch-first card list */}
          <div className="space-y-2 lg:hidden">
            {!loading && filteredLeads.length === 0 && <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Nema leadova za odabrane filtere.</div>}
            {filteredLeads.map((lead) => {
              const ownerId = effectiveOwnerId(lead);
              return (
                <button key={lead.id} type="button" onClick={() => setSelectedLead(lead)} className="w-full rounded-2xl border bg-card p-3 text-left shadow-sm transition active:scale-[0.995] sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 truncate font-semibold">{lead.company}</p>
                        <Badge variant="secondary" className="shrink-0 text-[11px]">{lead.status || 'Nova'}</Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{lead.interested_in || lead.contact_person || lead.source || 'Manual'}</p>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {(lead.city || lead.location) && <div className="flex min-w-0 items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{[lead.location, lead.city].filter(Boolean).join(' · ')}</span></div>}
                    {lead.phone && <div className="flex min-w-0 items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{lead.phone}</span></div>}
                    {lead.email && <div className="flex min-w-0 items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{lead.email}</span></div>}
                    {lead.next_step && <div className="flex min-w-0 items-center gap-2 text-muted-foreground"><CalendarClock className="h-4 w-4 shrink-0" /><span className="truncate">{lead.next_step}</span></div>}
                  </div>

                  <div className="mt-3 border-t pt-3" onClick={(event) => event.stopPropagation()}>
                    <Select value={ownerId} onValueChange={(value) => assignLead(lead.id, value)} disabled={assigningId === lead.id}>
                      <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{owners.map((owner) => <SelectItem key={owner.id} value={owner.id}>{ownerLabel(owner.id)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop: dense data table */}
          <div className="hidden overflow-x-auto rounded-xl border lg:block">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="border-b bg-muted/40 text-left"><tr><th className="px-4 py-3 font-medium">Lead</th><th className="px-4 py-3 font-medium">Lokacija</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Čiji je lead</th><th className="px-4 py-3 font-medium">Kontakt</th><th className="px-4 py-3 font-medium">Sljedeće</th></tr></thead>
              <tbody className="divide-y">
                {!loading && filteredLeads.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nema leadova za odabrane filtere.</td></tr>}
                {filteredLeads.map((lead) => {
                  const ownerId = effectiveOwnerId(lead);
                  const creatorId = lead.created_by || lead.user_id;
                  const creator = ownerMap.get(creatorId);
                  return (
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="cursor-pointer hover:bg-muted/30">
                      <td className="px-4 py-3"><p className="font-medium">{lead.company}</p><p className="text-xs text-muted-foreground">{lead.interested_in || lead.contact_person || lead.source || 'Manual'}</p></td>
                      <td className="px-4 py-3">{[lead.location, lead.city].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{lead.status || 'Nova'}</Badge></td>
                      <td className="min-w-[250px] px-4 py-3" onClick={(event) => event.stopPropagation()}><Select value={ownerId} onValueChange={(value) => assignLead(lead.id, value)} disabled={assigningId === lead.id}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{owners.map((owner) => <SelectItem key={owner.id} value={owner.id}>{ownerLabel(owner.id)}</SelectItem>)}</SelectContent></Select><div className="mt-1 text-xs text-muted-foreground">Kreirao: {creatorId === user?.id ? 'Benjamin' : creator?.email || 'nepoznat korisnik'}</div></td>
                      <td className="px-4 py-3"><p>{lead.phone || '—'}</p><p className="text-xs text-muted-foreground">{lead.email || ''}</p></td>
                      <td className="px-4 py-3"><p className="max-w-xs truncate">{lead.next_step || '—'}</p><p className="text-xs text-muted-foreground">{lead.next_action_at ? new Date(lead.next_action_at).toLocaleString('hr-HR') : ''}</p></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <LeadDetailDialog lead={selectedLead} owners={owners} open={Boolean(selectedLead)} onOpenChange={(nextOpen) => { if (!nextOpen) setSelectedLead(null); }} onChanged={load} />
      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} onAddLead={handleAddLead} />
    </div>
  );
};

const Stat = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) => (
  <Card className="min-w-0"><CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 sm:p-4 sm:pb-2"><CardTitle className="truncate text-[11px] font-medium sm:text-sm">{label}</CardTitle><Icon className="h-4 w-4 shrink-0 text-muted-foreground" /></CardHeader><CardContent className="p-3 pt-1 sm:p-4 sm:pt-0"><div className="text-xl font-bold sm:text-2xl">{value}</div></CardContent></Card>
);

export default OrderlyOwnerCRM;
