
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Facebook, Linkedin, Instagram, Save, Key } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    email_provider: '',
    email_settings: {
      smtp_host: '',
      smtp_port: '',
      smtp_username: '',
      smtp_password: '',
      from_email: '',
      from_name: ''
    },
    social_platforms: {
      facebook: {
        enabled: false,
        access_token: '',
        page_id: ''
      },
      linkedin: {
        enabled: false,
        access_token: '',
        company_id: ''
      },
      instagram: {
        enabled: false,
        access_token: '',
        account_id: ''
      }
    }
  });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          email_provider: data.email_provider || '',
          email_settings: data.email_settings || settings.email_settings,
          social_platforms: data.social_platforms || settings.social_platforms
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_provider: settings.email_provider,
          email_settings: settings.email_settings,
          social_platforms: settings.social_platforms,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Postavke spremljene",
        description: "Vaše postavke su uspješno ažurirane.",
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Dogodila se greška pri spremanju postavki.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEmailSettings = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      email_settings: {
        ...prev.email_settings,
        [field]: value
      }
    }));
  };

  const updateSocialPlatform = (platform: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      social_platforms: {
        ...prev.social_platforms,
        [platform]: {
          ...prev.social_platforms[platform as keyof typeof prev.social_platforms],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Postavke</h2>
          <p className="text-slate-600">Konfigurirajte vaše email i društvene mreže integracije</p>
        </div>
        <Button onClick={saveSettings} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Spremam...' : 'Spremi postavke'}
        </Button>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Email integracija</TabsTrigger>
          <TabsTrigger value="social">Društvene mreže</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email konfiguracija
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    placeholder="smtp.gmail.com"
                    value={settings.email_settings.smtp_host}
                    onChange={(e) => updateEmailSettings('smtp_host', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    placeholder="587"
                    value={settings.email_settings.smtp_port}
                    onChange={(e) => updateEmailSettings('smtp_port', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">SMTP korisničko ime</Label>
                  <Input
                    id="smtp_username"
                    placeholder="vas-email@gmail.com"
                    value={settings.email_settings.smtp_username}
                    onChange={(e) => updateEmailSettings('smtp_username', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">SMTP lozinka</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    placeholder="App lozinka"
                    value={settings.email_settings.smtp_password}
                    onChange={(e) => updateEmailSettings('smtp_password', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_email">Od email adrese</Label>
                  <Input
                    id="from_email"
                    placeholder="vas-email@gmail.com"
                    value={settings.email_settings.from_email}
                    onChange={(e) => updateEmailSettings('from_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">Od ime</Label>
                  <Input
                    id="from_name"
                    placeholder="Vaše ime ili tvrtka"
                    value={settings.email_settings.from_name}
                    onChange={(e) => updateEmailSettings('from_name', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                  Facebook integracija
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.social_platforms.facebook.enabled}
                    onCheckedChange={(checked) => updateSocialPlatform('facebook', 'enabled', checked)}
                  />
                  <Label>Omogući Facebook objave</Label>
                </div>
                {settings.social_platforms.facebook.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fb_token">Access Token</Label>
                      <Input
                        id="fb_token"
                        type="password"
                        placeholder="Facebook Access Token"
                        value={settings.social_platforms.facebook.access_token}
                        onChange={(e) => updateSocialPlatform('facebook', 'access_token', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fb_page">Page ID</Label>
                      <Input
                        id="fb_page"
                        placeholder="Facebook Page ID"
                        value={settings.social_platforms.facebook.page_id}
                        onChange={(e) => updateSocialPlatform('facebook', 'page_id', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Linkedin className="h-5 w-5 mr-2 text-blue-700" />
                  LinkedIn integracija
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.social_platforms.linkedin.enabled}
                    onCheckedChange={(checked) => updateSocialPlatform('linkedin', 'enabled', checked)}
                  />
                  <Label>Omogući LinkedIn objave</Label>
                </div>
                {settings.social_platforms.linkedin.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="li_token">Access Token</Label>
                      <Input
                        id="li_token"
                        type="password"
                        placeholder="LinkedIn Access Token"
                        value={settings.social_platforms.linkedin.access_token}
                        onChange={(e) => updateSocialPlatform('linkedin', 'access_token', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="li_company">Company ID</Label>
                      <Input
                        id="li_company"
                        placeholder="LinkedIn Company ID"
                        value={settings.social_platforms.linkedin.company_id}
                        onChange={(e) => updateSocialPlatform('linkedin', 'company_id', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Instagram className="h-5 w-5 mr-2 text-pink-600" />
                  Instagram integracija
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.social_platforms.instagram.enabled}
                    onCheckedChange={(checked) => updateSocialPlatform('instagram', 'enabled', checked)}
                  />
                  <Label>Omogući Instagram objave</Label>
                </div>
                {settings.social_platforms.instagram.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ig_token">Access Token</Label>
                      <Input
                        id="ig_token"
                        type="password"
                        placeholder="Instagram Access Token"
                        value={settings.social_platforms.instagram.access_token}
                        onChange={(e) => updateSocialPlatform('instagram', 'access_token', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ig_account">Account ID</Label>
                      <Input
                        id="ig_account"
                        placeholder="Instagram Business Account ID"
                        value={settings.social_platforms.instagram.account_id}
                        onChange={(e) => updateSocialPlatform('instagram', 'account_id', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
