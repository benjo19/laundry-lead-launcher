import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead, Reminder } from '@/types';
import { useReminders } from '@/hooks/useReminders';
import { useMakeIntegration } from '@/hooks/useMakeIntegration';
import { useLanguage } from '@/contexts/LanguageContext';
import ExportButton from './ExportButton';
import ReminderFilters from './crm/ReminderFilters';
import ReminderForm from './crm/ReminderForm';
import ReminderList from './crm/ReminderList';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';

interface NewReminderForm {
  title: string;
  description: string;
  date: string;
  time: string;
  priority: Reminder['priority'];
  company: string;
  companyInputMode: 'select' | 'manual';
}

const CRMReminder = () => {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { triggerWebhook } = useMakeIntegration();
  
  const [newReminder, setNewReminder] = useState<NewReminderForm>({
    title: '',
    description: '',
    date: '',
    time: '',
    priority: 'Srednji',
    company: '',
    companyInputMode: 'select'
  });

  const [leads] = useLocalStorage<Lead[]>('leads', []);
  const { 
    reminders, 
    loading,
    error,
    createReminder, 
    updateReminderStatus, 
    deleteReminder, 
    postponeReminder,
    refreshReminders
  } = useReminders();

  const filteredReminders = useMemo(() => {
    return reminders.filter(reminder => {
      const matchesStatus = statusFilter === 'all' || reminder.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || reminder.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [reminders, statusFilter, priorityFilter]);

  const handleCreateReminder = async () => {
    console.log('Creating reminder:', newReminder);
    try {
      await createReminder(newReminder);
      
      // Trigger Make.com webhook
      await triggerWebhook('reminder_created', {
        title: newReminder.title,
        company: newReminder.company,
        priority: newReminder.priority,
        date: newReminder.date,
        time: newReminder.time
      });

      setNewReminder({
        title: '',
        description: '',
        date: '',
        time: '',
        priority: 'Srednji',
        company: '',
        companyInputMode: 'select'
      });
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const handleUpdateReminderStatus = async (id: number, status: Reminder['status']) => {
    console.log('Updating reminder status:', id, status);
    try {
      await updateReminderStatus(id, status);
      if (status === 'Završen') {
        const reminder = reminders.find(r => r.id === id);
        if (reminder) {
          await triggerWebhook('reminder_completed', {
            id: reminder.id,
            title: reminder.title,
            company: reminder.company,
            completed_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error updating reminder status:', error);
    }
  };

  const activeReminders = reminders.filter(r => r.status === 'Aktivan');
  const completedReminders = reminders.filter(r => r.status === 'Završen');

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" text={`${t('loading')} ${t('crm_reminder').toLowerCase()}...`} className="py-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage 
          message={`${t('error_occurred')}: ${error}`}
          onRetry={refreshReminders}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t('crm_reminder')}</h2>
          <p className="text-slate-600">Upravljajte terminima i komunikacijom s klijentima</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-4 text-sm text-slate-600">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
              Aktivno: {activeReminders.length}
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Završeno: {completedReminders.length}
            </span>
          </div>
          <ExportButton data={filteredReminders} filename="crm-podsjetnici" type="reminders" />
        </div>
      </div>

      <ReminderFilters
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onStatusFilterChange={setStatusFilter}
        onPriorityFilterChange={setPriorityFilter}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ReminderList
          reminders={filteredReminders}
          onUpdateStatus={handleUpdateReminderStatus}
          onPostpone={postponeReminder}
          onDelete={deleteReminder}
        />

        <ReminderForm
          newReminder={newReminder}
          setNewReminder={setNewReminder}
          leads={leads}
          onCreateReminder={handleCreateReminder}
        />
      </div>
    </div>
  );
};

export default CRMReminder;
