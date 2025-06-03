import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Save, Mail, Share2, CheckCircle, XCircle, AlertCircle, ExternalLink, Bot, MapPin, Building2 } from 'lucide-react';
import BusinessProfileSettings from './BusinessProfileSettings';

interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

interface AISettings {
  openai_api_key: string;
  gemini_api_key: string;
  google_maps_api_key: string;
  default_ai_provider: 'openai' | 'gemini';
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

  const [aiSettings, setAiSettings] = useState<AISettings>({
    openai_api_key: '',
    gemini_api_key: '',
    google_maps_api_key: '',
    default_ai_provider: 'openai'
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
        // Load email settings
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

        // Load AI settings
        const aiData = settings.ai_settings;
        if (aiData && typeof aiData === 'object' && !Array.isArray(aiData)) {
          const typedAiSettings = aiData as Record<string, any>;
          setAiSettings({
            openai_api_key: typedAiSettings.openai_api_key || '',
            gemini_api_key: typedAiSettings.gemini_api_key || '',
            google_maps_api_key: typedAiSettings.google_maps_api_key || '',
            default_ai_provider: typedAiSettings.default_ai_provider || 'openai'
          });
        }

        // Load social settings
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
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSettings) {
        const { error } = await supabase
          .from('user_settings')
          .update({
            email_settings: emailSettings as any,
            ai_settings: aiSettings as any,
            social_platforms: socialPlatforms as any,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert([{
            user_id: user.id,
            email_settings: emailSettings as any,
            ai_settings: aiSettings as any,
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

  const getAIConnectionStatus = () => {
    const hasOpenAI = aiSettings.openai_api_key?.trim();
    const hasGemini = aiSettings.gemini_api_key?.trim();
    const hasGoogleMaps = aiSettings.google_maps_api_key?.trim();
    
    if (hasOpenAI || hasGemini || hasGoogleMaps) {
      return { status: 'connected', icon: CheckCircle, color: 'text-green-500', text: 'Konfigurisan' };
    }
    return { status: 'incomplete', icon: AlertCircle, color: 'text-yellow-500', text: 'Nepotpuno' };
  };

  const getConnectionStatus = (platform: keyof SocialPlatforms) => {
    const platformData = socialPlatforms[platform];
    if (!platformData.enabled) {
      return { status: 'disabled', icon: XCircle, color: 'text-gray-400', text: 'Onemogućeno' };
    }
    
    if (platform === 'facebook') {
      const fbData = platformData as SocialPlatforms['facebook'];
      if (fbData.app_id?.trim() && fbData.app_secret?.trim() && fbData.access_token?.trim() && fbData.page_id?.trim()) {
        return { status: 'connected', icon: CheckCircle, color: 'text-green-500', text: 'Povezano' };
      }
    } else {
      const socialData = platformData as SocialPlatforms['linkedin'] | SocialPlatforms['instagram'];
      if (socialData.username?.trim() && socialData.password?.trim()) {
        return { status: 'connected', icon: CheckCircle, color: 'text-green-500', text: 'Povezano' };
      }
    }
    
    return { status: 'incomplete', icon: AlertCircle, color: 'text-yellow-500', text: 'Nepotpuno' };
  };

  const getEmailConnectionStatus = () => {
    const requiredFields = [
      emailSettings.smtp_host?.trim(),
      emailSettings.smtp_username?.trim(),
      emailSettings.smtp_password?.trim(),
      emailSettings.from_email?.trim()
    ];
    const hasAllFields = requiredFields.every(field => field && field !== '');
    
    if (hasAllFields) {
      return { status: 'connected', icon: CheckCircle, color: 'text-green-500', text: 'Konfigurisan' };
    }
    return { status: 'incomplete', icon: AlertCircle, color: 'text-yellow-500', text: 'Nepotpuno' };
  };

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Postavke</h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">Konfigurirajte svoje AI, email i društvene mreže integracije</p>
        </div>

        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm">
            <TabsTrigger value="business" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Poslovanje</span>
              <span className="sm:hidden">Biz</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">AI & API</span>
              <span className="sm:hidden">API</span>
              {(() => {
                const status = getAIConnectionStatus();
                const StatusIcon = status.icon;
                return <StatusIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${status.color}`} />;
              })()}
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Email</span>
              <span className="sm:hidden">Mail</span>
              {(() => {
                const status = getEmailConnectionStatus();
                const StatusIcon = status.icon;
                return <StatusIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${status.color}`} />;
              })()}
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Social</span>
              <span className="sm:hidden">Social</span>
              {(() => {
                const hasConnectedPlatform = Object.keys(socialPlatforms).some(platform => {
                  const status = getConnectionStatus(platform as keyof SocialPlatforms);
                  return status.status === 'connected';
                });
                return hasConnectedPlatform ? 
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" /> : 
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />;
              })()}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business">
            <BusinessProfileSettings />
          </TabsContent>

          <TabsContent value="ai">
            <div className="space-y-6">
              {/* AI API Keys Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI API Ključevi
                    </div>
                    {(() => {
                      const hasAI = aiSettings.openai_api_key?.trim() || aiSettings.gemini_api_key?.trim();
                      return hasAI ? 
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                          <span className="text-sm text-green-500">Konfigurisan</span>
                        </div> :
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                          <span className="text-sm text-yellow-500">Nepotpuno</span>
                        </div>;
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="default_ai_provider">Zadani AI Provider</Label>
                    <Select 
                      value={aiSettings.default_ai_provider} 
                      onValueChange={(value: 'openai' | 'gemini') => 
                        setAiSettings({...aiSettings, default_ai_provider: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite zadani AI servis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI GPT</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="openai_api_key">OpenAI API Ključ</Label>
                    <Input
                      id="openai_api_key"
                      type="password"
                      value={aiSettings.openai_api_key || ''}
                      onChange={(e) => setAiSettings({...aiSettings, openai_api_key: e.target.value})}
                      placeholder="sk-..."
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Nabavite OpenAI API ključ ovdje
                      </a>
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="gemini_api_key">Google Gemini API Ključ</Label>
                    <Input
                      id="gemini_api_key"
                      type="password"
                      value={aiSettings.gemini_api_key || ''}
                      onChange={(e) => setAiSettings({...aiSettings, gemini_api_key: e.target.value})}
                      placeholder="AIza..."
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Nabavite Gemini API ključ ovdje
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Google Maps API Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Google Maps API
                    </div>
                    {(() => {
                      const hasGoogleMaps = aiSettings.google_maps_api_key?.trim();
                      return hasGoogleMaps ? 
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                          <span className="text-sm text-green-500">Konfigurisan</span>
                        </div> :
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                          <span className="text-sm text-yellow-500">Potreban</span>
                        </div>;
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="google_maps_api_key">Google Maps API Ključ</Label>
                    <Input
                      id="google_maps_api_key"
                      type="password"
                      value={aiSettings.google_maps_api_key || ''}
                      onChange={(e) => setAiSettings({...aiSettings, google_maps_api_key: e.target.value})}
                      placeholder="AIza..."
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Potreban za Lead Discovery funkcionalnost. 
                      <a href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        Nabavite Google Maps API ključ ovdje
                      </a>
                    </p>
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-2">
                      <p className="text-xs text-blue-800">
                        <strong>Napomena:</strong> Omogućite sljedeće API-jeve u Google Cloud Console:
                      </p>
                      <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
                        <li>Places API</li>
                        <li>Maps JavaScript API</li>
                        <li>Geocoding API</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                  SMTP konfiguracija
                  {(() => {
                    const status = getEmailConnectionStatus();
                    const StatusIcon = status.icon;
                    return (
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${status.color}`} />
                        <span className={`text-sm ${status.color}`}>{status.text}</span>
                      </div>
                    );
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={emailSettings.smtp_host || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      value={emailSettings.smtp_port || '587'}
                      onChange={(e) => setEmailSettings({...emailSettings, smtp_port: e.target.value})}
                      placeholder="587"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="smtp_username">Username</Label>
                  <Input
                    id="smtp_username"
                    value={emailSettings.smtp_username || ''}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_username: e.target.value})}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={emailSettings.smtp_password || ''}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                    placeholder="your-app-password"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      value={emailSettings.from_email || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, from_email: e.target.value})}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      id="from_name"
                      value={emailSettings.from_name || ''}
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
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    <div className="flex items-center gap-3">
                      Facebook
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = getConnectionStatus('facebook');
                          const StatusIcon = status.icon;
                          return (
                            <>
                              <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${status.color}`} />
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
                {socialPlatforms.facebook.enabled && (
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Kako postaviti Facebook integraciju:</h4>
                      <ol className="text-xs sm:text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Idite na <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Facebook Developer Portal</a></li>
                        <li>Stvorite novu aplikaciju ili koristite postojeću</li>
                        <li>Kopirajte App ID i App Secret ovdje</li>
                        <li>Generirajte Page Access Token putem Graph API Explorer-a</li>
                      </ol>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fb_app_id">App ID</Label>
                        <Input
                          id="fb_app_id"
                          value={socialPlatforms.facebook.app_id}
                          onChange={(e) => setSocialPlatforms({
                            ...socialPlatforms,
                            facebook: { ...socialPlatforms.facebook, app_id: e.target.value }
                          })}
                          placeholder="123456789012345"
                        />
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
                          placeholder="abcdef123456..."
                        />
                      </div>
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
                        placeholder="EAAxx..."
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
                        placeholder="123456789012345"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* LinkedIn Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    <div className="flex items-center gap-3">
                      LinkedIn
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = getConnectionStatus('linkedin');
                          const StatusIcon = status.icon;
                          return (
                            <>
                              <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${status.color}`} />
                              <span className={`text-sm ${status.color}`}>{status.text}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
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
                {socialPlatforms.linkedin.enabled && (
                  <CardContent className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-xs sm:text-sm text-orange-800">
                        <strong>Napomena:</strong> Koristimo automatizaciju preko web interface-a. Molimo budite oprezni s ograničenjima LinkedIn-a.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="linkedin_username">Username/Email</Label>
                      <Input
                        id="linkedin_username"
                        value={socialPlatforms.linkedin.username}
                        onChange={(e) => setSocialPlatforms({
                          ...socialPlatforms,
                          linkedin: { ...socialPlatforms.linkedin, username: e.target.value }
                        })}
                        placeholder="your-email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin_password">Password</Label>
                      <Input
                        id="linkedin_password"
                        type="password"
                        value={socialPlatforms.linkedin.password}
                        onChange={(e) => setSocialPlatforms({
                          ...socialPlatforms,
                          linkedin: { ...socialPlatforms.linkedin, password: e.target.value }
                        })}
                        placeholder="your-password"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Instagram Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                    <div className="flex items-center gap-3">
                      Instagram
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = getConnectionStatus('instagram');
                          const StatusIcon = status.icon;
                          return (
                            <>
                              <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${status.color}`} />
                              <span className={`text-sm ${status.color}`}>{status.text}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
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
                {socialPlatforms.instagram.enabled && (
                  <CardContent className="space-y-4">
                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                      <p className="text-xs sm:text-sm text-pink-800">
                        <strong>Napomena:</strong> Instagram integracija koristi automatizaciju. Preporučujemo korištenje business account-a.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="instagram_username">Username</Label>
                      <Input
                        id="instagram_username"
                        value={socialPlatforms.instagram.username}
                        onChange={(e) => setSocialPlatforms({
                          ...socialPlatforms,
                          instagram: { ...socialPlatforms.instagram, username: e.target.value }
                        })}
                        placeholder="your-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagram_password">Password</Label>
                      <Input
                        id="instagram_password"
                        type="password"
                        value={socialPlatforms.instagram.password}
                        onChange={(e) => setSocialPlatforms({
                          ...socialPlatforms,
                          instagram: { ...socialPlatforms.instagram, password: e.target.value }
                        })}
                        placeholder="your-password"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={saveSettings} disabled={loading} className="px-6">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Spremam...' : 'Spremi postavke'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
