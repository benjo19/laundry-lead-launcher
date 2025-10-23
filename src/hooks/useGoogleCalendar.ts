import { useState } from 'react';
import { useUserSettings } from './useUserSettings';
import { useToast } from '@/hooks/use-toast';
import { Reminder } from '@/types';

interface GoogleCalendarSettings {
  integration_type?: 'simple' | 'api';
  enabled?: boolean;
  api_key?: string;
  client_id?: string;
  calendar_id?: string;
  auto_sync?: boolean;
}

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export const useGoogleCalendar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { value: gcalSettings } = useUserSettings<GoogleCalendarSettings>('google_calendar_settings', {});
  const { toast } = useToast();

  const createCalendarEvent = async (reminder: Reminder): Promise<string | null> => {
    // Check if integration is enabled
    if (!gcalSettings?.enabled) {
      console.log('Google Calendar integration not enabled');
      return null;
    }

    // For simple integration, return null (will use links)
    if (gcalSettings.integration_type === 'simple' || !gcalSettings.api_key) {
      console.log('Using simple integration - calendar link will be generated');
      return null;
    }

    setIsLoading(true);
    
    try {
      // Check if gapi is loaded
      if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
        console.log('Google Calendar API not loaded, falling back to link');
        return null;
      }

      const startDateTime = new Date(`${reminder.date}T${reminder.time}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour later

      const event: GoogleCalendarEvent = {
        summary: reminder.title,
        description: `${reminder.description || ''}\n\nTvrtka: ${reminder.company}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: gcalSettings.calendar_id || 'primary',
        resource: event,
      });

      console.log('Event created:', response);
      
      toast({
        title: "Događaj dodan",
        description: "Podsjetnik je uspješno dodan u Google Calendar.",
      });

      return response.result.id || null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: "Greška",
        description: "Nije moguće dodati događaj u kalendar. Koristite link za manualno dodavanje.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCalendarEvent = async (reminder: Reminder, eventId: string): Promise<boolean> => {
    if (!gcalSettings?.enabled || gcalSettings.integration_type === 'simple') {
      return false;
    }

    setIsLoading(true);

    try {
      if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
        console.log('Google Calendar API not loaded');
        return false;
      }

      const startDateTime = new Date(`${reminder.date}T${reminder.time}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      const event: GoogleCalendarEvent = {
        summary: reminder.title,
        description: `${reminder.description || ''}\n\nTvrtka: ${reminder.company}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      await window.gapi.client.calendar.events.update({
        calendarId: gcalSettings.calendar_id || 'primary',
        eventId: eventId,
        resource: event,
      });

      toast({
        title: "Događaj ažuriran",
        description: "Podsjetnik je uspješno ažuriran u Google Calendar.",
      });

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      toast({
        title: "Greška",
        description: "Nije moguće ažurirati događaj u kalendaru.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const initGoogleCalendar = async (): Promise<boolean> => {
    if (!gcalSettings?.api_key || !gcalSettings?.client_id) {
      return false;
    }

    try {
      await new Promise((resolve, reject) => {
        window.gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject,
        });
      });

      await window.gapi.client.init({
        apiKey: gcalSettings.api_key,
        clientId: gcalSettings.client_id,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar.events',
      });

      return true;
    } catch (error) {
      console.error('Error initializing Google Calendar:', error);
      return false;
    }
  };

  const signInToGoogle = async (): Promise<boolean> => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      return true;
    } catch (error) {
      console.error('Error signing in to Google:', error);
      return false;
    }
  };

  return {
    createCalendarEvent,
    updateCalendarEvent,
    initGoogleCalendar,
    signInToGoogle,
    isLoading,
  };
};

declare global {
  interface Window {
    gapi: any;
  }
}
