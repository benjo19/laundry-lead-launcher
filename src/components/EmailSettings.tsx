
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Save, Loader2 } from 'lucide-react';

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
}

const EmailSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings>({
    smtp_server: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_name: '',
    from_email: '',
    use_tls: true,
    auto_signature: true,
    signature_template: ''
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
        .select('email_settings')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.email_settings && typeof data.email_settings === 'object' && data.email_settings !== null) {
        const emailSettings = data.email_settings as Record<string, any>;
        setSettings(prev => ({ ...prev, ...emailSettings }));
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setIsLoading(false);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtp_server">SMTP Server</Label>
            <Input
              id="smtp_server"
              value={settings.smtp_server}
              onChange={(e) => setSettings({ ...settings, smtp_server: e.target.value })}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input
              id="smtp_port"
              type="number"
              value={settings.smtp_port}
              onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtp_username">SMTP Username</Label>
            <Input
              id="smtp_username"
              value={settings.smtp_username}
              onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
              placeholder="vaš-email@gmail.com"
            />
          </div>
          <div>
            <Label htmlFor="smtp_password">SMTP Password</Label>
            <Input
              id="smtp_password"
              type="password"
              value={settings.smtp_password}
              onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
              placeholder="app-specific password"
            />
          </div>
        </div>

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
            id="use_tls"
            checked={settings.use_tls}
            onCheckedChange={(checked) => setSettings({ ...settings, use_tls: checked })}
          />
          <Label htmlFor="use_tls">Koristi TLS/SSL enkripciju</Label>
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
