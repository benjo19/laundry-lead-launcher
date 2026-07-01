import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Send, Sparkles, Trash2, Users, Settings, Edit3, Eye, Building2, X, Plus, UserPlus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLeadManagement } from '@/hooks/useLeadManagement';
import { Email, Lead } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIntegratedEmailService } from '@/hooks/useIntegratedEmailService';
import { useAISettings } from '@/hooks/useAISettings';
import { useMakeIntegration } from '@/hooks/useMakeIntegration';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import TemplateBuilder from '@/components/email-generator/TemplateBuilder';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { supabase } from '@/integrations/supabase/client';

// Fiksna "primary" adresa na koju ide TO polje. Svi stvarni primatelji idu u BCC
// tako da se ne vide međusobno, a AI se generira samo jednom.
const PRIMARY_TO_EMAIL = 'auto.mind.ai2025@gmail.com';

// Splita input po zarezu, točka-zarezu, novom redu ili razmaku, validira i dedupira.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const parseEmails = (input: string): { valid: string[]; invalid: string[] } => {
  const tokens = (input || '').split(/[\s,;]+/).map(t => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const t of tokens) {
    const lc = t.toLowerCase();
    if (seen.has(lc)) continue;
    seen.add(lc);
    if (EMAIL_REGEX.test(lc)) valid.push(lc);
    else invalid.push(t);
  }
  return { valid, invalid };
};

const generateIdempotencyKey = (prefix: string) => {
  const rand =
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`;
};

interface EmailGeneratorProps {
  preSelectedEmail?: string;
  preSelectedCompany?: string;
}


const EmailGenerator = ({ preSelectedEmail, preSelectedCompany }: EmailGeneratorProps) => {
  const { t } = useLanguage();

  // Load saved form data from localStorage
  const [savedFormData, setSavedFormData] = useLocalStorage('emailGeneratorForm', {
    recipients: [] as string[],
    selectedCompany: '',
    subject: '',
    emailContent: '',
    template: ''
  });

  const [recipients, setRecipients] = useState<string[]>(
    preSelectedEmail ? [preSelectedEmail] : (savedFormData.recipients || [])
  );
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(preSelectedCompany || savedFormData.selectedCompany || '');
  const [subject, setSubject] = useState(savedFormData.subject || '');
  const [emailContent, setEmailContent] = useState(savedFormData.emailContent || '');
  const [template, setTemplate] = useState(savedFormData.template || '');
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [selectedEmailForView, setSelectedEmailForView] = useState<Email | null>(null);
  
  // Bulk send progress
  const [bulkSendProgress, setBulkSendProgress] = useState(0);
  const [bulkSendTotal, setBulkSendTotal] = useState(0);
  const [isBulkSending, setIsBulkSending] = useState(false);

  // Per-recipient send status (pending / success / fail) shown in UI after webhook response
  type SendStatus = 'pending' | 'success' | 'fail';
  const [sendStatuses, setSendStatuses] = useState<Record<string, SendStatus>>({});
  const [lastSendError, setLastSendError] = useState<string | null>(null);
  const [lastSendCompletedAt, setLastSendCompletedAt] = useState<Date | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  // Save form data to localStorage with 500ms debounce, ne na svaki keystroke
  useEffect(() => {
    const handle = setTimeout(() => {
      setSavedFormData({
        recipients,
        selectedCompany,
        subject,
        emailContent,
        template
      });
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipients, selectedCompany, subject, emailContent, template]);

  // Override with pre-selected values when they change (clicking "Kontakt" on a lead)
  useEffect(() => {
    if (preSelectedEmail && !recipients.includes(preSelectedEmail)) {
      setRecipients(prev => [...prev, preSelectedEmail]);
    }
    if (preSelectedCompany) setSelectedCompany(preSelectedCompany);
    // Auto-pripremi: ako još nije izabran template, postavi 'intro' da korisnik može odmah generirati
    if (preSelectedEmail && !template) {
      setTemplate('intro');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedEmail, preSelectedCompany]);

  // Backfill: when leads load, mark any 'Nova' lead whose email already received a sent email as 'Kontaktiran'
  const [hasBackfilled, setHasBackfilled] = useState(false);

  const [emails, setEmails] = useLocalStorage<Email[]>('emails', [
    {
      id: 1,
      to: 'praonica-split@email.hr',
      subject: 'Uvodna prezentacija Marketing Agent',
      content: 'Poštovani, nadamo se da ste dobro...',
      template: 'intro',
      dateSent: '2024-02-13',
      status: 'Sent',
      openRate: '65%',
      clickRate: '12%'
    },
    {
      id: 2,
      to: 'cistoca-zagreb@email.hr',
      subject: 'Follow-up našeg razgovora',
      content: 'Poštovani, u nastavku našeg razgovora...',
      template: 'follow-up',
      dateSent: '2024-02-12',
      status: 'Sent',
      openRate: '45%',
      clickRate: '8%'
    },
    {
      id: 3,
      to: 'bijelo-rublje@email.hr',
      subject: 'Poslovni prijedlog suradnje',
      content: 'Poštovani, s obzirom na Vaše potrebe...',
      template: 'proposal',
      dateSent: '2024-02-11',
      status: 'Sent',
      openRate: '78%',
      clickRate: '23%'
    }
  ]);

  const { leads, updateLeadStatus } = useLeadManagement();
  const [discoveredLeads] = useLocalStorage<any[]>('discoveredLeads', []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();
  const { generateEmail } = useIntegratedEmailService();
  const { aiSettings, isAIConfigured } = useAISettings();
  const { profiles, selectedProfile, selectedProfileId, setSelectedProfileId } = useBusinessProfile();
  const { triggerWebhook } = useMakeIntegration();

  // Auto-detect equipment sale flow from selected business profile (e.g. Brentareno / praonice rublja)
  const isEquipmentSale = (() => {
    if (!selectedProfile) return false;
    const haystack = `${selectedProfile.name || ''} ${selectedProfile.company_name || ''} ${selectedProfile.industry || ''}`.toLowerCase();
    return /brentareno|oprema za pran|praonic|laundry equipment/.test(haystack);
  })();

  // Backfill efekt: ne blokira UI — koristi requestIdleCallback i ograničava obim.
  useEffect(() => {
    if (hasBackfilled) return;
    if (!leads || leads.length === 0) return;
    if (leads.length > 1000) {
      // Preskoči backfill za jako velike baze — preskupo bi bilo na svakom mountu
      setHasBackfilled(true);
      return;
    }

    let cancelled = false;
    const ric: (cb: () => void) => number =
      (window as any).requestIdleCallback || ((cb: () => void) => window.setTimeout(cb, 200));
    const cic: (id: number) => void =
      (window as any).cancelIdleCallback || window.clearTimeout;

    const handle = ric(async () => {
      try {
        const { data: sentEmails, error } = await supabase
          .from('emails')
          .select('to_email')
          .eq('status', 'Sent')
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) {
          console.error('Backfill: failed to fetch sent emails', error);
          return;
        }
        if (cancelled) return;

        const sentSet = new Set(
          (sentEmails || [])
            .flatMap(e => (e.to_email || '').split(/[,;]/))
            .map(s => s.trim().toLowerCase())
            .filter(Boolean)
        );

        if (sentSet.size === 0) return;

        const candidates = leads.filter(
          l => l.status === 'Nova' && l.email && sentSet.has(l.email.trim().toLowerCase())
        );

        if (candidates.length === 0) return;

        console.log(`📬 Backfill: updating ${candidates.length} lead(s) Nova → Kontaktiran`);
        // Paralelno, ne sekvencijalno
        await Promise.allSettled(
          candidates.map(lead => updateLeadStatus(lead.id, 'Kontaktiran'))
        );
        if (!cancelled) {
          toast({
            title: 'Statusi sinkronizirani',
            description: `${candidates.length} lead(ova) automatski označeno kao Kontaktiran (već primili email).`,
          });
        }
      } finally {
        if (!cancelled) setHasBackfilled(true);
      }
    });

    return () => {
      cancelled = true;
      cic(handle);
    };
  }, [leads, hasBackfilled, updateLeadStatus, toast]);

  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [generationType, setGenerationType] = useState<'recipient' | 'industry'>('recipient');

  const templates = [
    { value: 'intro', label: 'Uvodna prezentacija' },
    { value: 'follow-up', label: 'Follow-up email' },
    { value: 'proposal', label: 'Poslovni prijedlog' },
    { value: 'reminder', label: 'Podsjetnik' },
  ];

  const industries = [
    { value: 'opcenito', label: 'Sve industrije / Općenito' },
    { value: 'praone', label: 'Profesionalne praone rublja' },
    { value: 'restorani', label: 'Restorani i ugostiteljstvo' },
    { value: 'hoteli', label: 'Hoteli i smještaj' },
    { value: 'trgovina', label: 'Maloprodaja i trgovina' },
    { value: 'proizvodnaja', label: 'Proizvodnja' },
    { value: 'zdravstvo', label: 'Zdravstvo i njega' },
    { value: 'ljepota', label: 'Ljepota i wellness' },
    { value: 'gradevina', label: 'Građevinarstvo' },
    { value: 'edukacija', label: 'Edukacija i obuka' },
    { value: 'it', label: 'IT i tehnologija' },
    { value: 'transport', label: 'Transport i logistika' },
    { value: 'nekretnine', label: 'Nekretnine' },
  ];

  const generateEmailContent = async () => {
    if (!template) {
      toast({
        title: "Greška",
        description: "Molimo odaberite predložak prije generiranja emaila.",
        variant: "destructive"
      });
      return;
    }

    if (generationType === 'industry' && !selectedIndustry) {
      toast({
        title: "Industrija potrebna",
        description: "Molimo odaberite industriju za generiranje emaila.",
        variant: "destructive"
      });
      return;
    }

    if (!isAIConfigured()) {
      toast({
        title: "AI nije konfiguriran",
        description: "Molimo postavite AI postavke u Postavkama prije generiranja emaila.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    // Safety net: forsiraj otključavanje gumba nakon 60s, čak i ako poziv nikad ne resolve-a
    const safetyTimer = window.setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Generiranje predugo traje",
        description: "Otključao sam gumb. Pokušajte ponovno — ako se ponovi, osvježite stranicu.",
        variant: "destructive",
      });
    }, 60000);
    
    try {
      let industry = 'općenito';
      let recipientCompany = 'tvrtka';
      let recipientEmail = recipients[0] || 'primatelj@tvrtka.hr';
      let additionalContext = '';

      if (generationType === 'industry') {
        const industryLabel = industries.find(i => i.value === selectedIndustry)?.label || selectedIndustry;
        industry = industryLabel;
        recipientCompany = `tvrtka u industriji ${industryLabel.toLowerCase()}`;
        additionalContext = `Generiraj generički email za industriju: ${industryLabel}. Email treba biti primjenjiv za različite tvrtke u ovoj industriji.`;
      } else {
        const allEmails = getAllEmailAddresses();
        const selectedContact = allEmails.find(contact => contact.email === recipients[0]);
        const recipientData = recipients[0] ? getRecipientWebhookData(recipients[0]) : null;
        const resolvedCompanyName = recipientData?.client_company_name || selectedCompany || '';
        const companyName = resolvedCompanyName.toLowerCase();

        if (companyName.includes('praon') || companyName.includes('čišć') || companyName.includes('pranj')) {
          industry = 'profesionalne praone rublja';
        }
        
        recipientCompany = resolvedCompanyName || 'tvrtka';
        additionalContext = selectedContact?.source ? `Kontakt pronađen putem: ${selectedContact.source}` : '';
        
        if (recipients.length > 1) {
          additionalContext += ` Generiraj generički email koji će biti poslan na ${recipients.length} primatelja. Email treba biti primjenjiv za sve primatelje.`;
        }
      }

      const result = await generateEmail({
        recipientCompany,
        recipientEmail,
        emailType: template as 'intro' | 'follow-up' | 'proposal' | 'reminder',
        industry,
        profileId: selectedProfileId || undefined,
        additionalContext: additionalContext || undefined,
        companyInfo: generationType === 'recipient' ? {
          location: leads.find(l => l.email === recipients[0])?.location,
        } : undefined,
      });

      if (result) {
        setSubject(result.subject);
        setEmailContent(result.content);
        
        if (generationType === 'industry') {
          toast({
            title: "Email generiran za industriju",
            description: `Generički email za ${industries.find(i => i.value === selectedIndustry)?.label} je spreman.`,
          });
        }
      }
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      window.clearTimeout(safetyTimer);
      setIsGenerating(false);
    }
  };

  // Helper funkcija za personalizaciju email sadržaja
  const personalizeContent = (content: string, companyName: string, recipientEmail: string): string => {
    let personalizedContent = content;
    personalizedContent = personalizedContent.replace(/\{company_name\}/gi, companyName);
    personalizedContent = personalizedContent.replace(/\{company\}/gi, companyName);
    personalizedContent = personalizedContent.replace(/\{recipient\}/gi, companyName);
    personalizedContent = personalizedContent.replace(/\{to\}/gi, companyName);
    personalizedContent = personalizedContent.replace(/\{email\}/gi, recipientEmail);
    return personalizedContent;
  };

  // Helper funkcija za konverziju plain text u HTML format
  const convertToHTML = (text: string): string => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    const htmlParagraphs = paragraphs.map(paragraph => {
      const withBreaks = paragraph.replace(/\n/g, '<br>');
      return `<p>${withBreaks}</p>`;
    });
    return htmlParagraphs.join('');
  };

  const formatEmailIdentifier = (value: string) =>
    value
      .replace(/@.*$/, '')
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, char => char.toUpperCase());

  const getRecipientWebhookData = (recipientEmail: string) => {
    const normalizedEmail = recipientEmail.trim().toLowerCase();
    const leadFromDB = leads.find(lead => lead.email?.trim().toLowerCase() === normalizedEmail);
    const leadFromDiscovery = discoveredLeads.find((lead: any) => lead.email?.trim().toLowerCase() === normalizedEmail);
    const [localPart = '', domainPart = ''] = normalizedEmail.split('@');
    const domainName = domainPart.split('.')[0] || '';
    const commonEmailProviders = new Set(['gmail', 'outlook', 'hotmail', 'yahoo', 'icloud', 'protonmail', 'aol', 'live']);
    const inferredCompanyFromEmail = !commonEmailProviders.has(domainName) && domainName
      ? formatEmailIdentifier(domainName)
      : formatEmailIdentifier(localPart);
    const inferredClientName = /[._-]/.test(localPart)
      ? formatEmailIdentifier(localPart)
      : undefined;

    const clientCompanyName =
      leadFromDB?.company ||
      leadFromDiscovery?.name ||
      selectedCompany ||
      inferredCompanyFromEmail;

    const clientName =
      leadFromDiscovery?.contact_name ||
      leadFromDiscovery?.contactName ||
      leadFromDiscovery?.ownerName ||
      leadFromDiscovery?.personName ||
      leadFromDiscovery?.full_name ||
      leadFromDiscovery?.fullName ||
      inferredClientName;

    return {
      to_email: recipientEmail,
      company: clientCompanyName,
      client_company_name: clientCompanyName,
      ...(clientName && { client_name: clientName })
    };
  };

  const sendEmail = async () => {
    if (recipients.length === 0 || !subject || !emailContent) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo dodajte barem jednog primatelja, naslov i sadržaj emaila.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    setIsBulkSending(recipients.length > 1);
    setBulkSendTotal(recipients.length);
    setBulkSendProgress(0);
    setLastSendError(null);
    setLastSendCompletedAt(null);
    // Inicijaliziraj sve primatelje kao 'pending' dok webhook ne odgovori
    setSendStatuses(
      recipients.reduce((acc, r) => {
        acc[r] = 'pending';
        return acc;
      }, {} as Record<string, SendStatus>)
    );

    try {
      let successCount = 0;
      let failCount = 0;

      const { valid: cleanRecipients } = parseEmails(recipients.join(','));
      if (cleanRecipients.length === 0) {
        toast({
          title: "Nema valjanih primatelja",
          description: "Molimo dodajte barem jednu valjanu email adresu.",
          variant: "destructive",
        });
        setIsSending(false);
        setIsBulkSending(false);
        return;
      }

      const bulkPayload = {
        subject: subject,
        content: convertToHTML(emailContent),
        company_name: selectedProfile?.name || '',
        to_email: PRIMARY_TO_EMAIL,
        to_emails_list: cleanRecipients,
        bcc_emails: cleanRecipients.join(', '),
        ...(isEquipmentSale && { is_equipment_sale: true }),
        idempotency_key: generateIdempotencyKey('sent'),
      };

      console.log('📤 Final webhook payload (sent):', {
        event_type: 'sent',
        data: bulkPayload,
        idempotency_key: bulkPayload.idempotency_key,
      });

      const webhookTriggered = await triggerWebhook('sent', bulkPayload);


      if (!webhookTriggered) {
        // Označi sve kao neuspjeh u UI-u
        setSendStatuses(prev => {
          const next = { ...prev };
          recipients.forEach(r => { next[r] = 'fail'; });
          return next;
        });
        setLastSendError('Webhook nije konfiguriran ili je vratio grešku.');
        setLastSendCompletedAt(new Date());
        toast({
          title: "Webhook nije konfiguriran",
          description: "Molimo postavite Email webhook URL u postavkama Make.com integracije.",
          variant: "destructive"
        });
        setIsSending(false);
        setIsBulkSending(false);
        return;
      }

      // Webhook je primljen → svi primatelji su uspješno predani na slanje
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        setSendStatuses(prev => ({ ...prev, [recipient]: 'success' }));
        successCount++;
        setBulkSendProgress(i + 1);
      }
      setLastSendCompletedAt(new Date());

      const newEmails: Email[] = recipients.map(r => ({
        id: Date.now() + Math.random(),
        to: r,
        subject,
        content: emailContent,
        template: template || 'custom',
        dateSent: new Date().toISOString().split('T')[0],
        status: 'Sent' as const
      }));

      if (editingDraftId) {
        setEmails(prev => prev.filter(e => e.id !== editingDraftId).concat(newEmails));
        setEditingDraftId(null);
      } else {
        setEmails(prev => [...newEmails, ...prev]);
      }
      
      // Auto-update lead status: poslan e-mail → 'Ponuda' (Ponuda poslana)
      // Promoviramo samo statuse ranije u funnelu — nikad ne degradiramo Sastanak/Pregovori/Dobiveno/Izgubljeno.
      const recipientEmails = new Set(recipients.map(r => r.trim().toLowerCase()));
      const promotableSentStatuses = new Set(['Nova', 'Kvalificiran', 'Kontaktiran', 'Zainteresiran']);
      const leadsToUpdate = leads.filter(
        l => l.email && recipientEmails.has(l.email.trim().toLowerCase()) && promotableSentStatuses.has(l.status)
      );
      for (const lead of leadsToUpdate) {
        try {
          await updateLeadStatus(lead.id, 'Ponuda');
        } catch (e) {
          console.error('Failed to auto-update lead status:', lead.company, e);
        }
      }

      // Resetira formu, ali zadržava sendStatuses kako bi korisnik vidio rezultate
      resetForm();

      toast({
        title: "Emailovi poslani",
        description: `Uspješno poslano: ${successCount}${failCount > 0 ? `, neuspješno: ${failCount}` : ''} od ${recipients.length} primatelja.${leadsToUpdate.length > 0 ? ` ${leadsToUpdate.length} lead(ova) prebačeno u "Ponuda poslana".` : ''}`,
      });

    } catch (error) {
      console.error('Error triggering email webhook:', error);
      // Sve označi kao fail
      setSendStatuses(prev => {
        const next = { ...prev };
        recipients.forEach(r => { next[r] = 'fail'; });
        return next;
      });
      setLastSendError(error instanceof Error ? error.message : 'Nepoznata greška');
      setLastSendCompletedAt(new Date());
      toast({
        title: "Greška",
        description: "Dogodila se greška pri slanju email podataka.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
      setIsBulkSending(false);
      setBulkSendProgress(0);
      setBulkSendTotal(0);
    }
  };

  const resetForm = () => {
    const resetData = {
      recipients: [] as string[],
      selectedCompany: '',
      subject: '',
      emailContent: '',
      template: ''
    };
    setRecipients([]);
    setManualEmailInput('');
    setSelectedCompany('');
    setSubject('');
    setEmailContent('');
    setTemplate('');
    setSavedFormData(resetData);
  };

  const saveDraft = async () => {
    if (isSavingDraft) {
      // Spriječi dvostruke klikove dok webhook još nije odgovorio
      return;
    }
    if (!subject || !emailContent) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite naslov i sadržaj za spremanje drafta.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingDraft(true);

    const recipientStr = recipients.join(', ') || '';
    const personalizedContent = recipientStr ? personalizeContent(
      emailContent, 
      selectedCompany || (recipients[0]?.split('@')[0] || ''),
      recipients[0] || ''
    ) : emailContent;

    const htmlContent = convertToHTML(personalizedContent);
    const draftRecipients = recipients.map(getRecipientWebhookData);
    const primaryRecipient = draftRecipients[0];

    // Stabilan idempotency key — koristi se za sve interne retry pokušaje istog drafta,
    // pa Make.com (preko Data Store / filter) može dedupirati duplikate.
    const idempotencyKey = `draft-${editingDraftId ?? 'new'}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const draftData = {
      to_email: recipientStr,
      subject: subject,
      content: htmlContent,
      timestamp: new Date().toISOString(),
      status: 'draft',
      idempotency_key: idempotencyKey,
      ...(draftRecipients.length > 0 && {
        recipients: draftRecipients
      }),
      ...(selectedProfile?.name && {
        company_name: selectedProfile.name
      }),
      ...(primaryRecipient?.client_company_name && {
        client_company_name: primaryRecipient.client_company_name
      }),
      ...(primaryRecipient?.client_name && {
        client_name: primaryRecipient.client_name
      }),
      ...(isEquipmentSale && { is_equipment_sale: true }),
    };

    let webhookOk = false;
    // Zajednički AbortController — outer guard od 90s stvarno otkaže fetch,
    // bez pozadinskog ghost POSTa.
    const draftAbort = new AbortController();
    const draftGuard = window.setTimeout(() => draftAbort.abort(), 90000);
    try {
      webhookOk = await triggerWebhook(
        'draft',
        draftData,
        draftAbort.signal
      );
    } catch (err: any) {
      console.error('Draft webhook error:', err);
      const isAbort = err?.name === 'AbortError';
      if (isAbort) {
        toast({
          title: "Webhook predugo odgovara",
          description: "Make.com nije odgovorio ni nakon 3 pokušaja. Draft je spremljen lokalno — provjerite Make.com scenarij.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Greška pri slanju drafta",
          description: (err?.message || 'Nepoznata greška.') + ' Draft je spremljen lokalno.',
          variant: "destructive",
        });
      }
    } finally {
      window.clearTimeout(draftGuard);
      setIsSavingDraft(false);
    }

    // Auto-update lead status: 'Nova' / 'Kvalificiran' -> 'Kontaktiran' za sve primatelje koje smo upravo draftali
    let draftLeadsUpdated = 0;
    if (recipients.length > 0) {
      const recipientEmailsLc = new Set(recipients.map(r => r.trim().toLowerCase()));
      const draftLeadsToUpdate = leads.filter(
        l =>
          l.email &&
          recipientEmailsLc.has(l.email.trim().toLowerCase()) &&
          (l.status === 'Nova' || l.status === 'Kvalificiran')
      );
      for (const lead of draftLeadsToUpdate) {
        try {
          await updateLeadStatus(lead.id, 'Kontaktiran');
          draftLeadsUpdated++;
        } catch (e) {
          console.error('Failed to auto-update lead status on draft:', lead.company, e);
        }
      }
    }



    if (editingDraftId) {
      setEmails(emails.map(email => 
        email.id === editingDraftId 
          ? { ...email, to: recipientStr || 'Bez primatelja', subject, content: emailContent, template: template || 'custom' }
          : email
      ));
      toast({
        title: "Draft ažuriran",
        description:
          (webhookOk
            ? "Draft je ažuriran i poslan na webhook."
            : "Draft je ažuriran lokalno. Webhook nije poslan — provjerite URL i Auto trigger u Postavkama → Integracije.") +
          (draftLeadsUpdated > 0 ? ` Status ažuriran za ${draftLeadsUpdated} lead(ova).` : ''),
        variant: webhookOk ? "default" : "destructive",
      });
    } else {
      const draft: Email = {
        id: Date.now(),
        to: recipientStr || 'Bez primatelja',
        subject,
        content: emailContent,
        template: template || 'custom',
        dateSent: new Date().toISOString().split('T')[0],
        status: 'Draft'
      };
      setEmails([draft, ...emails]);
      toast({
        title: "Draft spremljen",
        description:
          (webhookOk
            ? "Draft je spremljen i poslan na webhook."
            : "Draft je spremljen lokalno. Webhook nije poslan — provjerite URL i Auto trigger u Postavkama → Integracije.") +
          (draftLeadsUpdated > 0 ? ` Status ažuriran za ${draftLeadsUpdated} lead(ova).` : ''),
        variant: webhookOk ? "default" : "destructive",
      });
    }
  };



  const editDraft = (email: Email) => {
    const parsedRecipients = email.to === 'Bez primatelja' ? [] : email.to.split(',').map(e => e.trim()).filter(Boolean);
    setRecipients(parsedRecipients);
    setSubject(email.subject);
    setEmailContent(email.content);
    setTemplate(email.template);
    setEditingDraftId(email.id);
    
    const allEmails = getAllEmailAddresses();
    const contact = allEmails.find(c => parsedRecipients.includes(c.email));
    if (contact) {
      setSelectedCompany(contact.company);
    }

    toast({
      title: "Draft učitan",
      description: "Draft je učitan za uređivanje.",
    });
  };

  const cancelEdit = () => {
    setEditingDraftId(null);
    resetForm();
    toast({
      title: "Uređivanje otkazano",
      description: "Vraćeni ste na čisti obrazac.",
    });
  };

  const deleteEmail = (emailId: number) => {
    setEmails(emails.filter(email => email.id !== emailId));
    if (editingDraftId === emailId) {
      cancelEdit();
    }
    toast({
      title: "Email obrisan",
      description: "Email je uspješno obrisan.",
    });
  };

  const getAllEmailAddresses = () => {
    const leadEmails = leads.filter(lead => lead.email).map(lead => ({
      email: lead.email,
      company: lead.company,
      source: 'Lead Hunter'
    }));
    
    const discoveredEmails = discoveredLeads.filter(lead => lead.email).map((lead: any) => ({
      email: lead.email,
      company: lead.name,
      source: 'Lead Discovery',
      ...(lead.contact_name && { client_name: lead.contact_name }),
      ...(lead.contactName && { client_name: lead.contactName }),
      ...(lead.ownerName && { client_name: lead.ownerName }),
      ...(lead.personName && { client_name: lead.personName }),
      ...(lead.full_name && { client_name: lead.full_name }),
      ...(lead.fullName && { client_name: lead.fullName })
    }));
    
    const allEmails = [...leadEmails, ...discoveredEmails];
    const uniqueEmails = allEmails.filter((email, index, self) => 
      index === self.findIndex(e => e.email === email.email)
    );
    
    return uniqueEmails;
  };

  const addRecipient = (email: string) => {
    const { valid, invalid } = parseEmails(email);
    if (valid.length === 0 && invalid.length > 0) {
      toast({
        title: "Neispravna email adresa",
        description: `Nije prepoznat valjani email: ${invalid.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    setRecipients(prev => {
      const existing = new Set(prev.map(r => r.toLowerCase()));
      const toAdd = valid.filter(v => !existing.has(v));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
    if (invalid.length > 0) {
      toast({
        title: "Neke adrese preskočene",
        description: `Neispravan format: ${invalid.join(', ')}`,
        variant: "destructive",
      });
    }
  };


  const removeRecipient = (email: string) => {
    setRecipients(prev => prev.filter(r => r !== email));
  };

  // Mapiranje EmailGenerator kategorija -> IndustrySelector values iz baze
  const industryMapping: Record<string, string[]> = {
    'praone': ['laundry', 'dry-cleaning', 'industrial-laundry', 'cleaning-service', 'samoposluzna praona'],
    'restorani': ['restaurant', 'fast-food', 'cafe', 'bar', 'catering', 'bakery'],
    'hoteli': ['hotel', 'hostel', 'apartment', 'motel', 'hoteli'],
    'trgovina': ['clothing', 'grocery', 'pharmacy', 'electronics', 'jewelry'],
    'proizvodnaja': ['manufacturing', 'textile-manufacturing', 'food-production', 'metal-manufacturing', 'plastic-manufacturing', 'wood-manufacturing', 'chemical-manufacturing', 'electronics-manufacturing', 'automotive-manufacturing', 'machinery-manufacturing', 'proizvodnja', 'proizvodnja pekara'],
    'zdravstvo': ['general-practice', 'dental', 'veterinary', 'optometry'],
    'ljepota': ['beauty-salon', 'spa', 'barbershop', 'massage'],
    'gradevina': ['plumbing', 'electrical', 'hvac', 'construction'],
    'edukacija': ['kindergarten', 'primary-school', 'language-school', 'tutoring'],
    'it': ['it-services'],
    'nekretnine': ['real-estate', 'property-management'],
    'transport': [],
  };

  const getFilteredEmailAddresses = () => {
    const allEmails = getAllEmailAddresses();
    if (generationType !== 'industry' || !selectedIndustry || selectedIndustry === 'opcenito') {
      return allEmails;
    }
    const mappedValues = industryMapping[selectedIndustry] || [];
    return allEmails.filter(contact => {
      const leadFromDB = leads.find(l => l.email === contact.email);
      const leadFromDiscovery = discoveredLeads.find((l: any) => l.email === contact.email);
      const leadIndustry = (leadFromDB?.industry || leadFromDiscovery?.industry || '').toLowerCase().trim();
      if (!leadIndustry) return false;
      // Check if lead's industry matches any of the mapped values
      return mappedValues.some(mapped => leadIndustry === mapped || leadIndustry.includes(mapped));
    });
  };

  // Statistike za objašnjenje razlike između broja leadova i broja primatelja
  const getRecipientStats = (mode: 'all' | 'industry') => {
    const totalLeads = leads.length;
    const leadsWithoutEmail = leads.filter(l => !l.email || !l.email.trim()).length;
    const leadsWithEmail = totalLeads - leadsWithoutEmail;

    if (mode === 'all') {
      const uniqueEmails = getAllEmailAddresses().length;
      const duplicates = Math.max(0, leadsWithEmail - uniqueEmails);
      return { totalLeads, leadsWithoutEmail, duplicates, uniqueEmails };
    }

    // industry mode
    const filteredCount = getFilteredEmailAddresses().length;
    const allUnique = getAllEmailAddresses().length;
    const notMatchingIndustry = Math.max(0, allUnique - filteredCount);
    const duplicates = Math.max(0, leadsWithEmail - allUnique);
    return { totalLeads, leadsWithoutEmail, duplicates, uniqueEmails: filteredCount, notMatchingIndustry };
  };

  const addAllFromDatabase = () => {
    const filteredEmails = getFilteredEmailAddresses();
    const newRecipients = filteredEmails
      .map(c => c.email)
      .filter(email => !recipients.includes(email));
    
    if (newRecipients.length === 0) {
      const industryLabel = industries.find(i => i.value === selectedIndustry)?.label;
      toast({
        title: "Nema novih adresa",
        description: generationType === 'industry' && selectedIndustry && selectedIndustry !== 'opcenito'
          ? `Nema email adresa za industriju: ${industryLabel}.`
          : "Sve email adrese iz baze su već dodane.",
      });
      return;
    }

    setRecipients(prev => [...prev, ...newRecipients]);
    const industryLabel = industries.find(i => i.value === selectedIndustry)?.label;
    toast({
      title: "Adrese dodane",
      description: generationType === 'industry' && selectedIndustry && selectedIndustry !== 'opcenito'
        ? `Dodano ${newRecipients.length} email adresa za industriju: ${industryLabel}.`
        : `Dodano ${newRecipients.length} email adresa iz baze.`,
    });
  };

  const handleRecipientSelect = (selectedEmail: string) => {
    addRecipient(selectedEmail);
    const allEmails = getAllEmailAddresses();
    const selectedContact = allEmails.find(contact => contact.email === selectedEmail);
    if (selectedContact && !selectedCompany) {
      setSelectedCompany(selectedContact.company);
    }
  };

  const handleManualEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (manualEmailInput.trim()) {
        addRecipient(manualEmailInput);
        setManualEmailInput('');
      }
    }
  };

  const handleTemplateSelect = (template: any) => {
    let processedSubject = template.subject;
    let processedContent = template.content;
    
    const replacements: Record<string, string> = {
      '{{company_name}}': selectedCompany || '{{company_name}}',
      '{{your_name}}': 'Vaše ime',
      '{{your_company}}': 'Vaša tvrtka',
      '{{date}}': new Date().toLocaleDateString('hr-HR'),
    };

    Object.entries(replacements).forEach(([variable, value]) => {
      processedSubject = processedSubject.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      processedContent = processedContent.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    setSubject(processedSubject);
    setEmailContent(processedContent);
    setTemplate(template.category);
    setShowTemplateBuilder(false);

    toast({
      title: "Predložak učitan",
      description: `Predložak "${template.name}" je uspješno učitan.`,
    });
  };

  // Filter emails to show drafts and sent emails separately
  const draftEmails = emails.filter(email => email.status === 'Draft');
  const sentEmails = emails.filter(email => email.status === 'Sent');

  // Available contacts not yet added
  const availableContacts = getAllEmailAddresses().filter(c => !recipients.includes(c.email));

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">Email Generator</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Stvorite personalizirane emailove za Vaše klijente pomoću integrirane AI</p>
          {!isAIConfigured() && (
            <p className="text-xs sm:text-sm text-orange-600 mt-1">
              ⚠️ AI nije konfiguriran - idite u Postavke da postavite API ključ
            </p>
          )}
          {editingDraftId && (
            <p className="text-xs sm:text-sm text-blue-600 mt-1">
              ✏️ Uređujete draft email - možete ga ažurirati ili poslati
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          {editingDraftId && (
            <Button variant="outline" onClick={cancelEdit} className="w-full sm:w-auto text-sm">
              Otkaži uređivanje
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowTemplateBuilder(!showTemplateBuilder)}
            className="w-full sm:w-auto text-sm"
          >
            {showTemplateBuilder ? 'Sakrij' : 'Upravljaj'} predlošcima
          </Button>
          <Link to="/settings" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto text-sm">
              <Settings className="h-4 w-4 mr-2" />
              AI Postavke
            </Button>
          </Link>
        </div>
      </div>

      {/* Template Builder */}
      {showTemplateBuilder && (
        <TemplateBuilder onTemplateSelect={handleTemplateSelect} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Email Settings Card */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Mail className="h-5 w-5 mr-2 text-blue-600 shrink-0" />
              <span className="truncate">Email Postavke</span>
              {editingDraftId && (
                <span className="ml-2 text-xs sm:text-sm text-blue-600 hidden sm:inline">(Uređivanje draft-a)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Business Profile Selection */}
            {profiles.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Poslovni profil
                </label>
                <Select value={selectedProfile?.id || ''} onValueChange={setSelectedProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite profil" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name} - {profile.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProfile && (
                  <p className="text-xs text-slate-500">
                    {selectedProfile.company_name} ({selectedProfile.industry})
                  </p>
                )}
              </div>
            )}

            {/* Generation Type Selection */}
            <div className="space-y-2 bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
              <label className="block text-sm font-medium text-slate-700">
                Način generiranja
              </label>
              <Select value={generationType} onValueChange={(value: 'recipient' | 'industry') => {
                setGenerationType(value);
                if (value === 'industry') {
                  setRecipients([]);
                  setSelectedCompany('');
                } else {
                  setSelectedIndustry('');
                  setRecipients([]);
                }
              }}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Odaberite način" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recipient">📧 Za konkretnog primatelja</SelectItem>
                  <SelectItem value="industry">🏭 Za industriju (generički template)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Fields - Recipient Mode */}
            {generationType === 'recipient' && (
              <>
                {/* Multi-Recipient Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">
                      Primatelji ({recipients.length})
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAllFromDatabase}
                      className="text-xs"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Dodaj sve iz baze ({getAllEmailAddresses().length})
                    </Button>
                  </div>
                  {(() => {
                    const s = getRecipientStats('all');
                    if (s.totalLeads === 0) return null;
                    return (
                      <p className="text-xs text-muted-foreground -mt-1">
                        {s.uniqueEmails} jedinstvenih primatelja od {s.totalLeads} leadova
                        {s.leadsWithoutEmail > 0 && ` • ${s.leadsWithoutEmail} bez emaila`}
                        {s.duplicates > 0 && ` • ${s.duplicates} duplikata spojeno`}
                      </p>
                    );
                  })()}

                  {/* Selected recipients badges */}
                  {recipients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50 rounded-lg border border-blue-200 max-h-32 overflow-y-auto">
                      {recipients.map((email) => {
                        const contact = getAllEmailAddresses().find(c => c.email === email);
                        return (
                          <Badge key={email} variant="secondary" className="flex items-center gap-1 text-xs py-1 px-2">
                            <span className="truncate max-w-[180px]">
                              {contact ? `${contact.company} (${email})` : email}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeRecipient(email)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown to add from leads */}
                  {availableContacts.length > 0 && (
                    <Select value="" onValueChange={handleRecipientSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Odaberite iz postojećih leadova" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-none max-h-60 overflow-y-auto">
                        {availableContacts.map((contact, index) => (
                          <SelectItem key={index} value={contact.email} className="max-w-full p-2">
                            <div className="flex flex-row items-center gap-2 w-full min-w-0">
                              <div className="font-medium text-sm text-slate-900">{contact.company}</div>
                              <div className="text-xs text-slate-500">•</div>
                              <div className="text-xs text-slate-600 truncate">{contact.email}</div>
                              <div className="text-xs text-slate-400 ml-auto shrink-0">({contact.source})</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Manual Email Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Unesite email i pritisnite Enter"
                      value={manualEmailInput}
                      onChange={(e) => setManualEmailInput(e.target.value)}
                      onKeyDown={handleManualEmailKeyDown}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (manualEmailInput.trim()) {
                          addRecipient(manualEmailInput.trim());
                          setManualEmailInput('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Naziv tvrtke (za personalizaciju)
                  </label>
                  <Input
                    placeholder="Naziv tvrtke"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {/* Conditional Fields - Industry Mode */}
            {generationType === 'industry' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Odaberite industriju
                  </label>
                  <Select value={selectedIndustry} onValueChange={(value) => {
                    setSelectedIndustry(value);
                    // Auto-refresh recipients when industry changes
                    if (value && value !== 'opcenito') {
                      const allEmails = getAllEmailAddresses();
                      const mappedValues = industryMapping[value] || [];
                      const filtered = allEmails.filter(contact => {
                        const leadFromDB = leads.find(l => l.email === contact.email);
                        const leadFromDiscovery = discoveredLeads.find((l: any) => l.email === contact.email);
                        const leadIndustry = (leadFromDB?.industry || leadFromDiscovery?.industry || '').toLowerCase().trim();
                        if (!leadIndustry) return false;
                        return mappedValues.some(mapped => leadIndustry === mapped || leadIndustry.includes(mapped));
                      });
                      setRecipients(filtered.map(c => c.email));
                    } else {
                      setRecipients([]);
                    }
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Odaberite industriju" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedIndustry && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-md border border-purple-200">
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span className="text-purple-700 font-medium">Industrija:</span>
                        <span className="text-purple-600">{industries.find(i => i.value === selectedIndustry)?.label}</span>
                      </div>
                      <p className="text-xs text-purple-600">
                        Email će biti generički template primjenjiv za različite tvrtke u ovoj industriji
                      </p>
                    </div>
                  )}
                </div>

                {/* Multi-recipient for industry mode */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">
                      Primatelji za slanje ({recipients.length})
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAllFromDatabase}
                      className="text-xs"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Dodaj sve iz baze ({getFilteredEmailAddresses().length})
                    </Button>
                  </div>
                  {selectedIndustry && selectedIndustry !== 'opcenito' && (() => {
                    const s = getRecipientStats('industry');
                    if (s.totalLeads === 0) return null;
                    return (
                      <p className="text-xs text-muted-foreground -mt-1">
                        {s.uniqueEmails} primatelja za odabranu industriju od {s.totalLeads} leadova
                        {s.leadsWithoutEmail > 0 && ` • ${s.leadsWithoutEmail} bez emaila`}
                        {s.duplicates > 0 && ` • ${s.duplicates} duplikata spojeno`}
                        {s.notMatchingIndustry !== undefined && s.notMatchingIndustry > 0 && ` • ${s.notMatchingIndustry} druge industrije`}
                      </p>
                    );
                  })()}

                  {recipients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-purple-50 rounded-lg border border-purple-200 max-h-32 overflow-y-auto">
                      {recipients.map((email) => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1 text-xs py-1 px-2">
                          <span className="truncate max-w-[180px]">{email}</span>
                          <button type="button" onClick={() => removeRecipient(email)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      placeholder="Unesite email i pritisnite Enter"
                      value={manualEmailInput}
                      onChange={(e) => setManualEmailInput(e.target.value)}
                      onKeyDown={handleManualEmailKeyDown}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (manualEmailInput.trim()) {
                          addRecipient(manualEmailInput.trim());
                          setManualEmailInput('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {recipients.length === 0 && (
                    <p className="text-xs text-orange-600 font-medium">
                      ⚠️ Dodajte primatelje za slanje emaila
                    </p>
                  )}
                </div>

                {/* Company Name for industry mode */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Naziv tvrtke (opcionalno)
                  </label>
                  <Input
                    placeholder="Naziv tvrtke"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {/* Template Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Predložak
              </label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Odaberite predložak" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((temp) => (
                    <SelectItem key={temp.value} value={temp.value}>
                      {temp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Naslov (generirat će se automatski)
              </label>
              <Input
                placeholder="Naslov će biti generiran pomoću AI-a"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generateEmailContent} 
              disabled={isGenerating || !isAIConfigured() || !template ||
                (generationType === 'industry' && !selectedIndustry)}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm"
              title={!template ? 'Odaberite predložak (npr. Uvodni email)' : (generationType === 'industry' && !selectedIndustry ? 'Odaberite industriju' : '')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generiranje AI sadržaja...' : 
                generationType === 'industry' ? 'Generiraj Template za Industriju' : 'Generiraj Personalizirani Email'}
            </Button>
            {!template && (
              <p className="text-xs text-orange-600 font-medium mt-2">
                ⚠️ Odaberite predložak (Predložak ↑) prije generiranja
              </p>
            )}
          </CardContent>
        </Card>

        {/* Email Content Card */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-base sm:text-lg">Sadržaj Emaila</CardTitle>
            {generationType === 'industry' && emailContent && (
              <p className="text-xs text-purple-600 mt-2">
                💡 Ovo je generički template - možete ga kopirati i prilagoditi za pojedine klijente
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Vaš personalizirani email sadržaj će se pojaviti ovdje..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              className="min-h-48 sm:min-h-64 w-full resize-none font-sans leading-relaxed"
              style={{ whiteSpace: 'pre-wrap' }}
            />
            
            {/* Formatted Preview */}
            {emailContent && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                <p className="text-sm font-medium text-slate-700 mb-2">Preview:</p>
                <div 
                  className="text-slate-700 whitespace-pre-wrap font-sans leading-relaxed"
                >
                  {emailContent}
                </div>
              </div>
            )}

            {/* Bulk Send Progress */}
            {isBulkSending && (
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Slanje emailova...</span>
                  <span>{bulkSendProgress} / {bulkSendTotal}</span>
                </div>
                <Progress value={(bulkSendProgress / bulkSendTotal) * 100} className="h-2" />
              </div>
            )}

            {isEquipmentSale && (
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-amber-200 bg-amber-50">
                <span className="text-sm font-medium text-amber-900">
                  🧺 Automatski označeno: Prodaja opreme za pranje (routing u Make.com prema profilu "{selectedProfile?.name}")
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                onClick={sendEmail} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSending || recipients.length === 0}
                title={recipients.length === 0 ? 'Dodajte primatelje za slanje' : ''}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending 
                  ? `Šaljem${bulkSendTotal > 1 ? ` (${bulkSendProgress}/${bulkSendTotal})` : ''}...` 
                  : (editingDraftId 
                    ? 'Pošalji Ažurirani Email' 
                    : `Pošalji Email${recipients.length > 1 ? ` (${recipients.length})` : ''}`
                  )
                }
              </Button>
              <Button 
                onClick={saveDraft} 
                variant="outline" 
                className="flex-1 text-sm"
                disabled={!subject || !emailContent || isSavingDraft}
              >
                {isSavingDraft
                  ? 'Spremam...'
                  : (editingDraftId ? 'Ažuriraj Draft' : 'Spremi Draft')}
              </Button>
            </div>

            {/* Send Status Panel — prikazuje per-recipient status nakon webhook odgovora */}
            {Object.keys(sendStatuses).length > 0 && (
              <div className="mt-3 p-3 rounded-lg border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    Status slanja
                    {lastSendCompletedAt && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        ({lastSendCompletedAt.toLocaleTimeString('hr-HR')})
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSendStatuses({});
                      setLastSendError(null);
                      setLastSendCompletedAt(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Očisti
                  </button>
                </div>

                {/* Sažetak */}
                {(() => {
                  const entries = Object.entries(sendStatuses);
                  const pending = entries.filter(([, s]) => s === 'pending').length;
                  const success = entries.filter(([, s]) => s === 'success').length;
                  const fail = entries.filter(([, s]) => s === 'fail').length;
                  return (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {pending > 0 && (
                        <Badge variant="secondary">⏳ Pending: {pending}</Badge>
                      )}
                      {success > 0 && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">✓ Uspješno: {success}</Badge>
                      )}
                      {fail > 0 && (
                        <Badge variant="destructive">✗ Neuspješno: {fail}</Badge>
                      )}
                    </div>
                  );
                })()}

                {lastSendError && (
                  <p className="text-xs text-destructive">{lastSendError}</p>
                )}

                {/* Lista po primatelju */}
                <div className="max-h-40 overflow-y-auto space-y-1 pt-1">
                  {Object.entries(sendStatuses).map(([recipient, status]) => (
                    <div
                      key={recipient}
                      className="flex items-center justify-between text-xs px-2 py-1 rounded bg-muted/50"
                    >
                      <span className="truncate mr-2 text-foreground">{recipient}</span>
                      {status === 'pending' && (
                        <Badge variant="secondary" className="shrink-0">⏳ Pending</Badge>
                      )}
                      {status === 'success' && (
                        <Badge className="shrink-0 bg-green-600 hover:bg-green-700 text-white">✓ Poslano</Badge>
                      )}
                      {status === 'fail' && (
                        <Badge variant="destructive" className="shrink-0">✗ Greška</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recipients.length === 0 && emailContent && (
              <div className="mt-2 text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 Možete spremiti draft bez primatelja i dodati ih kasnije
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Draft Emails Section */}
      {draftEmails.length > 0 && (
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Edit3 className="h-5 w-5 mr-2 text-orange-600 shrink-0" />
              <span>Draft Emailovi ({draftEmails.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {draftEmails.map((email) => (
                <div key={email.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-100 last:border-0 bg-orange-50 rounded-lg px-4 space-y-3 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900 text-sm truncate">{email.subject}</p>
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 shrink-0">
                        Draft
                      </span>
                      {editingDraftId === email.id && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 shrink-0">
                          Uređuje se
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 truncate">{email.to}</p>
                    <p className="text-xs text-slate-500">Stvoren: {email.dateSent}</p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editDraft(email)}
                      disabled={editingDraftId === email.id}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteEmail(email.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Emails Section */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-base sm:text-lg">Poslani Emailovi ({sentEmails.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sentEmails.map((email) => (
              <div key={email.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-100 last:border-0 space-y-3 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-medium text-slate-900 text-sm truncate">{email.subject}</p>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 shrink-0">
                      Sent
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 truncate">{email.to}</p>
                  {email.openRate && (
                    <p className="text-xs text-slate-500">
                      Open rate: {email.openRate} | Click rate: {email.clickRate}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs text-slate-500">{email.dateSent}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEmailForView(email)}
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteEmail(email.id)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email View Modal */}
      <Dialog open={!!selectedEmailForView} onOpenChange={() => setSelectedEmailForView(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedEmailForView?.subject}
            </DialogTitle>
          </DialogHeader>
          {selectedEmailForView && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-700">Primatelj:</p>
                  <p className="text-slate-600">{selectedEmailForView.to}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Datum slanja:</p>
                  <p className="text-slate-600">{selectedEmailForView.dateSent}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Predložak:</p>
                  <p className="text-slate-600">{selectedEmailForView.template}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Status:</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedEmailForView.status === 'Sent' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedEmailForView.status}
                  </span>
                </div>
              </div>
              
              {selectedEmailForView.openRate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">Open Rate:</p>
                    <p className="text-slate-600">{selectedEmailForView.openRate}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Click Rate:</p>
                    <p className="text-slate-600">{selectedEmailForView.clickRate}</p>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <p className="font-medium text-slate-700 mb-2">Sadržaj emaila:</p>
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <div className="prose prose-sm max-w-none">
                    {selectedEmailForView.content.includes('<p>') ? (
                      <div 
                        className="text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedEmailForView.content }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                        {selectedEmailForView.content}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailGenerator;
