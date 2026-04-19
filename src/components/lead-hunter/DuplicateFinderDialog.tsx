import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitMerge, Mail, Building2, Loader2 } from 'lucide-react';
import { Lead } from '@/types';
import {
  findDuplicateGroups,
  pickBestMaster,
  mergeLeadData,
  DuplicateGroup,
} from './utils/duplicateDetection';

interface DuplicateFinderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onMerge: (
    masterId: number,
    duplicateIds: number[],
    mergedData: Partial<Lead>
  ) => Promise<void>;
}

const DuplicateFinderDialog: React.FC<DuplicateFinderDialogProps> = ({
  open,
  onOpenChange,
  leads,
  onMerge,
}) => {
  const [mode, setMode] = useState<'email' | 'company' | 'both'>('both');
  const [selectedMasters, setSelectedMasters] = useState<Record<string, number>>({});
  const [mergingGroup, setMergingGroup] = useState<string | null>(null);
  const [mergingAll, setMergingAll] = useState(false);

  const groups = useMemo(() => findDuplicateGroups(leads, mode), [leads, mode]);

  const totalDuplicates = useMemo(
    () => groups.reduce((sum, g) => sum + g.leads.length - 1, 0),
    [groups]
  );

  const getMaster = (group: DuplicateGroup): Lead => {
    const selectedId = selectedMasters[group.id];
    if (selectedId) {
      const found = group.leads.find((l) => l.id === selectedId);
      if (found) return found;
    }
    return pickBestMaster(group.leads);
  };

  const handleMergeGroup = async (group: DuplicateGroup) => {
    const master = getMaster(group);
    const duplicates = group.leads.filter((l) => l.id !== master.id);
    const mergedData = mergeLeadData(master, duplicates);
    setMergingGroup(group.id);
    try {
      await onMerge(master.id, duplicates.map((d) => d.id), mergedData);
    } finally {
      setMergingGroup(null);
    }
  };

  const handleMergeAll = async () => {
    setMergingAll(true);
    try {
      for (const group of groups) {
        const master = getMaster(group);
        const duplicates = group.leads.filter((l) => l.id !== master.id);
        const mergedData = mergeLeadData(master, duplicates);
        await onMerge(master.id, duplicates.map((d) => d.id), mergedData);
      }
    } finally {
      setMergingAll(false);
    }
  };

  const matchTypeLabel = (t: 'email' | 'company' | 'both') => {
    if (t === 'email') return { text: 'Email', icon: <Mail className="h-3 w-3" /> };
    if (t === 'company')
      return { text: 'Naziv', icon: <Building2 className="h-3 w-3" /> };
    return { text: 'Email + Naziv', icon: <GitMerge className="h-3 w-3" /> };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Pronađi i spoji duplikate
          </DialogTitle>
          <DialogDescription>
            Pronađeno {groups.length} {groups.length === 1 ? 'grupa' : 'grupa'} duplikata
            ({totalDuplicates} {totalDuplicates === 1 ? 'duplikat' : 'duplikata'} za brisanje).
            Master zapis će zadržati objedinjene podatke, ostali se brišu.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="both">Oboje</TabsTrigger>
            <TabsTrigger value="email">Po emailu</TabsTrigger>
            <TabsTrigger value="company">Po nazivu firme</TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          {groups.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <GitMerge className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nema pronađenih duplikata za odabrani način usporedbe.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {groups.map((group) => {
                const master = getMaster(group);
                const labelInfo = matchTypeLabel(group.matchType);
                const isMerging = mergingGroup === group.id;
                return (
                  <Card key={group.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {labelInfo.icon}
                            {labelInfo.text}
                          </Badge>
                          <span className="text-sm font-medium">
                            {group.leads.length} leadova
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleMergeGroup(group)}
                          disabled={isMerging || mergingAll}
                        >
                          {isMerging ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <GitMerge className="h-4 w-4 mr-1" />
                          )}
                          Spoji grupu
                        </Button>
                      </div>

                      <RadioGroup
                        value={String(master.id)}
                        onValueChange={(val) =>
                          setSelectedMasters((prev) => ({
                            ...prev,
                            [group.id]: Number(val),
                          }))
                        }
                      >
                        <div className="space-y-2">
                          {group.leads.map((lead) => {
                            const isMaster = lead.id === master.id;
                            return (
                              <div
                                key={lead.id}
                                className={`flex items-start gap-3 p-3 rounded-md border ${
                                  isMaster ? 'border-primary bg-primary/5' : 'border-border'
                                }`}
                              >
                                <RadioGroupItem
                                  value={String(lead.id)}
                                  id={`${group.id}-${lead.id}`}
                                  className="mt-1"
                                />
                                <Label
                                  htmlFor={`${group.id}-${lead.id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{lead.company}</span>
                                    {isMaster && (
                                      <Badge variant="default" className="text-xs">
                                        Master
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {lead.status}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    {lead.email && (
                                      <span>📧 {lead.email}</span>
                                    )}
                                    {lead.phone && (
                                      <span>📞 {lead.phone}</span>
                                    )}
                                    {lead.location && (
                                      <span>📍 {lead.location}</span>
                                    )}
                                    {lead.dateAdded && (
                                      <span>📅 {lead.dateAdded}</span>
                                    )}
                                    {lead.industry && (
                                      <span>🏷️ {lead.industry}</span>
                                    )}
                                    {lead.website && (
                                      <span className="truncate">🌐 {lead.website}</span>
                                    )}
                                  </div>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zatvori
          </Button>
          {groups.length > 0 && (
            <Button
              onClick={handleMergeAll}
              disabled={mergingAll || mergingGroup !== null}
            >
              {mergingAll ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <GitMerge className="h-4 w-4 mr-1" />
              )}
              Spoji sve grupe ({groups.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateFinderDialog;
