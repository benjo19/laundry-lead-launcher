
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
  equipment_sales_webhook_url?: string;
  equipment_sales_auto_trigger?: boolean;
  crm_export_webhook_url?: string;
  crm_export_auto_trigger?: boolean;
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

  const triggerWebhook = useCallback(async (eventType: string, data: any, externalSignal?: AbortSignal): Promise<boolean> => {
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
      const isEquipmentEvent = eventType === 'equipment_sale';
      const isEmailEvent = !isEquipmentEvent && (eventType === 'sent' || eventType === 'draft');
      const isCRMExportEvent = eventType === 'crm_export';
      const isLeadEvent = eventType === 'lead_added';
      
      let webhookUrl: string | undefined;
      let autoTrigger: boolean | undefined;
      
      if (isContentEvent) {
        webhookUrl = settings?.content_booster_webhook_url;
        autoTrigger = settings?.content_booster_auto_trigger;
      } else if (isEquipmentEvent) {
        webhookUrl = settings?.equipment_sales_webhook_url;
        autoTrigger = settings?.equipment_sales_auto_trigger;
      } else if (isEmailEvent) {
        webhookUrl = settings?.email_webhook_url;
        autoTrigger = settings?.email_auto_trigger;
      } else if (isCRMExportEvent) {
        webhookUrl = settings?.crm_export_webhook_url;
        autoTrigger = settings?.crm_export_auto_trigger;
      } else if (isLeadEvent) {
        webhookUrl = settings?.webhook_url;
        autoTrigger = settings?.auto_trigger;
      } else {
        console.log(`Make.com: Unknown event type ${eventType}`);
        return false;
      }

      // Fallback: ako event-specifični webhook nije konfiguriran, koristi glavni
      // webhook_url + auto_trigger (back-compat s ranijim setupom gdje je jedan
      // webhook pokrivao sve event-ove).
      if (!webhookUrl && (isEmailEvent || isEquipmentEvent || isContentEvent || isCRMExportEvent)) {
        if (settings?.webhook_url) {
          console.log(`Make.com: koristim fallback webhook_url za ${eventType}`);
          webhookUrl = settings.webhook_url;
          if (autoTrigger === undefined || autoTrigger === false) {
            autoTrigger = settings.auto_trigger;
          }
        }
      }

      if (!webhookUrl) {
        console.log(`Make.com: Webhook URL not configured for ${eventType}`);
        return false;
      }
      
      if (!autoTrigger) {
        console.log(`Make.com: Auto trigger disabled for ${eventType}`);
        return false;
      }

      // Format data based on event type with unified structure
      let unifiedData: MakeWebhookData;
      const hasImageBlob = data.image instanceof Blob;

      if (isEmailEvent || isEquipmentEvent) {
        const recipientsList = data.recipients || [{ to_email: data.to_email || '' }];
        const toEmailsList = recipientsList
          .flatMap((r: any) => {
            const email = r.to_email || '';
            return email.includes(',') 
              ? email.split(',').map((e: string) => e.trim()) 
              : [email.trim()];
          })
          .filter(Boolean);
        const normalizedRecipients = recipientsList
          .map((recipient: any) => ({
            to_email: recipient.to_email || '',
            ...(recipient.company && { company: recipient.company }),
            ...(recipient.client_company_name && { client_company_name: recipient.client_company_name }),
            ...(recipient.client_name && { client_name: recipient.client_name })
          }))
          .filter((recipient: any) => recipient.to_email);
        const primaryRecipient = normalizedRecipients[0];

        const cleanSubject = (data.subject || '').trim();
        const cleanContent = (data.content || '')
          .replace(/^```(?:html|text|markdown)?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        const isAlreadyHTML = cleanContent.trim().startsWith('<!DOCTYPE') || cleanContent.trim().startsWith('<html') || cleanContent.trim().startsWith('<p');
        const htmlContent = isAlreadyHTML ? cleanContent : '<p>' + cleanContent
          .split('\n\n')
          .map(para => para.trim().replace(/\n/g, '<br>'))
          .filter(para => para.length > 0)
          .join('</p><p>') + '</p>';

        const clientCompanyName = data.client_company_name || primaryRecipient?.client_company_name;
        const clientName = data.client_name || primaryRecipient?.client_name;

        unifiedData = {
          event_type: eventType,
          timestamp: new Date().toISOString(),
          user_id: user.id,
          data: {
            subject: cleanSubject,
            content: htmlContent,
            to_emails_list: toEmailsList,
            ...(normalizedRecipients.length > 0 && { recipients: normalizedRecipients }),
            ...(data.company_name && { company_name: data.company_name }),
            ...(clientCompanyName && { client_company_name: clientCompanyName }),
            ...(clientName && { client_name: clientName })
          },
          schema: {
            subject: 'string',
            content: 'string',
            to_emails_list: 'array',
            recipients: 'array',
            company_name: 'string',
            client_company_name: 'string',
            client_name: 'string'
          }
        };
      } else if (isCRMExportEvent) {
        unifiedData = {
          event_type: 'crm_export',
          timestamp: new Date().toISOString(),
          user_id: user.id,
          data: {
            export_info: {
              type: data.type || 'reminders',
              filename: data.filename || 'export',
              format: data.format || 'excel',
              timestamp: new Date().toISOString(),
              user_id: user.id
            },
            summary: {
              total_items: data.data?.length || 0,
              total_leads: data.leads?.length || 0,
              has_leads: (data.leads?.length || 0) > 0,
              has_reminders: (data.data?.length || 0) > 0
            },
            reminders: (data.data || []).map((item: any) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              company: item.company,
              date: item.date,
              time: item.time,
              priority: item.priority,
              status: item.status,
              created_at: item.created_at
            })),
            leads: (data.leads || []).map((lead: any) => ({
              id: lead.id,
              company: lead.company,
              email: lead.email,
              phone: lead.phone,
              website: lead.website,
              location: lead.location,
              status: lead.status,
              potential: lead.potential,
              industry: lead.industry,
              notes: lead.notes,
              created_at: lead.created_at
            }))
          },
          schema: {
            export_info: 'object',
            summary: 'object',
            reminders: 'array',
            leads: 'array'
          }
        };
      } else if (isContentEvent) {
        if (hasImageBlob) {
          // Use FormData for content with image file
          const formData = new FormData();
          formData.append('event_type', 'content_published');
          formData.append('timestamp', new Date().toISOString());
          formData.append('user_id', user.id);
          formData.append('text', data.text || '');
          formData.append('image', data.image, 'image.jpg');

          const response = await fetch(webhookUrl, {
            method: 'POST',
            body: formData,
          });

          console.log(`Make.com webhook triggered for ${eventType} with image file`);
          return true;
        } else {
          unifiedData = {
            event_type: 'content_published',
            timestamp: new Date().toISOString(),
            user_id: user.id,
            data: {
              text: data.text || '',
              image: data.image || ''
            },
            schema: {
              text: 'string',
              image: 'string'
            }
          };
        }
      } else if (isLeadEvent) {
        // Lead data for Google Sheets
        unifiedData = {
          event_type: 'lead_added',
          timestamp: new Date().toISOString(),
          user_id: user.id,
          data: {
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
            dateAdded: data.dateAdded || '',
            business_profile_id: data.business_profile_id || '',
            business_profile_name: data.business_profile_name || '',
            business_company_name: data.business_company_name || ''
          },
          schema: {
            company: 'string',
            email: 'string',
            phone: 'string',
            website: 'string',
            location: 'string',
            country: 'string',
            status: 'string',
            potential: 'string',
            industry: 'string',
            biljeske: 'string',
            dateAdded: 'string',
            business_profile_id: 'string',
            business_profile_name: 'string',
            business_company_name: 'string'
          }
        };
      } else {
        console.error(`Make.com: Unhandled event type ${eventType}`);
        return false;
      }

      // Idempotency key — proslijedi iz callera ili generiraj. Make.com scenarij ga može
      // koristiti za dedupe (npr. Data Store) kad isti request stigne više puta zbog retrya.
      const idempotencyKey =
        (data && typeof data.idempotency_key === 'string' && data.idempotency_key) ||
        `${eventType}-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      (unifiedData as any).idempotency_key = idempotencyKey;

      // Retry s exponential backoffom za 5xx i timeout/network greške.
      const MAX_ATTEMPTS = 3;
      const PER_ATTEMPT_TIMEOUT_MS = 20000;
      const BASE_BACKOFF_MS = 1000;

      let lastError: any = null;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        // Bail early if caller already aborted (npr. outer guard timeout u saveDraft)
        if (externalSignal?.aborted) {
          const err: any = new Error('Aborted by caller');
          err.name = 'AbortError';
          throw err;
        }
        const controller = new AbortController();
        const onExternalAbort = () => controller.abort();
        externalSignal?.addEventListener('abort', onExternalAbort);
        const timeoutId = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS);
        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify(unifiedData),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          externalSignal?.removeEventListener('abort', onExternalAbort);

          if (response.ok || response.status === 0) {
            console.log(`Make.com webhook triggered for event: ${eventType} (attempt ${attempt})`);
            return true;
          }

          // 5xx = retriable. 4xx = permanent.
          if (response.status >= 500 && response.status < 600 && attempt < MAX_ATTEMPTS) {
            const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
            console.warn(`Make.com webhook ${response.status} — retry ${attempt}/${MAX_ATTEMPTS - 1} za ${backoff}ms`);
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }

          console.error(`Make.com webhook error: ${response.status} ${response.statusText}`);
          return false;
        } catch (err: any) {
          clearTimeout(timeoutId);
          externalSignal?.removeEventListener('abort', onExternalAbort);
          lastError = err;
          const isAbort = err?.name === 'AbortError';
          // Ako je externi signal abortirao — prekini odmah, ne retryaj.
          if (isAbort && externalSignal?.aborted) {
            throw err;
          }
          const isNetwork = err instanceof TypeError; // fetch network failure
          const retriable = isAbort || isNetwork;
          if (retriable && attempt < MAX_ATTEMPTS) {
            const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
            console.warn(`Make.com webhook ${isAbort ? 'timeout' : 'network error'} — retry ${attempt}/${MAX_ATTEMPTS - 1} za ${backoff}ms`);
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
          throw err;
        }
      }
      if (lastError) throw lastError;
      return false;
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
