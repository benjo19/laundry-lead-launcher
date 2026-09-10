import { Lead } from '@/types';

export type LeadStatus = Lead['status'];

export interface LeadStatusMeta {
  value: LeadStatus;
  label: string;
  stage: number;
  pillClass: string;
  dotClass: string;
  isActive: boolean;
  isHot: boolean;
  isWon: boolean;
  isLost: boolean;
}

const STATUS_LIST: LeadStatusMeta[] = [
  { value: 'Nova', label: 'Nova', stage: 1, pillClass: 'bg-status-new/10 text-status-new border border-status-new/30', dotClass: 'bg-status-new', isActive: true, isHot: false, isWon: false, isLost: false },
  { value: 'Kvalificiran', label: 'Kvalificiran', stage: 2, pillClass: 'bg-status-analysis/10 text-status-analysis border border-status-analysis/30', dotClass: 'bg-status-analysis', isActive: true, isHot: false, isWon: false, isLost: false },
  { value: 'Kontaktiran', label: 'Kontaktiran', stage: 3, pillClass: 'bg-status-contacted/10 text-status-contacted border border-status-contacted/30', dotClass: 'bg-status-contacted', isActive: true, isHot: false, isWon: false, isLost: false },
  { value: 'Demo', label: 'Demo', stage: 4, pillClass: 'bg-status-offer-draft/10 text-status-offer-draft border border-status-offer-draft/30', dotClass: 'bg-status-offer-draft', isActive: true, isHot: true, isWon: false, isLost: false },
  { value: 'Trial', label: 'Trial', stage: 5, pillClass: 'bg-status-offer-sent/10 text-status-offer-sent border border-status-offer-sent/30', dotClass: 'bg-status-offer-sent', isActive: true, isHot: true, isWon: false, isLost: false },
  { value: 'Plaća', label: 'Plaća', stage: 6, pillClass: 'bg-status-won/10 text-status-won border border-status-won/30', dotClass: 'bg-status-won', isActive: false, isHot: false, isWon: true, isLost: false },
  { value: 'Sastanak', label: 'Sastanak zakazan', stage: 4, pillClass: 'bg-status-offer-draft/10 text-status-offer-draft border border-status-offer-draft/30', dotClass: 'bg-status-offer-draft', isActive: true, isHot: true, isWon: false, isLost: false },
  { value: 'Ponuda', label: 'Ponuda poslana', stage: 5, pillClass: 'bg-status-offer-sent/10 text-status-offer-sent border border-status-offer-sent/30', dotClass: 'bg-status-offer-sent', isActive: true, isHot: true, isWon: false, isLost: false },
  { value: 'Pregovori', label: 'Pregovori', stage: 6, pillClass: 'bg-status-negotiation/10 text-status-negotiation border border-status-negotiation/30', dotClass: 'bg-status-negotiation', isActive: true, isHot: true, isWon: false, isLost: false },
  { value: 'Dobiveno', label: 'Dobiveno', stage: 7, pillClass: 'bg-status-won/10 text-status-won border border-status-won/30', dotClass: 'bg-status-won', isActive: false, isHot: false, isWon: true, isLost: false },
  { value: 'Izgubljeno', label: 'Izgubljeno', stage: 8, pillClass: 'bg-status-lost/10 text-status-lost border border-status-lost/30', dotClass: 'bg-status-lost', isActive: false, isHot: false, isWon: false, isLost: true },
  { value: 'Zainteresiran', label: 'Zainteresiran', stage: 3, pillClass: 'bg-success/10 text-success border border-success/30', dotClass: 'bg-success', isActive: true, isHot: true, isWon: false, isLost: false },
  { value: 'Odbačen', label: 'Odbačen', stage: 9, pillClass: 'bg-status-lost/10 text-status-lost border border-status-lost/30', dotClass: 'bg-status-lost', isActive: false, isHot: false, isWon: false, isLost: true },
  { value: 'Zatvoren', label: 'Zatvoren', stage: 9, pillClass: 'bg-status-cold/15 text-muted-foreground border border-border', dotClass: 'bg-status-cold', isActive: false, isHot: false, isWon: false, isLost: false },
];

export const LEAD_STATUS_META: Record<LeadStatus, LeadStatusMeta> = STATUS_LIST.reduce(
  (acc, s) => ({ ...acc, [s.value]: s }),
  {} as Record<LeadStatus, LeadStatusMeta>,
);

export const LEAD_STATUS_OPTIONS: LeadStatusMeta[] = [
  LEAD_STATUS_META['Nova'],
  LEAD_STATUS_META['Kvalificiran'],
  LEAD_STATUS_META['Kontaktiran'],
  LEAD_STATUS_META['Demo'],
  LEAD_STATUS_META['Trial'],
  LEAD_STATUS_META['Plaća'],
  LEAD_STATUS_META['Sastanak'],
  LEAD_STATUS_META['Ponuda'],
  LEAD_STATUS_META['Pregovori'],
  LEAD_STATUS_META['Dobiveno'],
  LEAD_STATUS_META['Izgubljeno'],
  LEAD_STATUS_META['Odbačen'],
];

export const getStatusMeta = (status: string | null | undefined): LeadStatusMeta =>
  (status && LEAD_STATUS_META[status as LeadStatus]) || LEAD_STATUS_META['Nova'];

export const POTENTIAL_META: Record<string, { label: string; pillClass: string }> = {
  Visok: { label: 'Visok', pillClass: 'bg-success/10 text-success border border-success/30' },
  Srednji: { label: 'Srednji', pillClass: 'bg-warning/10 text-warning border border-warning/30' },
  Nizak: { label: 'Nizak', pillClass: 'bg-muted text-muted-foreground border border-border' },
};
