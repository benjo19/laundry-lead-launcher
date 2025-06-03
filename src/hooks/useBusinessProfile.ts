
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface BusinessProfile {
  company_name: string;
  industry: string;
  business_description: string;
  target_audience: string;
  company_values: string;
  ai_tone: 'professional' | 'friendly' | 'casual' | 'authoritative';
  ai_goals: string[];
  email_signature: string;
  website: string;
  location: string;
}

export const useBusinessProfile = () => {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('business_profile')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data?.business_profile) {
        const businessData = data.business_profile;
        if (businessData && typeof businessData === 'object' && !Array.isArray(businessData)) {
          // Ensure ai_goals is always an array
          const profileWithDefaults = {
            ...businessData,
            ai_goals: Array.isArray(businessData.ai_goals) ? businessData.ai_goals : []
          };
          setProfile(profileWithDefaults as unknown as BusinessProfile);
        }
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (profileData: BusinessProfile) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          business_profile: profileData as any,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setProfile(profileData);
      toast({
        title: "Profil spremljen",
        description: "Vaš poslovni profil je uspješno ažuriran.",
      });
    } catch (error) {
      console.error('Error saving business profile:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom spremanja profila.",
        variant: "destructive",
      });
    }
  };

  const getContextForAI = () => {
    if (!profile) return '';
    
    // Ensure all fields have default values to prevent undefined errors
    const safeProfile = {
      company_name: profile.company_name || '',
      industry: profile.industry || '',
      business_description: profile.business_description || '',
      target_audience: profile.target_audience || '',
      company_values: profile.company_values || '',
      ai_tone: profile.ai_tone || 'professional',
      ai_goals: Array.isArray(profile.ai_goals) ? profile.ai_goals : [],
      location: profile.location || '',
      website: profile.website || ''
    };
    
    return `
Tvrtka: ${safeProfile.company_name}
Industrija: ${safeProfile.industry}
Opis poslovanja: ${safeProfile.business_description}
Ciljna skupina: ${safeProfile.target_audience}
Vrijednosti tvrtke: ${safeProfile.company_values}
Ton komunikacije: ${safeProfile.ai_tone}
Ciljevi AI asistenta: ${safeProfile.ai_goals.join(', ')}
Lokacija: ${safeProfile.location}
Website: ${safeProfile.website}
    `.trim();
  };

  return {
    profile,
    isLoading,
    saveProfile,
    loadProfile,
    getContextForAI
  };
};
