import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, UserRoundSearch } from 'lucide-react';
import { toast } from 'sonner';
import AdminPartnerCRM from '@/components/admin/AdminPartnerCRM';

type Partner = {
  user_id: string;
  email: string | null;
  lead_count: number;
  reminder_count: number;
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
      if (!ids.length) {
        setPartners([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await db.from('profiles').select('id,email').in('id', ids);
      if (profilesError) throw profilesError;
      const emailMap = new Map((profiles ?? []).map((row: any) => [row.id, row.email]));

      const rows = await Promise.all(ids.map(async (userId: string) => {
        const [leadsResult, remindersResult] = await Promise.all([
          db.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          db.from('reminders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        ]);
        return {
          user_id: userId,
          email: emailMap.get(userId) ?? null,
          lead_count: leadsResult.count || 0,
          reminder_count: remindersResult.count || 0,
        };
      }));

      setPartners(rows);
    } catch (error: any) {
      console.error('Admin partner overview load error:', error);
      toast.error(error?.message || 'Nije moguće učitati terence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  if (selectedPartner) {
    return (
      <AdminPartnerCRM
        partnerUserId={selectedPartner.user_id}
        partnerEmail={selectedPartner.email}
        onBack={() => setSelectedPartner(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>CRM terenaca</CardTitle>
          <CardDescription>Klikni na terenca za kompletan pregled njegovih leadova, follow-upova, lokacija i provizija.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadPartners} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Osvježi
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!loading && partners.length === 0 && <p className="text-sm text-muted-foreground">Još nema terenaca.</p>}
        {partners.map((partner) => (
          <div key={partner.user_id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{partner.email || partner.user_id}</p>
              <p className="mt-1 text-sm text-muted-foreground">{partner.lead_count} leadova · {partner.reminder_count} follow-upova</p>
            </div>
            <Button onClick={() => setSelectedPartner(partner)} className="gap-2">
              <UserRoundSearch className="h-4 w-4" /> Otvori CRM
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminPartnerOverview;
