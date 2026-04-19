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
  ai_system_prompt?: string;
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
        ai_system_prompt: profileData.ai_system_prompt,
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

  // Wrap a fetch with a timeout so a slow document never blocks generation
  const fetchWithTimeout = async (url: string, ms: number): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const getDocumentsContent = async (profileId?: string): Promise<string> => {
    if (!user || !profileId) return '';

    try {
      // Cap the listing call at 4s — if storage is slow, give up and proceed without docs
      const listPromise = supabase.storage
        .from('business-documents')
        .list(folderPath_(user.id, profileId), { limit: 10 });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('list-timeout')), 4000)
      );

      const result: any = await Promise.race([listPromise, timeoutPromise]).catch((e) => {
        console.warn('Document list skipped:', e?.message);
        return { data: null, error: e };
      });

      const { data: files, error } = result || {};
      if (error || !files || files.length === 0) {
        return '';
      }

      const folderPath = `${user.id}/${profileId}`;
      const documentContents: string[] = [];

      // Process files in parallel with a per-file timeout (3s) so one slow file can't block others
      const tasks = files.slice(0, 10).map(async (file: any) => {
        try {
          const { data: urlData } = await supabase.storage
            .from('business-documents')
            .createSignedUrl(`${folderPath}/${file.name}`, 300);

          if (!urlData?.signedUrl) return null;

          const isText =
            file.metadata?.mimetype === 'text/plain' ||
            file.metadata?.mimetype === 'text/csv';

          if (isText) {
            const response = await fetchWithTimeout(urlData.signedUrl, 3000);
            const content = await response.text();
            return `\n--- Dokument: ${file.name} ---\n${content.substring(0, 2000)}`;
          }
          return `\n--- Dokument: ${file.name} (${file.metadata?.mimetype || 'nepoznat format'}) ---`;
        } catch (e: any) {
          console.warn(`Skipping document ${file.name}:`, e?.message);
          return null;
        }
      });

      const results = await Promise.all(tasks);
      results.forEach((r) => r && documentContents.push(r));

      return documentContents.join('\n');
    } catch (error) {
      console.error('Error loading documents for AI context:', error);
      return '';
    }
  };

  // helper to build folder path consistently
  // (kept inline to avoid breaking other call-sites)
  function folderPath_(userId: string, profileId: string) {
    return `${userId}/${profileId}`;
  }

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
      ai_system_prompt: profile.ai_system_prompt || '',
      location: profile.location || '',
      website: profile.website || '',
      email_signature: profile.email_signature || ''
    };
    
    // Get documents content for this specific profile
    const documentsContent = await getDocumentsContent(profile.id);
    
    let baseContext = `
Tvrtka: ${safeProfile.company_name}
Industrija: ${safeProfile.industry}
Opis poslovanja: ${safeProfile.business_description}
Ciljna skupina: ${safeProfile.target_audience}
Vrijednosti tvrtke: ${safeProfile.company_values}
Ton komunikacije: ${safeProfile.ai_tone}
Ciljevi AI asistenta: ${safeProfile.ai_goals.join(', ')}
Lokacija: ${safeProfile.location}
Website: ${safeProfile.website}
Email potpis: ${safeProfile.email_signature}
    `.trim();

    if (safeProfile.ai_system_prompt) {
      baseContext += `\n\nPrilagođene AI upute: ${safeProfile.ai_system_prompt}`;
    }

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
