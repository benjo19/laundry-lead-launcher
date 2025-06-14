import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, Sparkles, Trash2, Users, Settings, Edit3 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Email, Lead } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIntegratedEmailService } from '@/hooks/useIntegratedEmailService';
import { useAISettings } from '@/hooks/useAISettings';
import { Link } from 'react-router-dom';
import TemplateBuilder from '@/components/email-generator/TemplateBuilder';

interface EmailGeneratorProps {
  preSelectedEmail?: string;
  preSelectedCompany?: string;
}

const EmailGenerator = ({ preSelectedEmail, preSelectedCompany }: EmailGeneratorProps) => {
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

  const [leads] = useLocalStorage<Lead[]>('leads', []);
  const [discoveredLeads] = useLocalStorage<any[]>('discoveredLeads', []);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const { generateEmail } = useIntegratedEmailService();
  const { aiSettings, isAIConfigured } = useAISettings();

  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);

  const templates = [
    { value: 'intro', label: 'Uvodna prezentacija' },
    { value: 'follow-up', label: 'Follow-up email' },
    { value: 'proposal', label: 'Poslovni prijedlog' },
    { value: 'reminder', label: 'Podsjetnik' },
  ];

  const generateEmailContent = async () => {
    console.log('generateEmailContent called');
    console.log('Current AI settings:', aiSettings);
    console.log('Is AI configured:', isAIConfigured());

    if (!template) {
      toast({
        title: "Greška",
        description: "Molimo odaberite predložak prije generiranja emaila.",
        variant: "destructive"
      });
      return;
    }

    if (!recipient) {
      toast({
        title: "Primatelj potreban",
        description: "Molimo odaberite ili unesite email primatelja.",
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
      // Find additional context about the company
      const allEmails = getAllEmailAddresses();
      const selectedContact = allEmails.find(contact => contact.email === recipient);
      
      // Try to determine industry based on company info
      let industry = 'općenito';
      const companyName = selectedCompany.toLowerCase();
      if (companyName.includes('praon') || companyName.includes('čišć') || companyName.includes('pranj')) {
        industry = 'profesionalne praone rublja';
      }

      console.log('Calling generateEmail with params:', {
        recipientCompany: selectedCompany || 'tvrtka',
        recipientEmail: recipient,
        emailType: template,
        industry,
        additionalContext: selectedContact?.source ? `Kontakt pronađen putem: ${selectedContact.source}` : undefined,
        companyInfo: {
          location: selectedContact ? leads.find(l => l.email === recipient)?.location : undefined,
        }
      });

      const result = await generateEmail({
        recipientCompany: selectedCompany || 'tvrtka',
        recipientEmail: recipient,
        emailType: template as 'intro' | 'follow-up' | 'proposal' | 'reminder',
        industry,
        additionalContext: selectedContact?.source ? `Kontakt pronađen putem: ${selectedContact.source}` : undefined,
        companyInfo: {
          location: selectedContact ? leads.find(l => l.email === recipient)?.location : undefined,
        }
      });

      console.log('generateEmail result:', result);

      if (result) {
        setSubject(result.subject);
        setEmailContent(result.content);
      }
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = () => {
    if (!recipient || !subject || !emailContent) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite primatelja, naslov i sadržaj emaila.",
        variant: "destructive"
      });
      return;
    }

    if (editingDraftId) {
      // Update existing draft to sent
      setEmails(emails.map(email => 
        email.id === editingDraftId 
          ? { ...email, to: recipient, subject, content: emailContent, status: 'Sent' as const, dateSent: new Date().toISOString().split('T')[0] }
          : email
      ));
      setEditingDraftId(null);
    } else {
      // Create new sent email
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
    
    // Reset form and clear saved data
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
      title: "Email poslan",
      description: `Email je uspješno poslan na ${recipient}`,
    });
  };

  const saveDraft = () => {
    if (!recipient || !subject || !emailContent) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite osnovne podatke za spremanje drafta.",
        variant: "destructive"
      });
      return;
    }

    if (editingDraftId) {
      // Update existing draft
      setEmails(emails.map(email => 
        email.id === editingDraftId 
          ? { ...email, to: recipient, subject, content: emailContent, template: template || 'custom' }
          : email
      ));
      toast({
        title: "Draft ažuriran",
        description: "Email draft je uspješno ažuriran.",
      });
    } else {
      // Create new draft
      const draft: Email = {
        id: Date.now(),
        to: recipient,
        subject,
        content: emailContent,
        template: template || 'custom',
        dateSent: new Date().toISOString().split('T')[0],
        status: 'Draft'
      };
      setEmails([draft, ...emails]);
      toast({
        title: "Draft spremljen",
        description: "Email draft je uspješno spremljen.",
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
    
    return [...leadEmails, ...discoveredEmails];
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Email Generator</h2>
          <p className="text-slate-600">Stvorite personalizirane emailove za Vaše klijente pomoću integrirane AI</p>
          {!isAIConfigured() && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠️ AI nije konfiguriran - idite u Postavke da postavite API ključ
            </p>
          )}
          {editingDraftId && (
            <p className="text-sm text-blue-600 mt-1">
              ✏️ Uređujete draft email - možete ga ažurirati ili poslati
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {editingDraftId && (
            <Button variant="outline" onClick={cancelEdit}>
              Otkaži uređivanje
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowTemplateBuilder(!showTemplateBuilder)}
          >
            {showTemplateBuilder ? 'Sakrij' : 'Upravljaj'} predlošcima
          </Button>
          <Link to="/settings">
            <Button variant="outline">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Email Postavke
              {editingDraftId && (
                <span className="ml-2 text-sm text-blue-600">(Uređivanje draft-a)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Odaberite primatelja iz leadova
              </label>
              <Select value={recipient} onValueChange={handleRecipientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite iz postojećih leadova" />
                </SelectTrigger>
                <SelectContent>
                  {getAllEmailAddresses().map((contact, index) => (
                    <SelectItem key={index} value={contact.email}>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-slate-500" />
                        <div>
                          <div className="font-medium">{contact.company}</div>
                          <div className="text-xs text-slate-500">{contact.email} • {contact.source}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manual Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ili unesite email ručno
              </label>
              <Input
                placeholder="email@tvrtka.hr"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Naziv tvrtke (za personalizaciju)
              </label>
              <Input
                placeholder="Naziv tvrtke"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Predložak
              </label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Naslov (generirat će se automatski)
              </label>
              <Input
                placeholder="Naslov će biti generiran pomoću AI-a"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generateEmailContent} 
              disabled={isGenerating || !isAIConfigured()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generiranje AI sadržaja...' : 'Generiraj Personalizirani AI Email'}
            </Button>
          </CardContent>
        </Card>

        {/* Email Content Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sadržaj Emaila</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Vaš personalizirani email sadržaj će se pojaviti ovdje..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              className="min-h-64"
            />
            
            <div className="flex space-x-2">
              <Button onClick={sendEmail} className="flex-1 bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" />
                {editingDraftId ? 'Pošalji Ažurirani Email' : 'Pošalji Email'}
              </Button>
              <Button onClick={saveDraft} variant="outline">
                {editingDraftId ? 'Ažuriraj Draft' : 'Spremi Draft'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Draft Emails Section */}
      {draftEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Edit3 className="h-5 w-5 mr-2 text-orange-600" />
              Draft Emailovi ({draftEmails.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {draftEmails.map((email) => (
                <div key={email.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 bg-orange-50 rounded-lg px-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-slate-900">{email.subject}</p>
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        Draft
                      </span>
                      {editingDraftId === email.id && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Uređuje se
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{email.to}</p>
                    <p className="text-xs text-slate-500">Stvoren: {email.dateSent}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editDraft(email)}
                      disabled={editingDraftId === email.id}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteEmail(email.id)}
                      className="text-red-600 hover:text-red-700"
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
      <Card>
        <CardHeader>
          <CardTitle>Poslani Emailovi ({sentEmails.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sentEmails.map((email) => (
              <div key={email.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-slate-900">{email.subject}</p>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Sent
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{email.to}</p>
                  {email.openRate && (
                    <p className="text-xs text-slate-500">
                      Open rate: {email.openRate} | Click rate: {email.clickRate}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">{email.dateSent}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteEmail(email.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailGenerator;
