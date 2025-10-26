
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
  email_webhook_url?: string;
  email_auto_trigger?: boolean;
  crm_export_webhook_url?: string;
  crm_export_auto_trigger?: boolean;
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
    content_booster_auto_trigger: false,
    email_webhook_url: '',
    email_auto_trigger: false,
    crm_export_webhook_url: '',
    crm_export_auto_trigger: false
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

  const testEmailWebhook = async () => {
    if (!settings.email_webhook_url) {
      toast({
        title: "Greška",
        description: "Molimo unesite Email Webhook URL prije testiranja.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setLastTestResult(null);

    try {
      const testEmailData = {
        to_email: 'test@example.com',
        subject: 'Test email iz Marketing Agent aplikacije',
        content_preview: 'Ovo je testni email poslan iz Marketing Agent aplikacije za provjeru Make.com integracije...',
        timestamp: new Date().toISOString(),
        send_method: 'resend',
        status: 'sent'
      };

      console.log('=== EMAIL WEBHOOK TEST ===');
      console.log('Webhook URL:', settings.email_webhook_url);
      console.log('Test data:', testEmailData);

      const response = await fetch(settings.email_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(testEmailData),
      });

      console.log('Request sent successfully (no-cors mode)');

      setLastTestResult('success');
      toast({
        title: "Test uspješan",
        description: "Test email podaci poslani na Make.com. Provjerite scenario da li ste primili podatke.",
        duration: 6000,
      });
    } catch (error) {
      console.error('Error testing email webhook:', error);
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

  const testCRMExportWebhook = async () => {
    if (!settings.crm_export_webhook_url) {
      toast({
        title: "Greška",
        description: "Molimo unesite CRM Export Webhook URL prije testiranja.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setLastTestResult(null);

    try {
      const testCRMData = {
        export_type: 'reminders',
        filename: 'crm-test-export',
        timestamp: new Date().toISOString(),
        total_count: 2,
        items: [
          {
            title: 'Testni reminder',
            description: 'Test opis za reminder',
            company: 'Test Tvrtka d.o.o.',
            date: '2024-01-20',
            time: '14:00',
            priority: 'Visok',
            status: 'Aktivan'
          },
          {
            title: 'Drugi reminder',
            description: 'Poslati ponudu',
            company: 'Drugi Klijent d.o.o.',
            date: '2024-01-22',
            time: '10:00',
            priority: 'Srednji',
            status: 'Aktivan'
          }
        ],
        leads: [
          {
            company: 'Test Tvrtka d.o.o.',
            email: 'info@test.hr',
            phone: '+385 1 234 5678',
            website: 'https://www.test.hr',
            location: 'Zagreb, Hrvatska',
            industry: 'IT & Tehnologija'
          },
          {
            company: 'Drugi Klijent d.o.o.',
            email: 'kontakt@klijent.hr',
            phone: '+385 91 999 8888',
            website: 'https://www.klijent.hr',
            location: 'Split, Hrvatska',
            industry: 'Trgovina'
          }
        ]
      };

      console.log('=== CRM EXPORT WEBHOOK TEST ===');
      console.log('Webhook URL:', settings.crm_export_webhook_url);
      console.log('Test data:', testCRMData);

      const response = await fetch(settings.crm_export_webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(testCRMData),
      });

      console.log('Request sent successfully (no-cors mode)');

      setLastTestResult('success');
      toast({
        title: "Test uspješan",
        description: "Test CRM podaci poslani na Make.com. Provjerite scenario da li ste primili podatke.",
        duration: 6000,
      });
    } catch (error) {
      console.error('Error testing CRM export webhook:', error);
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

          {/* Email Integration Section */}
          <div className="border-t pt-6 mt-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-green-900 mb-2">📧 Email integracija</h4>
              <p className="text-sm text-green-800">
                Odvojeni webhook za poslane emailove. Šalje podatke o primatelju, predmetu, sadržaju i statusu.
              </p>
            </div>

            <div>
              <Label htmlFor="email_webhook_url">Email Webhook URL</Label>
              <Input
                id="email_webhook_url"
                type="url"
                value={settings.email_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, email_webhook_url: e.target.value })}
                placeholder="https://hook.eu1.make.com/xxxxxxxx"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="email_auto_trigger"
                checked={settings.email_auto_trigger || false}
                onChange={(e) => setSettings({ ...settings, email_auto_trigger: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="email_auto_trigger">Automatski šalji podatke o poslanih emailovima</Label>
            </div>

            <Button
              onClick={testEmailWebhook}
              disabled={isTesting || !settings.email_webhook_url}
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
                  Testiraj Email Webhook
                </>
              )}
            </Button>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <h5 className="text-xs font-medium text-slate-700 mb-2">📦 Primjer podataka koji se šalju:</h5>
              <pre className="text-xs text-slate-600 font-mono">
{`{
  "to_email": "test@example.com",
  "subject": "Test email predmet",
  "content_preview": "Prvih 200 karaktera...",
  "timestamp": "2024-01-15T10:30:00Z",
  "send_method": "resend",
  "status": "sent"
}`}
              </pre>
            </div>
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

          {/* CRM Export Integration Section */}
          <div className="border-t pt-6 mt-6">
            <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-cyan-900 mb-2">📊 CRM Export integracija</h4>
              <p className="text-sm text-cyan-800">
                Webhook za export CRM podataka. Šalje remindere, leadove, i sve povezane informacije u JSON formatu.
                Na Make.com možete generirati Excel, poslati email, ili uploadati na Drive.
              </p>
            </div>

            <div>
              <Label htmlFor="crm_export_webhook_url">CRM Export Webhook URL</Label>
              <Input
                id="crm_export_webhook_url"
                type="url"
                value={settings.crm_export_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, crm_export_webhook_url: e.target.value })}
                placeholder="https://hook.eu1.make.com/xxxxxxxx"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="crm_export_auto_trigger"
                checked={settings.crm_export_auto_trigger || false}
                onChange={(e) => setSettings({ ...settings, crm_export_auto_trigger: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="crm_export_auto_trigger">Automatski šalji CRM podatke na webhook kod exporta</Label>
            </div>

            <Button
              onClick={testCRMExportWebhook}
              disabled={isTesting || !settings.crm_export_webhook_url}
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
                  Testiraj CRM Export Webhook
                </>
              )}
            </Button>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <h5 className="text-xs font-medium text-slate-700 mb-2">📦 Primjer podataka koji se šalju:</h5>
              <pre className="text-xs text-slate-600 font-mono overflow-x-auto">
{`{
  "event": "crm_export",
  "export_info": {
    "type": "reminders",
    "filename": "crm-export",
    "format": "excel",
    "timestamp": "2025-10-26T10:30:00Z",
    "user_id": "user-uuid"
  },
  "summary": {
    "total_items": 4,
    "total_leads": 10,
    "has_leads": true,
    "has_reminders": true
  },
  "reminders": [
    {
      "id": "uuid-123",
      "title": "Poziv klijenta",
      "description": "Nazvati za ponudu",
      "company": "ABC d.o.o.",
      "date": "2025-10-26",
      "time": "14:00",
      "priority": "Visok",
      "status": "Aktivan",
      "created_at": "2025-10-20T12:00:00Z"
    }
  ],
  "leads": [
    {
      "id": "uuid-456",
      "company": "XYZ d.o.o.",
      "email": "info@xyz.hr",
      "phone": "+385 1 234 5678",
      "website": "www.xyz.hr",
      "location": "Zagreb, Croatia",
      "status": "Nova",
      "potential": "Visok",
      "industry": "IT",
      "notes": "Zainteresirani za usluge",
      "created_at": "2025-10-20T12:00:00Z"
    }
  ]
}`}
              </pre>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="text-xs font-medium text-blue-700 mb-2">💡 Što možeš napraviti na Make.com:</h5>
              <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                <li>Generiraj Excel file sa Google Sheets ili Microsoft Excel Online modulom</li>
                <li>Pošalji Excel kao email attachment preko Gmail/Outlook modula</li>
                <li>Uploadaj na Google Drive / Dropbox / OneDrive</li>
                <li>Kreiraj novi sheet u postojećem Google Sheets dokumentu</li>
                <li>Pošalji podatke u drugi CRM (HubSpot, Salesforce, itd.)</li>
              </ul>
            </div>
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
                <li>• <code>lead_added</code> - Kada se doda novi lead</li>
                <li>• <code>reminder_created</code> - Kada se kreira novi podsjetnik</li>
                <li>• <code>reminder_completed</code> - Kada se završi podsjetnik</li>
                <li>• <code>test_connection</code> - Test konekcije</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-green-700 mb-2">Email eventi:</h5>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• <code>email_sent</code> - Kada se pošalje email</li>
              </ul>
              <p className="text-xs text-green-500 mt-2">
                Šalje: to_email, subject, content_preview, timestamp, send_method, status
              </p>
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
            <div>
              <h5 className="text-sm font-medium text-cyan-700 mb-2">CRM Export eventi:</h5>
              <ul className="text-sm text-cyan-600 space-y-1">
                <li>• <code>crm_export</code> - Kada se exportaju CRM podaci</li>
              </ul>
              <p className="text-xs text-cyan-500 mt-2">
                Šalje: export_type, filename, timestamp, total_count, items, leads
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MakeIntegration;
