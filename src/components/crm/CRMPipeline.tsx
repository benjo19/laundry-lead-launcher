import React, { useState } from 'react';
import { Lead } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Phone, Mail, Building2, MapPin, ChevronRight,
  User, Star, TrendingUp, Search, SlidersHorizontal
} from 'lucide-react';

const STAGES: { id: Lead['status']; label: string; color: string; bg: string; border: string }[] = [
  { id: 'Nova',          label: 'Nova',          color: 'text-blue-700',  bg: 'bg-blue-50',    border: 'border-blue-200' },
  { id: 'Kontaktiran',   label: 'Kontaktiran',   color: 'text-purple-700',bg: 'bg-purple-50',  border: 'border-purple-200' },
  { id: 'Zainteresiran', label: 'Zainteresiran', color: 'text-yellow-700',bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  { id: 'Zatvoren',      label: 'Zatvoren',      color: 'text-green-700', bg: 'bg-green-50',   border: 'border-green-200' },
  { id: 'Odbačen',       label: 'Odbačen',       color: 'text-red-700',   bg: 'bg-red-50',     border: 'border-red-200' },
];

const potentialColors: Record<string, string> = {
  Visok:  'text-green-600',
  Srednji:'text-yellow-600',
  Nizak:  'text-gray-400',
};

interface LeadCardProps {
  lead: Lead;
  onMove: (id: number, status: Lead['status']) => void;
  stages: typeof STAGES;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onMove, stages }) => {
  const [open, setOpen] = useState(false);
  const currentIdx = stages.findIndex(s => s.id === lead.status);
  const nextStage = stages[currentIdx + 1];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-3 space-y-2 cursor-pointer" onClick={() => setOpen(o => !o)}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 text-sm truncate">{lead.company}</div>
            {lead.industry && <div className="text-xs text-gray-500 truncate">{lead.industry}</div>}
          </div>
        </div>
        <Star className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${potentialColors[lead.potential]}`} fill="currentColor" />
      </div>

      {lead.location && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3" /> {lead.location}
        </div>
      )}

      {open && (
        <div className="pt-2 border-t space-y-1.5 text-xs text-gray-600">
          {lead.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</div>}
          {lead.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</div>}
          {lead.notes && <div className="text-gray-500 italic mt-1 line-clamp-2">{lead.notes}</div>}
          <div className="flex gap-1 pt-1 flex-wrap">
            {stages.filter((_, i) => i !== stages.findIndex(s => s.id === lead.status)).map(s => (
              <button
                key={s.id}
                onClick={e => { e.stopPropagation(); onMove(lead.id, s.id); }}
                className={`px-2 py-0.5 rounded text-xs font-medium border ${s.bg} ${s.color} ${s.border} hover:opacity-80 transition`}
              >
                → {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!open && nextStage && (
        <button
          onClick={e => { e.stopPropagation(); onMove(lead.id, nextStage.id); }}
          className={`w-full flex items-center justify-center gap-1 text-xs py-1 rounded border font-medium ${nextStage.bg} ${nextStage.color} ${nextStage.border} hover:opacity-80 transition`}
        >
          <ChevronRight className="w-3 h-3" /> {nextStage.label}
        </button>
      )}
    </div>
  );
};

const CRMPipeline: React.FC = () => {
  const { leads, updateLead } = useLeadManagement();
  const [search, setSearch] = useState('');

  const handleMove = async (id: number, status: Lead['status']) => {
    await updateLead(id, { status });
  };

  const filtered = leads.filter(l =>
    !search ||
    l.company.toLowerCase().includes(search.toLowerCase()) ||
    (l.location || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.industry || '').toLowerCase().includes(search.toLowerCase())
  );

  const byStage = (stageId: Lead['status']) => filtered.filter(l => l.status === stageId);

  const totalValue = leads.filter(l => l.status === 'Zatvoren').length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">CRM Pipeline</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Povucite karte ili koristite gumbe za premještanje leadova kroz faze
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 w-60"
              placeholder="Pretraži..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="flex gap-3 flex-wrap text-sm text-gray-600">
        {STAGES.map(s => {
          const count = byStage(s.id).length;
          return (
            <span key={s.id} className={`px-3 py-1 rounded-full border font-medium ${s.bg} ${s.color} ${s.border}`}>
              {s.label}: {count}
            </span>
          );
        })}
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => {
            const stageLeads = byStage(stage.id);
            return (
              <div key={stage.id} className={`w-64 rounded-xl border ${stage.border} ${stage.bg} flex flex-col`}>
                <div className={`px-4 py-3 border-b ${stage.border} flex items-center justify-between`}>
                  <span className={`font-semibold text-sm ${stage.color}`}>{stage.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white border ${stage.border} ${stage.color}`}>
                    {stageLeads.length}
                  </span>
                </div>
                <div className="p-3 space-y-2 flex-1 min-h-[200px]">
                  {stageLeads.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-6">Nema leadova</div>
                  ) : (
                    stageLeads.map(lead => (
                      <LeadCard key={lead.id} lead={lead} onMove={handleMove} stages={STAGES} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CRMPipeline;
