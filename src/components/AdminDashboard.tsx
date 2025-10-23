import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { supabase } from '@/integrations/supabase/client';
import { Users, Settings, Database, TrendingUp } from 'lucide-react';
import LoadingSpinner from './ui/loading-spinner';
import { toast } from 'sonner';

interface UserStats {
  id: string;
  email: string;
  created_at: string;
  lead_count: number;
  email_count: number;
  reminder_count: number;
}

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { settings, updateGlobalSetting, isLoading } = useGlobalSettings();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalLeads: 0,
    totalEmails: 0,
    totalReminders: 0
  });
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    loadUsers();
    loadSystemStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Get all users from auth
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at');

      if (profilesError) throw profilesError;

      // Get counts for each user
      const usersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const [leadsResult, emailsResult, remindersResult] = await Promise.all([
            supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
            supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
            supabase.from('reminders').select('id', { count: 'exact', head: true }).eq('user_id', profile.id)
          ]);

          return {
            ...profile,
            lead_count: leadsResult.count || 0,
            email_count: emailsResult.count || 0,
            reminder_count: remindersResult.count || 0
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
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
        supabase.from('reminders').select('id', { count: 'exact', head: true })
      ]);

      setSystemStats({
        totalUsers: usersResult.count || 0,
        totalLeads: leadsResult.count || 0,
        totalEmails: emailsResult.count || 0,
        totalReminders: remindersResult.count || 0
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const handleUpdateWebhook = async (key: string, url: string) => {
    await updateGlobalSetting(key, { url });
  };

  if (isLoading || loadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage global settings and monitor system usage</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <TrendingUp className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Global Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalLeads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalEmails}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reminders</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalReminders}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View all users and their activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{user.lead_count}</p>
                        <p className="text-muted-foreground">Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{user.email_count}</p>
                        <p className="text-muted-foreground">Emails</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{user.reminder_count}</p>
                        <p className="text-muted-foreground">Reminders</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Integration Settings</CardTitle>
              <CardDescription>Configure global webhook URLs for all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="make-webhook">Make.com Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="make-webhook"
                    placeholder="https://hook.eu1.make.com/..."
                    defaultValue={settings.make_webhook_url?.url || ''}
                    onBlur={(e) => handleUpdateWebhook('make_webhook_url', e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This webhook will be used for all users' Make.com integrations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zapier-webhook">Zapier Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="zapier-webhook"
                    placeholder="https://hooks.zapier.com/..."
                    defaultValue={settings.zapier_webhook_url?.url || ''}
                    onBlur={(e) => handleUpdateWebhook('zapier_webhook_url', e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This webhook will be used for all users' Zapier integrations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-webhook">Content Booster Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="content-webhook"
                    placeholder="https://..."
                    defaultValue={settings.content_booster_webhook_url?.url || ''}
                    onBlur={(e) => handleUpdateWebhook('content_booster_webhook_url', e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This webhook will be used for all content creation events
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
