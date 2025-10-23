import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationResult {
  zapier: boolean;
  googleCalendar: boolean;
}

export async function migrateLocalStorageToDatabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    zapier: false,
    googleCalendar: false,
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return result;

    // Check if user settings exist
    const { data: settings } = await supabase
      .from('user_settings')
      .select('zapier_settings, google_calendar_settings')
      .eq('user_id', user.id)
      .maybeSingle();

    const updates: any = {};
    let hasUpdates = false;

    // Migrate Zapier webhook
    const zapierWebhook = localStorage.getItem('zapier_webhook_url');
    if (zapierWebhook && (!settings?.zapier_settings || Object.keys(settings.zapier_settings).length === 0)) {
      try {
        const parsedWebhook = JSON.parse(zapierWebhook);
        updates.zapier_settings = {
          webhook_url: parsedWebhook,
          enabled: true,
          last_migrated: new Date().toISOString(),
        };
        hasUpdates = true;
        result.zapier = true;
      } catch {
        // If not JSON, use as plain string
        updates.zapier_settings = {
          webhook_url: zapierWebhook,
          enabled: true,
          last_migrated: new Date().toISOString(),
        };
        hasUpdates = true;
        result.zapier = true;
      }
    }

    // Migrate Google Calendar settings
    const gcalConnected = localStorage.getItem('google_calendar_connected');
    const gcalSettings = localStorage.getItem('google_calendar_settings');
    
    if ((gcalConnected || gcalSettings) && (!settings?.google_calendar_settings || Object.keys(settings.google_calendar_settings).length === 0)) {
      const migratedSettings: any = {
        last_migrated: new Date().toISOString(),
      };

      if (gcalConnected) {
        try {
          migratedSettings.enabled = JSON.parse(gcalConnected);
        } catch {
          migratedSettings.enabled = gcalConnected === 'true';
        }
      }

      if (gcalSettings) {
        try {
          const parsed = JSON.parse(gcalSettings);
          Object.assign(migratedSettings, parsed);
        } catch (e) {
          console.error('Failed to parse Google Calendar settings:', e);
        }
      }

      updates.google_calendar_settings = migratedSettings;
      hasUpdates = true;
      result.googleCalendar = true;
    }

    // Save to database if there are updates
    if (hasUpdates) {
      if (settings) {
        // Update existing
        await supabase
          .from('user_settings')
          .update(updates)
          .eq('user_id', user.id);
      } else {
        // Insert new
        await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            ...updates,
          });
      }

      // Show success message
      const migratedItems = [];
      if (result.zapier) migratedItems.push('Zapier');
      if (result.googleCalendar) migratedItems.push('Google Calendar');

      if (migratedItems.length > 0) {
        toast.success('Settings Migrated', {
          description: `Your ${migratedItems.join(' and ')} settings have been migrated to the database.`,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Migration error:', error);
    return result;
  }
}
