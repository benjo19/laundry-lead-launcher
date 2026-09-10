import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type PartnerInvite = {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'revoked';
  created_at: string;
  accepted_at: string | null;
};

type PartnerUser = {
  user_id: string;
  email: string | null;
  role: string;
};

const SalesPartnerManagement: React.FC = () => {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<PartnerInvite[]>([]);
  const [partners, setPartners] = useState<PartnerUser[]>([]);

  const db = supabase as any;

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: inviteRows, error: inviteError }, { data: roleRows, error: roleError }] = await Promise.all([
        db.from('sales_partner_invites').select('id,email,status,created_at,accepted_at').order('created_at', { ascending: false }),
        db.from('user_roles').select('user_id,role').eq('role', 'sales_partner'),
      ]);

      if (inviteError) throw inviteError;
      if (roleError) throw roleError;

      const roleList = roleRows ?? [];
      const userIds = roleList.map((row: any) => row.user_id);
      let profileMap = new Map<string, string | null>();

      if (userIds.length) {
        const { data: profiles, error: profilesError } = await db
          .from('profiles')
          .select('id,email')
          .in('id', userIds);
        if (profilesError) throw profilesError;
        profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p.email]));
      }

      setInvites(inviteRows ?? []);
      setPartners(roleList.map((row: any) => ({ ...row, email: profileMap.get(row.user_id) ?? null })));
    } catch (error: any) {
      console.error('Partner admin load error:', error);
      toast.error(error?.message || 'Nije moguće učitati terence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addPartner = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('Nisi prijavljen kao admin.');

      const { error } = await db.from('sales_partner_invites').insert({
        email: normalizedEmail,
        invited_by: user.id,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') throw new Error('Taj email je već dodan kao terenac.');
        throw error;
      }

      toast.success('Terenac je dodan. Može se prijaviti Google računom s tim emailom.');
      setEmail('');
      await loadData();
    } catch (error: any) {
      console.error('Add partner error:', error);
      toast.error(error?.message || 'Dodavanje terenca nije uspjelo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Terenci / sales partneri</CardTitle>
          <CardDescription>
            Dodaj email terenca. Kad se prijavi Google računom s tim emailom, dobit će samo svoj Orderly Partner CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addPartner} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="partner-email">Google email terenca</Label>
              <Input
                id="partner-email"
                type="email"
                placeholder="terenac@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={saving}
                required
              />
            </div>
            <Button type="submit" disabled={saving} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {saving ? 'Dodajem…' : 'Dodaj terenca'}
            </Button>
            <Button type="button" variant="outline" onClick={loadData} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Osvježi
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktivni terenci</CardTitle>
          <CardDescription>{partners.length} korisnika trenutno ima sales_partner rolu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {partners.length === 0 ? (
            <p className="text-sm text-muted-foreground">Još nema aktivnih terenaca.</p>
          ) : partners.map((partner) => (
            <div key={partner.user_id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{partner.email || partner.user_id}</p>
                <p className="text-xs text-muted-foreground">Orderly Partner CRM</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Aktivan</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pozvani emailovi</CardTitle>
          <CardDescription>Pending čeka prvu Google prijavu; accepted znači da je partner aktiviran.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nema pozvanih terenaca.</p>
          ) : invites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-muted-foreground">Dodano {new Date(invite.created_at).toLocaleDateString('hr-HR')}</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">{invite.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesPartnerManagement;
