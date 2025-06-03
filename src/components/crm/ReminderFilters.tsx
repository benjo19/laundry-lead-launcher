
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

interface ReminderFiltersProps {
  statusFilter: string;
  priorityFilter: string;
  onStatusFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
}

const ReminderFilters = ({
  statusFilter,
  priorityFilter,
  onStatusFilterChange,
  onPriorityFilterChange
}: ReminderFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Filter className="h-5 w-5 mr-2 text-slate-600" />
          Filtri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi statusi</SelectItem>
              <SelectItem value="Aktivan">Aktivan</SelectItem>
              <SelectItem value="Završen">Završen</SelectItem>
              <SelectItem value="Odgođen">Odgođen</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Prioritet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi prioriteti</SelectItem>
              <SelectItem value="Visok">Visok</SelectItem>
              <SelectItem value="Srednji">Srednji</SelectItem>
              <SelectItem value="Nizak">Nizak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderFilters;
