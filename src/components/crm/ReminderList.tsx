import React from 'react';
import { Reminder } from '@/types';
import ReminderItem from './ReminderItem';
import { cn } from '@/lib/utils';

interface ReminderListProps {
  reminders: Reminder[];
  onUpdateStatus: (id: number, status: Reminder['status']) => void;
  onPostpone: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (reminder: Reminder) => void;
  compact?: boolean;
}

const ReminderList = ({ reminders, onUpdateStatus, onPostpone, onDelete, onEdit, compact = false }: ReminderListProps) => (
  <div className={cn(compact ? 'space-y-1.5' : 'space-y-2')}>
    {reminders.map((reminder) => (
      <ReminderItem key={reminder.id} reminder={reminder} onUpdateStatus={onUpdateStatus} onPostpone={onPostpone} onDelete={onDelete} onEdit={onEdit} compact={compact} />
    ))}
    {reminders.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nema follow-upova koji odgovaraju filterima.</div>}
  </div>
);

export default ReminderList;
