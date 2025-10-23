import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SettingsKey = 'zapier_settings' | 'google_calendar_settings' | 'make_settings' | 'email_settings' | 'social_platforms';

export function useUserSettings<T = any>(settingsKey: SettingsKey, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [settingsKey]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setValue(defaultValue);
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select(settingsKey)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data && data[settingsKey]) {
        setValue(data[settingsKey] as T);
      } else {
        setValue(defaultValue);
      }
    } catch (err) {
      console.error(`Error loading ${settingsKey}:`, err);
      setError(err as Error);
      setValue(defaultValue);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newValue: T) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save settings",
          variant: "destructive",
        });
        return false;
      }

      // Optimistic update
      setValue(newValue);

      // Check if settings exist
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({ [settingsKey]: newValue })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            [settingsKey]: newValue,
          });

        if (insertError) throw insertError;
      }

      return true;
    } catch (err) {
      console.error(`Error updating ${settingsKey}:`, err);
      setError(err as Error);
      toast({
        title: "Error",
        description: `Failed to save settings: ${(err as Error).message}`,
        variant: "destructive",
      });
      // Revert optimistic update
      await loadSettings();
      return false;
    }
  };

  return {
    value,
    setValue: updateSettings,
    isLoading,
    error,
    refresh: loadSettings,
  };
}
