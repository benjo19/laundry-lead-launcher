import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, RefreshCw, Eye, EyeOff, KeyRound, X } from 'lucide-react';
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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

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
          action: 'create',
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

  const startPasswordEdit = (userId: string) => {
    setEditingUserId(userId);
    setEditPassword('');
    setShowEditPassword(false);
  };

  const cancelPasswordEdit = () => {
    setEditingUserId(null);
    setEditPassword('');
    setShowEditPassword(false);
  };

  const updatePartnerPassword = async (userId: string) => {
    if (editPassword.length < 8) {
      toast.error('Nova lozinka mora imati najmanje 8 znakova.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-sales-partner', {
        body: {
          action: 'update_password',
          userId,
          password: editPassword,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Promjena lozinke nije uspjela.');

      toast.success('Lozinka je promijenjena. Korisnik se može odmah prijaviti novom lozinkom.');
      cancelPasswordEdit();
    } catch (error: any) {
      console.error('Update partner password error:', error);
      const message = error?.context?.body?.error || error?.message || 'Promjena lozinke nije uspjela.';
      toast.error(message);
    } finally {
      setUpdatingPassword(false);
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
          <CardDescription>{partners.length} korisnika trenutno ima sales_partner rolu. Ovdje možeš postaviti novu lozinku postojećem korisniku.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {partners.length === 0 ? (
            <p className="text-sm text-muted-foreground">Još nema aktivnih terenaca.</p>
          ) : partners.map((partner) => (
            <div key={partner.user_id} className="rounded-lg border p-3 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{partner.email || partner.user_id}</p>
                  <p className="text-xs text-muted-foreground">Orderly Partner CRM</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Aktivan</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => startPasswordEdit(partner.user_id)}
                  >
                    <KeyRound className="h-4 w-4" />
                    Promijeni lozinku
                  </Button>
                </div>
              </div>

              {editingUserId === partner.user_id && (
                <div className="rounded-md bg-muted/40 p-3">
                  <Label htmlFor={`password-${partner.user_id}`}>Nova lozinka</Label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Input
                        id={`password-${partner.user_id}`}
                        type={showEditPassword ? 'text' : 'password'}
                        placeholder="Najmanje 8 znakova"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        minLength={8}
                        className="pr-10"
                        disabled={updatingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        tabIndex={-1}
                      >
                        {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      onClick={() => updatePartnerPassword(partner.user_id)}
                      disabled={updatingPassword || editPassword.length < 8}
                    >
                      {updatingPassword ? 'Spremam…' : 'Spremi lozinku'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={cancelPasswordEdit} disabled={updatingPassword} className="gap-1">
                      <X className="h-4 w-4" />
                      Odustani
                    </Button>
                  </div>
                </div>
              )}
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
