import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import AddLeadDialog from '@/components/AddLeadDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Search, Users, MapPin, CircleDollarSign, UserRound } from 'lucide-react';
import { toast } from 'sonner';

type LeadRow = {
  id: string;
  user_id: string;
  created_by: string | null;
  assigned_to: string | null;
  company: string;
  location: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  source: string | null;
  created_at: string | null;
};

type Owner = {
  id: string;
  email: string | null;
  role: string;
};

const OrderlyOwnerCRM: React.FC = () => {
  const { user } = useAuthContext();
  const { addLead } = useLeadManagement();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const db = supabase as any;
      const [leadResult, profileResult, roleResult] = await Promise.all([
        db.from('leads')
          .select('id,user_id,created_by,assigned_to,company,location,city,phone,email,status,source,created_at')
          .order('created_at', { ascending: false }),
        db.from('profiles').select('id,email'),
        db.from('user_roles').select('user_id,role'),
      ]);

      const error = leadResult.error || profileResult.error || roleResult.error;
      if (error) throw error;

      const roleMap = new Map<string, string>();
      (roleResult.data ?? []).forEach((row: any) => {
        const current = roleMap.get(row.user_id);
        if (!current || row.role === 'super_admin' || (row.role === 'sales_partner' && current !== 'super_admin')) {
          roleMap.set(row.user_id, row.role);
        }
      });

      const ownerRows: Owner[] = (profileResult.data ?? [])
        .map((profile: any) => ({
          id: profile.id,
          email: profile.email,
          role: roleMap.get(profile.id) || 'user',
        }))
        .filter((profile: Owner) => profile.role === 'super_admin' || profile.role === 'sales_partner');

      setOwners(ownerRows);
      setLeads(leadResult.data ?? []);
    } catch (error: any) {
      console.error('Orderly owner CRM load error:', error);
      toast.error(error?.message || 'Nije moguće učitati Orderly CRM.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const ownerMap = useMemo(() => new Map(owners.map((owner) => [owner.id, owner])), [owners]);
  const effectiveOwnerId = (lead: LeadRow) => lead.assigned_to || lead.user_id;

  const filteredLeads = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const ownerId = effectiveOwnerId(lead);
      const owner = ownerMap.get(ownerId);
      const creator = ownerMap.get(lead.created_by || lead.user_id);
      const matchesSearch = !needle || [lead.company, lead.location, lead.city, lead.phone, lead.email, owner?.email, creator?.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
      const matchesOwner = ownerFilter === 'all' || ownerId === ownerFilter;
      const matchesStatus = statusFilter === 'all' || (lead.status || 'Nova') === statusFilter;
      return matchesSearch && matchesOwner && matchesStatus;
    });
  }, [leads, ownerMap, ownerFilter, search, statusFilter]);

  const stats = useMemo(() => {
    const partnerIds = new Set(owners.filter((owner) => owner.role === 'sales_partner').map((owner) => owner.id));
    return {
      total: leads.length,
      mine: leads.filter((lead) => effectiveOwnerId(lead) === user?.id).length,
      partner: leads.filter((lead) => partnerIds.has(effectiveOwnerId(lead))).length,
      paying: leads.filter((lead) => lead.status === 'Plaća').length,
    };
  }, [leads, owners, user?.id]);

  const statuses = useMemo(() => Array.from(new Set(leads.map((lead) => lead.status || 'Nova'))).sort(), [leads]);

  const handleAddLead = async (...args: Parameters<typeof addLead>) => {
    const result = await addLead(...args);
    if (result) {
      setAddLeadOpen(false);
      await load();
    }
    return result;
  };

  const ownerLabel = (ownerId: string) => {
    if (ownerId === user?.id) return 'Benjamin / moj lead';
    return ownerMap.get(ownerId)?.email || 'Nepoznat vlasnik';
  };

  const assignLead = async (leadId: string, assignedTo: string) => {
    setAssigningId(leadId);
    try {
      const db = supabase as any;
      const { error } = await db
        .from('leads')
        .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) throw error;
      setLeads((current) => current.map((lead) => lead.id === leadId ? { ...lead, assigned_to: assignedTo } : lead));
      toast.success('Lead je dodijeljen.');
    } catch (error: any) {
      console.error('Lead assignment error:', error);
      toast.error(error?.message || 'Nije moguće dodijeliti lead.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Orderly</p>
          <h2 className="text-2xl font-bold tracking-tight">Owner CRM</h2>
          <p className="text-sm text-muted-foreground">Svi tvoji leadovi i leadovi terenaca na jednom mjestu, s jasnim vlasnikom svakog leada.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Osvježi
          </Button>
          <Button onClick={() => setAddLeadOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Dodaj lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Svi leadovi" value={stats.total} icon={Users} />
        <Stat label="Moji leadovi" value={stats.mine} icon={UserRound} />
        <Stat label="Kod terenaca" value={stats.partner} icon={MapPin} />
        <Stat label="Plaćajući" value={stats.paying} icon={CircleDollarSign} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leadovi</CardTitle>
          <CardDescription>Lead možeš prebaciti sebi ili bilo kojem terencu. Kreator ostaje zapisan radi povijesti.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Traži lokal, grad, email, telefon ili terenca..." className="pl-9" />
            </div>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger><SelectValue placeholder="Svi vlasnici" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi vlasnici</SelectItem>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.id === user?.id ? 'Benjamin / moji leadovi' : owner.email || owner.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Svi statusi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi statusi</SelectItem>
                {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Lokacija</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Čiji je lead</th>
                  <th className="px-4 py-3 font-medium">Kontakt</th>
                  <th className="px-4 py-3 font-medium">Dodano</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!loading && filteredLeads.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nema leadova za odabrane filtere.</td></tr>
                )}
                {filteredLeads.map((lead) => {
                  const ownerId = effectiveOwnerId(lead);
                  const creatorId = lead.created_by || lead.user_id;
                  const creator = ownerMap.get(creatorId);
                  return (
                    <tr key={lead.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3"><p className="font-medium">{lead.company}</p><p className="text-xs text-muted-foreground">{lead.source || 'Manual'}</p></td>
                      <td className="px-4 py-3">{[lead.location, lead.city].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{lead.status || 'Nova'}</Badge></td>
                      <td className="px-4 py-3 min-w-[250px]">
                        <Select value={ownerId} onValueChange={(value) => assignLead(lead.id, value)} disabled={assigningId === lead.id}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {owners.map((owner) => (
                              <SelectItem key={owner.id} value={owner.id}>{ownerLabel(owner.id)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Kreirao: {creatorId === user?.id ? 'Benjamin' : creator?.email || 'nepoznat korisnik'}
                        </div>
                      </td>
                      <td className="px-4 py-3"><p>{lead.phone || '—'}</p><p className="text-xs text-muted-foreground">{lead.email || ''}</p></td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.created_at ? new Date(lead.created_at).toLocaleDateString('hr-HR') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} onAddLead={handleAddLead} />
    </div>
  );
};

const Stat = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-medium sm:text-sm">{label}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
  </Card>
);

export default OrderlyOwnerCRM;
