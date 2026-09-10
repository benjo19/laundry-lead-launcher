import React, { useMemo, useState } from 'react';
import { Search, Phone, MessageCircle, MapPin, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { Lead } from '@/types';

const PARTNER_STATUSES: Array<{ value: Lead['status']; label: string }> = [
  { value: 'Nova', label: 'Novi' },
  { value: 'Kontaktiran', label: 'Kontaktiran' },
  { value: 'Demo', label: 'Demo' },
  { value: 'Trial', label: 'Trial' },
  { value: 'Plaća', label: 'Plaća' },
  { value: 'Izgubljeno', label: 'Izgubljen' },
];

interface PartnerLeadsProps {
  onAddLead: () => void;
}

const PartnerLeads = ({ onAddLead }: PartnerLeadsProps) => {
  const { leads, loading, updateLeadStatus } = useLeadManagement();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (leads ?? []).filter((lead) => {
      const matchesQuery = !q || [lead.company, lead.phone, lead.email, lead.location, lead.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [leads, query, statusFilter]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-24 pt-5 sm:px-6 md:pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Orderly partner</p>
          <h1 className="text-2xl font-bold tracking-tight">Moji leadovi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Samo tvoji lokali i sljedeći prodajni korak.</p>
        </div>
        <Button onClick={onAddLead} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Dodaj lead</span>
          <span className="sm:hidden">Lead</span>
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Traži lokal, grad ili telefon..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            {PARTNER_STATUSES.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">Učitavam leadove...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center">
          <p className="font-medium">Nema leadova</p>
          <p className="mt-1 text-sm text-muted-foreground">Dodaj prvi lokal ili promijeni filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div key={lead.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{lead.company}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {(lead.city || lead.location) && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{lead.city || lead.location}</span>}
                    {lead.phone && <span>{lead.phone}</span>}
                  </div>
                  {lead.notes && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{lead.notes}</p>}
                </div>

                <div className="flex flex-col gap-2 sm:w-[210px]">
                  <Select value={lead.status} onValueChange={(value) => updateLeadStatus(lead.id, value as Lead['status'])}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PARTNER_STATUSES.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm" disabled={!lead.phone}>
                      <a href={lead.phone ? `tel:${lead.phone}` : undefined}><Phone className="mr-1.5 h-4 w-4" />Nazovi</a>
                    </Button>
                    <Button asChild variant="outline" size="sm" disabled={!lead.phone}>
                      <a href={lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, '')}` : undefined} target="_blank" rel="noreferrer"><MessageCircle className="mr-1.5 h-4 w-4" />WhatsApp</a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerLeads;
