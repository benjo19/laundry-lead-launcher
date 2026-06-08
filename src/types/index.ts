
export interface Lead {
  id: number;
  company: string;
  location: string;
  employees: string;
  phone: string;
  email: string;
  website?: string;
  status: 'Nova' | 'Kontaktiran' | 'Zainteresiran' | 'Odbačen' | 'Zatvoren';
  potential: 'Visok' | 'Srednji' | 'Nizak';
  dateAdded: string;
  industry?: string;
  notes?: string;
  country?: string;
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

export interface OfferItem {
  id: string;
  offer_id: string;
  redni_broj: number;
  naziv: string;
  opis?: string;
  kolicina: number;
  jedinica_mjere: string;
  cijena_bez_pdv: number;
  popust: number;
}

export interface Offer {
  id: string;
  user_id: string;
  lead_id?: string;
  broj_ponude: string;
  naslov: string;
  klijent_ime: string;
  klijent_email?: string;
  klijent_adresa?: string;
  klijent_oib?: string;
  status: 'Nacrt' | 'Poslana' | 'Prihvaćena' | 'Odbijena' | 'Istekla';
  datum_ponude: string;
  datum_valjanosti?: string;
  napomena?: string;
  popust_ukupno: number;
  pdv_stopa: number;
  currency: string;
  created_at: string;
  updated_at: string;
  items?: OfferItem[];
}

// Re-export ContentPost from contentTypes
export type { ContentPost, ContentGenerationParams, GeneratedContent } from './contentTypes';
