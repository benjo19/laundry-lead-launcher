export interface Lead {
  id: number;
  uuid?: string;
  company: string;
  location: string;
  employees: string;
  phone: string;
  email: string;
  website?: string;
  status:
    | 'Nova'
    | 'Kvalificiran'
    | 'Kontaktiran'
    | 'Odgovorio'
    | 'Demo'
    | 'Trial'
    | 'Plaća'
    | 'Sastanak'
    | 'Ponuda'
    | 'Pregovori'
    | 'Dobiveno'
    | 'Izgubljeno'
    | 'Zainteresiran'
    | 'Odbačen'
    | 'Zatvoren';
  potential: 'Visok' | 'Srednji' | 'Nizak';
  dateAdded: string;
  industry?: string;
  notes?: string;
  country?: string;
  city?: string;
  interested_in?: 'Orderly' | 'AutomindAI' | 'Oprema praone' | string;
  assigned_to?: string;
  user_id?: string;
  next_step?: string;
  next_action_at?: string;
  last_contact_at?: string;
  contact_outcome?: string;
  contact_type?: string;
  locations_count?: number;
  won_locations_count?: number;
  opportunity_value?: number;
  actual_mrr?: number;
  source?: string;
  businessProfileId?: string;
  businessProfileName?: string;
  businessCompanyName?: string;
}

export interface Email {
  id: number;
  to: string;
  subject: string;
  content: string;
  template: string;
  dateSent: string;
  status: 'Draft' | 'Sent' | 'Failed';
  openRate?: string;
  clickRate?: string;
}

export interface Reminder {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  priority: 'Visok' | 'Srednji' | 'Nizak';
  status: 'Aktivan' | 'Završen' | 'Odgođen';
  company: string;
  leadId?: number;
  calendarEventId?: string;
}

export type { ContentPost, ContentGenerationParams, GeneratedContent } from './contentTypes';
