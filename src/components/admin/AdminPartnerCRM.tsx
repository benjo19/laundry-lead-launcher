import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllLeadRows } from '@/lib/fetchAllLeadRows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CalendarClock, ChevronRight, CircleDollarSign, MapPin, MessageCircle, Phone, RefreshCw, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LeadDetailDialog from '@/components/admin/LeadDetailDialog';
import { toast } from 'sonner';

type LeadRow = {
  id: string; user_id: string; created_by: string | null; assigned_to: string | null; company: string;
  location: string | null; city: string | null; country: string | null; contact_person: string | null;
  phone: string | null; phone2: string | null; email: string | null; website: string | null; status: string | null;
  potential: string | null; industry: string | null; interested_in: string | null; notes: string | null; source: string | null;
  created_at: string | null; last_contact_at: string | null; contact_outcome: string | null; next_step: string | null;
  next_action_at: string | null; contact_type: string | null; locations_count: number | null; won_locations_count: number | null;
  opportunity_value: number | null; actual_mrr: number | null; lost_reason: string | null;
};
type Owner = { id: string; email: string | null; role: string };
const LEAD_COLUMNS = 'id,user_id,created_by,assigned_to,company,location,city,country,contact_person,phone,phone2,email,website,status,potential,industry,interested_in,notes,source,created_at,last_contact_at,contact_outcome,next_step,next_action_at,contact_type,locations_count,won_locations_count,opportunity_value,actual_mrr,lost_reason';
const STATUS_FILTERS = ['Nova', 'Kontaktiran', 'Demo', 'Trial', 'Plaća', 'Izgubljeno'];
const normStatus = (s: string | null) => { const v = s || 'Nova'; return v === 'Novi' ? 'Nova' : v === 'Izgubljen' ? 'Izgubljeno' : v; };

type ReminderRow = {
  id: number;
  title: string;
  company: string;
  date: string;
  time: string;
  status: string;
  priority: string;
};

type LocationRow = {
  id: string;
  customer_name: string;
  location_name: string;
  city: string | null;
  status: string;
  monthly_commission: number;
};

type CommissionRow = {
  id: string;
  period_start: string;
  amount: number;
  status: string;
};

interface AdminPartnerCRMProps {
  partnerUserId: string;
  partnerEmail: string | null;
  onBack: () => void;
}

const eur = (value: number) => new Intl.NumberFormat('hr-HR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
}).format(value);

const AdminPartnerCRM: React.FC<AdminPartnerCRMProps> = ({ partnerUserId, partnerEmail, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const db = supabase as any;
      const [leadResult, reminderResult, locationResult, commissionResult, profileResult, roleResult] = await Promise.all([
        fetchAllLeadRows<LeadRow>((from, to) => db.from('leads')
          .select(LEAD_COLUMNS)
          .eq('assigned_to', partnerUserId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: true })
          .range(from, to)),
        db.from('reminders')
          .select('id,title,company,date,time,status,priority')
          .eq('user_id', partnerUserId)
          .order('date', { ascending: true }),
        db.from('partner_locations')
          .select('id,customer_name,location_name,city,status,monthly_commission')
          .eq('partner_user_id', partnerUserId)
          .order('activated_at', { ascending: false }),
        db.from('partner_commissions')
          .select('id,period_start,amount,status')
          .eq('partner_user_id', partnerUserId)
          .order('period_start', { ascending: false }),
        db.from('profiles').select('id,email'),
        db.from('user_roles').select('user_id,role'),
      ]);

      const firstError = leadResult.error || reminderResult.error || locationResult.error || commissionResult.error;
      if (firstError) throw firstError;

      setLeads(leadResult.data ?? []);
      const roleMap = new Map<string, string>();
      (roleResult.data ?? []).forEach((r: any) => { const c = roleMap.get(r.user_id); if (!c || r.role === 'super_admin' || (r.role === 'sales_partner' && c !== 'super_admin')) roleMap.set(r.user_id, r.role); });
      setOwners((profileResult.data ?? []).map((p: any) => ({ id: p.id, email: p.email, role: roleMap.get(p.id) || 'user' })).filter((o: Owner) => o.role === 'super_admin' || o.role === 'sales_partner'));
      setReminders(reminderResult.data ?? []);
      setLocations((locationResult.data ?? []).map((row: any) => ({ ...row, monthly_commission: Number(row.monthly_commission ?? 0) })));
      setCommissions((commissionResult.data ?? []).map((row: any) => ({ ...row, amount: Number(row.amount ?? 0) })));
    } catch (error: any) {
      console.error('Admin partner CRM load error:', error);
      toast.error(error?.message || 'Nije moguće učitati CRM terenca.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [partnerUserId]);

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const qOk = !q || [lead.company, lead.city, lead.location, lead.phone, lead.email, lead.contact_person, lead.notes].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      return qOk && (statusFilter === 'all' || normStatus(lead.status) === statusFilter);
    });
  }, [leads, query, statusFilter]);
  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const activePipeline = leads.filter((lead) => ['Nova', 'Kontaktiran', 'Demo', 'Trial'].includes(lead.status || '')).length;
    const paying = leads.filter((lead) => lead.status === 'Plaća').length;
    const activeLocations = locations.filter((location) => location.status === 'active');
    const recurring = activeLocations.reduce((sum, location) => sum + location.monthly_commission, 0);
    const pending = commissions
      .filter((commission) => commission.status === 'pending' || commission.status === 'approved')
      .reduce((sum, commission) => sum + commission.amount, 0);
    return { activePipeline, paying, activeLocations: activeLocations.length, recurring, pending };
  }, [leads, locations, commissions]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Natrag na terence
          </Button>
          <p className="text-sm font-medium text-muted-foreground">CRM terenca</p>
          <h2 className="text-2xl font-bold">{partnerEmail || partnerUserId}</h2>
          <p className="text-sm text-muted-foreground">Admin pregled trenutno dodijeljenih leadova, follow-upova, lokacija i provizije.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Osvježi
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Leadovi" value={leads.length} icon={Users} />
        <Stat label="Aktivni pipeline" value={stats.activePipeline} icon={Users} />
        <Stat label="Plaćajućih" value={stats.paying} icon={Users} />
        <Stat label="Aktivne lokacije" value={stats.activeLocations} icon={MapPin} />
        <Stat label="Provizija / mj." value={eur(stats.recurring)} icon={CircleDollarSign} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leadovi</CardTitle>
            <CardDescription>Leadovi koji su trenutno dodijeljeni ovom terencu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Traži lokal, grad, telefon..." className="h-11 pl-9" />
            </div>
            <div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/20 p-1">
              {[['all', 'Svi'], ...STATUS_FILTERS.map((x) => [x, x === 'Nova' ? 'Novi' : x])].map(([value, label]) => {
                const count = value === 'all' ? leads.length : leads.filter((l) => normStatus(l.status) === value).length;
                return <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium transition ${statusFilter === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{label} <span className="text-xs opacity-70">{count}</span></button>;
              })}
            </div>
            <p className="text-xs text-muted-foreground">{filteredLeads.length} od {leads.length} leadova · dodirni lead za uređivanje</p>
            {!loading && filteredLeads.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{leads.length === 0 ? 'Terenac još nema leadova.' : 'Nema leadova za odabrani filter.'}</div>}
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="rounded-xl border bg-card p-3 shadow-sm">
                <button type="button" onClick={() => setSelectedId(lead.id)} className="flex w-full items-start justify-between gap-3 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{lead.company}</p>
                    <p className="truncate text-xs text-muted-foreground">{[lead.contact_person, lead.city || lead.location, lead.interested_in].filter(Boolean).join(' · ') || 'Lokacija nije unesena'}</p>
                    {lead.next_step && <p className="mt-2 line-clamp-2 text-sm"><span className="text-muted-foreground">Sljedeće: </span>{lead.next_step}</p>}
                    {!lead.next_step && lead.notes && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{lead.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{normStatus(lead.status) === 'Nova' ? 'Novi' : normStatus(lead.status)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
                {lead.phone && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                    <Button asChild variant="outline" size="sm" className="h-10"><a href={`tel:${lead.phone}`}><Phone className="mr-1.5 h-4 w-4" />Nazovi</a></Button>
                    <Button asChild variant="outline" size="sm" className="h-10"><a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-1.5 h-4 w-4" />WhatsApp</a></Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-up</CardTitle>
            <CardDescription>Podsjetnici koje vodi ovaj terenac.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading && reminders.length === 0 && <p className="text-sm text-muted-foreground">Nema follow-upova.</p>}
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{reminder.title}</p>
                    <p className="text-xs text-muted-foreground">{reminder.company}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{reminder.status}</span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" /> {reminder.date} {reminder.time} · {reminder.priority}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lokacije</CardTitle>
            <CardDescription>Lokacije pripisane ovom terencu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading && locations.length === 0 && <p className="text-sm text-muted-foreground">Nema lokacija.</p>}
            {locations.map((location) => (
              <div key={location.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{location.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{location.location_name}{location.city ? ` · ${location.city}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{eur(location.monthly_commission)}</p>
                  <p className="text-xs text-muted-foreground">{location.status === 'active' ? 'Aktivna' : 'Neaktivna'}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provizije</CardTitle>
            <CardDescription>Za isplatu: {eur(stats.pending)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading && commissions.length === 0 && <p className="text-sm text-muted-foreground">Nema obračunatih provizija.</p>}
            {commissions.slice(0, 24).map((commission) => (
              <div key={commission.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{new Date(`${commission.period_start}T00:00:00`).toLocaleDateString('hr-HR', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-xs text-muted-foreground">{commission.status}</p>
                </div>
                <p className="font-semibold">{eur(commission.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <LeadDetailDialog lead={selectedLead} owners={owners} open={Boolean(selectedLead)} onOpenChange={(next) => { if (!next) setSelectedId(null); }} onChanged={load} />
    </div>
  );
};

const Stat = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-medium sm:text-sm">{label}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent><div className="text-xl font-bold sm:text-2xl">{value}</div></CardContent>
  </Card>
);

export default AdminPartnerCRM;
