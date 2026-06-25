import React, { useMemo, useState } from 'react';
import { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, Phone, MapPin, Trash2, ArrowUpDown, ExternalLink, Inbox, Flame, Clock, Minus } from 'lucide-react';
import LeadDetailDialog from './LeadDetailDialog';
import { LEAD_STATUS_OPTIONS, getStatusMeta, POTENTIAL_META } from '@/lib/leadStatus';
import { parseLocation } from '@/utils/locationParser';

type Priority = 'hot' | 'warm' | 'cold';

const getPriority = (lead: Lead): Priority => {
  const daysOld = (Date.now() - new Date(lead.dateAdded).getTime()) / 86400000;
  const advanced = ['Sastanak zakazan', 'Ponuda poslana', 'Pregovori', 'Zainteresiran'];
  if (lead.potential === 'Visok' && daysOld <= 14) return 'hot';
  if (advanced.includes(lead.status as string)) return 'hot';
  if (lead.potential === 'Visok' || daysOld <= 30) return 'warm';
  return 'cold';
};

const PRIORITY_META: Record<Priority, { label: string; pillClass: string; Icon: typeof Flame }> = {
  hot: { label: 'Hot', pillClass: 'bg-destructive/10 text-destructive border border-destructive/20', Icon: Flame },
  warm: { label: 'Warm', pillClass: 'bg-warning/10 text-warning border border-warning/30', Icon: Clock },
  cold: { label: 'Cold', pillClass: 'bg-muted text-muted-foreground border border-border', Icon: Minus },
};

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const meta = PRIORITY_META[priority];
  const Icon = meta.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.pillClass}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
};

interface SelectableLeadListProps {
  leads: Lead[];
  selectedLeads: number[];
  onToggleSelect: (leadId: number) => void;
  onUpdateStatus: (leadId: number, newStatus: Lead['status']) => void;
  onDeleteLead: (leadId: number) => void;
  onEmailClick: (email: string, company: string) => void;
  onUpdateNotes: (leadId: number, notes: string) => Promise<void>;
  activeFiltersCount: number;
}

type SortKey = 'company' | 'status' | 'potential' | 'dateAdded' | 'location';
type SortDir = 'asc' | 'desc';

const SelectableLeadList = ({
  leads,
  selectedLeads,
  onToggleSelect,
  onUpdateStatus,
  onDeleteLead,
  onEmailClick,
  onUpdateNotes,
  activeFiltersCount,
}: SelectableLeadListProps) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('dateAdded');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const cityOf = (lead: Lead) => lead.city || parseLocation(lead.location).city || '';
  const countryOf = (lead: Lead) => lead.country || parseLocation(lead.location).country || '';

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'dateAdded' ? 'desc' : 'asc');
    }
  };

  const sortedLeads = useMemo(() => {
    const arr = [...leads];
    arr.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortKey) {
        case 'company':
          av = a.company.toLowerCase();
          bv = b.company.toLowerCase();
          break;
        case 'status':
          av = getStatusMeta(a.status).stage;
          bv = getStatusMeta(b.status).stage;
          break;
        case 'potential':
          av = { Visok: 3, Srednji: 2, Nizak: 1 }[a.potential] ?? 0;
          bv = { Visok: 3, Srednji: 2, Nizak: 1 }[b.potential] ?? 0;
          break;
        case 'dateAdded':
          av = a.dateAdded;
          bv = b.dateAdded;
          break;
        case 'location':
          av = `${countryOf(a)} ${cityOf(a)}`.toLowerCase();
          bv = `${countryOf(b)} ${cityOf(b)}`.toLowerCase();
          break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [leads, sortKey, sortDir]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogOpen(true);
  };

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 py-16 text-center">
        <Inbox className="mx-auto mb-3 h-12 w-12 text-muted-foreground/60" />
        <h3 className="text-base font-semibold text-foreground">
          {activeFiltersCount > 0 ? 'Nema rezultata' : 'Nema leadova u bazi'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeFiltersCount > 0
            ? 'Promijenite filtere ili obrišite pretragu za prikaz rezultata.'
            : 'Dodajte prvi lead da započnete s prodajnim procesom.'}
        </p>
      </div>
    );
  }

  const SortHeader = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? 'text-foreground' : 'opacity-50'}`} />
      </button>
    </TableHead>
  );

  return (
    <>
      <LeadDetailDialog
        lead={selectedLead}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdateStatus={onUpdateStatus}
        onUpdateNotes={onUpdateNotes}
        onEmailClick={onEmailClick}
      />

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                <TableHead className="w-10"></TableHead>
                <SortHeader k="company">Tvrtka</SortHeader>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Kontakt
                </TableHead>
                <SortHeader k="location">Lokacija</SortHeader>
                <SortHeader k="status">Status</SortHeader>
                <SortHeader k="potential">Potencijal</SortHeader>
                <SortHeader k="dateAdded" className="hidden lg:table-cell">Dodano</SortHeader>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Akcije
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeads.map((lead) => {
                const statusMeta = getStatusMeta(lead.status);
                const potentialMeta = POTENTIAL_META[lead.potential] ?? POTENTIAL_META['Srednji'];
                const isSelected = selectedLeads.includes(lead.id);
                const city = cityOf(lead);
                const country = countryOf(lead);

                return (
                  <TableRow
                    key={lead.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className="group cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, input, [role="combobox"], a')) return;
                      handleLeadClick(lead);
                    }}
                  >
                    <TableCell className="w-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(lead.id)}
                        aria-label={`Selektiraj ${lead.company}`}
                      />
                    </TableCell>

                    <TableCell className="min-w-[200px]">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground leading-tight">{lead.company}</span>
                        {lead.industry && (
                          <span className="text-xs text-muted-foreground mt-0.5">{lead.industry}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="min-w-[200px]">
                      <div className="flex flex-col gap-0.5 text-sm">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors truncate max-w-[220px]"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{lead.email}</span>
                          </a>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                            <Mail className="h-3.5 w-3.5" /> bez emaila
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {city || country ? (
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="flex flex-col leading-tight">
                            <span>{city || country}</span>
                            {city && country && (
                              <span className="text-xs text-muted-foreground">{country}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </TableCell>

                    <TableCell className="min-w-[170px]">
                      <Select
                        value={lead.status}
                        onValueChange={(value: Lead['status']) => onUpdateStatus(lead.id, value)}
                      >
                        <SelectTrigger
                          className={`h-8 w-[160px] border-0 px-2.5 py-1 text-xs font-medium rounded-md ${statusMeta.pillClass} focus:ring-2 focus:ring-ring`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                            <SelectValue />
                          </div>
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
                    </TableCell>

                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${potentialMeta.pillClass}`}>
                        {potentialMeta.label}
                      </span>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(lead.dateAdded).toLocaleDateString('hr-HR')}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        {lead.website && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!lead.email}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEmailClick(lead.email, lead.company);
                          }}
                          className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                          title="Pošalji email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLead(lead.id);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Obriši"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          <span>Prikazano {sortedLeads.length} {sortedLeads.length === 1 ? 'lead' : 'leadova'}</span>
          <span>Sortirano po: {sortKey} ({sortDir === 'asc' ? 'rastuće' : 'padajuće'})</span>
        </div>
      </div>
    </>
  );
};

export default SelectableLeadList;
