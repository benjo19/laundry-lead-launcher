
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
        description: `Sadržaj je uspješno objavljen na ${platform}`,
      });

      return data;
    } catch (error) {
      console.error('Error posting to social media:', error);
      toast({
        title: "Greška",
        description: `Dogodila se greška pri objavljivanju na ${platform}.`,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { postToSocial };
};
