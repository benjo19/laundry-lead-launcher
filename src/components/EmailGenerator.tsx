
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, FileText, Sparkles, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Email } from '@/types';
import { useToast } from '@/hooks/use-toast';

const EmailGenerator = () => {
  const [recipient, setRecipient] = useState('');
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

  const { toast } = useToast();

  const templates = [
    { value: 'intro', label: 'Uvodna prezentacija' },
    { value: 'follow-up', label: 'Follow-up email' },
    { value: 'proposal', label: 'Poslovni prijedlog' },
    { value: 'reminder', label: 'Podsjetnik' },
  ];

  const templateContent = {
    intro: `Poštovani,

Nadamo se da ste dobro. Pišemo Vam jer vjerujemo da bi naša Marketing Agent platforma mogla značajno unaprijediti Vaš marketing pristup u industriji profesionalnih praonica rublja.

Naš sustav omogućava:
• Automatsko pronalaženje novih klijenata
• Personalizirane email kampanje
• Praćenje komunikacije s klijentima
• Automatsko generiranje sadržaja za društvene mreže

Rado bismo Vam predstavili platformu u kratkom online sastanku. Imate li vremena sljedeći tjedan?

S poštovanjem,
Vaš Marketing Agent tim`,

    'follow-up': `Poštovani,

U nastavku našeg razgovora, šaljemo Vam dodatne informacije o Marketing Agent platformi.

Kao što smo spomenuli, naša platforma može:
- Povećati broj novih klijenata za 40-60%
- Smanjiti vrijeme utrošeno na marketing za 70%
- Automatizirati rutinske marketing zadatke

Priložili smo detaljnu analizu mogućih ušteda za Vašu praonicu.

Čekamo Vaš odgovor.

S poštovanjem,
Marketing Agent tim`,

    proposal: `Poštovani,

S obzirom na Vaše potrebe i zahtjeve, pripremili smo personalizirani poslovni prijedlog za implementaciju Marketing Agent sustava u Vašoj praoni.

PAKET USLUGA:
- Lead Hunter modul - 99€/mjesec
- Email automatizacija - 79€/mjesec
- CRM podsjetnici - 59€/mjesec
- Social media management - 89€/mjesec

PRVA 3 MJESECA: 50% POPUST

Implementacija: BESPLATNO
Obuka osoblja: UKLJUČENO
24/7 podrška: UKLJUČENO

Molimo Vas za povratnu informaciju do kraja tjedna.

S poštovanjem,
Marketing Agent tim`,

    reminder: `Poštovani,

Ovo je podsjetnik o našem dogovorenom sastanku/pozivu koji je zakazan za [DATUM] u [VRIJEME].

Dnevni red:
- Prezentacija Marketing Agent platforme
- Analiza Vaših trenutnih marketing procesa
- Demonstracija ključnih funkcionalnosti
- Q&A sesija

Link za sastanak: [LINK]

Molimo potvrdite svoju prisutnost.

S poštovanjem,
Marketing Agent tim`
  };

  const generateEmail = () => {
    if (!template) {
      toast({
        title: "Greška",
        description: "Molimo odaberite predložak prije generiranja emaila.",
        variant: "destructive"
      });
      return;
    }

    const content = templateContent[template as keyof typeof templateContent];
    setEmailContent(content);
    
    // Auto-generate subject based on template
    const subjects = {
      intro: 'Predstavljamo Marketing Agent - Revolucionarnite Vaš marketing!',
      'follow-up': 'Follow-up: Marketing Agent prijedlog za Vašu praonicu',
      proposal: 'Ekskluzivni prijedlog: Marketing Agent za Vašu tvrtku',
      reminder: 'Podsjetnik: Zakazani sastanak - Marketing Agent'
    };
    
    setSubject(subjects[template as keyof typeof subjects] || '');
    
    toast({
      title: "Email generiran",
      description: "AI sadržaj je uspješno generiran na temelju odabranog predloška.",
    });
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Email Generator</h2>
          <p className="text-slate-600">Stvorite personalizirane emailove za Vaše klijente</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          Upravljaj Predlošcima
        </Button>
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
                Primatelj
              </label>
              <Input
                placeholder="email@praonica.hr"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
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
                Naslov
              </label>
              <Input
                placeholder="Unesite naslov emaila"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <Button onClick={generateEmail} className="w-full bg-purple-600 hover:bg-purple-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Generiraj AI Email
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sadržaj Emaila</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Vaš email sadržaj će se pojaviti ovdje..."
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
