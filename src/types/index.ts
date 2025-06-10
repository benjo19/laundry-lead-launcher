
export interface Lead {
  id: number;
  company: string;
  location: string;
  employees: string;
  phone: string;
  email: string;
  status: 'Nova' | 'Kontaktiran' | 'Zainteresiran' | 'Odbačen' | 'Zatvoren';
  potential: 'Visok' | 'Srednji' | 'Nizak';
  dateAdded: string;
  industry?: string;
  notes?: string;
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
}

export interface ContentPost {
  id: number;
  platform: 'LinkedIn' | 'Facebook' | 'Instagram';
  content: string;
  contentType: 'tip' | 'case-study' | 'news' | 'promotional';
  date: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  engagement?: string;
  scheduledTime?: string;
}
