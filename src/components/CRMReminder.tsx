import React, { useState, useMemo } from 'react';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { Reminder } from '@/types';
import { useReminders } from '@/hooks/useReminders';
import { useMakeIntegration } from '@/hooks/useMakeIntegration';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateGoogleCalendarLink } from '@/utils/googleCalendarLink';
import ExportButton from './ExportButton';
import ReminderFilters from './crm/ReminderFilters';
import ReminderForm from './crm/ReminderForm';
import ReminderList from './crm/ReminderList';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import DensityToggle from '@/components/ui/density-toggle';
import { useDensity } from '@/hooks/useDensity';
import { cn } from '@/lib/utils';

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
  const { density } = useDensity();
  const compact = density === 'compact';
  
  const [newReminder, setNewReminder] = useState<NewReminderForm>({
    title: '',
    description: '',
    date: '',
    time: '',
    priority: 'Srednji',
    company: '',
    companyInputMode: 'select'
  });

  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const { leads } = useLeadManagement();
  const { 
    reminders, 
    loading,
    error,
    createReminder, 
    updateReminderStatus, 
    deleteReminder, 
    postponeReminder,
    refreshReminders,
    updateReminder
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
    
    // Generate and open Google Calendar link IMMEDIATELY (before async operations)
    // This prevents mobile pop-up blockers
    const calendarUrl = generateGoogleCalendarLink({
      title: newReminder.title,
      description: newReminder.description,
      date: newReminder.date,
      time: newReminder.time,
      company: newReminder.company,
    });
    window.open(calendarUrl, '_blank');
    
    try {
      const success = await createReminder(newReminder);
      
      if (success) {
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
      }
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

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setNewReminder({
      title: reminder.title,
      description: reminder.description,
      date: reminder.date,
      time: reminder.time,
      priority: reminder.priority,
      company: reminder.company,
      companyInputMode: 'select'
    });
  };

  const handleUpdateReminder = async () => {
    if (!editingReminder || !updateReminder) return;
    
    try {
      const success = await updateReminder(editingReminder.id, newReminder);
      if (success) {
        setEditingReminder(null);
        setNewReminder({
          title: '',
          description: '',
          date: '',
          time: '',
          priority: 'Srednji',
          company: '',
          companyInputMode: 'select'
        });
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingReminder(null);
    setNewReminder({
      title: '',
      description: '',
      date: '',
      time: '',
      priority: 'Srednji',
      company: '',
      companyInputMode: 'select'
    });
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
          <h2 className="text-3xl font-bold text-slate-900">CRM Datoteke</h2>
          <p className="text-slate-600">Upravljajte podacima koje možete izvoziti u tablice</p>
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
          <DensityToggle />
          <ExportButton data={filteredReminders} filename="crm-datoteke" type="reminders" leads={leads} />
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className={compact ? "pt-2 pb-2" : "pt-4 pb-3"}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Danas</p>
                <div className={cn("font-bold text-blue-600 dark:text-blue-400", compact ? "text-lg" : "text-2xl")}>
                  {reminders.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Aktivan').length}
                </div>
              </div>
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
          <CardContent className={compact ? "pt-2 pb-2" : "pt-4 pb-3"}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Visok prioritet</p>
                <div className={cn("font-bold text-orange-600 dark:text-orange-400", compact ? "text-lg" : "text-2xl")}>
                  {reminders.filter(r => r.priority === 'Visok' && r.status === 'Aktivan').length}
                </div>
              </div>
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900">
          <CardContent className={compact ? "pt-2 pb-2" : "pt-4 pb-3"}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Ovaj tjedan</p>
                <div className={cn("font-bold text-purple-600 dark:text-purple-400", compact ? "text-lg" : "text-2xl")}>
                  {reminders.filter(r => {
                    const reminderDate = new Date(r.date);
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return reminderDate <= weekFromNow && r.status === 'Aktivan';
                  }).length}
                </div>
              </div>
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className={compact ? "pt-2 pb-2" : "pt-4 pb-3"}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Ukupno završeno</p>
                <div className={cn("font-bold text-green-600 dark:text-green-400", compact ? "text-lg" : "text-2xl")}>
                  {reminders.filter(r => r.status === 'Završen').length}
                </div>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <ReminderFilters
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onStatusFilterChange={setStatusFilter}
        onPriorityFilterChange={setPriorityFilter}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <ReminderList
            reminders={filteredReminders}
            onUpdateStatus={handleUpdateReminderStatus}
            onPostpone={postponeReminder}
            onDelete={deleteReminder}
            onEdit={handleEditReminder}
          />
        </div>

        <div className="lg:col-span-1">
          <ReminderForm
            newReminder={newReminder}
            setNewReminder={setNewReminder}
            leads={leads}
            onCreateReminder={editingReminder ? handleUpdateReminder : handleCreateReminder}
            editingReminder={editingReminder}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default CRMReminder;
