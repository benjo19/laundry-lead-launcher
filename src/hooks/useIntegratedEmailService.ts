
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
  profileId?: string;
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
  const { aiSettings, isAIConfigured } = useAISettings();
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

    console.log('Checking AI configuration:', { aiSettings, isConfigured: isAIConfigured() });

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

      // Add business context to the parameters with error handling
      let businessContext = '';
      try {
        businessContext = await getContextForAI(params.profileId);
      } catch (error) {
        console.warn('Error getting business context:', error);
        businessContext = '';
      }

      // Map emailType to match edge function schema
      const emailTypeMap: Record<string, 'cold' | 'follow-up' | 'proposal' | 'introduction'> = {
        'intro': 'introduction',
        'follow-up': 'follow-up',
        'proposal': 'proposal',
        'reminder': 'follow-up'
      };

      const enhancedParams = {
        recipientName: params.recipientCompany,
        recipientCompany: params.recipientCompany,
        recipientIndustry: params.industry || params.companyInfo?.businessType,
        recipientLocation: params.companyInfo?.location,
        recipientWebsite: params.companyInfo?.website,
        recipientRating: params.companyInfo?.rating,
        emailType: emailTypeMap[params.emailType] || 'cold',
        additionalContext: params.additionalContext,
        businessContext: businessContext
      };

      console.log('Enhanced params with business context:', enhancedParams);

      const { data, error } = await supabase.functions.invoke('generate-email', {
        body: enhancedParams
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.subject || !data.content) {
        console.error('Invalid response from AI service:', data);
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
      } else if (error.message?.includes('Invalid authorization')) {
        errorMessage = 'Problem s autorizacijom. Molimo osvježite stranicu i pokušajte ponovo.';
      } else if (error.message) {
        errorMessage = `Greška: ${error.message}`;
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
