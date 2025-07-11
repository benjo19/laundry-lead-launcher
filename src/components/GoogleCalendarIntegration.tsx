import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Settings, TestTube, Loader2, ExternalLink, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const GoogleCalendarIntegration = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState({
    apiKey: '',
    clientId: '',
    autoSync: true,
    calendarId: 'primary'
  });

  // Check connection status on component mount
  useEffect(() => {
    const savedConnection = localStorage.getItem('googleCalendarConnected');
    const savedSettings = localStorage.getItem('googleCalendarSettings');
    
    if (savedConnection === 'true') {
      setIsConnected(true);
      if (savedSettings) {
        try {
          setCalendarSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error('Error parsing saved calendar settings:', e);
        }
      }
    }
  }, []);

  const handleConnect = async () => {
    if (!calendarSettings.apiKey || !calendarSettings.clientId) {
      toast({
        title: "Greška",
        description: "Molimo unesite API ključ i Client ID prije povezivanja.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('Attempting to connect to Google Calendar...');
    
    try {
      // Load Google APIs if not already loaded
      if (!window.gapi) {
        console.log('Loading Google API...');
        await loadGoogleAPI();
      }

      // Load and initialize Google API client
      console.log('Initializing Google API client...');
      await new Promise((resolve, reject) => {
        window.gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject,
        });
      });

      await window.gapi.client.init({
        apiKey: calendarSettings.apiKey,
        clientId: calendarSettings.clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar.events',
      });

      console.log('Google API client initialized, checking auth...');
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        console.log('User not signed in, prompting for sign in...');
        await authInstance.signIn();
      }

      console.log('Google Calendar successfully connected!');
      setIsConnected(true);
      
      // Store connection state in localStorage
      localStorage.setItem('googleCalendarConnected', 'true');
      localStorage.setItem('googleCalendarSettings', JSON.stringify(calendarSettings));
      
      toast({
        title: "Google Calendar povezan",
        description: "Uspješno ste povezali Google Calendar. Podsjetnici će se automatski dodavati.",
      });
      
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setIsConnected(false);
      toast({
        title: "Greška",
        description: `Dogodila se greška prilikom povezivanja: ${error.message || 'Nepoznata greška'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoogleAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  };

  const testConnection = async () => {
    if (!isConnected) {
      toast({
        title: "Greška",
        description: "Molimo prvo se povezite s Google Calendar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await window.gapi.client.calendar.calendarList.list();
      if (response.status === 200) {
        toast({
          title: "Test uspješan",
          description: "Google Calendar konekcija radi ispravno.",
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Test neuspješan",
        description: "Dogodila se greška prilikom testiranja konekcije.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (window.gapi && window.gapi.auth2) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance) {
        authInstance.signOut();
      }
    }
    
    // Clear connection state from localStorage
    localStorage.removeItem('googleCalendarConnected');
    localStorage.removeItem('googleCalendarSettings');
    
    setIsConnected(false);
    setCalendarSettings({
      apiKey: '',
      clientId: '',
      autoSync: true,
      calendarId: 'primary'
    });
    
    toast({
      title: "Odjavljeno",
      description: "Uspješno ste se odjavili iz Google Calendar.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integracija
          </div>
          <Badge 
            variant={isConnected ? "default" : "secondary"} 
            className={`flex items-center gap-1 ${
              isConnected 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Povezan
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Nije povezan
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Kako postaviti Google Calendar integraciju</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Idite na <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
            <li>Kreirajte novi projekt ili odaberite postojeći</li>
            <li>Omogućite Google Calendar API</li>
            <li>Kreirajte API ključ i OAuth 2.0 client ID</li>
            <li>Unesite podatke ispod i pritisnite "Povezano"</li>
          </ol>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Ključ *</Label>
              <Input
                id="apiKey"
                type="password"
                value={calendarSettings.apiKey}
                onChange={(e) => setCalendarSettings({...calendarSettings, apiKey: e.target.value})}
                placeholder="Unesite Google API ključ"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                value={calendarSettings.clientId}
                onChange={(e) => setCalendarSettings({...calendarSettings, clientId: e.target.value})}
                placeholder="Unesite OAuth 2.0 Client ID"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoSync"
                checked={calendarSettings.autoSync}
                onChange={(e) => setCalendarSettings({...calendarSettings, autoSync: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="autoSync">Automatski dodaj podsjetnike u kalendar</Label>
            </div>

            <Button 
              onClick={handleConnect} 
              disabled={isLoading || !calendarSettings.apiKey || !calendarSettings.clientId}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Povezujem...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Povezano s Google Calendar
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Google Calendar povezan</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Odspoji
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={testConnection} variant="outline" className="flex-1">
                <TestTube className="h-4 w-4 mr-2" />
                Testiraj konekciju
              </Button>
              <Button asChild variant="outline">
                <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Otvori Google Calendar
                </a>
              </Button>
            </div>

            <div className="text-sm text-slate-600">
              <p className="font-medium mb-2">Funkcionalnosti:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Automatsko dodavanje novih podsjetnika u kalendar</li>
                <li>Sinkronizacija s postojećim događajima</li>
                <li>Notifikacije preko Google Calendar aplikacije</li>
                <li>Pristup svim uređajima povezanim s Google račinom</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarIntegration;