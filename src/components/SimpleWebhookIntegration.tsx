import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, Webhook } from 'lucide-react';

interface WebhookSettings {
  webhook_url?: string;
  email_webhook_url?: string;
  content_booster_webhook_url?: string;
  auto_trigger_lead?: boolean;
  auto_trigger_email?: boolean;
  auto_trigger_content?: boolean;
}

const SimpleWebhookIntegration = () => {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<WebhookSettings>({
    webhook_url: '',
    email_webhook_url: '',
    content_booster_webhook_url: '',
    auto_trigger_lead: false,
    auto_trigger_email: false,
    auto_trigger_content: false,
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
        .select('make_settings')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.make_settings) {
        const makeSettings = data.make_settings as any;
        setSettings({
          webhook_url: makeSettings.webhook_url || '',
          email_webhook_url: makeSettings.email_webhook_url || '',
          content_booster_webhook_url: makeSettings.content_booster_webhook_url || '',
          auto_trigger_lead: makeSettings.auto_trigger_lead || false,
          auto_trigger_email: makeSettings.auto_trigger_email || false,
          auto_trigger_content: makeSettings.auto_trigger_content || false,
        });
      }
    } catch (error) {
      console.error('Error loading webhook settings:', error);
      toast({
        title: 'Greška',
        description: 'Nije moguće učitati webhook postavke',
        variant: 'destructive',
      });
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
        .select('id, make_settings')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentMakeSettings = (existingRecord?.make_settings as Record<string, any>) || {};
      const updatedMakeSettings = {
        ...currentMakeSettings,
        ...settings,
      };

      let result;
      if (existingRecord) {
        result = await supabase
          .from('user_settings')
          .update({
            make_settings: updatedMakeSettings as any,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            make_settings: updatedMakeSettings as any,
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      toast({
        title: 'Uspješno spremljeno',
        description: 'Webhook postavke su uspješno spremljene',
      });
    } catch (error) {
      console.error('Error saving webhook settings:', error);
      toast({
        title: 'Greška',
        description: 'Nije moguće spremiti webhook postavke',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testWebhook = async (type: 'lead' | 'email' | 'content') => {
    const webhookUrl = type === 'lead' 
      ? settings.webhook_url 
      : type === 'email' 
      ? settings.email_webhook_url 
      : settings.content_booster_webhook_url;

    if (!webhookUrl) {
      toast({
        title: 'Greška',
        description: 'Molimo unesite webhook URL prije testiranja',
        variant: 'destructive',
      });
      return;
    }

    setTestingWebhook(type);
    try {
      const testData = {
        test: true,
        type: type,
        timestamp: new Date().toISOString(),
        message: `Test webhook poziv - ${type}`,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        toast({
          title: 'Webhook test uspješan',
          description: `Testni podatci uspješno poslani na ${type} webhook`,
        });
      } else {
        throw new Error('Webhook response not OK');
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: 'Test nije uspio',
        description: 'Provjerite webhook URL i pokušajte ponovo',
        variant: 'destructive',
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook Integracije
        </CardTitle>
        <CardDescription>
          Povežite svoje webhook URL-ove za automatsko slanje podataka
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Webhook Lead */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="webhook_lead" className="text-base font-semibold">
              Webhook Lead
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Prima podatke kad se doda novi lead u bazu
          </p>
          <Input
            id="webhook_lead"
            type="url"
            placeholder="https://hook.eu1.make.com/xxxxx"
            value={settings.webhook_url}
            onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_trigger_lead"
              checked={settings.auto_trigger_lead}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, auto_trigger_lead: checked as boolean })
              }
            />
            <label
              htmlFor="auto_trigger_lead"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Automatski aktiviraj
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => testWebhook('lead')}
            disabled={!settings.webhook_url || testingWebhook === 'lead'}
          >
            {testingWebhook === 'lead' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testiram...
              </>
            ) : (
              'Test'
            )}
          </Button>
        </div>

        <div className="border-t pt-8" />

        {/* Webhook Email */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="webhook_email" className="text-base font-semibold">
              Webhook Email
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Prima podatke kad se pošalje email poruka
          </p>
          <Input
            id="webhook_email"
            type="url"
            placeholder="https://hook.eu1.make.com/xxxxx"
            value={settings.email_webhook_url}
            onChange={(e) => setSettings({ ...settings, email_webhook_url: e.target.value })}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_trigger_email"
              checked={settings.auto_trigger_email}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, auto_trigger_email: checked as boolean })
              }
            />
            <label
              htmlFor="auto_trigger_email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Automatski aktiviraj
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => testWebhook('email')}
            disabled={!settings.email_webhook_url || testingWebhook === 'email'}
          >
            {testingWebhook === 'email' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testiram...
              </>
            ) : (
              'Test'
            )}
          </Button>
        </div>

        <div className="border-t pt-8" />

        {/* Webhook Marketing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="webhook_marketing" className="text-base font-semibold">
              Webhook Marketing
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Prima podatke iz Content Boostera (objave i planiranje)
          </p>
          <Input
            id="webhook_marketing"
            type="url"
            placeholder="https://hook.eu1.make.com/xxxxx"
            value={settings.content_booster_webhook_url}
            onChange={(e) => setSettings({ ...settings, content_booster_webhook_url: e.target.value })}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_trigger_content"
              checked={settings.auto_trigger_content}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, auto_trigger_content: checked as boolean })
              }
            />
            <label
              htmlFor="auto_trigger_content"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Automatski aktiviraj
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => testWebhook('content')}
            disabled={!settings.content_booster_webhook_url || testingWebhook === 'content'}
          >
            {testingWebhook === 'content' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testiram...
              </>
            ) : (
              'Test'
            )}
          </Button>
        </div>

        <div className="border-t pt-8" />

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Spremam...
              </>
            ) : (
              'Spremi sve postavke'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleWebhookIntegration;
