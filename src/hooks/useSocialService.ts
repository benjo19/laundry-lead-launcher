
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
    if (!user) {
      toast({
        title: "Greška",
        description: "Morate biti prijavljeni da biste objavili na društvenim mrežama.",
        variant: "destructive",
      });
      return;
    }

    // Check if platform is configured
    const { data: settings } = await supabase
      .from('user_settings')
      .select('social_platforms')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!settings?.social_platforms) {
      toast({
        title: "Greška",
        description: "Niste konfigurirali postavke za društvene mreže.",
        variant: "destructive",
      });
      return;
    }

    const platformConfig = (settings.social_platforms as any)?.[platform];
    
    if (!platformConfig?.enabled) {
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
        toast({
          title: "Greška",
          description: "Facebook nije potpuno konfiguriran. Molimo provjerite Access Token i Page ID u postavkama.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('social-post', {
        body: {
          content,
          platform,
          user_id: user.id,
          image_url: imageUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Objavljeno",
        description: `Sadržaj je uspješno objavljen na ${platform}!`,
      });

      return data;
    } catch (error: any) {
      console.error('Error posting to social media:', error);
      
      // Show more specific error messages
      let errorMessage = `Dogodila se greška pri objavljivanju na ${platform}.`;
      
      if (error.message?.includes('access_token')) {
        errorMessage = 'Problem s pristupnim tokenom. Molimo provjerite Facebook postavke.';
      } else if (error.message?.includes('page_id')) {
        errorMessage = 'Problem s Page ID. Molimo provjerite Facebook postavke.';
      } else if (error.message?.includes('OAuthException')) {
        errorMessage = 'Problem s autorizacijom. Molimo obnovite Access Token.';
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
