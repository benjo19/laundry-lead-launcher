
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface AISettings {
  provider: 'openai' | 'gemini';
  api_key: string;
  model?: string;
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
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ai_settings: settings as any,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

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
    return aiSettings?.api_key && aiSettings?.provider;
  };

  return {
    aiSettings,
    isLoading,
    saveAISettings,
    loadAISettings,
    isAIConfigured
  };
};
