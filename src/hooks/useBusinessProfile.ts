import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface BusinessProfile {
  id?: string;
  name: string;
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
  is_default?: boolean;
}

export const useBusinessProfile = () => {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || profiles.find(p => p.is_default) || profiles[0] || null;

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setProfiles(data as BusinessProfile[]);
        
        // Set default selected profile
        const defaultProfile = data.find(p => p.is_default);
        if (defaultProfile) {
          setSelectedProfileId(defaultProfile.id);
        } else if (data.length > 0) {
          setSelectedProfileId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading business profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (profileData: BusinessProfile) => {
    if (!user) return;

    try {
      const dataToSave = {
        user_id: user.id,
        name: profileData.name,
        company_name: profileData.company_name,
        industry: profileData.industry,
        business_description: profileData.business_description,
        target_audience: profileData.target_audience,
        company_values: profileData.company_values,
        ai_tone: profileData.ai_tone,
        ai_goals: profileData.ai_goals,
        email_signature: profileData.email_signature,
        website: profileData.website,
        location: profileData.location,
        is_default: profileData.is_default || false
      };

      let result;
      
      if (profileData.id) {
        // Update existing profile
        result = await supabase
          .from('business_profiles')
          .update(dataToSave)
          .eq('id', profileData.id)
          .select()
          .single();
      } else {
        // Insert new profile
        result = await supabase
          .from('business_profiles')
          .insert(dataToSave)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      await loadProfiles();
      
      toast({
        title: "Profil spremljen",
        description: "Poslovni profil je uspješno spremljen.",
      });
    } catch (error) {
      console.error('Error saving business profile:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom spremanja profila.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('business_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        throw error;
      }

      await loadProfiles();
      
      toast({
        title: "Profil izbrisan",
        description: "Poslovni profil je uspješno izbrisan.",
      });
    } catch (error) {
      console.error('Error deleting business profile:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom brisanja profila.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const setDefaultProfile = async (profileId: string) => {
    if (!user) return;

    try {
      // First, remove default from all profiles
      await supabase
        .from('business_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the selected profile as default
      const { error } = await supabase
        .from('business_profiles')
        .update({ is_default: true })
        .eq('id', profileId);

      if (error) {
        throw error;
      }

      await loadProfiles();
      
      toast({
        title: "Zadani profil postavljen",
        description: "Profil je postavljen kao zadani.",
      });
    } catch (error) {
      console.error('Error setting default profile:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom postavljanja zadanog profila.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getDocumentsContent = async (profileId?: string): Promise<string> => {
    if (!user || !profileId) return '';
    
    try {
      const folderPath = `${user.id}/${profileId}`;
      const { data: files, error } = await supabase.storage
        .from('business-documents')
        .list(folderPath, { limit: 10 });

      if (error || !files || files.length === 0) {
        return '';
      }

      const documentContents: string[] = [];

      for (const file of files) {
        try {
          const { data: urlData } = await supabase.storage
            .from('business-documents')
            .createSignedUrl(`${folderPath}/${file.name}`, 300); // 5 min expiry

          if (urlData?.signedUrl) {
            const response = await fetch(urlData.signedUrl);
            const blob = await response.blob();
            
            if (file.metadata?.mimetype === 'text/plain' || file.metadata?.mimetype === 'text/csv') {
              const content = await blob.text();
              documentContents.push(`\n--- Dokument: ${file.name} ---\n${content.substring(0, 2000)}`);
            } else {
              documentContents.push(`\n--- Dokument: ${file.name} (${file.metadata?.mimetype || 'nepoznat format'}) ---`);
            }
          }
        } catch (error) {
          console.error(`Error reading document ${file.name}:`, error);
        }
      }

      return documentContents.join('\n');
    } catch (error) {
      console.error('Error loading documents for AI context:', error);
      return '';
    }
  };

  const getContextForAI = async (profileId?: string): Promise<string> => {
    const profile = profileId 
      ? profiles.find(p => p.id === profileId) 
      : selectedProfile;
      
    if (!profile || !profile.id) return '';
    
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
    
    // Get documents content for this specific profile
    const documentsContent = await getDocumentsContent(profile.id);
    
    const baseContext = `
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

    return documentsContent ? `${baseContext}\n\nDodatni dokumenti:${documentsContent}` : baseContext;
  };

  return {
    profiles,
    selectedProfile,
    selectedProfileId,
    isLoading,
    saveProfile,
    deleteProfile,
    setDefaultProfile,
    loadProfiles,
    setSelectedProfileId,
    getContextForAI
  };
};
