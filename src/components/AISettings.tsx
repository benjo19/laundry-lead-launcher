
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAISettings } from '@/hooks/useAISettings';
import { Brain, Key, Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AISettings = () => {
  const { aiSettings, isLoading, saveAISettings, isAIConfigured } = useAISettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    provider: 'openai' as 'openai' | 'gemini',
    api_key: '',
    model: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (aiSettings) {
      setFormData({
        provider: aiSettings.provider || 'openai',
        api_key: aiSettings.api_key || '',
        model: aiSettings.model || ''
      });
    }
  }, [aiSettings]);

  const handleSave = async () => {
    if (!formData.api_key.trim()) {
      toast({
        title: "Greška",
        description: "API ključ je obavezan.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveAISettings(formData);
    } catch (error) {
      console.error('Error saving AI settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.api_key) {
      toast({
        title: "Greška",
        description: "Unesite API ključ prije testiranja.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Test veze",
      description: "Testiranje AI konekcije...",
    });

    // Simple test - just save settings which will validate the key
    await handleSave();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Učitava AI postavke...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Postavke
        </CardTitle>
        {isAIConfigured() && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              AI je uspješno konfiguriran i spreman za korištenje.
            </AlertDescription>
          </Alert>
        )}
        {!isAIConfigured() && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Konfigurirajte AI postavke za korištenje generiranja emaila i sadržaja.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="provider">AI Provider</Label>
          <Select 
            value={formData.provider} 
            onValueChange={(value: 'openai' | 'gemini') => setFormData({ ...formData, provider: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
              <SelectItem value="gemini">Google Gemini</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-slate-500 mt-1">
            Odaberite AI servis koji želite koristiti
          </p>
        </div>

        <div>
          <Label htmlFor="api_key">API Ključ</Label>
          <div className="flex gap-2">
            <Input
              id="api_key"
              type={showApiKey ? "text" : "password"}
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder={
                formData.provider === 'openai' 
                  ? "sk-..." 
                  : "AIza..."
              }
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? "Sakrij" : "Prikaži"}
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {formData.provider === 'openai' 
              ? "Dobijte API ključ na platform.openai.com/api-keys"
              : "Dobijte API ključ na aistudio.google.com/app/apikey"
            }
          </p>
        </div>

        {formData.provider === 'openai' && (
          <div>
            <Label htmlFor="model">Model (opcionalno)</Label>
            <Select 
              value={formData.model} 
              onValueChange={(value) => setFormData({ ...formData, model: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Odaberite model ili ostavite prazno za default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default (gpt-4o-mini)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (brže, jeftinije)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (moćnije, skuplje)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleSave} 
            className="flex-1"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sprema...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Spremi AI Postavke
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={isSaving}
          >
            <Key className="h-4 w-4 mr-2" />
            Testiraj
          </Button>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Kako dobiti API ključ:</h4>
          <div className="space-y-2 text-sm text-slate-600">
            {formData.provider === 'openai' ? (
              <>
                <p>1. Idite na <strong>platform.openai.com</strong></p>
                <p>2. Registrirajte se ili se prijavite</p>
                <p>3. Idite na "API Keys" u vašem dashboard-u</p>
                <p>4. Kliknite "Create new secret key"</p>
                <p>5. Kopirajte ključ i zalijepite ga ovdje</p>
              </>
            ) : (
              <>
                <p>1. Idite na <strong>aistudio.google.com</strong></p>
                <p>2. Prijavite se s Google računom</p>
                <p>3. Kliknite "Get API key"</p>
                <p>4. Kreirajte novi API ključ</p>
                <p>5. Kopirajte ključ i zalijepite ga ovdje</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISettings;
