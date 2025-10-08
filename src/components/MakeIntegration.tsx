
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
  content_booster_webhook_url?: string;
  content_booster_auto_trigger?: boolean;
}

const MakeIntegration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);
  const [testLog, setTestLog] = useState<string>('');
  
  const [settings, setSettings] = useState<MakeSettings>({
    webhook_url: '',
    api_key: '',
    team_id: '',
    scenario_name: '',
    auto_trigger: false,
    trigger_events: ['email_sent', 'lead_added', 'reminder_created'],
    content_booster_webhook_url: '',
    content_booster_auto_trigger: false
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
      const testLeadData = {
        company: 'Test Tvrtka d.o.o.',
        email: 'test@example.com',
        phone: '+385 99 123 4567',
        website: 'https://www.test-company.com',
        location: 'Zagreb, Hrvatska',
        country: 'Hrvatska',
        status: 'Nova',
        potential: 'Visoki',
        industry: 'IT & Tehnologija',
        dateAdded: new Date().toISOString()
      };

      const response = await fetch(settings.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(testLeadData),
      });

      setLastTestResult('success');
      toast({
        title: "Test uspješan",
        description: "Test lead podaci poslani na Make.com. Provjerite scenario da li ste primili podatke.",
        duration: 6000,
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

  const testContentBoosterWebhook = async () => {
    if (!settings.content_booster_webhook_url) {
      toast({
        title: "Greška",
        description: "Molimo unesite Content Booster Webhook URL prije testiranja.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setLastTestResult(null);
    setTestLog('');

    try {
      // Create a small test image blob
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#4F46E5';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.fillText('Test', 25, 55);
      }
      
      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
      });

      // Prepare FormData with image file
      const formData = new FormData();
      formData.append('text', 'Test objava iz Marketing Agent aplikacije');
      formData.append('image', imageBlob, 'image.jpg');

      const logMessage = `📤 Šaljem podatke na:\n${settings.content_booster_webhook_url}\n\n📦 Podaci:\n- text: "Test objava iz Marketing Agent aplikacije"\n- image: test-image.jpg (${imageBlob.size} bytes)`;
      setTestLog(logMessage);
      
      console.log('=== CONTENT BOOSTER WEBHOOK TEST ===');
      console.log('Webhook URL:', settings.content_booster_webhook_url);
      console.log('Sending FormData with image file');

      const response = await fetch(settings.content_booster_webhook_url, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });

      console.log('Request sent successfully (no-cors mode - cannot see response)');

      setLastTestResult('success');
      setTestLog(prev => `${prev}\n\n✅ Zahtjev uspješno poslan sa .jpg slikom!`);
      
      toast({
        title: "Zahtjev poslan",
        description: "Podaci sa slikom su poslani na Make.com. Provjerite da je scenario AKTIVAN i da webhook čeka podatke.",
        duration: 8000,
      });
    } catch (error) {
      console.error('Error testing Content Booster webhook:', error);
      setLastTestResult('error');
      const errorMsg = error instanceof Error ? error.message : 'Nepoznata greška';
      setTestLog(prev => `${prev}\n\n❌ Greška: ${errorMsg}`);
      
      toast({
        title: "Test neuspješan",
        description: "Dogodila se greška prilikom slanja: " + errorMsg,
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
          <h4 className="font-medium text-blue-900 mb-2">📋 Kako postaviti Make.com integraciju - VAŽNO!</h4>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Idite na <a href="https://make.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Make.com</a> i kreirajte novi scenario</li>
            <li>Dodajte <strong>"Webhooks" &gt; "Custom webhook"</strong> modul na početak</li>
            <li>Kliknite na webhook i kreirajte novi webhook (dajte mu ime)</li>
            <li>Kopirajte webhook URL i zalijepite ga u polje ispod</li>
            <li>
              <strong className="text-red-700">KRITIČNO:</strong> Kliknite "Re-determine data structure" u webhook modulu i ODMAH nakon toga kliknite "Test" dugme ispod
            </li>
            <li>Make.com će sada primiti test podatke i automatski postaviti strukturu</li>
            <li>Dodajte module koje želite nakon webhook-a (npr. Google Sheets, Email, itd.)</li>
            <li>Spremite scenario i <strong>AKTIVIRAJTE GA</strong> (prekidač mora biti ON)</li>
          </ol>
          <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
            <p className="text-xs text-yellow-900">
              ⚠️ Ako ne vidite podatke: Provjerite da je scenario AKTIVAN i da webhook modul kaže "Waiting for data"
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-amber-900 mb-2">📋 Općenita integracija (Leadovi)</h4>
            <p className="text-sm text-amber-800">
              Ovaj webhook se koristi za slanje podataka o leadovima u Google Sheets ili drugu destinaciju.
            </p>
          </div>

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
            <Label htmlFor="auto_trigger">Automatski pokreni webhook za leadove</Label>
          </div>

          {/* Content Booster Integration Section */}
          <div className="border-t pt-6 mt-6">
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-purple-900 mb-2">🚀 Content Booster integracija</h4>
              <p className="text-sm text-purple-800">
                Odvojeni webhook za objave iz Content Booster modula. Šalje podatke o platformi, sadržaju, slici i drugim detaljima.
              </p>
            </div>

            <div>
              <Label htmlFor="content_booster_webhook_url">Content Booster Webhook URL</Label>
              <Input
                id="content_booster_webhook_url"
                type="url"
                value={settings.content_booster_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, content_booster_webhook_url: e.target.value })}
                placeholder="https://hook.eu1.make.com/xxxxxxxx"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="content_booster_auto_trigger"
                checked={settings.content_booster_auto_trigger || false}
                onChange={(e) => setSettings({ ...settings, content_booster_auto_trigger: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="content_booster_auto_trigger">Automatski šalji objave na Make.com</Label>
            </div>

            <Button
              onClick={testContentBoosterWebhook}
              disabled={isTesting || !settings.content_booster_webhook_url}
              variant="outline"
              className="w-full mt-4"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testiranje...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Testiraj Content Booster Webhook
                </>
              )}
            </Button>

            {testLog && (
              <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-200">
                <h5 className="font-medium text-sm mb-2">Test Log:</h5>
                <pre className="text-xs whitespace-pre-wrap font-mono text-slate-700">{testLog}</pre>
              </div>
            )}
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
                  Testiraj Lead Webhook
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-slate-700 mb-2">Općeniti eventi:</h5>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <code>email_sent</code> - Kada se pošalje email</li>
                <li>• <code>lead_added</code> - Kada se doda novi lead</li>
                <li>• <code>reminder_created</code> - Kada se kreira novi podsjetnik</li>
                <li>• <code>reminder_completed</code> - Kada se završi podsjetnik</li>
                <li>• <code>test_connection</code> - Test konekcije</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-purple-700 mb-2">Content Booster eventi:</h5>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• <code>content_published</code> - Kada se objavi sadržaj</li>
              </ul>
              <p className="text-xs text-purple-500 mt-2">
                Šalje: platform, content, contentType, date, companyName, industry, imageUrl
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MakeIntegration;
