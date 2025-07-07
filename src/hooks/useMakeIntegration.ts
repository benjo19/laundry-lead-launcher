
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MakeWebhookData {
  event_type: string;
  timestamp: string;
  user_id?: string;
  data: any;
  schema?: Record<string, string>;
}

interface MakeSettings {
  webhook_url?: string;
  auto_trigger?: boolean;
}

export const useMakeIntegration = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const getMakeSettings = useCallback(async (): Promise<MakeSettings | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('make_settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.make_settings && typeof data.make_settings === 'object') {
        return data.make_settings as MakeSettings;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Make.com settings:', error);
      return null;
    }
  }, [user]);

  const triggerWebhook = useCallback(async (eventType: string, data: any): Promise<boolean> => {
    if (!user) {
      console.log('Make.com: User not logged in');
      return false;
    }

    setIsLoading(true);
    try {
      const settings = await getMakeSettings();
      console.log('Make.com settings:', settings);
      
      if (!settings?.webhook_url) {
        console.log('Make.com: Webhook URL not configured');
        return false;
      }
      
      if (!settings?.auto_trigger) {
        console.log('Make.com: Auto trigger disabled');
        return false;
      }

      // Send only essential lead data for Google Sheets
      const webhookData = {
        company: data.company || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        status: data.status || '',
        potential: data.potential || '',
        dateAdded: data.dateAdded || ''
      };

      const response = await fetch(settings.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(webhookData),
      });

      console.log(`Make.com webhook triggered for event: ${eventType}`);
      return true;
    } catch (error) {
      console.error('Error triggering Make.com webhook:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, getMakeSettings]);

  return {
    triggerWebhook,
    getMakeSettings,
    isLoading
  };
};
