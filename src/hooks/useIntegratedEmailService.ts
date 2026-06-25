
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
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

// Wrap a promise with a timeout. Rejects with an Error if it doesn't resolve in time.
const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`TIMEOUT:${label}`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};

export const useIntegratedEmailService = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const { aiSettings, isAIConfigured } = useAISettings();
  const { getContextForAI } = useBusinessProfile();

  const generateEmail = async (params: EmailGenerationParams): Promise<GeneratedEmailContent | null> => {
    if (!user) {
      toast({
        title: "Niste prijavljeni",
        description: "Morate biti prijavljeni da biste generirali email. Molimo prijavite se ponovno.",
        variant: "destructive",
      });
      return null;
    }

    // Pre-flight: verify session is still valid before invoking the edge function.
    // Without this, an expired token causes supabase.functions.invoke to hang silently.
    try {
      const { data: sessionData, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        5000,
        'get-session'
      );
      const session = sessionData?.session;
      if (sessionError || !session?.access_token) {
        toast({
          title: "Sesija je istekla",
          description: "Vaša sesija više nije valjana. Osvježite stranicu (F5) i prijavite se ponovno.",
          variant: "destructive",
        });
        return null;
      }
      // If token expires in <60s, refresh proactively so the long AI call doesn't fail mid-flight.
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      if (expiresAt && expiresAt - Date.now() < 60_000) {
        const { data: refreshed, error: refreshErr } = await withTimeout(
          supabase.auth.refreshSession(),
          5000,
          'refresh-session'
        );
        if (refreshErr || !refreshed?.session) {
          toast({
            title: "Sesija ističe",
            description: "Nije moguće obnoviti sesiju. Osvježite stranicu i prijavite se ponovno.",
            variant: "destructive",
          });
          return null;
        }
      }
      console.log('[generateEmail] preflight ok');
    } catch (e: any) {
      toast({
        title: "Problem s autentikacijom",
        description: "Ne mogu provjeriti vašu sesiju. Osvježite stranicu i pokušajte ponovno.",
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

      // Add business context — protected by timeout. If it fails or hangs, we proceed without it.
      let businessContext = '';
      try {
        businessContext = await withTimeout(
          getContextForAI(params.profileId),
          8000,
          'business-context'
        );
      } catch (error: any) {
        console.warn('Business context unavailable, continuing without it:', error?.message);
        businessContext = '';
      }
      console.log('[generateEmail] context ready, invoking edge function');

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
        businessContext: businessContext,
        model: aiSettings?.email_model || 'google/gemini-2.5-flash'
      };

      console.log('Enhanced params with business context:', enhancedParams);

      // Call edge function — protected by 45s timeout (AI generation can take a while).
      const { data, error } = await withTimeout(
        supabase.functions.invoke('generate-email', { body: enhancedParams }),
        45000,
        'generate-email'
      );
      console.log('[generateEmail] edge function returned');

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

    } catch (error: any) {
      console.error('Error generating email:', error);

      let errorMessage = 'Dogodila se greška pri generiranju emaila.';
      let errorTitle = 'Greška pri generiranju';

      const msg = (error?.message || '').toString();
      const status = error?.status || error?.context?.status;
      const isAuthError =
        status === 401 || status === 403 ||
        /jwt|JWT|token|unauthor|Invalid authorization|session/i.test(msg);

      if (msg.startsWith('TIMEOUT:')) {
        errorTitle = 'Isteklo vrijeme';
        errorMessage = 'Generiranje traje predugo. Moguće je da je sesija istekla — osvježite stranicu (F5) i pokušajte ponovno.';
      } else if (isAuthError) {
        errorTitle = 'Sesija je istekla';
        errorMessage = 'Vaša prijava više nije valjana. Osvježite stranicu (F5) i prijavite se ponovno.';
      } else if (msg.includes('AI settings not configured')) {
        errorMessage = 'AI postavke nisu konfigurirane. Molimo postavite AI API ključ u Postavkama.';
      } else if (msg.includes('AI API key not found')) {
        errorMessage = 'AI API ključ nije pronađen. Molimo konfigurirajte ga u Postavkama.';
      } else if (/Failed to fetch|NetworkError|network/i.test(msg)) {
        errorTitle = 'Problem s mrežom';
        errorMessage = 'Nema veze sa serverom. Provjerite internet i pokušajte ponovno.';
      } else if (msg) {
        errorMessage = `Greška: ${msg}`;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  };

  return { generateEmail, isAIConfigured };
};
