
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const oauthCallback = searchParams.get('oauth_callback');
      
      if (!oauthCallback || !session || !user) return;

      try {
        console.log('Processing OAuth callback for:', oauthCallback);
        
        // Get the OAuth provider data from the session
        const providerToken = session.provider_token;
        const providerRefreshToken = session.provider_refresh_token;
        const userEmail = user.email;

        if (!providerToken || !userEmail) {
          throw new Error('OAuth tokens or email not found in session');
        }

        // Store OAuth tokens in user settings
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('email_settings')
          .eq('user_id', user.id)
          .maybeSingle();

        const currentSettings = existingSettings?.email_settings as any || {};
        const updatedSettings = {
          ...currentSettings,
          oauth_providers: {
            ...currentSettings.oauth_providers,
            [oauthCallback]: {
              email: userEmail,
              access_token: providerToken,
              refresh_token: providerRefreshToken,
              connected_at: new Date().toISOString()
            }
          }
        };

        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            email_settings: updatedSettings,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({
          title: "OAuth uspješan",
          description: `${oauthCallback === 'google' ? 'Google' : 'Outlook'} račun je uspješno povezan.`,
        });

        // Navigate to settings tab
        navigate('/settings?tab=email');

      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          title: "Greška OAuth-a",
          description: "Dogodila se greška pri obradi OAuth callback-a.",
          variant: "destructive",
        });
      }
    };

    handleOAuthCallback();
  }, [searchParams, session, user, toast, navigate]);
};
