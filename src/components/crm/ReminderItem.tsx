
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle2, Trash2, Users, Edit, CalendarPlus } from 'lucide-react';
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

const ReminderItem = ({ reminder, onUpdateStatus, onPostpone, onDelete, onEdit, compact = false }: ReminderItemProps) => {
  const calendarUrl = generateGoogleCalendarLink({
    title: reminder.title,
    description: reminder.description || '',
    date: reminder.date,
    time: reminder.time,
    company: reminder.company,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Visok': return 'bg-red-100 text-red-800';
      case 'Srednji': return 'bg-yellow-100 text-yellow-800';
      case 'Nizak': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'Završen' ? 
      <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
      <AlertCircle className="h-4 w-4 text-orange-600" />;
  };

  return (
    <div className={`border rounded-lg hover:shadow-sm transition-all ${compact ? 'p-2' : 'p-4'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {getStatusIcon(reminder.status)}
            <h3 className="font-medium text-slate-900">{reminder.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {reminder.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mb-1">{reminder.description}</p>
          <p className="text-xs text-slate-500 flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {reminder.company}
          </p>
        </div>
        <Badge className={getPriorityColor(reminder.priority)}>
          {reminder.priority}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-slate-500">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{reminder.date}</span>
          <Clock className="h-3 w-3 ml-3 mr-1" />
          <span>{reminder.time}</span>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-6 w-6 p-0 ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="Dodaj u Google Calendar"
          >
            <CalendarPlus className="h-4 w-4" />
          </a>
        </div>
        <div className="flex space-x-1">
          {reminder.status === 'Aktivan' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onUpdateStatus(reminder.id, 'Završen')}
                className="text-xs px-2 py-1 h-7"
              >
                Završi
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPostpone(reminder.id)}
                className="text-xs px-2 py-1 h-7"
              >
                Odgodi
              </Button>
            </>
          )}
          {reminder.status === 'Završen' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdateStatus(reminder.id, 'Aktivan')}
              className="text-xs px-2 py-1 h-7"
            >
              Aktiviraj
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(reminder)}
            className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 h-7"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(reminder.id)}
            className="text-red-600 hover:text-red-700 text-xs px-2 py-1 h-7"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReminderItem;
