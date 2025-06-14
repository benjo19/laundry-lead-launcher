
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users, CheckSquare, Square } from 'lucide-react';
import { Lead } from '@/types';

interface BulkOperationsProps {
  selectedLeads: number[];
  allLeads: Lead[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkStatusChange: (status: Lead['status']) => void;
}

const BulkOperations = ({
  selectedLeads,
  allLeads,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkStatusChange
}: BulkOperationsProps) => {
  const isAllSelected = selectedLeads.length === allLeads.length && allLeads.length > 0;
  const hasSelection = selectedLeads.length > 0;

  if (allLeads.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
      <Button
        variant="outline"
        size="sm"
        onClick={isAllSelected ? onDeselectAll : onSelectAll}
        className="flex items-center gap-2"
      >
        {isAllSelected ? (
          <CheckSquare className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        {isAllSelected ? 'Deselektiraj sve' : 'Selektiraj sve'}
      </Button>

      <span className="text-sm text-gray-600">
        {selectedLeads.length} od {allLeads.length} selektirano
      </span>

      {hasSelection && (
        <>
          <div className="h-4 w-px bg-gray-300" />
          
          <Select onValueChange={onBulkStatusChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Promijeni status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nova">Nova</SelectItem>
              <SelectItem value="Kontaktiran">Kontaktiran</SelectItem>
              <SelectItem value="Zainteresiran">Zainteresiran</SelectItem>
              <SelectItem value="Odbačen">Odbačen</SelectItem>
              <SelectItem value="Zatvoren">Zatvoren</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Obriši selektirane ({selectedLeads.length})
          </Button>
        </>
      )}
    </div>
  );
};

export default BulkOperations;
