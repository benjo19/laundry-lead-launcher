import React, { useState, useEffect } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Zap, Send, TestTube, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { migrateLocalStorageToDatabase } from '@/utils/migrateLocalStorageToDatabase';

interface ZapierSettings {
  webhook_url?: string;
  enabled?: boolean;
  last_test?: string;
  last_updated?: string;
}

const ZapierIntegration = () => {
  const { value: zapierSettings, setValue: setZapierSettings, isLoading: settingsLoading } = useUserSettings<ZapierSettings>(
    'zapier_settings',
    {}
  );
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testData, setTestData] = useState('{"message": "Test from Marketing Agent", "timestamp": ""}');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  // Load webhook URL from settings
  useEffect(() => {
    if (zapierSettings?.webhook_url) {
      setWebhookUrl(zapierSettings.webhook_url);
      if (zapierSettings.enabled) {
        setConnectionStatus('success');
      }
    }
  }, [zapierSettings]);

  // Migrate localStorage data on mount
  useEffect(() => {
    migrateLocalStorageToDatabase();
  }, []);

  const handleSaveWebhook = async () => {
    if (!webhookUrl || !validateWebhookUrl(webhookUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    const success = await setZapierSettings({
      webhook_url: webhookUrl,
      enabled: true,
      last_updated: new Date().toISOString(),
    });

    if (success) {
      toast({
        title: "Saved",
        description: "Your Zapier webhook URL has been saved",
      });
    }
  };

  const handleTriggerZap = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter and save your Zapier webhook URL first",
        variant: "destructive",
      });
      return;
    }

    if (!validateWebhookUrl(webhookUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Zapier webhook URL starting with https://hooks.zapier.com",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Triggering Zapier webhook:", webhookUrl);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(testData);
      } catch (parseError) {
        toast({
          title: "Invalid JSON",
          description: "Please enter valid JSON data",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          ...parsedData,
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
        }),
      });

      setConnectionStatus('success');
      
      // Update last test time
      await setZapierSettings({
        ...zapierSettings,
        webhook_url: webhookUrl,
        enabled: true,
        last_test: new Date().toISOString(),
      });

      toast({
        title: "Request Sent",
        description: "The request was sent to Zapier. Check your Zap's history to confirm it was triggered.",
      });
    } catch (error) {
      console.error("Error triggering webhook:", error);
      setConnectionStatus('error');
      toast({
        title: "Error",
        description: "Failed to trigger the Zapier webhook. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateWebhookUrl = (url: string) => {
    return url.includes('hooks.zapier.com') && url.startsWith('https://');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Zapier Integracija
                {connectionStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {connectionStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              </CardTitle>
            </div>
            {zapierSettings?.enabled && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected to YOUR account
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your webhook URL is private and only sends data to YOUR Zapier account. Each user configures their own integrations.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="webhook-url">Your Zapier Webhook URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  setConnectionStatus('idle');
                }}
                className={`${
                  webhookUrl && !validateWebhookUrl(webhookUrl) 
                    ? 'border-red-500' 
                    : webhookUrl && validateWebhookUrl(webhookUrl)
                    ? 'border-green-500'
                    : ''
                }`}
                disabled={settingsLoading}
              />
              <Button
                onClick={handleSaveWebhook}
                disabled={!webhookUrl || !validateWebhookUrl(webhookUrl) || settingsLoading}
                variant="outline"
              >
                Save
              </Button>
            </div>
            {webhookUrl && !validateWebhookUrl(webhookUrl) && (
              <p className="text-sm text-red-600 mt-1">
                URL treba počinjati s "https://hooks.zapier.com"
              </p>
            )}
            {zapierSettings?.last_test && (
              <p className="text-xs text-muted-foreground mt-1">
                Last tested: {new Date(zapierSettings.last_test).toLocaleString()}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Stvorite novi Zap u Zapier-u s "Webhook by Zapier" triggerom i kopirajte URL ovdje.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => window.open('https://zapier.com/apps/webhook/integrations', '_blank')}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Stvori Zapier Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Zapier Veze
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTriggerZap} className="space-y-4">
            <div>
              <Label htmlFor="test-data">Test Podaci (JSON format)</Label>
              <Textarea
                id="test-data"
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder='{"message": "Test poruka", "data": "neki podaci"}'
                rows={4}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Unesite JSON podatke koje želite poslati na Zapier za testiranje.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !webhookUrl || !validateWebhookUrl(webhookUrl)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Šalje...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Pokreni Test Zap
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kako koristiti Zapier integraciju</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1.</strong> Idite na Zapier.com i stvorite novi Zap</p>
            <p><strong>2.</strong> Odaberite "Webhooks by Zapier" kao trigger</p>
            <p><strong>3.</strong> Odaberite "Catch Hook" i kopirajte webhook URL</p>
            <p><strong>4.</strong> Zalijepite URL u polje iznad</p>
            <p><strong>5.</strong> Dodajte akcije koje želite da se izvršavaju (email, CRM, itd.)</p>
            <p><strong>6.</strong> Testirajte integraciju pomoću gumba za test</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-blue-900 mb-2">Automatsko pokretanje</h4>
            <p className="text-sm text-blue-800">
              Kada postavite webhook, aplikacija će automatski slati podatke na Zapier kad se:
            </p>
            <ul className="text-sm text-blue-800 mt-2 list-disc list-inside">
              <li>Doda novi lead</li>
              <li>Pošalje email</li>
              <li>Stvori novi sadržaj</li>
              <li>Postavlja reminder</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-amber-900 mb-2">Troubleshooting</h4>
            <div className="text-sm text-amber-800 space-y-1">
              <p>• Provjerite da URL počinje s "https://hooks.zapier.com"</p>
              <p>• Vaš Zap mora biti uključen (ON)</p>
              <p>• Provjerite Zap History u Zapier-u za greške</p>
              <p>• Test podaci se šalju čim pritisnete gumb</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZapierIntegration;
