
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
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.business_profile) {
        const businessData = data.business_profile as any;
        if (businessData && typeof businessData === 'object') {
          setProfile(businessData as BusinessProfile);
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
    
    return `
Tvrtka: ${profile.company_name}
Industrija: ${profile.industry}
Opis poslovanja: ${profile.business_description}
Ciljna skupina: ${profile.target_audience}
Vrijednosti tvrtke: ${profile.company_values}
Ton komunikacije: ${profile.ai_tone}
Ciljevi AI asistenta: ${profile.ai_goals.join(', ')}
Lokacija: ${profile.location}
Website: ${profile.website}
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
