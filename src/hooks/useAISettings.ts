import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type EmailAIModel =
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.5-pro'
  | 'google/gemini-3-flash-preview'
  | 'google/gemini-3.1-pro-preview';

interface AISettings {
  google_maps_api_key?: string;
  search_provider?: 'google_cse' | 'serpapi';
  email_model?: EmailAIModel;
}

export const useAISettings = () => {
  const [aiSettings, setAISettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAISettings();
    }
  }, [user]);

  const loadAISettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('ai_settings')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.ai_settings) {
        const settings = data.ai_settings as any;
        if (settings && typeof settings === 'object') {
          setAISettings({
            google_maps_api_key: settings.google_maps_api_key || '',
            search_provider: settings.search_provider || 'google_cse',
            email_model: settings.email_model || 'google/gemini-2.5-flash'
          });
        }
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAISettings = async (settings: AISettings) => {
    if (!user) return;

    try {
      // Clean settings - only save non-empty values
      const cleanSettings: AISettings = {
        google_maps_api_key: settings.google_maps_api_key?.trim() || undefined,
        search_provider: settings.search_provider || 'google_cse'
      };

      const { data: existingData, error: selectError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectError) {
        throw selectError;
      }

      let result;
      if (existingData) {
        result = await supabase
          .from('user_settings')
          .update({
            ai_settings: cleanSettings as any,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            ai_settings: cleanSettings as any,
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) {
        throw result.error;
      }

      setAISettings(cleanSettings);
      toast({
        title: "Postavke spremljene",
        description: "Vaše postavke su uspješno ažurirane.",
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom spremanja postavki.",
        variant: "destructive",
      });
    }
  };

  // AI is always configured via Lovable AI Gateway - no user API keys needed
  const isAIConfigured = () => true;

  return {
    aiSettings,
    isLoading,
    saveAISettings,
    loadAISettings,
    isAIConfigured
  };
};
