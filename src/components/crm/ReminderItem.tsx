import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle2, Trash2, Users, Edit, CalendarPlus } from 'lucide-react';
import { Reminder } from '@/types';
import { generateGoogleCalendarLink } from '@/utils/googleCalendarLink';

interface ReminderItemProps {
  reminder: Reminder;
  onUpdateStatus: (id: number, status: Reminder['status']) => void;
  onPostpone: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (reminder: Reminder) => void;
  compact?: boolean;
}

const localDate = () => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

const ReminderItem = ({ reminder, onUpdateStatus, onPostpone, onDelete, onEdit, compact = false }: ReminderItemProps) => {
  const calendarUrl = generateGoogleCalendarLink({ title: reminder.title, description: reminder.description || '', date: reminder.date, time: reminder.time, company: reminder.company });
  const today = localDate();
  const overdue = reminder.status === 'Aktivan' && reminder.date < today;
  const dueToday = reminder.status === 'Aktivan' && reminder.date === today;

  const priorityClass = reminder.priority === 'Visok'
    ? 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'
    : 'text-muted-foreground';
  const dateClass = overdue ? 'text-destructive' : dueToday ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground';

  return (
    <div className={`rounded-xl border bg-card transition-colors hover:bg-muted/20 ${compact ? 'p-2.5' : 'p-3 sm:p-4'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{reminder.title}</h3>
            <Badge variant={reminder.status === 'Završen' ? 'secondary' : 'outline'}>{reminder.status}</Badge>
            <Badge variant="outline" className={priorityClass}>{reminder.priority}</Badge>
          </div>
          {reminder.description && <p className="mt-1.5 text-sm text-muted-foreground">{reminder.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{reminder.company}</span>
            <span className={`flex items-center gap-1 font-medium ${dateClass}`}><Calendar className="h-3.5 w-3.5" />{overdue ? 'Kasni · ' : dueToday ? 'Danas · ' : ''}{reminder.date}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{reminder.time || '—'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:max-w-[260px] sm:justify-end">
          {reminder.status === 'Aktivan' ? <>
            <Button variant="outline" size="sm" onClick={() => onUpdateStatus(reminder.id, 'Završen')} className="h-9 gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Završi</Button>
            <Button variant="outline" size="sm" onClick={() => onPostpone(reminder.id)} className="h-9">Odgodi</Button>
          </> : <Button variant="outline" size="sm" onClick={() => onUpdateStatus(reminder.id, 'Aktivan')} className="h-9">Aktiviraj</Button>}
          <Button variant="ghost" size="icon" onClick={() => onEdit(reminder)} className="h-9 w-9" aria-label="Uredi"><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" asChild className="h-9 w-9" aria-label="Dodaj u kalendar"><a href={calendarUrl} target="_blank" rel="noopener noreferrer"><CalendarPlus className="h-4 w-4" /></a></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(reminder.id)} className="h-9 w-9 text-destructive hover:text-destructive" aria-label="Obriši"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default ReminderItem;
