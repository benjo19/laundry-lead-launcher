import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, RefreshCw, Eye, EyeOff, KeyRound, UserRoundCog, X } from 'lucide-react';
import { toast } from 'sonner';

type PartnerUser = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  role: string;
};

const USERNAME_RE = /^[a-z0-9._-]{3,40}$/;

const SalesPartnerManagement: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<PartnerUser[]>([]);

  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [editingUsernameUserId, setEditingUsernameUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);

  const db = supabase as any;

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: roleRows, error: roleError } = await db
        .from('user_roles')
        .select('user_id,role')
        .eq('role', 'sales_partner');
      if (roleError) throw roleError;

      const roleList = roleRows ?? [];
      const userIds = roleList.map((row: any) => row.user_id);
      let profileMap = new Map<string, { username: string | null; full_name: string | null }>();

      if (userIds.length) {
        const { data: profiles, error: profilesError } = await db
          .from('profiles')
          .select('id,username,full_name')
          .in('id', userIds);
        if (profilesError) throw profilesError;
        profileMap = new Map((profiles ?? []).map((p: any) => [p.id, { username: p.username ?? null, full_name: p.full_name ?? null }]));
      }

      setPartners(roleList.map((row: any) => ({
        ...row,
        username: profileMap.get(row.user_id)?.username ?? null,
        full_name: profileMap.get(row.user_id)?.full_name ?? null,
      })));
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
    const normalizedUsername = username.trim().toLowerCase();
    if (!USERNAME_RE.test(normalizedUsername)) {
      toast.error('Korisničko ime: 3-40 znakova; slova, brojevi, točka, crtica ili donja crta.');
      return;
    }
    if (password.length < 8) {
      toast.error('Lozinka mora imati najmanje 8 znakova.');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-sales-partner', {
        body: { action: 'create', username: normalizedUsername, password, fullName: fullName.trim() },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Kreiranje terenca nije uspjelo.');

      toast.success(`Korisnik ${normalizedUsername} je kreiran i može se odmah prijaviti.`);
      setFullName('');
      setUsername('');
      setPassword('');
      await loadData();
    } catch (error: any) {
      const message = error?.context?.body?.error || error?.message || 'Dodavanje terenca nije uspjelo.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const updatePartnerPassword = async (userId: string) => {
    if (editPassword.length < 8) {
      toast.error('Nova lozinka mora imati najmanje 8 znakova.');
      return;
    }
    setUpdatingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-sales-partner', {
        body: { action: 'update_password', userId, password: editPassword },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Promjena lozinke nije uspjela.');
      toast.success('Lozinka je promijenjena.');
      setEditingPasswordUserId(null);
      setEditPassword('');
    } catch (error: any) {
      toast.error(error?.context?.body?.error || error?.message || 'Promjena lozinke nije uspjela.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const updatePartnerUsername = async (userId: string) => {
    const normalizedUsername = editUsername.trim().toLowerCase();
    if (!USERNAME_RE.test(normalizedUsername)) {
      toast.error('Korisničko ime: 3-40 znakova; slova, brojevi, točka, crtica ili donja crta.');
      return;
    }
    setUpdatingUsername(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-sales-partner', {
        body: { action: 'set_username', userId, username: normalizedUsername },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Promjena korisničkog imena nije uspjela.');
      toast.success(`Korisničko ime je sada ${normalizedUsername}.`);
      setEditingUsernameUserId(null);
      setEditUsername('');
      await loadData();
    } catch (error: any) {
      toast.error(error?.context?.body?.error || error?.message || 'Promjena korisničkog imena nije uspjela.');
    } finally {
      setUpdatingUsername(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Kreiraj terenca</CardTitle>
          <CardDescription>
            Terenac dobiva samo korisničko ime i lozinku. Email mu nije potreban za prijavu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addPartner} className="grid gap-3 md:grid-cols-3 md:items-end">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Ime i prezime</Label>
              <Input id="partner-name" placeholder="Ivan Horvat" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={saving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-username">Korisničko ime</Label>
              <Input
                id="partner-username"
                type="text"
                autoComplete="off"
                placeholder="ivan.horvat"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
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
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={saving} className="gap-2">
                <UserPlus className="h-4 w-4" />{saving ? 'Kreiram…' : 'Kreiraj korisnika'}
              </Button>
              <Button type="button" variant="outline" onClick={loadData} disabled={loading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Osvježi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktivni terenci</CardTitle>
          <CardDescription>
            {partners.length} aktivnih. Možeš postaviti korisničko ime postojećem terencu ili promijeniti lozinku.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {partners.length === 0 ? (
            <p className="text-sm text-muted-foreground">Još nema aktivnih terenaca.</p>
          ) : partners.map((partner) => (
            <div key={partner.user_id} className="rounded-lg border p-3 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{partner.full_name || partner.username || 'Terenac'}</p>
                  <p className="text-xs text-muted-foreground">
                    {partner.username ? `Korisničko ime: ${partner.username}` : 'Korisničko ime još nije postavljeno'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Aktivan</span>
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => { setEditingUsernameUserId(partner.user_id); setEditUsername(partner.username || ''); }}>
                    <UserRoundCog className="h-4 w-4" />Korisničko ime
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => { setEditingPasswordUserId(partner.user_id); setEditPassword(''); setShowEditPassword(false); }}>
                    <KeyRound className="h-4 w-4" />Lozinka
                  </Button>
                </div>
              </div>

              {editingUsernameUserId === partner.user_id && (
                <div className="rounded-md bg-muted/40 p-3">
                  <Label htmlFor={`username-${partner.user_id}`}>Korisničko ime</Label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <Input id={`username-${partner.user_id}`} value={editUsername} onChange={(e) => setEditUsername(e.target.value.toLowerCase())} placeholder="ivan.horvat" className="flex-1" />
                    <Button type="button" onClick={() => updatePartnerUsername(partner.user_id)} disabled={updatingUsername}>Spremi</Button>
                    <Button type="button" variant="ghost" onClick={() => setEditingUsernameUserId(null)} disabled={updatingUsername}><X className="mr-1 h-4 w-4" />Odustani</Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Promjenom korisničkog imena mijenja se i način njegove prijave.</p>
                </div>
              )}

              {editingPasswordUserId === partner.user_id && (
                <div className="rounded-md bg-muted/40 p-3">
                  <Label htmlFor={`password-${partner.user_id}`}>Nova lozinka</Label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Input id={`password-${partner.user_id}`} type={showEditPassword ? 'text' : 'password'} placeholder="Najmanje 8 znakova" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} minLength={8} className="pr-10" disabled={updatingPassword} />
                      <button type="button" onClick={() => setShowEditPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
                        {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button type="button" onClick={() => updatePartnerPassword(partner.user_id)} disabled={updatingPassword || editPassword.length < 8}>{updatingPassword ? 'Spremam…' : 'Spremi lozinku'}</Button>
                    <Button type="button" variant="ghost" onClick={() => setEditingPasswordUserId(null)} disabled={updatingPassword}><X className="mr-1 h-4 w-4" />Odustani</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesPartnerManagement;
