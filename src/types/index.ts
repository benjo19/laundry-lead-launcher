
export interface Lead {
  id: number;
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
    | 'Sastanak'
    | 'Ponuda'
    | 'Pregovori'
    | 'Dobiveno'
    | 'Izgubljeno'
    // Legacy values kept for backwards-compat with existing Supabase rows
    | 'Zainteresiran'
    | 'Odbačen'
    | 'Zatvoren';
  potential: 'Visok' | 'Srednji' | 'Nizak';
  dateAdded: string;
  industry?: string;
  notes?: string;
  country?: string;
  city?: string;
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

// Re-export ContentPost from contentTypes
export type { ContentPost, ContentGenerationParams, GeneratedContent } from './contentTypes';
