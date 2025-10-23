import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GlobalSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

export const useGlobalSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadGlobalSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('global_settings')
        .select('*');

      if (error) throw error;

      const settingsMap = (data || []).reduce((acc: Record<string, any>, setting: GlobalSetting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error loading global settings:', error);
      toast.error('Failed to load global settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGlobalSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('global_settings')
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Global setting updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating global setting:', error);
      toast.error('Failed to update global setting');
      return false;
    }
  };

  useEffect(() => {
    loadGlobalSettings();
  }, []);

  return { 
    settings, 
    loadGlobalSettings, 
    updateGlobalSetting, 
    isLoading 
  };
};
