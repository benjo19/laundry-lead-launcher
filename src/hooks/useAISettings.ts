
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface AISettings {
  provider: 'openai' | 'gemini' | 'anthropic';
  api_key?: string; // legacy/general key
  openai_api_key?: string;
  gemini_api_key?: string;
  model?: string;
  google_maps_api_key?: string;
  custom_system_prompt?: string;
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
        // Type assertion with proper validation
        const settings = data.ai_settings as any;
        if (settings && typeof settings === 'object' && settings.provider && settings.api_key) {
          setAISettings(settings as AISettings);
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
      // First, check if a record exists
      const { data: existingData, error: selectError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing settings:', selectError);
        throw selectError;
      }

      let result;
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('user_settings')
          .update({
            ai_settings: settings as any,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Insert new record
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            ai_settings: settings as any,
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) {
        console.error('Error saving AI settings:', result.error);
        throw result.error;
      }

      setAISettings(settings);
      toast({
        title: "AI postavke spremljene",
        description: "Vaše AI postavke su uspješno ažurirane.",
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom spremanja AI postavki.",
        variant: "destructive",
      });
    }
  };

  const isAIConfigured = () => {
    if (!aiSettings?.provider) return false;
    if (aiSettings.provider === 'openai') return !!(aiSettings.openai_api_key || aiSettings.api_key);
    if (aiSettings.provider === 'gemini') return !!(aiSettings.gemini_api_key || aiSettings.api_key);
    // For other providers (e.g., Anthropic), fall back to generic api_key
    return !!aiSettings.api_key;
  };

  return {
    aiSettings,
    isLoading,
    saveAISettings,
    loadAISettings,
    isAIConfigured
  };
};
