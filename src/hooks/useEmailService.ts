
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useEmailService = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const sendEmail = async (to_email: string, subject: string, content: string) => {
    if (!user) {
      toast({
        title: "Greška",
        description: "Morate biti prijavljeni da biste poslali email.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to_email,
          subject,
          content
        }
      });

      if (error) throw error;

      toast({
        title: "Email poslan",
        description: `Email je uspješno poslan na ${to_email}`,
      });

      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri slanju email-a.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { sendEmail };
};
