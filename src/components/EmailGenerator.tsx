import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Send, Sparkles, Trash2, Users, Settings, Edit3, Eye, Building2 } from 'lucide-react';
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

interface EmailGeneratorProps {
  preSelectedEmail?: string;
  preSelectedCompany?: string;
}

const EmailGenerator = ({ preSelectedEmail, preSelectedCompany }: EmailGeneratorProps) => {
  const { t } = useLanguage();

  // Load saved form data from localStorage
  const [savedFormData, setSavedFormData] = useLocalStorage('emailGeneratorForm', {
    recipient: '',
    selectedCompany: '',
    subject: '',
    emailContent: '',
    template: ''
  });

  const [recipient, setRecipient] = useState(preSelectedEmail || savedFormData.recipient || '');
  const [selectedCompany, setSelectedCompany] = useState(preSelectedCompany || savedFormData.selectedCompany || '');
  const [subject, setSubject] = useState(savedFormData.subject || '');
  const [emailContent, setEmailContent] = useState(savedFormData.emailContent || '');
  const [template, setTemplate] = useState(savedFormData.template || '');
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [selectedEmailForView, setSelectedEmailForView] = useState<Email | null>(null);
  
  // Save form data to localStorage whenever fields change
  useEffect(() => {
    setSavedFormData({
      recipient,
      selectedCompany,
      subject,
      emailContent,
      template
    });
  }, [recipient, selectedCompany, subject, emailContent, template, setSavedFormData]);

  // Override with pre-selected values when they change
  useEffect(() => {
    if (preSelectedEmail) setRecipient(preSelectedEmail);
    if (preSelectedCompany) setSelectedCompany(preSelectedCompany);
  }, [preSelectedEmail, preSelectedCompany]);

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

  const { leads } = useLeadManagement();
  const [discoveredLeads] = useLocalStorage<any[]>('discoveredLeads', []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();
  const { generateEmail } = useIntegratedEmailService();
  const { aiSettings, isAIConfigured } = useAISettings();
  const { profiles, selectedProfile, selectedProfileId, setSelectedProfileId } = useBusinessProfile();
  const { triggerWebhook } = useMakeIntegration();

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

    // Check validation based on generation type
    if (generationType === 'recipient' && !recipient) {
      toast({
        title: "Primatelj potreban",
        description: "Molimo odaberite ili unesite email primatelja.",
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
    
    try {
      let industry = 'općenito';
      let recipientCompany = 'tvrtka';
      let recipientEmail = recipient || 'primatelj@tvrtka.hr';
      let additionalContext = '';

      if (generationType === 'industry') {
        // Generate by industry
        const industryLabel = industries.find(i => i.value === selectedIndustry)?.label || selectedIndustry;
        industry = industryLabel;
        recipientCompany = `tvrtka u industriji ${industryLabel.toLowerCase()}`;
        additionalContext = `Generiraj generički email za industriju: ${industryLabel}. Email treba biti primjenjiv za različite tvrtke u ovoj industriji.`;
      } else {
        // Generate by recipient
        const allEmails = getAllEmailAddresses();
        const selectedContact = allEmails.find(contact => contact.email === recipient);
        
        // Try to determine industry based on company info
        const companyName = selectedCompany.toLowerCase();
        if (companyName.includes('praon') || companyName.includes('čišć') || companyName.includes('pranj')) {
          industry = 'profesionalne praone rublja';
        }
        
        recipientCompany = selectedCompany || 'tvrtka';
        additionalContext = selectedContact?.source ? `Kontakt pronađen putem: ${selectedContact.source}` : '';
      }

      const result = await generateEmail({
        recipientCompany,
        recipientEmail,
        emailType: template as 'intro' | 'follow-up' | 'proposal' | 'reminder',
        industry,
        profileId: selectedProfileId || undefined,
        additionalContext: additionalContext || undefined,
        companyInfo: generationType === 'recipient' ? {
          location: leads.find(l => l.email === recipient)?.location,
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
      setIsGenerating(false);
    }
  };

  // Helper funkcija za personalizaciju email sadržaja
  const personalizeContent = (content: string, companyName: string, recipientEmail: string): string => {
    let personalizedContent = content;
    
    // Zamijeni sve moguće varijante placeholdera
    personalizedContent = personalizedContent.replace(/\{company_name\}/gi, companyName);
    personalizedContent = personalizedContent.replace(/\{company\}/gi, companyName);
    personalizedContent = personalizedContent.replace(/\{recipient\}/gi, companyName);
    personalizedContent = personalizedContent.replace(/\{to\}/gi, companyName);
    personalizedContent = personalizedContent.replace(/\{email\}/gi, recipientEmail);
    
    return personalizedContent;
  };

  // Helper funkcija za konverziju plain text u HTML format
  const convertToHTML = (text: string): string => {
    // Split by double newlines to get paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    // Convert each paragraph: replace single newlines with <br>
    const htmlParagraphs = paragraphs.map(paragraph => {
      const withBreaks = paragraph.replace(/\n/g, '<br>');
      return `    <p style="margin: 0 0 16px 0; line-height: 1.6;">${withBreaks}</p>`;
    });
    
    // Wrap in a professional HTML template
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
${htmlParagraphs.join('')}
  </div>
</body>
</html>`;
  };

  const sendEmail = async () => {
    if (!recipient || !subject || !emailContent) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite primatelja, naslov i sadržaj emaila.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      // Personaliziraj sadržaj prije slanja
      const personalizedContent = personalizeContent(
        emailContent, 
        selectedCompany || recipient.split('@')[0], // Ako nema company_name, koristi dio prije @
        recipient
      );

      // Konvertiraj u HTML format
      const htmlContent = convertToHTML(personalizedContent);

      // Pripremi email podatke za webhook
      const emailData = {
        to_email: recipient,
        subject: subject,
        content: htmlContent, // HTML formatiran sadržaj
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      // Pošalji na Make.com webhook
      const webhookTriggered = await triggerWebhook('sent', emailData);

      if (!webhookTriggered) {
        toast({
          title: "Webhook nije konfiguriran",
          description: "Molimo postavite Email webhook URL u postavkama Make.com integracije.",
          variant: "destructive"
        });
        return;
      }

      // Ažuriraj ili kreiraj email zapis
      if (editingDraftId) {
        setEmails(emails.map(email => 
          email.id === editingDraftId 
            ? { ...email, to: recipient, subject, content: emailContent, status: 'Sent' as const, dateSent: new Date().toISOString().split('T')[0] }
            : email
        ));
        setEditingDraftId(null);
      } else {
        const newEmail: Email = {
          id: Date.now(),
          to: recipient,
          subject,
          content: emailContent,
          template: template || 'custom',
          dateSent: new Date().toISOString().split('T')[0],
          status: 'Sent'
        };
        setEmails([newEmail, ...emails]);
      }
      
      // Reset forma
      const resetData = {
        recipient: '',
        selectedCompany: '',
        subject: '',
        emailContent: '',
        template: ''
      };
      
      setRecipient('');
      setSelectedCompany('');
      setSubject('');
      setEmailContent('');
      setTemplate('');
      setSavedFormData(resetData);

      toast({
        title: "Email poslan na webhook",
        description: `Email podaci su poslani na Make.com za slanje na ${recipient}`,
      });

    } catch (error) {
      console.error('Error triggering email webhook:', error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri slanju email podataka.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const saveDraft = async () => {
    if (!subject || !emailContent) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite naslov i sadržaj za spremanje drafta.",
        variant: "destructive"
      });
      return;
    }

    // Personaliziraj sadržaj prije slanja samo ako postoji primatelj
    const personalizedContent = recipient ? personalizeContent(
      emailContent, 
      selectedCompany || recipient.split('@')[0],
      recipient
    ) : emailContent;

    // Konvertiraj u HTML format
    const htmlContent = convertToHTML(personalizedContent);

    // Pošalji draft podatke na webhook uvijek, čak i bez primatelja
    const draftData = {
      to_email: recipient || '',
      subject: subject,
      content: htmlContent, // HTML formatiran sadržaj
      timestamp: new Date().toISOString(),
      status: 'draft'
    };

    await triggerWebhook('draft', draftData);

    if (editingDraftId) {
      // Update existing draft
      setEmails(emails.map(email => 
        email.id === editingDraftId 
          ? { ...email, to: recipient, subject, content: emailContent, template: template || 'custom' }
          : email
      ));
      toast({
        title: "Draft ažuriran",
        description: "Email draft je uspješno ažuriran i poslan na webhook.",
      });
    } else {
      // Create new draft
      const draft: Email = {
        id: Date.now(),
        to: recipient || 'Bez primatelja',
        subject,
        content: emailContent,
        template: template || 'custom',
        dateSent: new Date().toISOString().split('T')[0],
        status: 'Draft'
      };
      setEmails([draft, ...emails]);
      toast({
        title: "Draft spremljen",
        description: recipient 
          ? "Email draft je uspješno spremljen i poslan na webhook."
          : "Email draft je spremljen. Dodajte primatelja prije slanja.",
      });
    }
  };

  const editDraft = (email: Email) => {
    setRecipient(email.to);
    setSubject(email.subject);
    setEmailContent(email.content);
    setTemplate(email.template);
    setEditingDraftId(email.id);
    
    // Find company name from the email address
    const allEmails = getAllEmailAddresses();
    const contact = allEmails.find(c => c.email === email.to);
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
    // Reset form
    const resetData = {
      recipient: '',
      selectedCompany: '',
      subject: '',
      emailContent: '',
      template: ''
    };
    
    setRecipient('');
    setSelectedCompany('');
    setSubject('');
    setEmailContent('');
    setTemplate('');
    setSavedFormData(resetData);

    toast({
      title: "Uređivanje otkazano",
      description: "Vraćeni ste na čisti obrazac.",
    });
  };

  const deleteEmail = (emailId: number) => {
    setEmails(emails.filter(email => email.id !== emailId));
    
    // If we're editing this draft, cancel the edit
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
    
    const discoveredEmails = discoveredLeads.filter(lead => lead.email).map(lead => ({
      email: lead.email,
      company: lead.name,
      source: 'Lead Discovery'
    }));
    
    const allEmails = [...leadEmails, ...discoveredEmails];
    
    // Remove duplicates based on email address
    const uniqueEmails = allEmails.filter((email, index, self) => 
      index === self.findIndex(e => e.email === email.email)
    );
    
    return uniqueEmails;
  };

  const handleRecipientSelect = (selectedEmail: string) => {
    setRecipient(selectedEmail);
    const allEmails = getAllEmailAddresses();
    const selectedContact = allEmails.find(contact => contact.email === selectedEmail);
    if (selectedContact) {
      setSelectedCompany(selectedContact.company);
    }
  };

  const handleTemplateSelect = (template: any) => {
    // Apply template variables to content
    let processedSubject = template.subject;
    let processedContent = template.content;
    
    // Replace common variables with actual data if available
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
                  setRecipient('');
                  setSelectedCompany('');
                } else {
                  setSelectedIndustry('');
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
                {/* Recipient Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Odaberite primatelja iz leadova
                  </label>
                  <Select value={recipient} onValueChange={handleRecipientSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Odaberite iz postojećih leadova" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-none max-h-60 overflow-y-auto">
                      {getAllEmailAddresses().map((contact, index) => (
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
                  
                  {recipient && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-700 font-medium">Odabrani:</span>
                        <span className="text-blue-600 truncate">{recipient}</span>
                        {selectedCompany && (
                          <>
                            <span className="text-blue-400">•</span>
                            <span className="text-blue-600 truncate">{selectedCompany}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Ili unesite email ručno
                  </label>
                  <Input
                    placeholder="email@tvrtka.hr"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full"
                  />
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
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
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

                {/* Email input for sending industry templates */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Email za slanje <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="email@tvrtka.hr"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-orange-600 font-medium">
                    ⚠️ Email je potreban za slanje ili spremanje drafta
                  </p>
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
              disabled={isGenerating || !isAIConfigured() || 
                (generationType === 'recipient' && !recipient) ||
                (generationType === 'industry' && !selectedIndustry)}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generiranje AI sadržaja...' : 
                generationType === 'industry' ? 'Generiraj Template za Industriju' : 'Generiraj Personalizirani Email'}
            </Button>
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
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                onClick={sendEmail} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSending || !recipient}
                title={!recipient ? 'Unesite email primatelja za slanje' : ''}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Šaljem...' : (editingDraftId ? 'Pošalji Ažurirani Email' : 'Pošalji Email')}
              </Button>
              <Button 
                onClick={saveDraft} 
                variant="outline" 
                className="flex-1 text-sm"
                disabled={!subject || !emailContent}
              >
                {editingDraftId ? 'Ažuriraj Draft' : 'Spremi Draft'}
              </Button>
            </div>
            
            {!recipient && emailContent && (
              <div className="mt-2 text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 Možete spremiti draft bez primatelja i dodati ga kasnije
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
