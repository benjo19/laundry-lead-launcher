
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Reminder } from '@/types';

interface SupabaseReminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  priority: string;
  status: string;
  company: string;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
}

interface NewReminderForm {
  title: string;
  description: string;
  date: string;
  time: string;
  priority: Reminder['priority'];
  company: string;
  companyInputMode: 'select' | 'manual';
}

export const useSupabaseReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapSupabaseToReminder = (supabaseReminder: SupabaseReminder): Reminder => ({
    id: parseInt(supabaseReminder.id.replace(/-/g, ''), 16), // Convert UUID to number for compatibility
    title: supabaseReminder.title,
    description: supabaseReminder.description || '',
    date: supabaseReminder.date,
    time: supabaseReminder.time,
    priority: supabaseReminder.priority as Reminder['priority'],
    status: supabaseReminder.status as Reminder['status'],
    company: supabaseReminder.company,
    leadId: supabaseReminder.lead_id ? parseInt(supabaseReminder.lead_id.replace(/-/g, ''), 16) : undefined
  });

  const fetchReminders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching reminders from Supabase for user:', user.id);

      const { data, error } = await (supabase as any)
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reminders:', error);
        setError(error.message);
        return;
      }

      console.log('Fetched reminders from Supabase:', data?.length || 0);
      const mappedReminders = (data as SupabaseReminder[])?.map(mapSupabaseToReminder) || [];
      setReminders(mappedReminders);
    } catch (err) {
      console.error('Exception fetching reminders:', err);
      setError('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (newReminder: NewReminderForm) => {
    if (!user) {
      toast({
        title: "Greška",
        description: "Morate biti prijavljeni za kreiranje podsjetnika.",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Creating reminder in Supabase:', newReminder);
      const { error } = await (supabase as any)
        .from('reminders')
        .insert({
          user_id: user.id,
          title: newReminder.title,
          description: newReminder.description || null,
          date: newReminder.date,
          time: newReminder.time,
          priority: newReminder.priority,
          company: newReminder.company,
          status: 'Aktivan'
        });

      if (error) {
        console.error('Error creating reminder:', error);
        toast({
          title: "Greška",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      await fetchReminders(); // Refresh the list
      toast({
        title: "Podsjetnik kreiran",
        description: `Podsjetnik "${newReminder.title}" je uspješno kreiran.`,
      });
      return true;
    } catch (err) {
      console.error('Exception creating reminder:', err);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom kreiranja podsjetnika.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateReminderStatus = async (reminderId: number, newStatus: Reminder['status']) => {
    if (!user) return;

    try {
      const reminderToUpdate = reminders.find(r => r.id === reminderId);
      if (!reminderToUpdate) return;

      const { error } = await (supabase as any)
        .from('reminders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('title', reminderToUpdate.title)
        .eq('company', reminderToUpdate.company);

      if (error) {
        console.error('Error updating reminder status:', error);
        toast({
          title: "Greška",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      await fetchReminders();
      toast({
        title: "Status ažuriran",
        description: `Podsjetnik "${reminderToUpdate.title}" je označen kao ${newStatus.toLowerCase()}.`,
      });
    } catch (err) {
      console.error('Exception updating reminder status:', err);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom ažuriranja statusa.",
        variant: "destructive",
      });
    }
  };

  const deleteReminder = async (reminderId: number) => {
    if (!user) return;

    try {
      const reminderToDelete = reminders.find(r => r.id === reminderId);
      if (!reminderToDelete) return;

      const { error } = await (supabase as any)
        .from('reminders')
        .delete()
        .eq('user_id', user.id)
        .eq('title', reminderToDelete.title)
        .eq('company', reminderToDelete.company);

      if (error) {
        console.error('Error deleting reminder:', error);
        toast({
          title: "Greška",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      await fetchReminders();
      toast({
        title: "Podsjetnik obrisan",
        description: `"${reminderToDelete.title}" je obrisan.`,
      });
    } catch (err) {
      console.error('Exception deleting reminder:', err);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom brisanja podsjetnika.",
        variant: "destructive",
      });
    }
  };

  const postponeReminder = async (reminderId: number) => {
    if (!user) return;

    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) return;

      const currentDate = new Date(reminder.date);
      currentDate.setDate(currentDate.getDate() + 1);
      const newDate = currentDate.toISOString().split('T')[0];

      const { error } = await (supabase as any)
        .from('reminders')
        .update({ 
          date: newDate, 
          status: 'Odgođen',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('title', reminder.title)
        .eq('company', reminder.company);

      if (error) {
        console.error('Error postponing reminder:', error);
        toast({
          title: "Greška",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      await fetchReminders();
      toast({
        title: "Podsjetnik odgođen",
        description: `"${reminder.title}" je odgođen za jedan dan.`,
      });
    } catch (err) {
      console.error('Exception postponing reminder:', err);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom odgađanja podsjetnika.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  return {
    reminders,
    loading,
    error,
    createReminder,
    updateReminderStatus,
    deleteReminder,
    postponeReminder,
    refreshReminders: fetchReminders
  };
};
