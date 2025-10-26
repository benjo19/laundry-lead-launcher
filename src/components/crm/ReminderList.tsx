
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Reminder } from '@/types';
import ReminderItem from './ReminderItem';

interface ReminderListProps {
  reminders: Reminder[];
  onUpdateStatus: (id: number, status: Reminder['status']) => void;
  onPostpone: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (reminder: Reminder) => void;
}

const ReminderList = ({ reminders, onUpdateStatus, onPostpone, onDelete, onEdit }: ReminderListProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Podsjetnici ({reminders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onUpdateStatus={onUpdateStatus}
              onPostpone={onPostpone}
              onDelete={onDelete}
              onEdit={onEdit}
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
