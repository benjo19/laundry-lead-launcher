
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
import { Save, Mail, Share2 } from 'lucide-react';

interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

interface SocialPlatforms {
  facebook: {
    enabled: boolean;
    access_token: string;
    page_id: string;
  };
  linkedin: {
    enabled: boolean;
    access_token: string;
    company_id: string;
  };
  instagram: {
    enabled: boolean;
    access_token: string;
    account_id: string;
  };
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: ''
  });

  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatforms>({
    facebook: { enabled: false, access_token: '', page_id: '' },
    linkedin: { enabled: false, access_token: '', company_id: '' },
    instagram: { enabled: false, access_token: '', account_id: '' }
  });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (settings) {
        // Type-safe handling of email_settings
        const emailData = settings.email_settings;
        if (emailData && typeof emailData === 'object' && !Array.isArray(emailData)) {
          const typedEmailSettings = emailData as Record<string, any>;
          if (typedEmailSettings.smtp_host) {
            setEmailSettings({
              smtp_host: typedEmailSettings.smtp_host || '',
              smtp_port: typedEmailSettings.smtp_port || '587',
              smtp_username: typedEmailSettings.smtp_username || '',
              smtp_password: typedEmailSettings.smtp_password || '',
              from_email: typedEmailSettings.from_email || '',
              from_name: typedEmailSettings.from_name || ''
            });
          }
        }

        // Type-safe handling of social_platforms
        const socialData = settings.social_platforms;
        if (socialData && typeof socialData === 'object' && !Array.isArray(socialData)) {
          const typedSocialSettings = socialData as Record<string, any>;
          if (typedSocialSettings.facebook || typedSocialSettings.linkedin || typedSocialSettings.instagram) {
            setSocialPlatforms({
              facebook: typedSocialSettings.facebook || { enabled: false, access_token: '', page_id: '' },
              linkedin: typedSocialSettings.linkedin || { enabled: false, access_token: '', company_id: '' },
              instagram: typedSocialSettings.instagram || { enabled: false, access_token: '', account_id: '' }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri učitavanju postavki.",
        variant: "destructive",
      });
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
          email_settings: emailSettings,
          social_platforms: socialPlatforms,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Postavke spremljene",
        description: "Vaše postavke su uspješno spremljene.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri spremanju postavki.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Postavke</h1>
          <p className="text-slate-600 mt-2">Konfigurirajte svoje email i društvene mreže integracije</p>
        </div>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email postavke
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Društvene mreže
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>SMTP konfiguracija</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={emailSettings.smtp_host}
                      onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      value={emailSettings.smtp_port}
                      onChange={(e) => setEmailSettings({...emailSettings, smtp_port: e.target.value})}
                      placeholder="587"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="smtp_username">Username</Label>
                  <Input
                    id="smtp_username"
                    value={emailSettings.smtp_username}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_username: e.target.value})}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                    placeholder="your-app-password"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      value={emailSettings.from_email}
                      onChange={(e) => setEmailSettings({...emailSettings, from_email: e.target.value})}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      id="from_name"
                      value={emailSettings.from_name}
                      onChange={(e) => setEmailSettings({...emailSettings, from_name: e.target.value})}
                      placeholder="Your Company"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Facebook
                    <Switch
                      checked={socialPlatforms.facebook.enabled}
                      onCheckedChange={(checked) => 
                        setSocialPlatforms({
                          ...socialPlatforms,
                          facebook: { ...socialPlatforms.facebook, enabled: checked }
                        })
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fb_token">Access Token</Label>
                    <Input
                      id="fb_token"
                      value={socialPlatforms.facebook.access_token}
                      onChange={(e) => setSocialPlatforms({
                        ...socialPlatforms,
                        facebook: { ...socialPlatforms.facebook, access_token: e.target.value }
                      })}
                      placeholder="Your Facebook access token"
                      disabled={!socialPlatforms.facebook.enabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fb_page">Page ID</Label>
                    <Input
                      id="fb_page"
                      value={socialPlatforms.facebook.page_id}
                      onChange={(e) => setSocialPlatforms({
                        ...socialPlatforms,
                        facebook: { ...socialPlatforms.facebook, page_id: e.target.value }
                      })}
                      placeholder="Your Facebook page ID"
                      disabled={!socialPlatforms.facebook.enabled}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    LinkedIn
                    <Switch
                      checked={socialPlatforms.linkedin.enabled}
                      onCheckedChange={(checked) => 
                        setSocialPlatforms({
                          ...socialPlatforms,
                          linkedin: { ...socialPlatforms.linkedin, enabled: checked }
                        })
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="li_token">Access Token</Label>
                    <Input
                      id="li_token"
                      value={socialPlatforms.linkedin.access_token}
                      onChange={(e) => setSocialPlatforms({
                        ...socialPlatforms,
                        linkedin: { ...socialPlatforms.linkedin, access_token: e.target.value }
                      })}
                      placeholder="Your LinkedIn access token"
                      disabled={!socialPlatforms.linkedin.enabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="li_company">Company ID</Label>
                    <Input
                      id="li_company"
                      value={socialPlatforms.linkedin.company_id}
                      onChange={(e) => setSocialPlatforms({
                        ...socialPlatforms,
                        linkedin: { ...socialPlatforms.linkedin, company_id: e.target.value }
                      })}
                      placeholder="Your LinkedIn company ID"
                      disabled={!socialPlatforms.linkedin.enabled}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Instagram
                    <Switch
                      checked={socialPlatforms.instagram.enabled}
                      onCheckedChange={(checked) => 
                        setSocialPlatforms({
                          ...socialPlatforms,
                          instagram: { ...socialPlatforms.instagram, enabled: checked }
                        })
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ig_token">Access Token</Label>
                    <Input
                      id="ig_token"
                      value={socialPlatforms.instagram.access_token}
                      onChange={(e) => setSocialPlatforms({
                        ...socialPlatforms,
                        instagram: { ...socialPlatforms.instagram, access_token: e.target.value }
                      })}
                      placeholder="Your Instagram access token"
                      disabled={!socialPlatforms.instagram.enabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ig_account">Account ID</Label>
                    <Input
                      id="ig_account"
                      value={socialPlatforms.instagram.account_id}
                      onChange={(e) => setSocialPlatforms({
                        ...socialPlatforms,
                        instagram: { ...socialPlatforms.instagram, account_id: e.target.value }
                      })}
                      placeholder="Your Instagram account ID"
                      disabled={!socialPlatforms.instagram.enabled}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-8">
          <Button onClick={saveSettings} disabled={loading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Spremanje...' : 'Spremi postavke'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
