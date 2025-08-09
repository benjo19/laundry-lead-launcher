
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useSocialService = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const postToSocial = async (
    content: string, 
    platform: 'facebook' | 'linkedin' | 'instagram',
    imageUrl?: string
  ) => {
    console.log('useSocialService: Starting social post', { platform, contentLength: content.length, hasImage: !!imageUrl });

    if (!user) {
      console.log('useSocialService: No user found');
      toast({
        title: "Greška",
        description: "Morate biti prijavljeni da biste objavili na društvenim mrežama.",
        variant: "destructive",
      });
      return;
    }

    console.log('useSocialService: User ID:', user.id);

    // Check if platform is configured
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('social_platforms')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('useSocialService: Settings query result:', { settings, settingsError });

    if (!settings?.social_platforms) {
      console.log('useSocialService: No social platforms configured');
      toast({
        title: "Greška",
        description: "Niste konfigurirali postavke za društvene mreže.",
        variant: "destructive",
      });
      return;
    }

    const platformConfig = (settings.social_platforms as any)?.[platform];
    
    console.log('useSocialService: Platform config:', {
      platform,
      enabled: platformConfig?.enabled,
      hasAccessToken: !!platformConfig?.access_token,
      hasPageId: !!platformConfig?.page_id
    });

    if (!platformConfig?.enabled) {
      console.log('useSocialService: Platform not enabled');
      toast({
        title: "Greška",
        description: `${platform} nije omogućen u postavkama.`,
        variant: "destructive",
      });
      return;
    }

    // Validate Facebook configuration
    if (platform === 'facebook') {
      if (!platformConfig.access_token || !platformConfig.page_id) {
        console.log('useSocialService: Facebook incomplete config', {
          hasAccessToken: !!platformConfig.access_token,
          hasPageId: !!platformConfig.page_id
        });
        toast({
          title: "Greška",
          description: "Facebook nije potpuno konfiguriran. Molimo provjerite Access Token i Page ID u postavkama.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      console.log('useSocialService: Calling social-post function');
      
      const { data, error } = await supabase.functions.invoke('social-post', {
        body: {
          content,
          platform,
          image_url: imageUrl
        }
      });

      console.log('useSocialService: Function response:', { data, error });

      if (error) {
        console.error('useSocialService: Function error:', error);
        throw error;
      }

      console.log('useSocialService: Success');
      toast({
        title: "Objavljeno",
        description: `Sadržaj je uspješno objavljen na ${platform}!`,
      });

      return data;
    } catch (error: any) {
      console.error('useSocialService: Error posting to social media:', error);
      
      // Show more specific error messages
      let errorMessage = `Dogodila se greška pri objavljivanju na ${platform}.`;
      
      if (error.message?.includes('access_token')) {
        errorMessage = 'Problem s pristupnim tokenom. Molimo provjerite Facebook postavke.';
      } else if (error.message?.includes('page_id')) {
        errorMessage = 'Problem s Page ID. Molimo provjerite Facebook postavke.';
      } else if (error.message?.includes('OAuthException')) {
        errorMessage = 'Problem s autorizacijom. Molimo obnovite Access Token.';
      } else if (error.message) {
        errorMessage = `Greška: ${error.message}`;
      }
      
      toast({
        title: "Greška",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { postToSocial };
};
