import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Chrome, Globe, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmailOAuthHandlerProps {
  provider: 'google' | 'outlook';
  onConnectionChange: (provider: 'google' | 'outlook', email?: string) => void;
  connectedEmail?: string;
}

const EmailOAuthHandler: React.FC<EmailOAuthHandlerProps> = ({
  provider,
  onConnectionChange,
  connectedEmail
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    checkConnectionStatus();
  }, [user]);

  const checkConnectionStatus = async () => {
    if (!user) {
      setConnectionStatus('disconnected');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('email_settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const emailSettings = data?.email_settings as any;
      if (emailSettings?.oauth_providers?.[provider]?.email) {
        setConnectionStatus('connected');
        onConnectionChange(provider, emailSettings.oauth_providers[provider].email);
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleOAuthConnect = async () => {
    setIsConnecting(true);

    try {
      const redirectTo = `${window.location.origin}/settings?tab=email&oauth_callback=${provider}`;
      
      if (provider === 'google') {
        // Simplificirani OAuth config za Google bez konfliktnih parametara
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
              scope: 'email profile https://www.googleapis.com/auth/gmail.send'
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Google OAuth",
          description: "Preusmjeravanje na Google autentifikaciju...",
        });
        return;
      }
      
      if (provider === 'outlook') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'azure',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
              scope: 'email profile https://graph.microsoft.com/Mail.Send offline_access'
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Outlook OAuth",
          description: "Preusmjeravanje na autentifikaciju...",
        });
      }

    } catch (error) {
      console.error('OAuth error:', error);
      toast({
        title: "Greška",
        description: `Dogodila se greška pri povezivanju s ${provider === 'google' ? 'Google' : 'Outlook'} računom.`,
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('email_settings')
        .eq('user_id', user?.id)
        .maybeSingle();

      const currentSettings = existingSettings?.email_settings as any || {};
      const updatedSettings = {
        ...currentSettings,
        oauth_providers: {
          ...currentSettings.oauth_providers,
          [provider]: undefined
        }
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          email_settings: updatedSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setConnectionStatus('disconnected');
      onConnectionChange(provider);

      toast({
        title: "Račun odspjen",
        description: `${provider === 'google' ? 'Google' : 'Outlook'} račun je uspješno odspjen.`,
      });

    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri odspajanju računa.",
        variant: "destructive",
      });
    }
  };

  const getIcon = () => {
    return provider === 'google' ? <Chrome className="h-5 w-5" /> : <Globe className="h-5 w-5" />;
  };

  const getProviderName = () => {
    return provider === 'google' ? 'Google' : 'Outlook';
  };

  if (connectionStatus === 'checking') {
    return (
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-slate-600">Provjera stanja...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium">{getProviderName()}</span>
        </div>
        {connectionStatus === 'connected' && (
          <div className="flex items-center gap-1 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">Povezano</span>
          </div>
        )}
      </div>
      
      {connectionStatus === 'connected' ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">{connectedEmail}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="w-full"
          >
            Odspoji račun
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleOAuthConnect}
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Povezivanje...
            </>
          ) : (
            <>
              {getIcon()}
              <span className="ml-2">Poveži s {getProviderName()}</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default EmailOAuthHandler;
