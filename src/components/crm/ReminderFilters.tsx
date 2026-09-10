import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReminderFiltersProps {
  statusFilter: string;
  priorityFilter: string;
  onStatusFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
}

const ReminderFilters = ({ statusFilter, priorityFilter, onStatusFilterChange, onPriorityFilterChange }: ReminderFiltersProps) => (
  <div className="grid gap-2 sm:grid-cols-2 lg:max-w-xl">
    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
      <SelectTrigger className="h-11 sm:h-10"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent><SelectItem value="all">Svi statusi</SelectItem><SelectItem value="Aktivan">Aktivan</SelectItem><SelectItem value="Završen">Završen</SelectItem><SelectItem value="Odgođen">Odgođen</SelectItem></SelectContent>
    </Select>
    <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
      <SelectTrigger className="h-11 sm:h-10"><SelectValue placeholder="Prioritet" /></SelectTrigger>
      <SelectContent><SelectItem value="all">Svi prioriteti</SelectItem><SelectItem value="Visok">Visok</SelectItem><SelectItem value="Srednji">Srednji</SelectItem><SelectItem value="Nizak">Nizak</SelectItem></SelectContent>
    </Select>
  </div>
);

export default ReminderFilters;
