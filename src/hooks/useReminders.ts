
import { useSupabaseReminders } from '@/hooks/useSupabaseReminders';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Reminder } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export const useReminders = () => {
  const { user } = useAuth();
  const [localReminders] = useLocalStorage<Reminder[]>('reminders', []);
  
  // Use Supabase if user is authenticated, otherwise fallback to localStorage
  const supabaseHook = useSupabaseReminders();
  
  if (user) {
    return supabaseHook;
  }
  
  // Fallback to localStorage for non-authenticated users (legacy support)
  return {
    reminders: localReminders,
    loading: false,
    error: null,
    createReminder: async () => {
      console.log('Please log in to create reminders');
      return false;
    },
    updateReminderStatus: async () => {
      console.log('Please log in to update reminders');
    },
    deleteReminder: async () => {
      console.log('Please log in to delete reminders');
    },
    postponeReminder: async () => {
      console.log('Please log in to postpone reminders');
    },
    refreshReminders: async () => {
      console.log('Please log in to refresh reminders');
    }
  };
};
