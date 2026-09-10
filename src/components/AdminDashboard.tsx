import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { supabase } from '@/integrations/supabase/client';
import { Users, Settings, Database, TrendingUp, UserPlus, ContactRound, BriefcaseBusiness } from 'lucide-react';
import LoadingSpinner from './ui/loading-spinner';
import SalesPartnerManagement from '@/components/admin/SalesPartnerManagement';
import AdminPartnerOverview from '@/components/admin/AdminPartnerOverview';
import OrderlyOwnerCRM from '@/components/admin/OrderlyOwnerCRM';
import { toast } from 'sonner';

interface UserStats {
  id: string;
  email: string;
  created_at: string;
  lead_count: number;
  email_count: number;
  reminder_count: number;
  role?: string;
}

const AdminDashboard: React.FC = () => {
  const { settings, updateGlobalSetting, isLoading } = useGlobalSettings();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [systemStats, setSystemStats] = useState({ totalUsers: 0, totalLeads: 0, totalEmails: 0, totalReminders: 0 });
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    loadUsers();
    loadSystemStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const db = supabase as any;
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, email, created_at');
      if (profilesError) throw profilesError;

      const { data: roleRows, error: roleError } = await db.from('user_roles').select('user_id, role');
      if (roleError) throw roleError;
      const roleMap = new Map((roleRows ?? []).map((row: any) => [row.user_id, row.role]));

      const usersWithStats = await Promise.all((profiles || []).map(async (profile) => {
        const [leadsResult, emailsResult, remindersResult] = await Promise.all([
          supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
          supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
          supabase.from('reminders').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        ]);
        return {
          ...profile,
          lead_count: leadsResult.count || 0,
          email_count: emailsResult.count || 0,
          reminder_count: remindersResult.count || 0,
          role: (roleMap.get(profile.id) as string | undefined) || 'user',
        };
      }));

      setUsers(usersWithStats as UserStats[]);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Nije moguće učitati korisnike.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const [usersResult, leadsResult, emailsResult, remindersResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('emails').select('id', { count: 'exact', head: true }),
        supabase.from('reminders').select('id', { count: 'exact', head: true }),
      ]);
      setSystemStats({
        totalUsers: usersResult.count || 0,
        totalLeads: leadsResult.count || 0,
        totalEmails: emailsResult.count || 0,
        totalReminders: remindersResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const handleUpdateWebhook = async (key: string, url: string) => {
    await updateGlobalSetting(key, { url });
  };

  if (isLoading || loadingUsers) {
    return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" text="Učitavam admin..." /></div>;
  }

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Orderly by AutomindAI</p>
        <h1 className="text-3xl font-bold">Owner CRM</h1>
        <p className="text-muted-foreground">Tvoj centralni CRM za vlastite leadove, terence, aktivne lokacije i prodajni pipeline.</p>
      </div>

      <Tabs defaultValue="owner-crm" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-6">
          <TabsTrigger value="owner-crm"><BriefcaseBusiness className="mr-2 h-4 w-4" />Moj CRM</TabsTrigger>
          <TabsTrigger value="partner-crm"><ContactRound className="mr-2 h-4 w-4" />CRM terenaca</TabsTrigger>
          <TabsTrigger value="partners"><UserPlus className="mr-2 h-4 w-4" />Terenci</TabsTrigger>
          <TabsTrigger value="overview"><TrendingUp className="mr-2 h-4 w-4" />Pregled</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Korisnici</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Postavke</TabsTrigger>
        </TabsList>

        <TabsContent value="owner-crm" className="mt-5"><OrderlyOwnerCRM /></TabsContent>
        <TabsContent value="partner-crm" className="mt-5"><AdminPartnerOverview /></TabsContent>
        <TabsContent value="partners" className="mt-5"><SalesPartnerManagement /></TabsContent>

        <TabsContent value="overview" className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Korisnici" value={systemStats.totalUsers} icon={Users} />
            <StatCard label="Leadovi" value={systemStats.totalLeads} icon={Database} />
            <StatCard label="Emailovi" value={systemStats.totalEmails} icon={Database} />
            <StatCard label="Follow-up" value={systemStats.totalReminders} icon={Database} />
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Svi korisnici</CardTitle>
              <CardDescription>Pregled računa i trenutne uloge.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Kreiran {new Date(user.created_at).toLocaleDateString('hr-HR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{user.role}</span>
                    <div className="text-right text-xs text-muted-foreground">{user.lead_count} leadova</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Globalne postavke</CardTitle>
              <CardDescription>Postojeće integracije ostaju dostupne adminu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingField id="make-webhook" label="Make.com Webhook URL" value={settings.make_webhook_url?.url || ''} onBlur={(value) => handleUpdateWebhook('make_webhook_url', value)} />
              <SettingField id="zapier-webhook" label="Zapier Webhook URL" value={settings.zapier_webhook_url?.url || ''} onBlur={(value) => handleUpdateWebhook('zapier_webhook_url', value)} />
              <SettingField id="content-webhook" label="Content Booster Webhook URL" value={settings.content_booster_webhook_url?.url || ''} onBlur={(value) => handleUpdateWebhook('content_booster_webhook_url', value)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) => (
  <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>
);

const SettingField = ({ id, label, value, onBlur }: { id: string; label: string; value: string; onBlur: (value: string) => void }) => (
  <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} defaultValue={value} onBlur={(e) => onBlur(e.target.value)} /></div>
);

export default AdminDashboard;
