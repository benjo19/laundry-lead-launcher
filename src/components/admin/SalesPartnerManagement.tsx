import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, RefreshCw, Eye, EyeOff } from 'lucide-react';
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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    if (!normalizedEmail || !password) return;
    if (password.length < 8) {
      toast.error('Lozinka mora imati najmanje 8 znakova.');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-sales-partner', {
        body: {
          email: normalizedEmail,
          password,
          fullName: fullName.trim(),
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Kreiranje terenca nije uspjelo.');

      toast.success('Korisnik je kreiran. Može se odmah prijaviti emailom i lozinkom.');
      setFullName('');
      setEmail('');
      setPassword('');
      await loadData();
    } catch (error: any) {
      console.error('Add partner error:', error);
      const message = error?.context?.body?.error || error?.message || 'Dodavanje terenca nije uspjelo.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Kreiraj terenca</CardTitle>
          <CardDescription>
            Ti određuješ email i početnu lozinku. Korisnik se zatim odmah prijavljuje u svoj Orderly Partner CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addPartner} className="grid gap-3 md:grid-cols-3 md:items-end">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Ime i prezime</Label>
              <Input
                id="partner-name"
                placeholder="Ivan Horvat"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-email">Email</Label>
              <Input
                id="partner-email"
                type="email"
                placeholder="terenac@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-password">Početna lozinka</Label>
              <div className="relative">
                <Input
                  id="partner-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Najmanje 8 znakova"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={saving}
                  minLength={8}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={saving} className="gap-2">
                <UserPlus className="h-4 w-4" />
                {saving ? 'Kreiram…' : 'Kreiraj korisnika'}
              </Button>
              <Button type="button" variant="outline" onClick={loadData} disabled={loading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Osvježi
              </Button>
            </div>
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

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidencija korisnika</CardTitle>
            <CardDescription>Korisnici koje si kreirao ili ranije pozvao.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {invites.map((invite) => (
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
      )}
    </div>
  );
};

export default SalesPartnerManagement;
