import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAISettings } from '@/hooks/useAISettings';
import { Brain, Save, Loader2, CheckCircle, MapPin, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AISettings = () => {
  const { aiSettings, isLoading, saveAISettings } = useAISettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    google_maps_api_key: '',
    search_provider: 'google_cse' as 'google_cse' | 'serpapi',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);

  useEffect(() => {
    if (aiSettings) {
      setFormData({
        google_maps_api_key: aiSettings.google_maps_api_key || '',
        search_provider: aiSettings.search_provider || 'google_cse'
      });
    }
  }, [aiSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAISettings(formData);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Učitava postavke...</p>
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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Status - Always Enabled */}
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">AI je omogućen</span>
            </div>
            <p className="text-sm mt-1">
              Powered by Lovable AI Gateway • Model: Gemini 2.5 Flash
            </p>
          </AlertDescription>
        </Alert>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Lovable AI Gateway
          </h4>
          <p className="text-sm text-muted-foreground">
            Svi AI moduli koriste centralizirani Lovable AI Gateway. 
            Nije potrebno unositi vlastite API ključeve za OpenAI, Gemini ili druge AI providere.
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>✓ Generiranje emailova</li>
            <li>✓ Generiranje sadržaja</li>
            <li>✓ Knowledge Base chat</li>
            <li>✓ Analiza leadova</li>
          </ul>
        </div>

        {/* Web Search Provider */}
        <div>
          <Label htmlFor="search_provider">Web Search Provider</Label>
          <Select 
            value={formData.search_provider}
            onValueChange={(value: 'google_cse' | 'serpapi') => setFormData({ ...formData, search_provider: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Odaberite pretraživač" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google_cse">Google Custom Search (CSE)</SelectItem>
              <SelectItem value="serpapi">SerpAPI</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-1">
            Web search ključevi se konfiguriraju u Supabase Secrets.
          </p>
        </div>

        {/* Google Maps API Key (Optional) */}
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
              placeholder={aiSettings?.google_maps_api_key ? "••••••••" : "AIza..."}
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
          <p className="text-sm text-muted-foreground mt-1">
            Za Lead Discovery funkcionalnost - dobijte ključ na console.cloud.google.com
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
                Spremi Postavke
              </>
            )}
          </Button>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Kako dobiti Google Maps API ključ:</h4>
          <div className="text-sm text-muted-foreground">
            <p>1. Idite na <strong>console.cloud.google.com</strong></p>
            <p>2. Kreirajte novi projekt ili odaberite postojeći</p>
            <p>3. Omogućite "Places API" i "Maps JavaScript API"</p>
            <p>4. Credentials → Create Credentials → API Key</p>
            <p>5. Kopirajte ključ i zalijepite ovdje</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISettings;
