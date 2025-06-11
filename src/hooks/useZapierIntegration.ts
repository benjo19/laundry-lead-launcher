
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

export const useZapierIntegration = () => {
  const [webhookUrl] = useLocalStorage('zapier_webhook_url', '');
  const { toast } = useToast();

  const triggerZap = async (data: any, type: string = 'general') => {
    if (!webhookUrl) {
      console.log('No Zapier webhook URL configured');
      return;
    }

    try {
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
