import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Webhook, TestTube, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface WebhookSettings {
  webhook_url: string;
  auto_trigger: boolean;
}

const ContentBoosterWebhook = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);
  const [testLog, setTestLog] = useState<string>('');
  
  const [settings, setSettings] = useState<WebhookSettings>({
    webhook_url: '',
    auto_trigger: false
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
        if (makeSettings.content_booster_webhook_url) {
          setSettings({
            webhook_url: makeSettings.content_booster_webhook_url || '',
            auto_trigger: makeSettings.content_booster_auto_trigger || false
          });
        }
      }
    } catch (error) {
      console.error('Error loading webhook settings:', error);
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
        content_booster_webhook_url: settings.webhook_url,
        content_booster_auto_trigger: settings.auto_trigger
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
        title: "Spremljeno",
        description: "Content Booster webhook postavke su uspješno spremljene.",
      });
    } catch (error) {
      console.error('Error saving webhook settings:', error);
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
      formData.append('text', 'Test objava iz Marketing Agent Content Booster');
      formData.append('image', imageBlob, 'image.jpg');

      const logMessage = `📤 Šaljem podatke na:\n${settings.webhook_url}\n\n📦 Podaci:\n- text: "Test objava iz Marketing Agent Content Booster"\n- image: test-image.jpg (${imageBlob.size} bytes)`;
      setTestLog(logMessage);
      
      console.log('=== CONTENT BOOSTER WEBHOOK TEST ===');
      console.log('Webhook URL:', settings.webhook_url);
      console.log('Sending FormData with image file');

      await fetch(settings.webhook_url, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });

      console.log('Request sent successfully');

      setLastTestResult('success');
      setTestLog(prev => `${prev}\n\n✅ Zahtjev uspješno poslan sa .jpg slikom!`);
      
      toast({
        title: "Zahtjev poslan",
        description: "Test podaci sa slikom su poslani na vaš webhook. Provjerite destination za primljene podatke.",
        duration: 8000,
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
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
          <Webhook className="h-5 w-5" />
          Content Booster Webhook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">🚀 O Content Booster Webhook-u</h4>
          <p className="text-sm text-purple-800 mb-3">
            Postavite svoj vlastiti webhook URL gdje ćete primati objave iz Content Booster-a. 
            Webhook šalje podatke u FormData formatu sa tekstom i slikom (.jpg fajl).
          </p>
          <div className="space-y-2 text-sm text-purple-700">
            <p><strong>Format podataka:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><code>text</code> - Tekst objave</li>
              <li><code>image</code> - Slika kao .jpg fajl (ako postoji)</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="webhook_url">Webhook URL *</Label>
            <Input
              id="webhook_url"
              type="url"
              value={settings.webhook_url}
              onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
              placeholder="https://your-webhook-endpoint.com/webhook"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Unesite URL vašeg webhook endpointa koji će primati objave
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto_trigger"
              checked={settings.auto_trigger}
              onChange={(e) => setSettings({ ...settings, auto_trigger: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="auto_trigger">Automatski šalji objave na webhook</Label>
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
                  Testiraj Webhook
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

          {testLog && (
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
              <h5 className="font-medium text-sm mb-2">Test Log:</h5>
              <pre className="text-xs whitespace-pre-wrap font-mono text-slate-700">{testLog}</pre>
            </div>
          )}

          <Button onClick={saveSettings} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Spremanje...
              </>
            ) : (
              'Spremi postavke'
            )}
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Primjer webhook endpointa:</h4>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-sm font-mono text-slate-700 mb-2">POST /webhook</p>
            <p className="text-xs text-slate-600">
              Content-Type: multipart/form-data
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentBoosterWebhook;
