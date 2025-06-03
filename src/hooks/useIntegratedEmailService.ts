
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useAISettings } from './useAISettings';
import { useBusinessProfile } from './useBusinessProfile';

interface EmailGenerationParams {
  recipientCompany: string;
  recipientEmail: string;
  emailType: 'intro' | 'follow-up' | 'proposal' | 'reminder';
  additionalContext?: string;
  industry?: string;
  companyInfo?: {
    location?: string;
    website?: string;
    rating?: number;
    businessType?: string;
  };
}

interface GeneratedEmailContent {
  subject: string;
  content: string;
}

export const useIntegratedEmailService = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAIConfigured } = useAISettings();
  const { getContextForAI } = useBusinessProfile();

  const generateEmail = async (params: EmailGenerationParams): Promise<GeneratedEmailContent | null> => {
    if (!user) {
      toast({
        title: "Greška",
        description: "Morate biti prijavljeni da biste generirali email.",
        variant: "destructive",
      });
      return null;
    }

    if (!isAIConfigured()) {
      toast({
        title: "AI nije konfiguriran",
        description: "Molimo postavite AI API ključ u Postavkama prije generiranja emaila.",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log('Generating email with params:', params);

      // Add business context to the parameters
      const businessContext = getContextForAI();
      const enhancedParams = {
        ...params,
        businessContext: businessContext
      };

      const { data, error } = await supabase.functions.invoke('generate-email', {
        body: enhancedParams
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.subject || !data.content) {
        throw new Error('Invalid response from AI service');
      }

      toast({
        title: "Email generiran",
        description: `Personalizirani email je uspješno generiran za ${params.recipientCompany}.`,
      });

      return data as GeneratedEmailContent;

    } catch (error) {
      console.error('Error generating email:', error);
      
      let errorMessage = 'Dogodila se greška pri generiranju emaila.';
      
      if (error.message?.includes('AI settings not configured')) {
        errorMessage = 'AI postavke nisu konfigurirane. Molimo postavite AI API ključ u Postavkama.';
      } else if (error.message?.includes('AI API key not found')) {
        errorMessage = 'AI API ključ nije pronađen. Molimo konfigurirajte ga u Postavkama.';
      }

      toast({
        title: "Greška pri generiranju",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  };

  return { generateEmail, isAIConfigured };
};
