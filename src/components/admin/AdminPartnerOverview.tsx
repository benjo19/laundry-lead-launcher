import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, CircleDollarSign, MapPin, RefreshCw, UserRoundSearch, Users } from 'lucide-react';
import { toast } from 'sonner';
import AdminPartnerCRM from '@/components/admin/AdminPartnerCRM';

type Partner = {
  user_id: string;
  email: string | null;
  lead_count: number;
  active_lead_count: number;
  reminder_count: number;
  due_today_count: number;
  active_locations: number;
  monthly_commission: number;
};

const localDate = () => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

const AdminPartnerOverview: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const db = supabase as any;
      const { data: roleRows, error: roleError } = await db.from('user_roles').select('user_id').eq('role', 'sales_partner');
      if (roleError) throw roleError;
      const ids = (roleRows ?? []).map((row: any) => row.user_id);
      if (!ids.length) { setPartners([]); return; }

      const [profilesResult, leadsResult, remindersResult, locationsResult] = await Promise.all([
        db.from('profiles').select('id,email').in('id', ids),
        db.from('leads').select('id,user_id,assigned_to,status,next_action_at'),
        db.from('reminders').select('id,user_id,date,status').in('user_id', ids),
        db.from('partner_locations').select('partner_user_id,status,monthly_commission').in('partner_user_id', ids),
      ]);
      const error = profilesResult.error || leadsResult.error || remindersResult.error || locationsResult.error;
      if (error) throw error;

      const emailMap = new Map((profilesResult.data ?? []).map((row: any) => [row.id, row.email]));
      const today = localDate();
      const terminal = new Set(['Dobiveno', 'Izgubljeno', 'Zatvoren', 'Odbačen']);
      const rows = ids.map((userId: string) => {
        const partnerLeads = (leadsResult.data ?? []).filter((lead: any) => (lead.assigned_to || lead.user_id) === userId);
        const partnerReminders = (remindersResult.data ?? []).filter((r: any) => r.user_id === userId);
        const partnerLocations = (locationsResult.data ?? []).filter((l: any) => l.partner_user_id === userId);
        const activeLocations = partnerLocations.filter((l: any) => !['inactive', 'neaktivan', 'cancelled', 'otkazano'].includes(String(l.status || '').toLowerCase()));
        return {
          user_id: userId,
          email: emailMap.get(userId) ?? null,
          lead_count: partnerLeads.length,
          active_lead_count: partnerLeads.filter((lead: any) => !terminal.has(lead.status || 'Nova')).length,
          reminder_count: partnerReminders.filter((r: any) => r.status === 'Aktivan').length,
          due_today_count: partnerReminders.filter((r: any) => r.status === 'Aktivan' && r.date === today).length,
          active_locations: activeLocations.length,
          monthly_commission: activeLocations.reduce((sum: number, l: any) => sum + Number(l.monthly_commission || 0), 0),
        };
      });
      setPartners(rows);
    } catch (error: any) {
      console.error('Admin partner overview load error:', error);
      toast.error(error?.message || 'Nije moguće učitati terence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPartners(); }, []);

  if (selectedPartner) return <AdminPartnerCRM partnerUserId={selectedPartner.user_id} partnerEmail={selectedPartner.email} onBack={() => setSelectedPartner(null)} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Automind CRM</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Terenci</h1>
          <p className="mt-1 text-sm text-muted-foreground">Leadovi, follow-upovi, aktivne lokacije i provizije po prodajnom partneru.</p>
        </div>
        <Button variant="outline" onClick={loadPartners} disabled={loading} className="h-11 gap-2 sm:h-10"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Osvježi</Button>
      </div>

      {!loading && partners.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Još nema terenaca.</CardContent></Card>}

      <div className="grid gap-3 lg:grid-cols-2">
        {partners.map((partner) => (
          <Card key={partner.user_id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><CardTitle className="truncate text-lg">{partner.email || partner.user_id}</CardTitle><CardDescription className="mt-1">Prodajni partner</CardDescription></div>
                {partner.due_today_count > 0 && <Badge variant="secondary">{partner.due_today_count} danas</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric icon={Users} label="Aktivni leadovi" value={partner.active_lead_count} />
                <Metric icon={CalendarClock} label="Follow-up" value={partner.reminder_count} />
                <Metric icon={MapPin} label="Aktivne lokacije" value={partner.active_locations} />
                <Metric icon={CircleDollarSign} label="Provizija / mj" value={`${partner.monthly_commission.toFixed(0)} €`} />
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <p className="text-xs text-muted-foreground">Ukupno {partner.lead_count} dodijeljenih leadova</p>
                <Button onClick={() => setSelectedPartner(partner)} className="h-10 gap-2"><UserRoundSearch className="h-4 w-4" />Otvori CRM</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) => (
  <div className="rounded-xl bg-muted/40 p-3">
    <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-medium text-muted-foreground">{label}</p><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
    <p className="mt-2 text-lg font-bold">{value}</p>
  </div>
);

export default AdminPartnerOverview;
