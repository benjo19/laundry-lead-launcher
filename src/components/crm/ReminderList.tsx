
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
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

const ReminderList = ({ reminders, onUpdateStatus, onPostpone, onDelete, onEdit, compact = false }: ReminderListProps) => {
  return (
    <Card className="h-full">
      <CardHeader className={compact ? 'py-3' : undefined}>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Podsjetnici ({reminders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'pt-0 pb-3' : undefined}>
        <div className={cn(compact ? 'space-y-1.5' : 'space-y-3')}>
          {reminders.map((reminder) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onUpdateStatus={onUpdateStatus}
              onPostpone={onPostpone}
              onDelete={onDelete}
              onEdit={onEdit}
              compact={compact}
            />
          ))}
          {reminders.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nema podsjetnika koji odgovaraju filterima.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderList;

export default ReminderList;
