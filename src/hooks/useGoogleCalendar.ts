import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Reminder } from '@/types';

interface GoogleCalendarEvent {
  summary: string;
  description: string;
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createCalendarEvent = useCallback(async (reminder: Reminder) => {
    setIsLoading(true);
    try {
      // Check if Google Calendar API is loaded
      if (!window.gapi || !window.gapi.client.calendar) {
        throw new Error('Google Calendar API not loaded');
      }

      const startDateTime = new Date(`${reminder.date}T${reminder.time}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      const event: GoogleCalendarEvent = {
        summary: `CRM: ${reminder.title}`,
        description: `Tvrtka: ${reminder.company}\n\nOpis: ${reminder.description}\n\nPrioritet: ${reminder.priority}\n\nGenerirano iz Marketing Agent CRM-a`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Europe/Zagreb',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Europe/Zagreb',
        },
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      if (response.status === 200) {
        toast({
          title: "Događaj kreiran",
          description: `Podsjetnik "${reminder.title}" je dodan u Google Calendar.`,
        });
        return true;
      } else {
        throw new Error('Failed to create calendar event');
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom dodavanja u Google Calendar.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const initGoogleCalendar = useCallback(async () => {
    try {
      // Initialize Google API
      await new Promise((resolve, reject) => {
        window.gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject,
        });
      });

      await window.gapi.client.init({
        apiKey: 'YOUR_API_KEY', // Replace with your API key
        clientId: 'YOUR_CLIENT_ID', // Replace with your client ID
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar.events',
      });

      return true;
    } catch (error) {
      console.error('Error initializing Google Calendar:', error);
      return false;
    }
  }, []);

  const signInToGoogle = useCallback(async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }
      return true;
    } catch (error) {
      console.error('Error signing in to Google:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom prijave u Google.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    createCalendarEvent,
    initGoogleCalendar,
    signInToGoogle,
    isLoading,
  };
};

// Declare global types for Google API
declare global {
  interface Window {
    gapi: any;
  }
}