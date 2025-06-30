
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, TestTube, Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MakeSettings {
  webhook_url: string;
  api_key?: string;
  team_id?: string;
  scenario_name?: string;
  auto_trigger: boolean;
  trigger_events: string[];
}

const MakeIntegration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);
  
  const [settings, setSettings] = useState<MakeSettings>({
    webhook_url: '',
    api_key: '',
    team_id: '',
    scenario_name: '',
    auto_trigger: false,
    trigger_events: ['email_sent', 'lead_added', 'reminder_created']
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
        .maybeSingle();

      if (error) throw error;

      if (data?.make_settings) {
        const makeSettings = data.make_settings as Record<string, any>;
        setSettings(prev => ({ ...prev, ...makeSettings }));
      }
    } catch (error) {
      console.error('Error loading Make.com settings:', error);
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

      let result;
      if (existingRecord) {
        result = await supabase
          .from('user_settings')
          .update({
            make_settings: settings as any,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            make_settings: settings as any,
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      toast({
        title: t('save'),
        description: "Make.com postavke su uspješno spremljene.",
      });
    } catch (error) {
      console.error('Error saving Make.com settings:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom spremanja postavki.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!settings.webhook_url) {
      toast({
        title: "Greška",
        description: "Molimo unesite Webhook URL prije testiranja.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setLastTestResult(null);

    try {
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        user_id: user?.id,
        event_type: 'test_connection',
        data: {
          message: 'Test konekcije s Make.com',
          application: 'Marketing Agent'
        }
      };

      const response = await fetch(settings.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(testData),
      });

      setLastTestResult('success');
      toast({
        title: "Test uspješan",
        description: "Webhook je uspješno pozvan. Provjerite Make.com scenario logs.",
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      setLastTestResult('error');
      toast({
        title: "Test neuspješan",
        description: "Dogodila se greška prilikom testiranja webhook-a.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const triggerWebhook = async (eventType: string, data: any) => {
    if (!settings.webhook_url || !settings.auto_trigger) return;

    try {
      const webhookData = {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        user_id: user?.id,
        data: data
      };

      await fetch(settings.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(webhookData),
      });
    } catch (error) {
      console.error('Error triggering webhook:', error);
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
          <Settings className="h-5 w-5" />
          {t('make_integration')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Kako postaviti Make.com integraciju</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Idite na <a href="https://make.com" target="_blank" rel="noopener noreferrer" className="underline">Make.com</a> i kreirajte scenario</li>
            <li>Dodajte "Webhooks" trigger na početak scenarija</li>
            <li>Kopirajte Webhook URL iz Make.com-a i zalijepite ga ispod</li>
            <li>Testirajte konekciju klikom na "Test Connection"</li>
            <li>Spremite postavke i aktivirajte scenario u Make.com</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="webhook_url">{t('webhook_url')} *</Label>
            <Input
              id="webhook_url"
              type="url"
              value={settings.webhook_url}
              onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
              placeholder="https://hook.eu1.make.com/xxxxxxxx"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="scenario_name">Naziv scenarija (opcionalno)</Label>
            <Input
              id="scenario_name"
              value={settings.scenario_name}
              onChange={(e) => setSettings({ ...settings, scenario_name: e.target.value })}
              placeholder="Marketing Agent Integracija"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="team_id">Team ID (opcionalno)</Label>
            <Input
              id="team_id"
              value={settings.team_id}
              onChange={(e) => setSettings({ ...settings, team_id: e.target.value })}
              placeholder="123456"
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto_trigger"
              checked={settings.auto_trigger}
              onChange={(e) => setSettings({ ...settings, auto_trigger: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="auto_trigger">Automatski pokreni webhook za eventi</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={testWebhook}
              disabled={isTesting || !settings.webhook_url}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testiranje...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  {t('test_connection')}
                </>
              )}
            </Button>
            
            {lastTestResult && (
              <div className="flex items-center">
                {lastTestResult === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>

          <Button onClick={saveSettings} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Spremanje...
              </>
            ) : (
              t('save')
            )}
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Dostupni eventi za webhook:</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• <code>email_sent</code> - Kada se pošalje email</li>
            <li>• <code>lead_added</code> - Kada se doda novi lead</li>
            <li>• <code>reminder_created</code> - Kada se kreira novi podsjetnik</li>
            <li>• <code>reminder_completed</code> - Kada se završi podsjetnik</li>
            <li>• <code>test_connection</code> - Test konekcije</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MakeIntegration;
