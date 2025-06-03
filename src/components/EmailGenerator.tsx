import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, FileText, Sparkles, Trash2, Users, Settings } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Email, Lead } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIntegratedEmailService } from '@/hooks/useIntegratedEmailService';
import { useAISettings } from '@/hooks/useAISettings';
import { Link } from 'react-router-dom';

interface EmailGeneratorProps {
  preSelectedEmail?: string;
  preSelectedCompany?: string;
}

const EmailGenerator = ({ preSelectedEmail, preSelectedCompany }: EmailGeneratorProps) => {
  const [recipient, setRecipient] = useState(preSelectedEmail || '');
  const [selectedCompany, setSelectedCompany] = useState(preSelectedCompany || '');
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [template, setTemplate] = useState('');
  
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
    
    // Reset form
    setRecipient('');
    setSelectedCompany('');
    setSubject('');
    setEmailContent('');
    setTemplate('');

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
  };

  const deleteEmail = (emailId: number) => {
    setEmails(emails.filter(email => email.id !== emailId));
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Email Generator</h2>
          <p className="text-slate-600">Stvorite personalizirane emailove za Vaše klijente pomoću integrirane AI</p>
          {!isAIConfigured() && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠️ AI nije konfiguriran - idite u Postavke da postavite API ključ
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Link to="/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              AI Postavke
            </Button>
          </Link>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            Upravljaj Predlošcima
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Email Postavke
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                Pošalji Email
              </Button>
              <Button onClick={saveDraft} variant="outline">
                Spremi Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nedavni Emailovi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {emails.map((email) => (
              <div key={email.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-slate-900">{email.subject}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      email.status === 'Sent' ? 'bg-green-100 text-green-800' : 
                      email.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {email.status}
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
