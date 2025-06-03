
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Lead } from '@/types';
import { useReminders } from '@/hooks/useReminders';
import ExportButton from './ExportButton';
import ReminderFilters from './crm/ReminderFilters';
import ReminderForm from './crm/ReminderForm';
import ReminderList from './crm/ReminderList';

const CRMReminder = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    priority: 'Srednji' as const,
    company: '',
    companyInputMode: 'select' as const
  });

  const [leads] = useLocalStorage<Lead[]>('leads', []);
  const { 
    reminders, 
    createReminder, 
    updateReminderStatus, 
    deleteReminder, 
    postponeReminder 
  } = useReminders();

  const filteredReminders = useMemo(() => {
    return reminders.filter(reminder => {
      const matchesStatus = statusFilter === 'all' || reminder.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || reminder.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [reminders, statusFilter, priorityFilter]);

  const handleCreateReminder = () => {
    const success = createReminder(newReminder);
    if (success) {
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
  };

  const activeReminders = reminders.filter(r => r.status === 'Aktivan');
  const completedReminders = reminders.filter(r => r.status === 'Završen');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">CRM Podsjetnik</h2>
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
          onUpdateStatus={updateReminderStatus}
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
