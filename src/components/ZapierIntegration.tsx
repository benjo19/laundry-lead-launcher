
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Zap, Send, TestTube } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const ZapierIntegration = () => {
  const [webhookUrl, setWebhookUrl] = useLocalStorage('zapier_webhook_url', '');
  const [testData, setTestData] = useState('{"message": "Test from Marketing Agent", "timestamp": ""}');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTriggerZap = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast({
        title: "Greška",
        description: "Molimo unesite URL vašeg Zapier webhook-a",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Triggering Zapier webhook:", webhookUrl);

    try {
      let dataToSend;
      try {
        dataToSend = JSON.parse(testData);
        dataToSend.timestamp = new Date().toISOString();
        dataToSend.triggered_from = window.location.origin;
      } catch (parseError) {
        dataToSend = {
          message: testData,
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
        };
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(dataToSend),
      });

      toast({
        title: "Zahtjev poslan",
        description: "Zahtjev je poslan na Zapier. Provjerite historiju vašeg Zap-a da potvrdite da je pokrenut.",
      });
    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast({
        title: "Greška",
        description: "Neuspješno pokretanje Zapier webhook-a. Molimo provjerite URL i pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerWithLeadData = async (leadData: any) => {
    if (!webhookUrl) {
      toast({
        title: "Greška",
        description: "Molimo postavite Zapier webhook URL prije pokretanja",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const dataToSend = {
        type: "new_lead",
        lead: leadData,
        timestamp: new Date().toISOString(),
        triggered_from: "Marketing Agent - Lead Hunter",
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(dataToSend),
      });

      toast({
        title: "Lead poslan na Zapier",
        description: `Podaci za ${leadData.company} su poslani na Zapier.`,
      });
    } catch (error) {
      console.error("Error sending lead to Zapier:", error);
      toast({
        title: "Greška",
        description: "Neuspješno slanje lead-a na Zapier.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Zapier Integracija
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-url">Zapier Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="mt-1"
            />
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

            <Button type="submit" disabled={isLoading || !webhookUrl}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ZapierIntegration;
