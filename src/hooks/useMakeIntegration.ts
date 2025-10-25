
import { useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
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
  content_booster_webhook_url?: string;
  content_booster_auto_trigger?: boolean;
  email_webhook_url?: string;
  email_auto_trigger?: boolean;
}

export const useMakeIntegration = () => {
  const { user } = useAuthContext();
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
      
      // Determine which webhook to use based on event type
      const isContentEvent = eventType === 'content_published';
      const isEmailEvent = eventType === 'email_sent';
      
      let webhookUrl: string | undefined;
      let autoTrigger: boolean | undefined;
      
      if (isContentEvent) {
        webhookUrl = settings?.content_booster_webhook_url;
        autoTrigger = settings?.content_booster_auto_trigger;
      } else if (isEmailEvent) {
        webhookUrl = settings?.email_webhook_url;
        autoTrigger = settings?.email_auto_trigger;
      } else {
        webhookUrl = settings?.webhook_url;
        autoTrigger = settings?.auto_trigger;
      }
      
      if (!webhookUrl) {
        console.log(`Make.com: Webhook URL not configured for ${eventType}`);
        return false;
      }
      
      if (!autoTrigger) {
        console.log(`Make.com: Auto trigger disabled for ${eventType}`);
        return false;
      }

      // Format data based on event type
      let webhookData;
      const hasImageBlob = data.image instanceof Blob;

      if (isEmailEvent) {
        webhookData = {
          to_email: data.to_email || '',
          subject: data.subject || '',
          content: data.content || '', // Već personaliziran sadržaj
          timestamp: data.timestamp || new Date().toISOString(),
          status: data.status || 'sent' // 'sent' ili 'draft'
        };
      } else if (isContentEvent) {
        if (hasImageBlob) {
          // Use FormData for content with image file
          const formData = new FormData();
          formData.append('text', data.text || '');
          formData.append('image', data.image, 'image.jpg');

          const response = await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: formData,
          });

          console.log(`Make.com webhook triggered for ${eventType} with image file`);
          return true;
        } else {
          // Content Booster data without image
          webhookData = {
            text: data.text || '',
            image: data.image || ''
          };
        }
      } else {
        // Lead data for Google Sheets
        webhookData = {
          company: data.company || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          location: data.location || '',
          country: data.country || '',
          status: data.status || '',
          potential: data.potential || '',
          industry: data.industry || '',
          biljeske: data.biljeske || '',
          dateAdded: data.dateAdded || ''
        };
      }

      const response = await fetch(webhookUrl, {
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
