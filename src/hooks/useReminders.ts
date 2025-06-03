
import { useState, useCallback } from 'react';
import { Reminder, Lead } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

interface NewReminderForm {
  title: string;
  description: string;
  date: string;
  time: string;
  priority: Reminder['priority'];
  company: string;
  companyInputMode: 'select' | 'manual';
}

export const useReminders = () => {
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', [
    {
      id: 1,
      title: 'Poziv Praonica Split',
      description: 'Zakazati demo prezentaciju Marketing Agent platforme',
      date: '2024-02-15',
      time: '14:00',
      priority: 'Visok',
      status: 'Aktivan',
      company: 'Praonica Split'
    },
    {
      id: 2,
      title: 'Follow-up email Čistoća Zagreb',
      description: 'Poslati detaljan poslovni prijedlog s cijenama',
      date: '2024-02-16',
      time: '10:30',
      priority: 'Srednji',
      status: 'Aktivan',
      company: 'Čistoća Zagreb'
    },
    {
      id: 3,
      title: 'Pregled ponude Bijelo rublje',
      description: 'Provjeriti status ponude i kontaktirati klijenta',
      date: '2024-02-14',
      time: '16:00',
      priority: 'Nizak',
      status: 'Završen',
      company: 'Bijelo rublje'
    },
  ]);

  const { toast } = useToast();

  const createReminder = useCallback((newReminder: NewReminderForm) => {
    try {
      const reminder: Reminder = {
        id: Date.now(),
        title: newReminder.title,
        description: newReminder.description,
        date: newReminder.date,
        time: newReminder.time,
        priority: newReminder.priority,
        company: newReminder.company,
        status: 'Aktivan'
      };

      setReminders(prev => [reminder, ...prev]);

      toast({
        title: "Podsjetnik kreiran",
        description: `Podsjetnik "${reminder.title}" je uspješno kreiran.`,
      });

      return true;
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom kreiranja podsjetnika.",
        variant: "destructive"
      });
      return false;
    }
  }, [setReminders, toast]);

  const updateReminderStatus = useCallback((reminderId: number, newStatus: Reminder['status']) => {
    try {
      const reminderTitle = reminders.find(r => r.id === reminderId)?.title;
      
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? { ...reminder, status: newStatus } : reminder
      ));
      
      toast({
        title: "Status ažuriran",
        description: `Podsjetnik "${reminderTitle}" je označen kao ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error('Error updating reminder status:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom ažuriranja statusa.",
        variant: "destructive"
      });
    }
  }, [reminders, setReminders, toast]);

  const deleteReminder = useCallback((reminderId: number) => {
    try {
      const reminderToDelete = reminders.find(r => r.id === reminderId);
      
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      
      toast({
        title: "Podsjetnik obrisan",
        description: `"${reminderToDelete?.title}" je obrisan.`,
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom brisanja podsjetnika.",
        variant: "destructive"
      });
    }
  }, [reminders, setReminders, toast]);

  const postponeReminder = useCallback((reminderId: number) => {
    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) return;

      const currentDate = new Date(reminder.date);
      currentDate.setDate(currentDate.getDate() + 1);
      const newDate = currentDate.toISOString().split('T')[0];

      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, date: newDate, status: 'Odgođen' } : r
      ));

      toast({
        title: "Podsjetnik odgođen",
        description: `"${reminder.title}" je odgođen za jedan dan.`,
      });
    } catch (error) {
      console.error('Error postponing reminder:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška prilikom odgađanja podsjetnika.",
        variant: "destructive"
      });
    }
  }, [reminders, setReminders, toast]);

  return {
    reminders,
    createReminder,
    updateReminderStatus,
    deleteReminder,
    postponeReminder
  };
};
