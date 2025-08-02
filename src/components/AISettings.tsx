
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAISettings } from '@/hooks/useAISettings';
import { Brain, Key, Save, Loader2, CheckCircle, AlertTriangle, MapPin, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AISettings = () => {
  const { aiSettings, isLoading, saveAISettings, isAIConfigured } = useAISettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    provider: 'openai' as 'openai' | 'gemini' | 'anthropic',
    api_key: '',
    model: '',
    google_maps_api_key: '',
    custom_system_prompt: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);

  useEffect(() => {
    if (aiSettings) {
      setFormData({
        provider: aiSettings.provider || 'openai',
        api_key: aiSettings.api_key || '',
        model: aiSettings.model || '',
        google_maps_api_key: aiSettings.google_maps_api_key || '',
        custom_system_prompt: aiSettings.custom_system_prompt || ''
      });
    }
  }, [aiSettings]);

  const handleSave = async () => {
    if (!formData.api_key.trim()) {
      toast({
        title: "Greška",
        description: "AI API ključ je obavezan.",
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
        description: "Unesite AI API ključ prije testiranja.",
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
            onValueChange={(value: 'openai' | 'gemini' | 'anthropic') => setFormData({ ...formData, provider: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
              <SelectItem value="gemini">Google Gemini</SelectItem>
              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-slate-500 mt-1">
            Odaberite AI servis koji želite koristiti
          </p>
        </div>

        <div>
          <Label htmlFor="api_key">AI API Ključ</Label>
          <div className="flex gap-2">
            <Input
              id="api_key"
              type={showApiKey ? "text" : "password"}
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder={
                formData.provider === 'openai' 
                  ? "sk-..." 
                  : formData.provider === 'gemini'
                  ? "AIza..."
                  : "sk-ant-..."
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
              : formData.provider === 'gemini'
              ? "Dobijte API ključ na aistudio.google.com/app/apikey"
              : "Dobijte API ključ na console.anthropic.com"
            }
          </p>
        </div>

        <div>
          <Label htmlFor="google_maps_api_key" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Google Maps API Ključ (opcionalno)
          </Label>
          <div className="flex gap-2">
            <Input
              id="google_maps_api_key"
              type={showGoogleMapsKey ? "text" : "password"}
              value={formData.google_maps_api_key}
              onChange={(e) => setFormData({ ...formData, google_maps_api_key: e.target.value })}
              placeholder="AIza..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
            >
              {showGoogleMapsKey ? "Sakrij" : "Prikaži"}
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Za Lead Discovery funkcionalnost - dobijte ključ na console.cloud.google.com
          </p>
        </div>

        
        {formData.provider === 'anthropic' && (
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
                <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet (Default - najbolji balans)</SelectItem>
                <SelectItem value="claude-opus-4-20250514">Claude 4 Opus (najmoćniji)</SelectItem>
                <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (najbrži)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Default - brže, jeftinije)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (moćnije, skuplje)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="custom_system_prompt" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Prilagodi AI ponašanje (opcionalno)
          </Label>
          <Textarea
            id="custom_system_prompt"
            value={formData.custom_system_prompt}
            onChange={(e) => setFormData({ ...formData, custom_system_prompt: e.target.value })}
            placeholder="Opiši kako želiš da se AI ponaša pri generiranju emailova i sadržaja..."
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-slate-500 mt-1">
            Definiraj specifične instrukcije za AI kako se ponašati (npr. ton, stil, fokus na određene industrije...)
          </p>
        </div>

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
          <h4 className="font-medium mb-2">Kako dobiti API ključeve:</h4>
          <div className="space-y-2 text-sm text-slate-600">
            <div>
              <strong>AI API ključ:</strong>
              {formData.provider === 'openai' ? (
                <>
                  <p>1. Idite na <strong>platform.openai.com</strong></p>
                  <p>2. Registrirajte se ili se prijavite</p>
                  <p>3. Idite na "API Keys" u vašem dashboard-u</p>
                  <p>4. Kliknite "Create new secret key"</p>
                  <p>5. Kopirajte ključ i zalijepite ga ovdje</p>
                </>
              ) : formData.provider === 'gemini' ? (
                <>
                  <p>1. Idite na <strong>aistudio.google.com</strong></p>
                  <p>2. Prijavite se s Google računom</p>
                  <p>3. Kliknite "Get API key"</p>
                  <p>4. Kreirajte novi API ključ</p>
                  <p>5. Kopirajte ključ i zalijepite ga ovdje</p>
                </>
              ) : (
                <>
                  <p>1. Idite na <strong>console.anthropic.com</strong></p>
                  <p>2. Registrirajte se ili se prijavite</p>
                  <p>3. Idite na "API Keys"</p>
                  <p>4. Kliknite "Create Key"</p>
                  <p>5. Kopirajte ključ i zalijepite ga ovdje</p>
                </>
              )}
            </div>
            <div className="mt-3">
              <strong>Google Maps API ključ:</strong>
              <p>1. Idite na <strong>console.cloud.google.com</strong></p>
              <p>2. Kreirajte novi projekt ili odaberite postojeći</p>
              <p>3. Omogućite "Places API" i "Maps JavaScript API"</p>
              <p>4. Kreirajte API ključ u "Credentials" sekciji</p>
              <p>5. Kopirajte ključ za Lead Discovery funkcije</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISettings;
