import React, { useMemo, useState } from 'react';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { Reminder } from '@/types';
import { useReminders } from '@/hooks/useReminders';
import { useMakeIntegration } from '@/hooks/useMakeIntegration';
import { generateGoogleCalendarLink } from '@/utils/googleCalendarLink';
import ExportButton from './ExportButton';
import ReminderFilters from './crm/ReminderFilters';
import ReminderForm from './crm/ReminderForm';
import ReminderList from './crm/ReminderList';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorMessage from '@/components/ui/error-message';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import DensityToggle from '@/components/ui/density-toggle';
import { useDensity } from '@/hooks/useDensity';
import { Button } from '@/components/ui/button';

interface NewReminderForm {
  title: string;
  description: string;
  date: string;
  time: string;
  priority: Reminder['priority'];
  company: string;
  companyInputMode: 'select' | 'manual';
}

const localDate = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

const CRMReminder = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { triggerWebhook } = useMakeIntegration();
  const { density } = useDensity();
  const compact = density === 'compact';
  const [newReminder, setNewReminder] = useState<NewReminderForm>({ title: '', description: '', date: '', time: '', priority: 'Srednji', company: '', companyInputMode: 'select' });
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const { leads } = useLeadManagement();
  const { reminders, loading, error, createReminder, updateReminderStatus, deleteReminder, postponeReminder, refreshReminders, updateReminder } = useReminders();

  const filteredReminders = useMemo(() => reminders.filter(reminder => {
    const matchesStatus = statusFilter === 'all' || reminder.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || reminder.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  }), [reminders, statusFilter, priorityFilter]);

  const today = localDate();
  const sevenDays = new Date(); sevenDays.setDate(sevenDays.getDate() + 7);
  const weekEnd = localDate(sevenDays);
  const stats = useMemo(() => ({
    overdue: reminders.filter(r => r.status === 'Aktivan' && r.date && r.date < today).length,
    today: reminders.filter(r => r.status === 'Aktivan' && r.date === today).length,
    week: reminders.filter(r => r.status === 'Aktivan' && r.date >= today && r.date <= weekEnd).length,
    completed: reminders.filter(r => r.status === 'Završen').length,
  }), [reminders, today, weekEnd]);

  const handleCreateReminder = async () => {
    const calendarUrl = generateGoogleCalendarLink({ title: newReminder.title, description: newReminder.description, date: newReminder.date, time: newReminder.time, company: newReminder.company });
    window.open(calendarUrl, '_blank');
    try {
      const success = await createReminder(newReminder);
      if (success) {
        await triggerWebhook('reminder_created', { title: newReminder.title, company: newReminder.company, priority: newReminder.priority, date: newReminder.date, time: newReminder.time });
        setNewReminder({ title: '', description: '', date: '', time: '', priority: 'Srednji', company: '', companyInputMode: 'select' });
      }
    } catch (e) { console.error('Error creating reminder:', e); }
  };

  const handleUpdateReminderStatus = async (id: number, status: Reminder['status']) => {
    try {
      await updateReminderStatus(id, status);
      if (status === 'Završen') {
        const reminder = reminders.find(r => r.id === id);
        if (reminder) await triggerWebhook('reminder_completed', { id: reminder.id, title: reminder.title, company: reminder.company, completed_at: new Date().toISOString() });
      }
    } catch (e) { console.error('Error updating reminder status:', e); }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setNewReminder({ title: reminder.title, description: reminder.description, date: reminder.date, time: reminder.time, priority: reminder.priority, company: reminder.company, companyInputMode: 'select' });
  };

  const resetForm = () => {
    setEditingReminder(null);
    setNewReminder({ title: '', description: '', date: '', time: '', priority: 'Srednji', company: '', companyInputMode: 'select' });
  };

  const handleUpdateReminder = async () => {
    if (!editingReminder || !updateReminder) return;
    try { if (await updateReminder(editingReminder.id, newReminder)) resetForm(); } catch (e) { console.error('Error updating reminder:', e); }
  };

  if (loading) return <div className="mx-auto w-full max-w-7xl px-3 py-10 sm:px-6"><LoadingSpinner size="lg" text="Učitavam follow-upove..." className="py-12" /></div>;
  if (error) return <div className="mx-auto w-full max-w-7xl px-3 py-10 sm:px-6"><ErrorMessage message={`Greška: ${error}`} onRetry={refreshReminders} /></div>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-3 pb-24 pt-4 sm:px-6 sm:pt-5 md:pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="pr-12 sm:pr-0">
          <p className="text-sm font-medium text-muted-foreground">Automind CRM</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Follow-up</h1>
          <p className="mt-1 text-sm text-muted-foreground">Prodajne obveze, podsjetnici i sljedeći koraci na jednom mjestu.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refreshReminders} className="gap-2"><RefreshCw className="h-4 w-4" />Osvježi</Button>
          <DensityToggle />
          <ExportButton data={filteredReminders} filename="crm-follow-up" type="reminders" leads={leads} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard label="Kasni" value={stats.overdue} icon={AlertCircle} tone={stats.overdue ? 'danger' : 'neutral'} />
        <StatCard label="Danas" value={stats.today} icon={CalendarClock} tone={stats.today ? 'warning' : 'neutral'} />
        <StatCard label="Ovaj tjedan" value={stats.week} icon={Clock3} />
        <StatCard label="Završeno" value={stats.completed} icon={CheckCircle2} tone="success" />
      </div>

      <Card>
        <CardContent className="p-3 sm:p-5">
          <ReminderFilters statusFilter={statusFilter} priorityFilter={priorityFilter} onStatusFilterChange={setStatusFilter} onPriorityFilterChange={setPriorityFilter} />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">Obveze</h2><p className="text-sm text-muted-foreground">{filteredReminders.length} prikazano</p></div></div>
          <ReminderList reminders={filteredReminders} onUpdateStatus={handleUpdateReminderStatus} onPostpone={postponeReminder} onDelete={deleteReminder} onEdit={handleEditReminder} compact={compact} />
        </section>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">{editingReminder ? 'Uredi follow-up' : 'Novi follow-up'}</CardTitle></CardHeader>
            <CardContent>
              <ReminderForm newReminder={newReminder} setNewReminder={setNewReminder} leads={leads} onCreateReminder={editingReminder ? handleUpdateReminder : handleCreateReminder} editingReminder={editingReminder} onCancelEdit={resetForm} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, tone = 'neutral' }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone?: 'neutral' | 'danger' | 'warning' | 'success' }) => {
  const toneClass = tone === 'danger' ? 'text-destructive' : tone === 'warning' ? 'text-amber-600 dark:text-amber-400' : tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground';
  return <Card><CardContent className="p-3 sm:p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p><Icon className={`h-4 w-4 ${toneClass}`} /></div><p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p></CardContent></Card>;
};

export default CRMReminder;
