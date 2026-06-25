
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, CheckSquare, Square, Sparkles, Loader2 } from 'lucide-react';
import { Lead } from '@/types';
import { LEAD_STATUS_OPTIONS } from '@/lib/leadStatus';

interface BulkOperationsProps {
  selectedLeads: number[];
  allLeads: Lead[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkStatusChange: (status: Lead['status']) => void;
  onBulkEnrich?: () => void;
  isEnriching?: boolean;
}

const BulkOperations = ({
  selectedLeads,
  allLeads,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkStatusChange,
  onBulkEnrich,
  isEnriching = false,
}: BulkOperationsProps) => {
  const isAllSelected = selectedLeads.length === allLeads.length && allLeads.length > 0;
  const hasSelection = selectedLeads.length > 0;

  // Count selected leads without an email (eligible for enrichment)
  const enrichableCount = React.useMemo(() => {
    if (!hasSelection) return 0;
    const selectedSet = new Set(selectedLeads);
    return allLeads.filter(
      (l) => selectedSet.has(l.id) && (!l.email || !String(l.email).trim())
    ).length;
  }, [selectedLeads, allLeads, hasSelection]);

  if (allLeads.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 rounded-lg border">
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

      <span className="text-sm text-muted-foreground">
        {selectedLeads.length} od {allLeads.length} selektirano
      </span>

      {hasSelection && (
        <>
          <div className="h-4 w-px bg-border" />

          <Select onValueChange={onBulkStatusChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Promijeni status" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${opt.dotClass}`} />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {onBulkEnrich && enrichableCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBulkEnrich}
              disabled={isEnriching}
              className="flex items-center gap-2"
            >
              {isEnriching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isEnriching
                ? `Pronalazim emailove... (${enrichableCount})`
                : `Pronađi emailove (${enrichableCount})`}
            </Button>
          )}

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
