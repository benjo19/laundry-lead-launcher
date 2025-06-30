
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOAuthCallback } from '@/hooks/useOAuthCallback';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Save, Loader2, Chrome, Globe, ExternalLink } from 'lucide-react';
import EmailOAuthHandler from './EmailOAuthHandler';

interface EmailSettings {
  smtp_server: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_name: string;
  from_email: string;
  use_tls: boolean;
  auto_signature: boolean;
  signature_template: string;
  provider_type?: 'manual' | 'gmail' | 'outlook';
  oauth_providers?: {
    google?: {
      email?: string;
      access_token?: string;
      refresh_token?: string;
      connected_at?: string;
    };
    outlook?: {
      email?: string;
      access_token?: string;
      refresh_token?: string;
      connected_at?: string;
    };
  };
}

const EmailSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<{
    google?: string;
    outlook?: string;
  }>({});
  
  const [settings, setSettings] = useState<EmailSettings>({
    smtp_server: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_name: '',
    from_email: '',
    use_tls: true,
    auto_signature: true,
    signature_template: '',
    provider_type: 'manual',
    oauth_providers: {}
  });

  // Handle OAuth callbacks
  useOAuthCallback();

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('email_settings')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.email_settings && typeof data.email_settings === 'object' && data.email_settings !== null) {
        const emailSettings = data.email_settings as Record<string, any>;
        setSettings(prev => ({ ...prev, ...emailSettings }));
        
        // Update connected accounts state
        if (emailSettings.oauth_providers) {
          setConnectedAccounts({
            google: emailSettings.oauth_providers.google?.email,
            outlook: emailSettings.oauth_providers.outlook?.email
          });
        }
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSelect = (provider: 'gmail' | 'outlook') => {
    if (provider === 'gmail') {
      setSettings({
        ...settings,
        provider_type: 'gmail',
        smtp_server: 'smtp.gmail.com',
        smtp_port: 587,
        use_tls: true
      });
    } else if (provider === 'outlook') {
      setSettings({
        ...settings,
        provider_type: 'outlook',
        smtp_server: 'smtp-mail.outlook.com',
        smtp_port: 587,
        use_tls: true
      });
    }
  };

  const handleOAuthConnectionChange = (provider: 'google' | 'outlook', email?: string) => {
    setConnectedAccounts(prev => ({
      ...prev,
      [provider]: email
    }));
    
    // Reload settings to get the latest OAuth data
    if (email) {
      loadSettings();
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { data: existingRecord } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      if (existingRecord) {
        result = await supabase
          .from('user_settings')
          .update({
            email_settings: settings as any,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            email_settings: settings as any,
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Postavke spremljene",
        description: "Email postavke su uspješno ažurirane.",
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom spremanja postavki.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Postavke
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OAuth Authentication Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">OAuth Autentikacija</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <EmailOAuthHandler
              provider="google"
              onConnectionChange={handleOAuthConnectionChange}
              connectedEmail={connectedAccounts.google}
            />
            <EmailOAuthHandler
              provider="outlook"
              onConnectionChange={handleOAuthConnectionChange}
              connectedEmail={connectedAccounts.outlook}
            />
          </div>
          <p className="text-sm text-slate-600">
            Povežite vaše email račune kroz OAuth za sigurnu autentikaciju bez potrebe za unošenjem lozinki.
          </p>
        </div>

        {/* Provider Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Odaberite email pružatelja</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              type="button"
              variant={settings.provider_type === 'gmail' ? 'default' : 'outline'}
              onClick={() => handleProviderSelect('gmail')}
              className="flex items-center gap-2 h-12"
            >
              <Chrome className="h-5 w-5" />
              Gmail
            </Button>
            <Button
              type="button"
              variant={settings.provider_type === 'outlook' ? 'default' : 'outline'}
              onClick={() => handleProviderSelect('outlook')}
              className="flex items-center gap-2 h-12"
            >
              <Globe className="h-5 w-5" />
              Outlook
            </Button>
            <Button
              type="button"
              variant={settings.provider_type === 'manual' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, provider_type: 'manual' })}
              className="flex items-center gap-2 h-12"
            >
              <Mail className="h-5 w-5" />
              Ručno
            </Button>
          </div>
        </div>

        {/* Provider-specific instructions */}
        {settings.provider_type === 'gmail' && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Gmail postavke</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {connectedAccounts.google ? (
                <>
                  <li>• Gmail račun je povezan kroz OAuth</li>
                  <li>• Emailovi će se slati kroz sigurnu Google autentikaciju</li>
                  <li>• Nema potrebe za App Password</li>
                </>
              ) : (
                <>
                  <li>• Kliknite "Poveži s Google" iznad za OAuth integraciju</li>
                  <li>• Ili ručno unesite Gmail podatke ispod</li>
                  <li>• Za ručno podešavanje trebate App Password</li>
                </>
              )}
            </ul>
          </div>
        )}

        {settings.provider_type === 'outlook' && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Outlook postavke</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              {connectedAccounts.outlook ? (
                <>
                  <li>• Outlook račun je povezan kroz OAuth</li>
                  <li>• Emailovi će se slati kroz sigurnu Microsoft autentikaciju</li>
                  <li>• Nema potrebe za lozinku</li>
                </>
              ) : (
                <>
                  <li>• Kliknite "Poveži s Outlook" iznad za OAuth integraciju</li>
                  <li>• Ili ručno unesite Outlook podatke ispod</li>
                  <li>• Za ručno podešavanje koristite običnu lozinku</li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* SMTP Configuration - show if not using OAuth or manual selected */}
        {(settings.provider_type === 'manual' || 
          (settings.provider_type === 'gmail' && !connectedAccounts.google) ||
          (settings.provider_type === 'outlook' && !connectedAccounts.outlook)) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp_server">SMTP Server</Label>
                <Input
                  id="smtp_server"
                  value={settings.smtp_server}
                  onChange={(e) => setSettings({ ...settings, smtp_server: e.target.value })}
                  placeholder="smtp.gmail.com"
                  disabled={settings.provider_type !== 'manual'}
                />
              </div>
              <div>
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                  disabled={settings.provider_type !== 'manual'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp_username">
                  {settings.provider_type === 'gmail' ? 'Gmail Email' : 
                   settings.provider_type === 'outlook' ? 'Outlook Email' : 'SMTP Username'}
                </Label>
                <Input
                  id="smtp_username"
                  value={settings.smtp_username}
                  onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                  placeholder={
                    settings.provider_type === 'gmail' ? 'vaš-email@gmail.com' :
                    settings.provider_type === 'outlook' ? 'vaš-email@outlook.com' :
                    'vaš-email@example.com'
                  }
                />
              </div>
              <div>
                <Label htmlFor="smtp_password">
                  {settings.provider_type === 'gmail' ? 'App Password' : 
                   settings.provider_type === 'outlook' ? 'Lozinka' : 'SMTP Password'}
                </Label>
                <Input
                  id="smtp_password"
                  type="password"
                  value={settings.smtp_password}
                  onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                  placeholder={
                    settings.provider_type === 'gmail' ? 'App-specific password' :
                    settings.provider_type === 'outlook' ? 'Microsoft account password' :
                    'password'
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="use_tls"
                checked={settings.use_tls}
                onCheckedChange={(checked) => setSettings({ ...settings, use_tls: checked })}
                disabled={settings.provider_type !== 'manual'}
              />
              <Label htmlFor="use_tls">Koristi TLS/SSL enkripciju</Label>
            </div>
          </>
        )}

        {/* Common settings that always show */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from_name">Ime pošaljatelja</Label>
            <Input
              id="from_name"
              value={settings.from_name}
              onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
              placeholder="Vaše ime ili tvrtka"
            />
          </div>
          <div>
            <Label htmlFor="from_email">Email pošaljatelja</Label>
            <Input
              id="from_email"
              type="email"
              value={settings.from_email}
              onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
              placeholder="vaš-email@domena.com"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="auto_signature"
            checked={settings.auto_signature}
            onCheckedChange={(checked) => setSettings({ ...settings, auto_signature: checked })}
          />
          <Label htmlFor="auto_signature">Automatski dodaj potpis</Label>
        </div>

        <div>
          <Label htmlFor="signature_template">Template potpisa</Label>
          <Textarea
            id="signature_template"
            value={settings.signature_template}
            onChange={(e) => setSettings({ ...settings, signature_template: e.target.value })}
            placeholder="Vaš email potpis template..."
            rows={4}
          />
        </div>

        <Button onClick={saveSettings} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sprema...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Spremi postavke
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmailSettings;
