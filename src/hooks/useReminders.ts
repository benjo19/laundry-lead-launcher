import { useSupabaseReminders } from '@/hooks/useSupabaseReminders';

// Reminders require a signed-in user; the hook returns an empty list otherwise.
export const useReminders = () => useSupabaseReminders();
