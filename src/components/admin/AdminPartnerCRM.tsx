import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllLeadRows } from '@/lib/fetchAllLeadRows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CalendarClock, CircleDollarSign, MapPin, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';

type LeadRow = {
  id: string;
  company: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
};

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

  const load = async () => {
    setLoading(true);
    try {
      const db = supabase as any;
      const [leadResult, reminderResult, locationResult, commissionResult] = await Promise.all([
        fetchAllLeadRows<LeadRow>((from, to) => db.from('leads')
          .select('id,company,location,phone,email,status,created_at')
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
      ]);

      const firstError = leadResult.error || reminderResult.error || locationResult.error || commissionResult.error;
      if (firstError) throw firstError;

      setLeads(leadResult.data ?? []);
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
          <CardContent className="space-y-2">
            {!loading && leads.length === 0 && <p className="text-sm text-muted-foreground">Nema leadova.</p>}
            {leads.map((lead) => (
              <div key={lead.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{lead.company}</p>
                    <p className="text-xs text-muted-foreground">{lead.location || 'Lokacija nije unesena'}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{lead.status || 'Nova'}</span>
                </div>
                {(lead.phone || lead.email) && <p className="mt-2 text-xs text-muted-foreground">{[lead.phone, lead.email].filter(Boolean).join(' · ')}</p>}
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
