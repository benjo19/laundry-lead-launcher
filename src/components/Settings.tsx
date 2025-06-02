
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
import { Save, Mail, Share2, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

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
    app_id: string;
    app_secret: string;
    access_token: string;
    page_id: string;
  };
  linkedin: {
    enabled: boolean;
    username: string;
    password: string;
  };
  instagram: {
    enabled: boolean;
    username: string;
    password: string;
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
    facebook: { enabled: false, app_id: '', app_secret: '', access_token: '', page_id: '' },
    linkedin: { enabled: false, username: '', password: '' },
    instagram: { enabled: false, username: '', password: '' }
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
              facebook: typedSocialSettings.facebook || { enabled: false, app_id: '', app_secret: '', access_token: '', page_id: '' },
              linkedin: typedSocialSettings.linkedin || { enabled: false, username: '', password: '' },
              instagram: typedSocialSettings.instagram || { enabled: false, username: '', password: '' }
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
      // First, check if settings exist for this user
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_settings')
          .update({
            email_settings: emailSettings as any,
            social_platforms: socialPlatforms as any,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('user_settings')
          .insert([{
            user_id: user.id,
            email_settings: emailSettings as any,
            social_platforms: socialPlatforms as any
          }]);

        if (error) throw error;
      }

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

  const getConnectionStatus = (platform: keyof SocialPlatforms) => {
    const platformData = socialPlatforms[platform];
    if (!platformData.enabled) {
      return { status: 'disabled', icon: XCircle, color: 'text-gray-400', text: 'Onemogućeno' };
    }
    
    if (platform === 'facebook') {
      const fbData = platformData as SocialPlatforms['facebook'];
      if (fbData.app_id && fbData.app_secret && fbData.access_token && fbData.page_id) {
        return { status: 'connected', icon: CheckCircle, color: 'text-green-500', text: 'Povezano' };
      }
    } else {
      // For LinkedIn and Instagram
      const socialData = platformData as SocialPlatforms['linkedin'] | SocialPlatforms['instagram'];
      if (socialData.username && socialData.password) {
        return { status: 'connected', icon: CheckCircle, color: 'text-green-500', text: 'Povezano' };
      }
    }
    
    return { status: 'incomplete', icon: AlertCircle, color: 'text-yellow-500', text: 'Nepotpuno' };
  };

  const getEmailConnectionStatus = () => {
    const requiredFields = [emailSettings.smtp_host, emailSettings.smtp_username, emailSettings.smtp_password, emailSettings.from_email];
    const hasAllFields = requiredFields.every(field => field && field.trim() !== '');
    
    if (hasAllFields) {
      return { status: 'connected', icon: CheckCircle, color: 'text-green-500', text: 'Konfigurisan' };
    }
    return { status: 'incomplete', icon: AlertCircle, color: 'text-yellow-500', text: 'Nepotpuno' };
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
              {(() => {
                const status = getEmailConnectionStatus();
                const StatusIcon = status.icon;
                return <StatusIcon className={`h-4 w-4 ${status.color}`} />;
              })()}
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Društvene mreže
              {(() => {
                const hasConnectedPlatform = Object.keys(socialPlatforms).some(platform => {
                  const status = getConnectionStatus(platform as keyof SocialPlatforms);
                  return status.status === 'connected';
                });
                return hasConnectedPlatform ? 
                  <CheckCircle className="h-4 w-4 text-green-500" /> : 
                  <XCircle className="h-4 w-4 text-gray-400" />;
              })()}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  SMTP konfiguracija
                  {(() => {
                    const status = getEmailConnectionStatus();
                    const StatusIcon = status.icon;
                    return (
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-5 w-5 ${status.color}`} />
                        <span className={`text-sm ${status.color}`}>{status.text}</span>
                      </div>
                    );
                  })()}
                </CardTitle>
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
              {/* Facebook Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      Facebook
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = getConnectionStatus('facebook');
                          const StatusIcon = status.icon;
                          return (
                            <>
                              <StatusIcon className={`h-5 w-5 ${status.color}`} />
                              <span className={`text-sm ${status.color}`}>{status.text}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
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
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Kako postaviti Facebook integraciju:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Idite na <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Facebook Developer Portal</a></li>
                      <li>Stvorite novu aplikaciju ili koristite postojeću</li>
                      <li>Dodajte "Pages" permission u Graph API Explorer</li>
                      <li>Generirajte Page Access Token za vašu stranicu</li>
                      <li>Unesite podatke u polja ispod</li>
                    </ol>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.open('https://developers.facebook.com/tools/explorer/', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Graph API Explorer
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fb_app_id">App ID</Label>
                      <Input
                        id="fb_app_id"
                        value={socialPlatforms.facebook.app_id}
                        onChange={(e) => setSocialPlatforms({
                          ...socialPlatforms,
                          facebook: { ...socialPlatforms.facebook, app_id: e.target.value }
                        })}
                        placeholder="1234567890123456"
                        disabled={!socialPlatforms.facebook.enabled}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fb_page_id">Page ID</Label>
                      <Input
                        id="fb_page_id"
                        value={socialPlatforms.facebook.page_id}
                        onChange={(e) => setSocialPlatforms({
                          ...socialPlatforms,
                          facebook: { ...socialPlatforms.facebook, page_id: e.target.value }
                        })}
                        placeholder="1234567890123456"
                        disabled={!socialPlatforms.facebook.enabled}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="fb_app_secret">App Secret</Label>
                    <Input
                      id="fb_app_secret"
                      type="password"
                      value={socialPlatforms.facebook.app_secret}
                      onChange={(e) => setSocialPlatforms({
                        ...socialPlatforms,
                        facebook: { ...socialPlatforms.facebook, app_secret: e.target.value }
                      })}
                      placeholder="app_secret_key"
                      disabled={!socialPlatforms.facebook.enabled}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fb_access_token">Page Access Token</Label>
                    <Input
                      id="fb_access_token"
                      type="password"
                      value={socialPlatforms.facebook.access_token}
                      onChange={(e) => setSocialPlatforms({
                        ...socialPlatforms,
                        facebook: { ...socialPlatforms.facebook, access_token: e.target.value }
                      })}
                      placeholder="Page access token"
                      disabled={!socialPlatforms.facebook.enabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {(['linkedin', 'instagram'] as const).map((platform) => {
                const status = getConnectionStatus(platform);
                const StatusIcon = status.icon;
                const platformName = platform === 'linkedin' ? 'LinkedIn' : 'Instagram';
                
                return (
                  <Card key={platform}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {platformName}
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-5 w-5 ${status.color}`} />
                            <span className={`text-sm ${status.color}`}>{status.text}</span>
                          </div>
                        </div>
                        <Switch
                          checked={socialPlatforms[platform].enabled}
                          onCheckedChange={(checked) => 
                            setSocialPlatforms({
                              ...socialPlatforms,
                              [platform]: { ...socialPlatforms[platform], enabled: checked }
                            })
                          }
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor={`${platform}_username`}>Korisničko ime</Label>
                        <Input
                          id={`${platform}_username`}
                          value={(socialPlatforms[platform] as SocialPlatforms['linkedin']).username}
                          onChange={(e) => setSocialPlatforms({
                            ...socialPlatforms,
                            [platform]: { ...socialPlatforms[platform], username: e.target.value }
                          })}
                          placeholder={`Vaše ${platformName} korisničko ime`}
                          disabled={!socialPlatforms[platform].enabled}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${platform}_password`}>Lozinka</Label>
                        <Input
                          id={`${platform}_password`}
                          type="password"
                          value={(socialPlatforms[platform] as SocialPlatforms['linkedin']).password}
                          onChange={(e) => setSocialPlatforms({
                            ...socialPlatforms,
                            [platform]: { ...socialPlatforms[platform], password: e.target.value }
                          })}
                          placeholder={`Vaša ${platformName} lozinka`}
                          disabled={!socialPlatforms[platform].enabled}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
