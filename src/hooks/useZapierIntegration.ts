import { useUserSettings } from './useUserSettings';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ZapierSettings {
  webhook_url?: string;
  enabled?: boolean;
  last_test?: string;
}

export const useZapierIntegration = () => {
  const { value: zapierSettings } = useUserSettings<ZapierSettings>('zapier_settings', {});
  const [webhookUrl, setWebhookUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (zapierSettings?.webhook_url) {
      setWebhookUrl(zapierSettings.webhook_url);
    }
  }, [zapierSettings]);

  const triggerZap = async (data: any, type: string = 'general') => {
    if (!webhookUrl) {
      console.log('No Zapier webhook URL configured');
      return;
    }

    try {
      // Check if data contains an image blob
      const hasImageBlob = data.image instanceof Blob;

      if (hasImageBlob) {
        // Use FormData for multipart/form-data
        const formData = new FormData();
        formData.append('type', type);
        formData.append('text', data.text || '');
        formData.append('image', data.image, 'image.jpg');
        formData.append('timestamp', new Date().toISOString());
        formData.append('triggered_from', `Marketing Agent - ${type}`);
        formData.append('source_url', window.location.href);

        await fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          body: formData,
        });

        console.log(`Zapier webhook triggered for ${type} with image file`);
      } else {
        // Use JSON for regular data
        const payload = {
          type,
          data,
          timestamp: new Date().toISOString(),
          triggered_from: `Marketing Agent - ${type}`,
          source_url: window.location.href
        };

        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify(payload),
        });

        console.log(`Zapier webhook triggered for ${type}:`, payload);
      }
    } catch (error) {
      console.error('Error triggering Zapier webhook:', error);
    }
  };

  const triggerNewLead = async (leadData: any) => {
    await triggerZap(leadData, 'new_lead');
  };

  const triggerEmailSent = async (emailData: any) => {
    await triggerZap(emailData, 'email_sent');
  };

  const triggerNewReminder = async (reminderData: any) => {
    await triggerZap(reminderData, 'new_reminder');
  };

  const triggerContentCreated = async (contentData: any) => {
    await triggerZap(contentData, 'content_created');
  };

  return {
    isConfigured: !!webhookUrl,
    triggerZap,
    triggerNewLead,
    triggerEmailSent,
    triggerNewReminder,
    triggerContentCreated
  };
};
